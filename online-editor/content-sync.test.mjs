import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ContentSync } from './content-sync.mjs';

const template = fs.readFileSync('index.html', 'utf8');
const content = JSON.parse(fs.readFileSync('content.json', 'utf8'));
const secret = 'test-only-sync-secret-'.repeat(4);
const session = () => ({ accessToken: 'test-sensitive-token', expires: Date.now() + 60000 });
const changed = title => {
  const value = structuredClone(content);
  value['hero-title'].zh = title;
  return value;
};

async function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-sync-'));
  const filename = path.join(directory, 'draft.json');
  const remote = { content, template, revision: 'initial', tree: 'tree' };
  const calls = [];
  let beforeSave = async () => {};
  let afterSave = async () => {};
  const github = {
    async owner(token) { assert.equal(token, 'test-sensitive-token'); calls.push('owner'); },
    async read() { calls.push('read'); return structuredClone(remote); },
    async save(token, base, next) {
      calls.push('save');
      await beforeSave();
      assert.equal(base.revision, remote.revision);
      remote.revision += '-next';
      remote.content = structuredClone(next);
      await afterSave();
      return { revision: remote.revision, commitUrl: 'https://github.com/test/commit/test' };
    },
  };
  const instances = [];
  const create = () => {
    const sync = new ContentSync({ filename, github, secret, automatic: false });
    instances.push(sync);
    return sync;
  };
  t.after(async () => {
    await Promise.all(instances.map(instance => instance.close()));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const sync = create();
  await sync.open(session().accessToken);
  calls.length = 0;
  return { sync, create, filename, remote, calls, github,
    beforeSave: fn => { beforeSave = fn; }, afterSave: fn => { afterSave = fn; },
    save: (title, requestId) => sync.accept({ revision: sync.snapshot().revision, content: changed(title), requestId }, session()),
  };
}

test('acknowledgement is durable, makes no GitHub calls, and survives a restart without plaintext credentials', async t => {
  const f = await fixture(t);
  const result = await f.save('服务器已保存', 'one');
  assert.equal(result.sync.state, 'syncing');
  assert.deepEqual(f.calls, []);
  const disk = fs.readFileSync(f.filename, 'utf8');
  assert(!disk.includes('test-sensitive-token'));
  assert.equal(JSON.parse(disk).content['hero-title'].zh, '服务器已保存');
  assert.equal(fs.statSync(f.filename).mode & 0o777, 0o600);
  await f.sync.close();
  const restarted = f.create();
  assert.equal(restarted.snapshot().content['hero-title'].zh, '服务器已保存');
  await restarted.flush();
  assert.equal(restarted.status().state, 'synced');
  assert.equal(f.remote.content['hero-title'].zh, '服务器已保存');
});

test('queued saves coalesce, but a save accepted during a write survives the earlier completion', async t => {
  const f = await fixture(t);
  await f.save('第一版');
  await f.save('第二版');
  let release;
  let started;
  const began = new Promise(resolve => { started = resolve; });
  const wait = new Promise(resolve => { release = resolve; });
  f.beforeSave(async () => { started(); await wait; });
  const running = f.sync.flush();
  await began;
  await f.save('第三版');
  release();
  await running;
  assert.equal(f.calls.filter(call => call === 'save').length, 2);
  assert.equal(f.sync.snapshot().content['hero-title'].zh, '第三版');
  assert.equal(f.remote.content['hero-title'].zh, '第三版');
  assert.equal(f.sync.status().state, 'synced');
});

test('lost GitHub response recovers after restart without duplicate commits', async t => {
  const f = await fixture(t);
  await f.save('已提交但丢失回应');
  f.afterSave(async () => { throw new TypeError('connection lost'); });
  await f.sync.flush();
  assert.equal(f.sync.status().state, 'retrying');
  await f.sync.close();
  const restarted = f.create();
  await restarted.flush();
  assert.equal(restarted.status().state, 'synced');
  assert.equal(f.calls.filter(call => call === 'save').length, 1);
});

test('external content conflicts retain the accepted draft; unrelated commits can sync', async t => {
  const f = await fixture(t);
  await f.save('服务器草稿');
  f.remote.revision = 'external';
  f.remote.content = changed('别处的修改');
  await f.sync.flush();
  assert.equal(f.sync.status().state, 'blocked');
  assert.equal(f.sync.snapshot().content['hero-title'].zh, '服务器草稿');
  assert(!f.calls.includes('save'));
  f.remote.content = content;
  await f.sync.retry(session());
  await f.sync.flush();
  assert.equal(f.sync.status().state, 'synced');
  assert.equal(f.remote.content['hero-title'].zh, '服务器草稿');
});

test('stale tabs are rejected, while repeating an identical request is idempotent', async t => {
  const f = await fixture(t);
  const input = { revision: 'initial', content: changed('一次保存'), requestId: 'same-request' };
  const first = await f.sync.accept(input, session());
  const second = await f.sync.accept(input, session());
  assert.equal(second.revision, first.revision);
  await assert.rejects(f.sync.accept({ ...input, requestId: 'new-request' }, session()), { status: 409 });
  await f.sync.flush();
  assert.equal(f.calls.filter(call => call === 'save').length, 1);
});

test('an expired background credential blocks publishing until the owner retries with a fresh session', async t => {
  const f = await fixture(t);
  await f.sync.accept({ revision: 'initial', content: changed('稍后同步') }, { ...session(), expires: Date.now() - 1 });
  await f.sync.flush();
  assert.equal(f.sync.status().state, 'blocked');
  assert.deepEqual(f.calls, []);
  await f.sync.retry(session());
  await f.sync.flush();
  assert.equal(f.sync.status().state, 'synced');
});

test('a failed disk write cannot acknowledge a save or replace the in-memory content', async t => {
  const f = await fixture(t);
  f.sync.store.filename = path.join(f.filename, 'impossible');
  await assert.rejects(f.save('不能假装保存成功'));
  assert.deepEqual(f.sync.snapshot().content, content);
  assert.deepEqual(f.calls, []);
});

test('opening the editor reads server content even when GitHub is unavailable or has external edits', async t => {
  const f = await fixture(t);
  await f.save('服务器版本');
  await f.sync.flush();
  f.calls.length = 0;
  f.github.read = async () => { throw new Error('GitHub unavailable'); };
  const opened = await f.sync.open(session().accessToken);
  assert.equal(opened.content['hero-title'].zh, '服务器版本');
  assert.deepEqual(f.calls, []);
});
