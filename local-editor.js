(() => {
  const config = JSON.parse(document.getElementById('editor-config').textContent);
  const page = window.portfolio;
  let saved = structuredClone(page.content);
  let revision = config.revision;
  let editing = false;
  let saving = false;
  let composing = false;
  const fields = [...document.querySelectorAll('[data-copy]')];
  const toolbar = document.createElement('aside');
  toolbar.className = 'local-editor';
  toolbar.setAttribute('aria-label', '本地文字编辑');
  toolbar.innerHTML = `<button type="button" data-action="edit">编辑文字</button>
    <div class="editor-controls" hidden>
      <div class="editor-info"><strong class="editor-language"></strong><span role="status" aria-live="polite"></span></div>
      <button type="button" data-action="discard">撤销修改</button>
      <button type="button" data-action="save" class="editor-primary">保存</button>
      <button type="button" data-action="finish">完成</button>
    </div>`;
  document.body.append(toolbar);
  const button = action => toolbar.querySelector(`[data-action="${action}"]`);
  const status = toolbar.querySelector('[role="status"]');
  const dirty = () => JSON.stringify(page.content) !== JSON.stringify(saved);

  function update(message) {
    const changed = dirty();
    toolbar.querySelector('.editor-language').textContent = page.language === 'zh' ? '编辑中文' : 'Editing English';
    status.textContent = message || (changed ? '有未保存的修改' : '点击文字直接修改');
    button('save').disabled = !changed || saving || composing;
    button('discard').disabled = !changed || saving;
    button('finish').disabled = saving || composing;
  }

  function setEditing(active) {
    editing = active;
    document.body.classList.toggle('is-editing', active);
    button('edit').hidden = active;
    toolbar.querySelector('.editor-controls').hidden = !active;
    for (const field of fields) {
      if (active) {
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
    update();
  }

  for (const field of fields) {
    field.addEventListener('input', () => {
      if (!editing) return;
      page.content[field.dataset.copy][page.language] = field.innerText.replaceAll('\r\n', '\n');
      update();
    });
    field.addEventListener('compositionstart', () => { composing = true; update(); });
    field.addEventListener('compositionend', () => { composing = false; update(); });
    field.addEventListener('paste', event => {
      if (!editing) return;
      event.preventDefault();
      document.execCommand('insertText', false, event.clipboardData.getData('text/plain'));
    });
    field.addEventListener('drop', event => { if (editing) event.preventDefault(); });
  }
  document.addEventListener('click', event => {
    if (editing && event.target.closest('[data-copy]')?.closest('a')) event.preventDefault();
  }, true);
  document.addEventListener('portfolio:language', () => update());
  window.addEventListener('beforeunload', event => {
    if (dirty()) { event.preventDefault(); event.returnValue = ''; }
  });

  async function save() {
    if (saving || composing) return false;
    if (!dirty()) return true;
    saving = true;
    const snapshot = structuredClone(page.content);
    update('正在保存…');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let message;
    let success = false;
    try {
      const response = await fetch('/__editor/content', {
        method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Editor-Token': config.token },
        body: JSON.stringify({ revision, content: snapshot }), signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      revision = result.revision;
      saved = snapshot;
      success = true;
      message = dirty() ? '已保存；还有新修改未保存' : '已保存到本地';
    } catch (error) {
      message = error.name === 'AbortError' || error instanceof TypeError
        ? '暂时无法保存。修改仍在页面中，请确认本地服务运行后重试。' : error.message;
    } finally {
      clearTimeout(timeout);
      saving = false;
      update(message);
    }
    return success;
  }

  button('edit').onclick = () => setEditing(true);
  button('save').onclick = save;
  button('discard').onclick = () => { page.replaceContent(structuredClone(saved)); update('已撤销未保存的修改'); };
  button('finish').onclick = async () => {
    if (await save() && !dirty()) { setEditing(false); button('edit').focus(); }
  };
  document.addEventListener('keydown', event => {
    if (editing && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      if (!event.isComposing) save();
    }
  });
})();
