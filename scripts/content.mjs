import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

export function contentKeys(template) {
  return [...template.matchAll(/data-copy="([^"]+)"/g)].map(match => match[1]);
}

export function validateContent(content, keys) {
  if (!content || typeof content !== 'object' || Array.isArray(content)
      || Object.keys(content).sort().join('\n') !== [...keys].sort().join('\n')) {
    throw new Error('文案结构已变化，请刷新页面后重试。');
  }
  for (const entry of Object.values(content)) {
    if (!entry || typeof entry !== 'object' || Object.keys(entry).sort().join(',') !== 'en,zh'
        || ['zh', 'en'].some(lang => typeof entry[lang] !== 'string' || entry[lang].length > 20000)) {
      throw new Error('每段文案须为纯文字，且不超过 20,000 字。');
    }
  }
}

export function readContent(root) {
  const raw = fs.readFileSync(path.join(root, 'content.json'), 'utf8');
  const content = JSON.parse(raw);
  const template = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  validateContent(content, contentKeys(template));
  return { content, template, revision: createHash('sha256').update(raw).digest('hex') };
}

export function saveContent(root, input) {
  const current = readContent(root);
  if (input.revision !== current.revision) {
    throw Object.assign(new Error('其他页面已更新内容。本次修改仍在页面中，请先复制保留，再刷新合并。'), { status: 409 });
  }
  try { validateContent(input.content, contentKeys(current.template)); }
  catch (error) { throw Object.assign(error, { status: 400 }); }
  const filename = path.join(root, 'content.json');
  const temporary = `${filename}.tmp`;
  try {
    fs.writeFileSync(temporary, JSON.stringify(input.content, null, 2) + '\n', { flag: 'wx' });
    fs.renameSync(temporary, filename);
  } finally {
    if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
  }
  return readContent(root);
}
