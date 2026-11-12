import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import http from 'node:http';
import { createNodeServer } from './server.mjs';

const env = { PUBLIC_ORIGIN: 'https://dandi.site', EDITOR_PATH: '/editor',
  GITHUB_CLIENT_ID: 'test-client', GITHUB_CLIENT_SECRET: 'test-secret', SESSION_SECRET: 'test-session-key-'.repeat(4) };

async function start(t, handler) {
  const server = createNodeServer(env, handler);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  return (path, { headers = {}, method = 'GET', body } = {}) => new Promise((resolve, reject) => {
    const request = http.request({ hostname: '127.0.0.1', port: server.address().port, path, method,
      headers: { Host: 'dandi.site', ...headers } }, response => {
      let text = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { text += chunk; });
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, text }));
    });
    request.on('error', reject);
    request.end(body);
  });
}

test('Node adapter uses the configured origin, preserves cookies, and rejects hostile hosts', async t => {
  const received = [];
  const request = await start(t, { async fetch(input) {
    received.push(input.url);
    const headers = new Headers();
    headers.append('Set-Cookie', 'first=a; HttpOnly; Secure');
    headers.append('Set-Cookie', 'second=b; HttpOnly; Secure');
    return new Response('ok', { headers });
  } });
  const response = await request('/editor/auth/callback?code=test', { headers: { 'X-Forwarded-Host': 'attacker.test', 'X-Forwarded-Proto': 'http' } });
  assert.equal(response.status, 200);
  assert.equal(response.headers['set-cookie'].length, 2);
  assert.deepEqual(received, ['https://dandi.site/editor/auth/callback?code=test']);
  assert.equal((await request('/editor/', { headers: { Host: 'attacker.test' } })).status, 403);
  assert.equal((await request('//attacker.test/')).status, 403);
  assert.equal((await request('/editor/', { method: 'PUT', headers: { 'Content-Length': 524289 } })).status, 413);
  assert.equal(received.length, 1);
});

test('mounted Node service exposes only editor assets and denies anonymous saves', async t => {
  const request = await start(t);
  assert.equal((await request('/editor/health')).status, 200);
  const login = await request('/editor/auth/login');
  assert.equal(login.status, 303);
  assert.equal(new URL(login.headers.location).searchParams.get('redirect_uri'), 'https://dandi.site/editor/auth/callback');
  assert(login.headers['set-cookie'][0].includes('Secure'));
  const asset = await request('/editor/local-editor.js');
  assert.equal(asset.status, 200);
  assert(asset.headers['content-type'].includes('javascript'));
  assert(asset.text.includes('保存并发布'));
  for (const path of ['/editor/.env', '/editor/../.env', '/editor/server.mjs']) {
    assert.notEqual((await request(path)).status, 200);
  }
  const save = await request('/editor/__editor/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(save.status, 401);
  assert.equal((await request('/')).status, 404);
});
