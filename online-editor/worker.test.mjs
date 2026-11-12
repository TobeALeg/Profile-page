import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createEditor } from './worker.mjs';
import { OWNER_ID, SITE_URL } from './config.mjs';
import { SESSION_COOKIE, LOGIN_COOKIE, seal, unseal } from './session.mjs';

const origin = 'https://editor.example.test';
const env = { GITHUB_CLIENT_ID: 'test-client', GITHUB_CLIENT_SECRET: 'test-client-secret', SESSION_SECRET: 'test-only-session-key-'.repeat(4) };
const template = fs.readFileSync('index.html', 'utf8');
const content = JSON.parse(fs.readFileSync('content.json', 'utf8'));
const encoded = value => Buffer.from(value).toString('base64');
const json = (value, status = 200) => new Response(JSON.stringify(value), { status });

function fixture({ userId = OWNER_ID, conflict = false } = {}) {
  const calls = [];
  const editor = createEditor(async (url, options = {}) => {
    const pathname = new URL(url).pathname;
    calls.push({ pathname, ...options, body: options.body && JSON.parse(options.body) });
    if (pathname === '/login/oauth/access_token') return json({ access_token: 'test-access-token', expires_in: 28800 });
    assert.equal(options.headers.Authorization, 'Bearer test-access-token');
    if (pathname === '/user') return json({ id: userId, login: 'TobeALeg' });
    if (pathname.endsWith('/git/ref/heads/main')) return json({ object: { sha: 'head-before' } });
    if (pathname.endsWith('/git/commits/head-before')) return json({ tree: { sha: 'base-tree' } });
    if (pathname.endsWith('/contents/index.html')) return json({ content: encoded(template) });
    if (pathname.endsWith('/contents/content.json')) return json({ content: encoded(JSON.stringify(content)) });
    if (pathname.endsWith('/git/trees')) return json({ sha: 'new-tree' });
    if (pathname.endsWith('/git/commits')) return json({ sha: 'new-commit' });
    if (pathname.endsWith('/git/refs/heads/main')) return conflict ? json({}, 422) : json({});
    throw new Error(`Unexpected GitHub call ${url}`);
  });
  return { calls, request: (path, options) => editor.fetch(new Request(origin + path, options), env),
    writes: () => calls.filter(call => ['POST', 'PATCH'].includes(call.method) && call.pathname.startsWith('/repos/')) };
}

async function sessionHeaders(extra = {}) {
  const value = await seal({ userId: OWNER_ID, accessToken: 'test-access-token', csrf: 'csrf-test', expires: Date.now() + 60000 }, env.SESSION_SECRET, SESSION_COOKIE);
  return { Cookie: `${SESSION_COOKIE}=${value}`, Origin: origin, 'X-Editor-Token': 'csrf-test', 'Content-Type': 'application/json', ...extra };
}

