import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import http from 'node:http';
import { createPreviewServer } from './preview.mjs';
import { readContent } from './content.mjs';
import { renderPage } from './render.mjs';
import { expandModules } from './modules.mjs';

test('editing survives reload, restart and static rendering without losing translations', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-editor-'));
  for (const file of ['index.html', 'content.json']) fs.copyFileSync(file, path.join(root, file));
  let server;
  let origin;
  async function start() {
    server = createPreviewServer(root);
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    origin = `http://127.0.0.1:${server.address().port}`;
  }
  async function stop() { await new Promise(resolve => server.close(resolve)); }
  t.after(async () => { if (server.listening) await stop(); fs.rmSync(root, { recursive: true, force: true }); });
  await start();
  const read = () => fetch(`${origin}/__editor/content`).then(response => response.json());
  const put = (body, token, requestOrigin = origin) => fetch(`${origin}/__editor/content`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', 'X-Editor-Token': token, Origin: requestOrigin }, body: JSON.stringify(body),
  });
  const before = await read();
  const content = structuredClone(before.content);
  const key = 'hero-title';
  content[key].zh = '直接修改中文\n保留换行 <script>alert("test")</script> & 引号';
  content[key].en = 'A separately edited English title';
  content._modules = [{ source: 'text-p-1', id: 'copy-test' }];
  content['copy-test-text-0'] = { zh: '独立的模块副本', en: 'An independent copied block' };
  const write = await put({ content, revision: before.revision }, before.token);
  assert.equal(write.status, 200);
  const after = await read();
  assert.deepEqual(after.content, content);
  assert.notEqual(after.revision, before.revision);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root, 'content.json'), 'utf8')), content);
  const html = await fetch(origin).then(response => response.text());
  assert(html.includes('&lt;script&gt;alert("test")&lt;/script&gt; &amp;'));
  assert(!html.includes('<script>alert("test")</script>'));
  assert(html.includes('local-editor.js'));
  assert(html.includes('data-module="copy-test"'));
  assert(html.includes('独立的模块副本'));
  assert.equal(after.content['p-1'].zh, before.content['p-1'].zh);

  // A second tab cannot silently replace a newer save.
  assert.equal((await put({ content: before.content, revision: before.revision }, before.token)).status, 409);
  assert.deepEqual((await read()).content, content);
  // Reject malformed content and writes from another origin or without the local capability.
  assert.equal((await put({ content: {}, revision: after.revision }, before.token)).status, 400);
  assert.equal((await put({ content, revision: after.revision }, before.token, 'https://example.com')).status, 403);
  assert.equal((await put({ content, revision: after.revision }, 'wrong-token')).status, 403);
  const invalidHostStatus = await new Promise((resolve, reject) => {
    http.get(origin, { headers: { Host: 'untrusted.example' } }, response => {
      response.resume();
      resolve(response.statusCode);
    }).on('error', reject);
  });
  assert.equal(invalidHostStatus, 403);
  for (const route of ['/docs/product.md', '/.git/config', '/scripts/preview.mjs']) {
    assert.equal((await fetch(origin + route)).status, 404);
  }
  await stop();
  await start();
  assert.deepEqual((await read()).content, content);
  const { template, content: persisted } = readContent(root);
  const built = renderPage(template, persisted);
  assert(built.includes('A separately edited English title'));
  assert(built.includes('&lt;script&gt;'));
  assert(!built.includes('local-editor'));
  assert(!built.includes(before.token));
  assert(built.includes('data-module="copy-test"'));
});

test('nested copies retain independent content and adopt redesigned module markup', () => {
  const template = '<main data-editor-root><section id="story" data-module="story" class="layout-v1"><h2 data-copy="title"></h2><p id="description" data-module="paragraph" data-copy="body"></p><a href="#description" aria-describedby="description">more</a></section></main><!-- PAGE_CONTENT -->';
  const content = {
    title: { zh: '原章节', en: 'Original section' },
    body: { zh: '原段落', en: 'Original paragraph' },
    'copy-paragraph-text-0': { zh: '副本段落', en: 'Copied paragraph' },
    'copy-section-text-0': { zh: '副本章节', en: 'Copied section' },
    'copy-section-text-1': { zh: '章节里的段落', en: 'Paragraph in copied section' },
    'copy-section-text-2': { zh: '章节里的副本', en: 'Nested copy' },
    'copy-again-text-0': { zh: '再次复制', en: 'Copied again' },
    _modules: [
      { source: 'paragraph', id: 'copy-paragraph' },
      { source: 'story', id: 'copy-section' },
      { source: 'copy-section-module-2', id: 'copy-again' },
    ],
  };
  const html = renderPage(template, content);
  const markup = html.split('<script')[0];
  const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert(markup.includes('href="#copy-section-id-1" aria-describedby="copy-section-id-1"'));
  assert(markup.indexOf('>原段落<') < markup.indexOf('>副本段落<'));
  assert(markup.includes('>再次复制<'));
  const redesigned = renderPage(template.replace('layout-v1', 'new-design'), content);
  assert.equal((redesigned.match(/class="new-design"/g) || []).length, 2);
  assert(!redesigned.includes('layout-v1'));
  assert.throws(() => expandModules(template, [{ source: 'missing', id: 'copy-unknown' }]));
  assert.throws(() => expandModules(template, [{ source: 'story', id: 'copy-a', html: '<script></script>' }]));
});
