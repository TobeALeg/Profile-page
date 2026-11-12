import { createModuleEditor, cleanEditorMarkup } from './local-modules.mjs';
import { createDraftBackup, restoreDraftLayout } from './editor-drafts.mjs';

const config = JSON.parse(document.getElementById('editor-config').textContent);
const editorPath = config.basePath || '';
const page = window.portfolio;
const root = document.querySelector('[data-editor-root]');
let saved = structuredClone(page.content);
let savedLayout = root.innerHTML;
let revision = config.revision;
let editing = false;
let selecting = false;
let saving = false;
let composing = false;
let syncState = config.sync || { state: 'synced', message: '已同步' };
let pendingRequest = null;
let backupAvailable = false;
let syncTimer;
let recoveryDraft = null;
let storage;
try { storage = localStorage; } catch {}
const drafts = config.online ? createDraftBackup(storage, 'portfolio-editor-draft-v1') : null;
const retainDraft = () => {
  if (!drafts) return;
  if (recoveryDraft) { backupAvailable = false; return; }
  if (dirty()) backupAvailable = drafts.write(page.content, saved, revision);
  else if (!recoveryDraft) { drafts.clear(); backupAvailable = false; }
};
const toolbar = document.createElement('aside');
toolbar.className = 'local-editor';
toolbar.setAttribute('aria-label', config.online ? '本人页面编辑' : '本地页面编辑');
toolbar.innerHTML = `<button type="button" data-action="edit">编辑页面</button>
  <div class="editor-controls" hidden>
    <div class="editor-info"><strong class="editor-language"></strong><span role="status" aria-live="polite"></span></div>
    <div class="editor-actions">
      <button type="button" data-action="mode">选择模块</button>
      <button type="button" data-action="parent" hidden>选外层</button>
      <button type="button" data-action="copy" hidden>复制模块</button>
      <button type="button" data-action="discard">撤销修改</button>
      <button type="button" data-action="save" class="editor-primary">保存</button>
      <button type="button" data-action="finish">完成</button>
    </div>
  </div>`;
