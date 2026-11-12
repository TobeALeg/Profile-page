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
let notice = '';
let syncNotice = '';
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
toolbar.innerHTML = `<div class="editor-bar">
  <div class="editor-heading">
    <span class="editor-brand">页面编辑</span>
    <select class="editor-language" data-action="language" aria-label="编辑语言">
      <option value="zh">中文</option><option value="en">English</option>
    </select>
  </div>
  <div class="editor-controls" hidden>
    <button type="button" data-action="mode" aria-pressed="false">选择模块</button>
    <span class="editor-status" role="status" aria-live="polite"></span>
    <div class="editor-actions">
      <button type="button" data-action="finish">完成</button>
      <button type="button" data-action="save" class="editor-primary">保存</button>
    </div>
  </div>
  <button type="button" data-action="edit" class="editor-primary">编辑页面</button>
  <details class="editor-menu">
    <summary aria-label="更多编辑操作">更多</summary>
    <div class="editor-menu-panel">
      <button type="button" data-action="discard">撤销未保存修改</button>
    </div>
  </details>
</div>
<div class="editor-context" hidden>
  <span class="editor-selection"></span>
  <button type="button" data-action="parent" hidden>选择外层</button>
  <button type="button" data-action="copy">复制模块</button>
</div>
<div class="editor-alert" hidden>
  <span class="editor-feedback" role="alert"></span>
</div>`;
document.body.prepend(toolbar);
document.body.classList.add('has-editor');
new ResizeObserver(() => {
  document.documentElement.style.setProperty('--editor-toolbar-height', `${toolbar.offsetHeight}px`);
}).observe(toolbar);
const menu = toolbar.querySelector('.editor-menu');
document.addEventListener('click', event => {
  if (!menu.contains(event.target)) menu.open = false;
});
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
    } catch { update('退出失败，请重试。', true); }
  };
  const syncLabel = document.createElement('span');
  syncLabel.className = 'editor-sync';
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.dataset.action = 'retry-sync';
  retry.textContent = '重试同步';
  retry.hidden = true;
  retry.onclick = async () => {
    retry.disabled = true;
    syncNotice = '';
    try {
      const response = await fetch(`${editorPath}/__editor/sync`, { method: 'POST', headers: { 'X-Editor-Token': config.token } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      syncState = result;
      updateSync();
      pollSync();
    } catch (error) { syncNotice = error.message; updateSync(); }
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
  account.append(back, logout, syncLabel);
  toolbar.querySelector('.editor-menu-panel').append(account);
  toolbar.querySelector('.editor-alert').append(retry, download, dismissDraft);
}
const button = action => toolbar.querySelector(`[data-action="${action}"]`);
const status = toolbar.querySelector('.editor-status');
const dirty = () => JSON.stringify(page.content) !== JSON.stringify(saved);
const modules = createModuleEditor(root, () => page.content, () => update());

function update(message, isError = false) {
  if (message !== undefined) notice = isError ? message : '';
  const changed = dirty();
  toolbar.querySelector('.editor-language').value = page.language;
  status.textContent = (!isError && message) || (saving ? '保存中…'
    : changed ? '未保存' : config.online && syncState.state === 'syncing' ? '已保存 · 同步中'
    : config.online && syncState.state === 'retrying' ? '已保存 · 同步重试中'
    : config.online ? '已保存' : '已保存到本地');
  status.title = changed && backupAvailable ? '草稿已保留在本机，尚未保存到服务器' : status.textContent;
  status.dataset.state = changed ? 'dirty' : saving ? 'saving' : 'saved';
  toolbar.querySelector('.editor-context').hidden = !editing || !selecting;
  toolbar.querySelector('.editor-selection').textContent = modules.selected ? modules.label : '点击要复制的模块';
  button('mode').textContent = selecting ? '返回文字编辑' : '选择模块';
  button('mode').setAttribute('aria-pressed', String(selecting));
  button('mode').disabled = saving || composing;
  button('language').disabled = composing;
  button('parent').hidden = !selecting || !modules.parent;
  button('parent').disabled = saving;
  button('copy').disabled = !modules.selected || saving;
  button('save').textContent = saving ? '保存中…' : '保存';
  button('save').disabled = !changed || saving || composing;
  button('discard').disabled = !changed || saving;
  button('finish').disabled = saving || composing;
  updateAlert();
}

function updateAlert() {
  const text = recoveryDraft ? '有旧版本的本机草稿，请先下载保留，再清除旧草稿。'
    : notice || syncNotice || (['blocked', 'retrying'].includes(syncState.state) ? syncState.message : '');
  toolbar.querySelector('.editor-feedback').textContent = text;
  toolbar.querySelector('.editor-alert').hidden = !text;
}

function updateSync() {
  if (!config.online) return;
  toolbar.querySelector('.editor-sync').textContent = syncState.state === 'synced' ? 'GitHub 已同步' : syncState.message;
  button('retry-sync').hidden = !['blocked', 'retrying'].includes(syncState.state);
  button('download-draft').hidden = !recoveryDraft;
  button('dismiss-draft').hidden = !recoveryDraft;
  update();
}

async function pollSync() {
  clearTimeout(syncTimer);
  try {
    const response = await fetch(`${editorPath}/__editor/sync`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    const result = await response.json();
    if (response.status === 401) {
      syncNotice = '登录已过期，请刷新页面重新登录。本机草稿会保留。';
      updateAlert();
      return;
    }
    if (!response.ok) throw new Error(result.error);
    syncState = result;
    syncNotice = '';
    updateSync();
    if (['syncing', 'retrying'].includes(result.state)) syncTimer = setTimeout(pollSync, 2000);
  } catch {
    syncNotice = '暂时无法查询同步状态，已保存的内容仍在服务器。';
    updateAlert();
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
  menu.open = false;
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
  update('保存中…');
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
    message = dirty() ? '还有新修改未保存' : config.online ? '已保存' : '已保存到本地';
  } catch (error) {
    retainDraft();
    message = error.name === 'AbortError' || error instanceof TypeError
      ? config.online ? '暂时无法确认保存结果。修改仍在页面中，请稍后重试。'
        : '暂时无法保存。修改仍在页面中，请确认本地服务运行后重试。' : error.message;
  } finally {
    clearTimeout(timeout);
    saving = false;
    update(message, !success);
  }
  return success;
}

button('language').onchange = event => window.setLang(event.target.value);
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
    update('已复制 · 未保存');
  } catch (error) { update(error.message, true); }
};
button('save').onclick = save;
button('discard').onclick = () => {
  menu.open = false;
  page.replaceContent(structuredClone(saved), savedLayout);
  retainDraft();
  modules.clear();
  selecting = false;
  configureFields();
  update('已撤销修改');
};
button('finish').onclick = async () => {
  if (await save() && !dirty()) { setEditing(false); button('edit').focus(); }
};
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (menu.open) { menu.open = false; menu.querySelector('summary').focus(); }
    else if (selecting) { selecting = false; configureFields(); update(); button('mode').focus(); }
  }
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

if (!config.online) update();
