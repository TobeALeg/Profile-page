import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readContent, saveContent } from './content.mjs';
import { renderPage } from './render.mjs';

const MAX_BODY = 512 * 1024;
const MIME = { '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon' };
const publicFiles = new Set(['/system-tokens.css', '/portfolio.css', '/portfolio.js', '/local-editor.css', '/local-editor.js', '/local-modules.mjs', '/module-copy.mjs']);

function respond(response, status, data, type = 'application/json') {
  response.writeHead(status, { 'Content-Type': `${type}; charset=utf-8`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  response.end(type === 'application/json' ? JSON.stringify(data) : data);
}

async function readJson(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY) throw Object.assign(new Error('内容过大，未保存。'), { status: 413 });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString()); }
  catch { throw Object.assign(new Error('保存内容格式无效。'), { status: 400 }); }
}

export function createPreviewServer(root) {
  const token = randomBytes(32).toString('hex');
  return http.createServer(async (request, response) => {
    try {
      const port = request.socket.localPort;
      const hosts = [`127.0.0.1:${port}`, `localhost:${port}`];
      if (!hosts.includes(request.headers.host)) return respond(response, 403, { error: '仅允许本地访问。' });
      const origin = `http://${request.headers.host}`;
      const pathname = decodeURIComponent(new URL(request.url, origin).pathname);
      if (pathname === '/__editor/content') {
        if (request.method === 'GET') {
          const { content, revision } = readContent(root);
          return respond(response, 200, { content, revision, token });
        }
        if (request.method !== 'PUT') return respond(response, 405, { error: '不支持此操作。' });
        if (request.headers.origin !== origin || request.headers['x-editor-token'] !== token
            || request.headers['content-type'] !== 'application/json') {
          return respond(response, 403, { error: '保存请求无效，请刷新本地页面后重试。' });
        }
        if (Number(request.headers['content-length']) > MAX_BODY) return respond(response, 413, { error: '内容过大，未保存。' });
        const input = await readJson(request);
        if (!input || typeof input !== 'object') return respond(response, 400, { error: '保存内容格式无效。' });
        const { revision } = saveContent(root, input);
        return respond(response, 200, { revision });
      }
      if (!['GET', 'HEAD'].includes(request.method)) return respond(response, 405, { error: '不支持此操作。' });
      if (pathname === '/' || pathname === '/index.html') {
        const { content, template, revision } = readContent(root);
        return respond(response, 200, request.method === 'HEAD' ? '' : renderPage(template, content, { token, revision }), 'text/html');
      }
      if (!publicFiles.has(pathname) && !pathname.startsWith('/assets/') && !pathname.startsWith('/output/playwright/jetbao/')) {
        return respond(response, 404, { error: '未找到文件。' });
      }
      const filename = fs.realpathSync(path.join(root, pathname));
      if (!filename.startsWith(fs.realpathSync(root) + path.sep) || !fs.statSync(filename).isFile()) {
        return respond(response, 404, { error: '未找到文件。' });
      }
      respond(response, 200, request.method === 'HEAD' ? '' : fs.readFileSync(filename), MIME[path.extname(filename)] || 'application/octet-stream');
    } catch (error) {
      const status = error.status || (error.code === 'ENOENT' ? 404 : 500);
      respond(response, status, { error: status === 500 ? '保存或读取失败，页面中的修改仍然保留。' : error.message });
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
  const port = Number(process.env.PORT || 4173);
  const server = createPreviewServer(root);
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`Local editor: http://127.0.0.1:${port}/#worket`));
}
