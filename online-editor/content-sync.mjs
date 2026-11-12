import { randomUUID } from 'node:crypto';
import { renderPage } from '../scripts/render.mjs';
import { DraftStore } from './draft-store.mjs';
import { failure } from './config.mjs';
import { seal, unseal } from './session.mjs';

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const hasWork = state => Boolean(state?.active || state?.pending);
const credentialPurpose = 'portfolio-sync-credentials';

export class ContentSync {
  constructor({ filename, github, secret, template, automatic = true }) {
    this.store = new DraftStore(filename);
    this.template = template;
    if (template && this.store.value) renderPage(template, this.store.value.content);
    this.github = github;
    this.secret = secret;
    this.automatic = automatic;
    this.running = null;
    this.closed = false;
    this.kick();
  }

  status() {
    const state = this.store.value;
    const error = state?.error;
    return {
      revision: state?.revision,
      state: error ? error.permanent ? 'blocked' : 'retrying' : hasWork(state) ? 'syncing' : 'synced',
      message: error ? error.message : hasWork(state) ? '已保存到服务器，后台同步中' : '已同步',
      commitUrl: state?.lastCommit?.commitUrl,
    };
  }

  snapshot() {
    const state = this.store.value;
    if (!state) throw failure(409, '请先打开编辑页，再保存修改。');
    return { content: structuredClone(state.content), template: this.template || state.base.template,
      revision: state.revision, sync: this.status() };
  }

  async open(token) {
    // Once initialized, this server owns the current content. GitHub is a backup.
    if (this.store.value) return this.snapshot();
    await this.github.owner(token);
    const remote = await this.github.read(token);
    // Another request may have initialized and saved content during this read.
    if (this.store.value) return this.snapshot();
    renderPage(this.template || remote.template, remote.content);
    this.store.update(() => ({ revision: remote.revision,
      content: remote.content, base: remote, active: null, pending: null, error: null,
      lastRequest: null, lastCommit: null }));
    return this.snapshot();
  }

  async credentials(session) {
    return seal({ accessToken: session.accessToken, expires: session.expires }, this.secret, credentialPurpose);
  }

  async accept(input, session) {
    if (!input || typeof input !== 'object') throw failure(400, '保存内容格式无效。');
    if (input.requestId !== undefined && (typeof input.requestId !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(input.requestId))) {
      throw failure(400, '保存请求标识无效。');
    }
    const credentials = await this.credentials(session);
    this.store.update(state => {
      if (!state) throw failure(409, '请先打开编辑页，再保存修改。');
      if (input.requestId && state.lastRequest === input.requestId && same(input.content, state.content)) return state;
      if (input.revision !== state.revision) throw failure(409, '其他页面已保存新内容。本机草稿仍保留，请先保留修改再刷新合并。');
      const template = this.template || state.base.template;
      try { renderPage(template, input.content); }
      catch (error) { throw failure(400, error.message); }
      state.revision = `save-${randomUUID()}`;
      state.content = input.content;
      state.pending = { id: state.revision, content: input.content, template, credentials };
      state.lastRequest = input.requestId || null;
      // A fresh owner session can resume work that was waiting for reauthentication.
      if (state.error?.code === 401) {
        if (state.active) state.active.credentials = credentials;
        state.error = null;
      }
      return state;
    });
    this.kick();
    return { revision: this.store.value.revision, sync: this.status() };
  }

  async retry(session) {
    const credentials = await this.credentials(session);
    if (hasWork(this.store.value)) this.store.update(state => {
      for (const job of [state.active, state.pending]) if (job) job.credentials = credentials;
      state.error = null;
      return state;
    });
    this.kick();
    return this.status();
  }

  kick() {
    if (!this.automatic || this.closed || this.running || !hasWork(this.store.value) || this.store.value.error?.permanent) return;
    clearTimeout(this.timer);
    const delay = Math.max(0, Math.max(this.failurePause || 0, this.store.value.error?.retryAt || 0) - Date.now());
    this.timer = setTimeout(() => { this.flush().catch(() => {}); }, delay);
    this.timer.unref?.();
  }

  async flush() {
    if (this.closed) return;
    if (this.running) return this.running;
    clearTimeout(this.timer);
    this.running = this.run();
    try { await this.running; }
    catch (error) { this.failurePause = Date.now() + 30000; throw error; }
    finally { this.running = null; this.kick(); }
  }

  async run() {
    while (!this.closed && hasWork(this.store.value)) {
      if (this.store.value.error?.permanent) return;
      if (!this.store.value.active) this.store.update(state => {
        state.active = { ...state.pending, base: state.base };
        state.pending = null;
        return state;
      });
      const job = structuredClone(this.store.value.active);
      try {
        const credentials = await unseal(job.credentials, this.secret, credentialPurpose);
        if (!credentials) throw failure(401, '已保存到服务器；登录已过期，请重新登录后重试同步。');
        await this.github.owner(credentials.accessToken);
        const remote = await this.github.read(credentials.accessToken);
        if (remote.template !== job.template) throw failure(409, '页面结构已变化，服务器上的修改已保留，请先处理版本冲突。');
        let result;
        if (same(remote.content, job.content)) {
          // Recovery after a successful GitHub write whose response was lost.
          result = { revision: remote.revision };
        } else {
          if (!same(remote.content, job.base.content)) throw failure(409, '仓库内容已有其他修改，服务器草稿已保留，请先合并冲突。');
          result = await this.github.save(credentials.accessToken, remote, job.content);
        }
        this.store.update(state => {
          state.base = { ...remote, content: job.content, revision: result.revision };
          state.active = null;
          state.error = null;
          state.lastCommit = result;
          return state;
        });
      } catch (error) {
        this.store.update(state => {
          const attempts = (state.error?.attempts || 0) + 1;
          const permanent = [400, 401, 403, 409].includes(error.status);
          state.error = { code: error.status || 502, permanent, attempts,
            retryAt: Date.now() + Math.min(60000, 2000 * 2 ** Math.min(attempts - 1, 5)),
            message: permanent ? error.message : '已保存到服务器，同步暂时失败，正在自动重试。' };
          return state;
        });
        return;
      }
    }
  }

  async close() {
    this.closed = true;
    clearTimeout(this.timer);
    await this.running;
  }
}
