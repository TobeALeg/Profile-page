import { rewriteClone } from './module-copy.mjs';
import { cleanEditorMarkup } from './local-modules.mjs';

export function createDraftBackup(storage, key) {
  return {
    read() {
      try {
        const value = JSON.parse(storage.getItem(key) || 'null');
        return value?.version === 1 && value.content && value.baseContent ? value : null;
      } catch { return null; }
    },
    write(content, baseContent, revision) {
      try { storage.setItem(key, JSON.stringify({ version: 1, content, baseContent, revision })); return true; }
      catch { return false; }
    },
    clear() { try { storage.removeItem(key); } catch {} },
  };
}

// Restore copies from trusted page markup; drafts contain text and operations, never HTML.
export function restoreDraftLayout(root, current, draft) {
  const existing = current._modules || [];
  const operations = draft._modules || [];
  if (!Array.isArray(operations) || operations.length > 100
      || JSON.stringify(operations.slice(0, existing.length)) !== JSON.stringify(existing)) {
    throw new Error('本机草稿的模块结构已变化。');
  }
  const layout = root.cloneNode(true);
  cleanEditorMarkup(layout);
  for (const operation of operations.slice(existing.length)) {
    if (!operation || !/^copy-[a-z0-9-]{1,64}$/.test(operation.id)) throw new Error('模块草稿无效。');
    const modules = [...layout.querySelectorAll('[data-module]')];
    const source = modules.find(node => node.dataset.module === operation.source);
    if (!source || modules.some(node => node.dataset.module === operation.id)) throw new Error('模块来源已变化。');
    const clone = source.cloneNode(true);
    const nodes = [clone, ...clone.querySelectorAll('*')];
    if (nodes.length + layout.querySelectorAll('*').length > 10000) throw new Error('模块过多。');
    const attributes = nodes.map(node => [...node.attributes].map(({ name, value }) => ({ name, value })));
    rewriteClone(attributes, operation.id);
    nodes.forEach((node, index) => attributes[index].forEach(({ name, value }) => node.setAttribute(name, value)));
    source.after(clone);
  }
  const outside = [...root.ownerDocument.querySelectorAll('[data-copy]')].filter(field => !root.contains(field));
  const fields = [...layout.querySelectorAll('[data-copy]'), ...outside];
  if (fields.length !== Object.keys(draft).filter(key => key !== '_modules').length
      || fields.some(field => !draft[field.dataset.copy]
        || ['zh', 'en'].some(lang => typeof draft[field.dataset.copy][lang] !== 'string'))) {
    throw new Error('本机草稿与当前页面不匹配。');
  }
  return layout.innerHTML;
}
