// Shared by the browser and the HTML renderer. Only identifiers are rewritten;
// layout, classes, images and links outside the copied module stay as authored.
export function rewriteClone(attributes, copyId) {
  const names = new Map([
    ['data-copy', new Map()], ['data-module', new Map()], ['id', new Map()],
  ]);
  for (const attrs of attributes) {
    for (const attr of attrs) {
      const map = names.get(attr.name);
      if (!map) continue;
      const kind = { 'data-copy': 'text', 'data-module': 'module', id: 'id' }[attr.name];
      map.set(attr.value, attr.name === 'data-module' && map.size === 0
        ? copyId : `${copyId}-${kind}-${map.size}`);
    }
  }
  const ids = names.get('id');
  for (const attrs of attributes) {
    for (const attr of attrs) {
      if (names.has(attr.name)) attr.value = names.get(attr.name).get(attr.value);
      else if (['for', 'aria-labelledby', 'aria-describedby', 'aria-controls', 'headers'].includes(attr.name)) {
        attr.value = attr.value.split(/\s+/).map(id => ids.get(id) || id).join(' ');
      } else if (['href', 'xlink:href'].includes(attr.name) && attr.value.startsWith('#')) {
        attr.value = '#' + (ids.get(attr.value.slice(1)) || attr.value.slice(1));
      }
    }
  }
  return names.get('data-copy');
}
