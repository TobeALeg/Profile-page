import { renderPage } from '../scripts/render.mjs';
import { createGitHub } from './github.mjs';
import { MAX_BODY, OWNER_ID, SITE_URL, failure } from './config.mjs';
import { LOGIN_COOKIE, SESSION_COOKIE, challenge, cookie, randomToken, readCookie, seal, unseal } from './session.mjs';

const assets = new Set(['/local-editor.js', '/local-editor.css', '/local-modules.mjs', '/module-copy.mjs']);

function respond(body, status = 200, type = 'application/json', extra = {}) {
  return new Response(type === 'application/json' ? JSON.stringify(body) : body, {
    status, headers: { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY',
      'Content-Security-Policy': "frame-ancestors 'none'", ...extra },
  });
}
const redirect = (location, cookies = []) => {
  const response = respond('', 303, 'text/plain', { Location: location });
  for (const value of cookies) response.headers.append('Set-Cookie', value);
  return response;
};

async function readInput(request) {
  if (request.headers.get('Content-Type') !== 'application/json') throw failure(415, '保存内容格式无效。');
  if (Number(request.headers.get('Content-Length')) > MAX_BODY) throw failure(413, '内容过大，未保存。');
  const reader = request.body?.getReader();
  if (!reader) throw failure(400, '缺少保存内容。');
  let text = '';
  let size = 0;
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY) { await reader.cancel(); throw failure(413, '内容过大，未保存。'); }
    text += decoder.decode(value, { stream: true });
  }
  try { return JSON.parse(text + decoder.decode()); }
  catch { throw failure(400, '保存内容格式无效。'); }
}

function withPublicAssets(template) {
  return template.replace(/\b(href|src)="([^"]+)"/g, (match, attribute, value) => {
    if (value.startsWith('#') || /^[a-z]+:/i.test(value)) return match;
    return `${attribute}="${new URL(value, SITE_URL).href}"`;
  });
}

export function createEditor(fetcher = fetch) {
  const github = createGitHub(fetcher);
  return {
    async fetch(request, env) {
      try {
        const url = new URL(request.url);
        if (url.protocol !== 'https:') throw failure(400, '请使用 HTTPS 打开编辑器。');
        if (assets.has(url.pathname) && ['GET', 'HEAD'].includes(request.method)) return env.ASSETS.fetch(request);
        if (url.pathname === '/health' && request.method === 'GET') {
          const configured = Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET && env.SESSION_SECRET?.length >= 43);
          return respond({ configured }, configured ? 200 : 503);
        }
        if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.SESSION_SECRET) {
          throw failure(503, '编辑服务尚未完成配置。');
        }
        if (url.pathname === '/auth/login' && request.method === 'GET') {
          const state = randomToken();
          const verifier = randomToken();
          const login = await seal({ state, verifier, expires: Date.now() + 600000 }, env.SESSION_SECRET, LOGIN_COOKIE);
          const authorize = new URL('https://github.com/login/oauth/authorize');
          authorize.search = new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID,
            redirect_uri: `${url.origin}/auth/callback`, state, code_challenge: await challenge(verifier),
            code_challenge_method: 'S256', allow_signup: 'false' });
          return redirect(authorize.href, [cookie(LOGIN_COOKIE, login, 600)]);
        }
        if (url.pathname === '/auth/callback' && request.method === 'GET') {
          const login = await unseal(readCookie(request, LOGIN_COOKIE), env.SESSION_SECRET, LOGIN_COOKIE);
          if (!login || !url.searchParams.get('code') || url.searchParams.get('state') !== login.state) {
            throw failure(400, '登录请求已失效，请重新登录。');
          }
          const credentials = await github.exchange(url.searchParams.get('code'), login.verifier, env, `${url.origin}/auth/callback`);
          await github.owner(credentials.access_token);
          const seconds = Math.min(3600, credentials.expires_in || 3600);
          const session = await seal({ userId: OWNER_ID, accessToken: credentials.access_token,
            csrf: randomToken(), expires: Date.now() + seconds * 1000 }, env.SESSION_SECRET, SESSION_COOKIE);
          return redirect('/', [cookie(LOGIN_COOKIE, '', 0), cookie(SESSION_COOKIE, session, seconds)]);
        }
        const session = await unseal(readCookie(request, SESSION_COOKIE), env.SESSION_SECRET, SESSION_COOKIE);
        if (!session || session.userId !== OWNER_ID) {
          if (url.pathname === '/' && request.method === 'GET') return redirect('/auth/login');
          throw failure(401, '请先登录。当前修改仍保留在页面中。');
        }
        if (['PUT', 'POST'].includes(request.method)
            && (request.headers.get('Origin') !== url.origin || request.headers.get('X-Editor-Token') !== session.csrf)) {
          throw failure(403, '保存请求无效，请从编辑页面操作。');
        }
        if (url.pathname === '/auth/logout' && request.method === 'POST') {
          return respond({ url: SITE_URL }, 200, 'application/json', { 'Set-Cookie': cookie(SESSION_COOKIE, '', 0) });
        }
        if (url.pathname === '/' && request.method === 'GET') {
          await github.owner(session.accessToken);
          const current = await github.read(session.accessToken);
          const html = renderPage(withPublicAssets(current.template), current.content, {
            token: session.csrf, revision: current.revision, online: true, siteUrl: SITE_URL,
          });
          return respond(html, 200, 'text/html');
        }
        if (url.pathname === '/__editor/content' && request.method === 'PUT') {
          await github.owner(session.accessToken);
          const input = await readInput(request);
          const current = await github.read(session.accessToken);
          if (!input || input.revision !== current.revision) throw failure(409, '仓库已有新修改，请保留当前文字后重新打开编辑页。');
          try { renderPage(current.template, input.content); }
          catch (error) { throw failure(400, error.message); }
          return respond(await github.save(session.accessToken, current, input.content));
        }
        return respond({ error: '未找到页面。' }, 404);
      } catch (error) {
        return respond({ error: error.status ? error.message : '服务暂时不可用，修改仍保留在页面中。' }, error.status || 500);
      }
    },
  };
}

export default createEditor();
