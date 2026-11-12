export function contentKeys(template) {
  return [...template.matchAll(/data-copy="([^"]+)"/g)].map(match => match[1]);
}

export function validateContent(content, keys) {
  if (!content || typeof content !== 'object' || Array.isArray(content)
      || Object.keys(content).filter(key => key !== '_modules').sort().join('\n') !== [...keys].sort().join('\n')) {
    throw new Error('文案结构已变化，请刷新页面后重试。');
  }
  for (const [key, entry] of Object.entries(content)) {
    if (key === '_modules') continue;
    if (!entry || typeof entry !== 'object' || Object.keys(entry).sort().join(',') !== 'en,zh'
        || ['zh', 'en'].some(lang => typeof entry[lang] !== 'string' || entry[lang].length > 20000)) {
      throw new Error('每段文案须为纯文字，且不超过 20,000 字。');
    }
  }
}
