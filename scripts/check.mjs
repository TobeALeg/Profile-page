import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { readContent, contentKeys } from './content.mjs';
import { renderPage } from './render.mjs';
const { content, template } = readContent(process.cwd());
assert.equal(new Set(contentKeys(template)).size, contentKeys(template).length, 'Duplicate content keys');
const html = renderPage(template, content);
for (const file of ['portfolio.js', 'local-editor.js']) new vm.Script(fs.readFileSync(file, 'utf8'));
for (const [,script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(script);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate ids');
for (const [,url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  if(url.startsWith('#')) assert(ids.includes(url.slice(1)),`Missing anchor ${url}`);
  else if(!url.startsWith('https:')) assert(fs.existsSync(url.split('?')[0]),`Missing asset ${url}`);
}
assert.equal((html.match(/class="timeline-node"/g)||[]).length,5);
assert(!html.includes('cdn.tailwindcss.com'),'Runtime CDN dependency');

assert(!html.includes('local-editor'), 'Local editor leaked into static page');
console.log('PASS: JavaScript syntax, bilingual content, unique IDs, 5 cases, assets, anchors, static page excludes editor');
