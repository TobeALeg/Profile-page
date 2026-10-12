import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html = fs.readFileSync('index.html','utf8');
for (const [,script] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(script);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate ids');
for (const [,url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
  if(url.startsWith('#')) assert(ids.includes(url.slice(1)),`Missing anchor ${url}`);
  else if(!url.startsWith('https:')) assert(fs.existsSync(url),`Missing asset ${url}`);
}
assert.equal((html.match(/class="timeline-node"/g)||[]).length,5);
assert(!html.includes('cdn.tailwindcss.com'),'Runtime CDN dependency');

console.log('PASS: JavaScript syntax, unique IDs, 5 cases, local assets, anchor targets, no runtime Tailwind or fake links');
