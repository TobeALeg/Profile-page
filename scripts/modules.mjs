import { parse, parseFragment, serialize, serializeOuter } from 'parse5';
import { rewriteClone } from '../module-copy.mjs';

function elements(node) {
  return [ ...(node.attrs ? [node] : []), ...(node.childNodes || []).flatMap(elements) ];
}
const attribute = (node, name) => node.attrs.find(attr => attr.name === name)?.value;

export function expandModules(template, operations = []) {
  if (!Array.isArray(operations) || operations.length > 100) throw new Error('模块复制记录无效或过多。');
  const document = parse(template);
  const modules = new Map();
  let count = 0;
  const register = nodes => {
    count += nodes.length;
    if (count > 10000) throw new Error('页面模块过多，请先保存并整理内容。');
    for (const node of nodes) {
      const id = attribute(node, 'data-module');
      if (!id) continue;
      if (modules.has(id)) throw new Error(`模块标记重复：${id}`);
      modules.set(id, node);
    }
  };
  register(elements(document));
  for (const operation of operations) {
    if (!operation || Object.keys(operation).sort().join(',') !== 'id,source'
        || typeof operation.source !== 'string' || !/^copy-[a-z0-9-]{1,64}$/.test(operation.id)) {
      throw new Error('模块复制记录无效。');
    }
    const source = modules.get(operation.source);
    if (!source || modules.has(operation.id)) throw new Error('模块来源已变化，请刷新页面后重试。');
    const clone = parseFragment(source.parentNode, serializeOuter(source), {}).childNodes[0];
    const nodes = elements(clone);
    rewriteClone(nodes.map(node => node.attrs), operation.id);
    register(nodes);
    clone.parentNode = source.parentNode;
    const siblings = source.parentNode.childNodes;
    siblings.splice(siblings.indexOf(source) + 1, 0, clone);
  }
  return serialize(document);
}