document.body.append(toolbar);
if (config.online) {
  const account = document.createElement('div');
  account.className = 'editor-account';
  const back = document.createElement('a');
  back.href = config.siteUrl;
  back.target = '_blank';
  back.rel = 'noopener noreferrer';
  back.textContent = '查看公开网站';
  const logout = document.createElement('button');
  logout.type = 'button';
  logout.textContent = '退出登录';
  logout.onclick = async () => {
    if (saving || (dirty() && !window.confirm('有未保存的修改，仍要退出吗？'))) return;
    try {
      const response = await fetch(`${editorPath}/auth/logout`, { method: 'POST', headers: { 'X-Editor-Token': config.token } });
      if (!response.ok) throw new Error('退出失败，请重试。');
      saved = structuredClone(page.content);
      location.assign(config.siteUrl);
    } catch { update('退出失败，请重试。'); }
  };
  const syncLabel = document.createElement('span');
  syncLabel.className = 'editor-sync';
  syncLabel.setAttribute('role', 'status');
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.dataset.action = 'retry-sync';
  retry.textContent = '重试同步';
  retry.hidden = true;
  retry.onclick = async () => {
    retry.disabled = true;
    try {
      const response = await fetch(`${editorPath}/__editor/sync`, { method: 'POST', headers: { 'X-Editor-Token': config.token } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      syncState = result;
      updateSync();
      pollSync();
    } catch (error) { syncLabel.textContent = error.message; }
    finally { retry.disabled = false; }
  };
  const download = document.createElement('button');
  download.type = 'button';
  download.dataset.action = 'download-draft';
  download.textContent = '下载本机草稿';
  download.hidden = true;
  download.onclick = () => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([JSON.stringify(recoveryDraft, null, 2)], { type: 'application/json' }));
    link.download = 'portfolio-draft.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };
  const dismissDraft = document.createElement('button');
  dismissDraft.type = 'button';
  dismissDraft.dataset.action = 'dismiss-draft';
  dismissDraft.textContent = '清除旧草稿';
  dismissDraft.hidden = true;
  dismissDraft.onclick = () => {
    if (!window.confirm('清除本机旧草稿？请先下载需要保留的内容。')) return;
    recoveryDraft = null;
    drafts.clear();
    retainDraft();
    updateSync();
    update();
  };
  account.append(syncLabel, retry, download, dismissDraft, back, logout);
  toolbar.append(account);
  toolbar.querySelector('[data-action="save"]').textContent = '保存';
}
const button = action => toolbar.querySelector(`[data-action="${action}"]`);
const status = toolbar.querySelector('[role="status"]');
const dirty = () => JSON.stringify(page.content) !== JSON.stringify(saved);
const modules = createModuleEditor(root, () => page.content, () => update());

function update(message) {
  const changed = dirty();
  toolbar.querySelector('.editor-language').textContent = selecting ? '选择模块'
    : page.language === 'zh' ? '编辑中文' : 'Editing English';
  status.textContent = message || (selecting
    ? modules.selected ? `已选：${modules.label}` : '点击要复制的内容块'
    : saving ? '正在保存到服务器…'
    : changed ? backupAvailable ? '草稿已保留在本机，尚未保存到服务器' : '有未保存的修改'
    : '点击文字直接修改');
  button('mode').textContent = selecting ? '改文字' : '选择模块';
  button('mode').disabled = saving || composing;
  button('parent').hidden = !selecting || !modules.parent;
  button('parent').disabled = saving;
  button('copy').hidden = !selecting;
  button('copy').disabled = !modules.selected || saving;
  button('save').disabled = !changed || saving || composing;
  button('discard').disabled = !changed || saving;
  button('finish').disabled = saving || composing;
}

function updateSync() {
  if (!config.online) return;
  toolbar.querySelector('.editor-sync').textContent = recoveryDraft
    ? '本机有旧版本草稿，请先下载保留，再编辑当前版本。' : syncState.message;
  button('retry-sync').hidden = !['blocked', 'retrying'].includes(syncState.state);
  button('download-draft').hidden = !recoveryDraft;
  button('dismiss-draft').hidden = !recoveryDraft;
}

async function pollSync() {
  clearTimeout(syncTimer);
  try {
    const response = await fetch(`${editorPath}/__editor/sync`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    const result = await response.json();
    if (response.status === 401) {
      toolbar.querySelector('.editor-sync').textContent = '登录已过期，请刷新页面重新登录。本机草稿会保留。';
      return;
    }
    if (!response.ok) throw new Error(result.error);
    syncState = result;
    updateSync();
    if (['syncing', 'retrying'].includes(result.state)) syncTimer = setTimeout(pollSync, 2000);
  } catch {
    toolbar.querySelector('.editor-sync').textContent = '暂时无法查询同步状态，已保存的内容仍在服务器。';
    syncTimer = setTimeout(pollSync, 5000);
  }
}

function configureFields() {
  for (const field of document.querySelectorAll('[data-copy]')) {
    if (editing && !selecting) {
      field.contentEditable = 'plaintext-only';
      field.setAttribute('role', 'textbox');
      field.setAttribute('aria-multiline', 'true');
      field.setAttribute('aria-label', `编辑：${field.textContent.slice(0, 28)}`);
      field.setAttribute('tabindex', '0');
      field.spellcheck = true;
    } else {
      for (const name of ['contenteditable', 'role', 'aria-multiline', 'aria-label', 'tabindex', 'spellcheck']) field.removeAttribute(name);
    }
  }
  modules.setMode(editing && selecting);
}

function setEditing(active) {
  editing = active;
  selecting = false;
  document.body.classList.toggle('is-editing', active);
  button('edit').hidden = active;
  toolbar.querySelector('.editor-controls').hidden = !active;
  modules.clear();
  configureFields();
  update();
}

// Delegation covers text fields in newly copied modules as well.
document.addEventListener('input', event => {
  const field = event.target.closest('[data-copy]');
  if (!editing || selecting || !field) return;
  page.content[field.dataset.copy][page.language] = field.innerText.replaceAll('\r\n', '\n');
  retainDraft();
  update();
});
document.addEventListener('compositionstart', () => { composing = true; update(); });
document.addEventListener('compositionend', () => { composing = false; update(); });
document.addEventListener('paste', event => {
  if (!editing || selecting || !event.target.closest('[data-copy]')) return;
  event.preventDefault();
  document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
});
document.addEventListener('drop', event => {
  if (editing && event.target.closest('[data-copy]')) event.preventDefault();
});
document.addEventListener('click', event => {
  if (editing && event.target.closest('[data-copy]')?.closest('a')) event.preventDefault();
}, true);
document.addEventListener('portfolio:language', () => update());
window.addEventListener('beforeunload', event => {
  retainDraft();
  if (dirty()) { event.preventDefault(); event.returnValue = ''; }
});

async function save() {
  if (saving || composing) return false;
  if (!dirty()) return true;
  saving = true;
  const snapshot = structuredClone(page.content);
  const layout = root.cloneNode(true);
  cleanEditorMarkup(layout);
  retainDraft();
  const requestContent = JSON.stringify(snapshot);
  if (!pendingRequest || pendingRequest.content !== requestContent || pendingRequest.revision !== revision) {
    pendingRequest = { content: requestContent, revision, id: crypto.randomUUID() };
  }
  update('正在保存…');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  let message;
  let success = false;
  try {
    const response = await fetch(`${editorPath}/__editor/content`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Editor-Token': config.token },
      body: JSON.stringify({ revision, content: snapshot, requestId: pendingRequest.id }), signal: controller.signal,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error);
    revision = result.revision;
    saved = snapshot;
    savedLayout = layout.innerHTML;
    pendingRequest = null;
    if (config.online) {
      syncState = result.sync || { state: 'syncing', message: '已保存到服务器，后台同步中' };
      updateSync();
      pollSync();
    }
    retainDraft();
    success = true;
    message = dirty() ? '已保存；还有新修改未保存'
      : config.online ? '已保存到服务器，可以继续编辑' : '已保存到本地';
  } catch (error) {
    retainDraft();
    message = error.name === 'AbortError' || error instanceof TypeError
      ? config.online ? '暂时无法确认保存结果。修改仍在页面中，请稍后重试。'
        : '暂时无法保存。修改仍在页面中，请确认本地服务运行后重试。' : error.message;
  } finally {
    clearTimeout(timeout);
    saving = false;
    update(message);
  }
  return success;
}

button('edit').onclick = () => setEditing(true);
button('mode').onclick = () => { selecting = !selecting; configureFields(); update(); };
button('parent').onclick = () => modules.selectParent();
button('copy').onclick = () => {
  try {
    const clone = modules.duplicate();
    if (!clone) return;
    selecting = false;
    configureFields();
    retainDraft();
    clone.scrollIntoView({ block: 'center', behavior: 'instant' });
    update('已复制，可直接修改副本；保存后保留');
  } catch (error) { update(error.message); }
};
button('save').onclick = save;
button('discard').onclick = () => {
  page.replaceContent(structuredClone(saved), savedLayout);
  retainDraft();
  modules.clear();
  selecting = false;
  configureFields();
  update('已撤销未保存的修改');
};
button('finish').onclick = async () => {
  if (await save() && !dirty()) { setEditing(false); button('edit').focus(); }
};
document.addEventListener('keydown', event => {
  if (editing && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    if (!event.isComposing) save();
  }
});
if (config.online) {
  const draft = drafts.read();
  if (draft) {
    if (JSON.stringify(draft.content) === JSON.stringify(page.content)) drafts.clear();
    else if (draft.revision === revision || JSON.stringify(draft.baseContent) === JSON.stringify(page.content)) {
      try {
        const layout = restoreDraftLayout(root, page.content, draft.content);
        page.replaceContent(draft.content, layout);
        retainDraft();
      } catch { recoveryDraft = draft; }
    } else recoveryDraft = draft;
  }
  setEditing(true);
  updateSync();
  pollSync();
}
