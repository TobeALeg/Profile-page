import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createPublicSite } from './public-site.mjs';
import { ContentSync } from './content-sync.mjs';

test('anonymous home updates immediately after durable save, before GitHub sync, and survives restart', async t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'portfolio-public-'));
  const template = fs.readFileSync('index.html', 'utf8');
  const content = JSON.parse(fs.readFileSync('content.json', 'utf8'));
  let writes = 0;
  const options = { filename: path.join(directory, 'draft.json'), secret: 'public-test-secret-'.repeat(4), automatic: false,
    github: { async owner() {}, async read() { return { template, content, revision: 'base', tree: 'tree' }; },
      async save() { writes++; throw new Error('Offline'); } } };
  let sync = new ContentSync(options);
  const site = createPublicSite(process.cwd(), () => sync.store.value ? sync.snapshot() : null);
  t.after(async () => { await sync.close(); fs.rmSync(directory, { recursive: true, force: true }); });
  const home = () => site.fetch(new Request('https://dandi.site/'));
  assert((await (await home()).text()).includes(content['hero-title'].zh));
  await sync.open('test');
  const next = structuredClone(content);
  next['hero-title'].zh = '立即公开 <script>不能执行</script>';
  await sync.accept({ revision: 'base', content: next }, { accessToken: 'test', expires: Date.now() + 60000 });
  const response = await home();
  const html = await response.text();
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert(html.includes('立即公开 &lt;script&gt;'));
  assert(!html.includes('editor-config'));
  assert(!html.includes('local-editor.js'));
  assert.equal(writes, 0);
  await sync.close();
  sync = new ContentSync(options);
  assert.equal(await (await home()).text(), html);
  for (const pathname of ['/content.json', '/.env', '/online-editor/draft.json', '/docs/product.md', '/assets/../package.json']) {
    assert.equal((await site.fetch(new Request('https://dandi.site' + pathname))).status, 404);
  }
  assert.equal((await site.fetch(new Request('https://dandi.site/', { method: 'PUT', body: '{}' }))).status, 405);
});
