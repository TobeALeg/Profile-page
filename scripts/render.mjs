import { contentKeys, validateContent } from './content.mjs';

const escapeText = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const jsonForHtml = value => JSON.stringify(value).replaceAll('<', '\\u003c');

export function renderPage(template, content, editor = null) {
  validateContent(content, contentKeys(template));
  let html = template.replace(/(<[a-z0-9]+\b[^>]*\bdata-copy="([^"]+)"[^>]*>)[\s\S]*?(<\/[a-z0-9]+>)/g,
    (_, open, key, close) => open + escapeText(content[key].zh) + close);
  html = html.replace('<!-- PAGE_CONTENT -->',
    `<script id="page-content" type="application/json">${jsonForHtml(content)}</script>`);
  if (editor) {
    html = html.replace('</head>', '<link rel="stylesheet" href="/local-editor.css">\n</head>');
    html = html.replace('</body>', `<script id="editor-config" type="application/json">${jsonForHtml(editor)}</script>\n<script src="/local-editor.js" defer></script>\n</body>`);
  }
  return html;
}
