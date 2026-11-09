import { rewriteClone } from './module-copy.mjs';

export function cleanEditorMarkup(root) {
  for (const node of [root, ...root.querySelectorAll('*')]) {
    for (const attr of [...node.attributes]) {
      if (attr.name.startsWith('data-editor-') && attr.name !== 'data-editor-root') node.removeAttribute(attr.name);
    }
    if (node.matches('[data-copy]')) {
      for (const name of ['contenteditable', 'role', 'aria-multiline', 'aria-label', 'tabindex', 'spellcheck']) node.removeAttribute(name);
    } else if (node.matches('[data-module]')) node.removeAttribute('tabindex');
  }
}

export function createModuleEditor(root, getContent, onSelection) {
  let selecting = false;
  let selected = null;
  let hovered = null;
  const mark = (node, name, active) => node?.toggleAttribute(name, active);
  const choose = node => {
    mark(selected, 'data-editor-selected', false);
    selected = node;
    mark(selected, 'data-editor-selected', true);
    onSelection();
  };
  root.addEventListener('pointerover', event => {
    if (!selecting) return;
    mark(hovered, 'data-editor-hover', false);
    hovered = event.target.closest('[data-module]');
    mark(hovered, 'data-editor-hover', true);
  });
  root.addEventListener('pointerleave', () => mark(hovered, 'data-editor-hover', false));
  root.addEventListener('click', event => {
    if (!selecting) return;
    const module = event.target.closest('[data-module]');
    event.preventDefault();
    event.stopImmediatePropagation();
    choose(module);
  }, true);
  root.addEventListener('keydown', event => {
    if (selecting && ['Enter', ' '].includes(event.key)) {
      event.preventDefault();
      choose(event.target.closest('[data-module]'));
    }
  });
  return {
    get selected() { return selected; },
    get parent() { return selected?.parentElement.closest('[data-module]'); },
    get label() {
      return (selected?.querySelector('h1,h2,h3')?.textContent || selected?.textContent || '').trim().slice(0, 26);
    },
    setMode(active) {
      selecting = active;
      document.body.classList.toggle('is-selecting-modules', active);
      mark(hovered, 'data-editor-hover', false);
      for (const node of root.querySelectorAll('[data-module]')) {
        if (active) node.setAttribute('tabindex', '0');
        else if (!node.hasAttribute('contenteditable')) node.removeAttribute('tabindex');
      }
    },
    clear() { choose(null); },
    selectParent() { if (this.parent) choose(this.parent); },
    duplicate() {
      if (!selected?.isConnected) return null;
      const content = getContent();
      if ((content._modules?.length || 0) >= 100) throw new Error('模块复制已达上限，请先整理页面。');
      const clone = selected.cloneNode(true);
      cleanEditorMarkup(clone);
      const nodes = [clone, ...clone.querySelectorAll('*')];
      const attributes = nodes.map(node => [...node.attributes].map(({ name, value }) => ({ name, value })));
      const id = `copy-${crypto.randomUUID()}`;
      const fields = rewriteClone(attributes, id);
      nodes.forEach((node, index) => attributes[index].forEach(({ name, value }) => node.setAttribute(name, value)));
      for (const [source, key] of fields) content[key] = structuredClone(content[source]);
      (content._modules ||= []).push({ source: selected.dataset.module, id });
      selected.after(clone);
      choose(clone);
      return clone;
    },
  };
}