test('OAuth binds state and PKCE to the browser, then issues an encrypted owner-only cookie', async () => {
  const app = fixture();
  const login = await app.request('/auth/login');
  assert.equal(login.status, 303);
  const authorize = new URL(login.headers.get('Location'));
  assert.equal(authorize.origin, 'https://github.com');
  assert.equal(authorize.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(authorize.searchParams.get('code_challenge').length, 43);
  const loginCookie = login.headers.get('Set-Cookie').split(';')[0];
  assert(loginCookie.startsWith(LOGIN_COOKIE));
  const callback = `/auth/callback?code=test-code&state=${authorize.searchParams.get('state')}`;
  assert.equal((await app.request(callback)).status, 400);
  assert.equal((await app.request('/auth/callback?code=test-code&state=wrong', { headers: { Cookie: loginCookie } })).status, 400);
  assert.equal(app.calls.length, 0);
  const success = await app.request(callback, { headers: { Cookie: loginCookie } });
  assert.equal(success.status, 303);
  assert.equal(success.headers.get('Location'), '/');
  const session = success.headers.getSetCookie().find(value => value.startsWith(SESSION_COOKIE));
  assert(session.includes('HttpOnly; Secure; SameSite=Lax'));
  assert(!session.includes('test-access-token'));
  assert(app.calls[0].body.code_verifier);
  const decoded = await unseal(session.split(';')[0].slice(SESSION_COOKIE.length + 1), env.SESSION_SECRET, SESSION_COOKIE);
  assert.equal(decoded.userId, OWNER_ID);
  assert.equal(decoded.accessToken, 'test-access-token');
});

test('another GitHub account cannot obtain an editor session even with the owner login name', async () => {
  const app = fixture({ userId: 123 });
  const login = await app.request('/auth/login');
  const state = new URL(login.headers.get('Location')).searchParams.get('state');
  const result = await app.request(`/auth/callback?code=code&state=${state}`, { headers: { Cookie: login.headers.get('Set-Cookie').split(';')[0] } });
  assert.equal(result.status, 403);
  assert.equal(result.headers.get('Set-Cookie'), null);
  assert.equal(app.writes().length, 0);
});

test('anonymous, forged, expired and cross-site saves never write to GitHub', async () => {
  const app = fixture();
  const headers = await sessionHeaders();
  const expired = await seal({ userId: OWNER_ID, expires: Date.now() - 1 }, env.SESSION_SECRET, SESSION_COOKIE);
  const attempts = [
    [{}, 401],
    [{ ...headers, Cookie: `${SESSION_COOKIE}=forged` }, 401],
    [{ ...headers, Cookie: `${SESSION_COOKIE}=${expired}` }, 401],
    [{ ...headers, Origin: 'https://attacker.example' }, 403],
    [{ ...headers, 'X-Editor-Token': 'wrong' }, 403],
  ];
  for (const [requestHeaders, expected] of attempts) {
    const result = await app.request('/__editor/content', { method: 'PUT', headers: requestHeaders, body: '{}' });
    assert.equal(result.status, expected);
  }
  assert.equal(app.calls.length, 0);
});

test('each write rechecks numeric GitHub identity rather than trusting the session alone', async () => {
  const app = fixture({ userId: 123 });
  const result = await app.request('/__editor/content', { method: 'PUT', headers: await sessionHeaders(), body: '{}' });
  assert.equal(result.status, 403);
  assert.deepEqual(app.calls.map(call => call.pathname), ['/user']);
});

test('owner preview renders current repository content without exposing the GitHub token', async () => {
  const app = fixture();
  const result = await app.request('/', { headers: await sessionHeaders() });
  const html = await result.text();
  assert.equal(result.status, 200);
  assert.equal(result.headers.get('Cache-Control'), 'no-store');
  assert(html.includes(`${SITE_URL}portfolio.css`));
  assert(html.includes('href="#worket"'));
  assert(html.includes('src="/local-editor.js'));
  assert(html.includes('"online":true'));
  assert(!html.includes('test-access-token'));
  assert(html.includes(content['hero-title'].zh));
});

test('invalid, excessive and stale content is rejected without repository writes', async () => {
  const app = fixture();
  const headers = await sessionHeaders();
  for (const [body, status] of [
    [JSON.stringify({ revision: 'stale', content }), 409],
    [JSON.stringify({ revision: 'head-before', content: {} }), 400],
    ['{invalid', 400],
    [' '.repeat(512 * 1024 + 1), 413],
  ]) {
    assert.equal((await app.request('/__editor/content', { method: 'PUT', headers, body })).status, status);
  }
  assert.equal(app.writes().length, 0);
});

test('owner saves only content.json, keeps translations and modules, and advances main without force', async () => {
  const app = fixture();
  const changed = structuredClone(content);
  changed['hero-title'].zh = '新标题 <script>alert(1)</script>';
  changed._modules = [{ source: 'text-p-1', id: 'copy-online' }];
  changed['copy-online-text-0'] = { zh: '线上副本', en: 'Online copy' };
  const result = await app.request('/__editor/content', { method: 'PUT', headers: await sessionHeaders(),
    body: JSON.stringify({ revision: 'head-before', content: changed, path: 'not-allowed.txt' }) });
  assert.equal(result.status, 200);
  assert.equal((await result.json()).revision, 'new-commit');
  const writes = app.writes();
  assert.equal(writes.length, 3);
  assert.deepEqual(writes[0].body.tree.map(file => file.path), ['content.json']);
  assert.deepEqual(JSON.parse(writes[0].body.tree[0].content), changed);
  assert.equal(changed['hero-title'].en, content['hero-title'].en);
  assert.deepEqual(writes[1].body.parents, ['head-before']);
  assert.deepEqual(writes[2].body, { sha: 'new-commit', force: false });
});

test('concurrent commits return a conflict rather than overwriting main', async () => {
  const app = fixture({ conflict: true });
  const result = await app.request('/__editor/content', { method: 'PUT', headers: await sessionHeaders(),
    body: JSON.stringify({ revision: 'head-before', content }) });
  assert.equal(result.status, 409);
  assert.equal(app.writes().at(-1).body.force, false);
});

test('logout requires CSRF validation and clears the secure session cookie', async () => {
  const app = fixture();
  const result = await app.request('/auth/logout', { method: 'POST', headers: await sessionHeaders() });
  assert.equal(result.status, 200);
  assert(result.headers.get('Set-Cookie').includes('Max-Age=0'));
  assert.equal((await result.json()).url, SITE_URL);
  assert.equal(app.calls.length, 0);
});
