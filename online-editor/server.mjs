import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { createEditor } from './app.mjs';
import { EDITOR_ASSETS, MAX_BODY } from './config.mjs';

const assetRoot = fileURLToPath(new URL('./public/', import.meta.url));

export function createNodeServer(env, handler = createEditor()) {
  const origin = new URL(env.PUBLIC_ORIGIN);
  if (origin.protocol !== 'https:' || origin.href !== `${origin.origin}/`) throw new Error('PUBLIC_ORIGIN must be an HTTPS origin');
  const basePath = env.EDITOR_PATH || '';
  if (!/^(\/[a-zA-Z0-9_-]+)*$/.test(basePath)) throw new Error('Invalid EDITOR_PATH');
  const runtime = { ...env, ASSETS: {
    async fetch(request) {
      const name = new URL(request.url).pathname.slice(basePath.length + 1);
      if (!EDITOR_ASSETS.includes(name)) return new Response('Not found', { status: 404 });
      const body = request.method === 'HEAD' ? null : await fs.promises.readFile(path.join(assetRoot, name));
      return new Response(body, { headers: {
        'Content-Type': name.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/javascript; charset=utf-8',
        'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff',
      } });
    },
  } };
  return http.createServer({ requestTimeout: 30000, headersTimeout: 15000 }, async (incoming, outgoing) => {
    try {
      if (incoming.headers.host !== origin.host || !incoming.url.startsWith('/') || incoming.url.startsWith('//')) {
        outgoing.writeHead(403); outgoing.end('Invalid host'); return;
      }
      if (Number(incoming.headers['content-length']) > MAX_BODY) {
        outgoing.writeHead(413); outgoing.end('Content too large'); return;
      }
      const headers = new Headers();
      for (const [name, value] of Object.entries(incoming.headers)) {
        if (value !== undefined) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
      }
      // The public origin is configured, never inferred from forwarded headers.
      const request = new Request(new URL(incoming.url, origin), {
        method: incoming.method, headers,
        ...(!['GET', 'HEAD'].includes(incoming.method) ? { body: Readable.toWeb(incoming), duplex: 'half' } : {}),
      });
      const response = await handler.fetch(request, runtime);
      outgoing.statusCode = response.status;
      for (const [name, value] of response.headers) if (name !== 'set-cookie') outgoing.setHeader(name, value);
      const cookies = response.headers.getSetCookie();
      if (cookies.length) outgoing.setHeader('Set-Cookie', cookies);
      if (response.body && incoming.method !== 'HEAD') await pipeline(Readable.fromWeb(response.body), outgoing);
      else outgoing.end();
    } catch {
      if (outgoing.headersSent) { outgoing.destroy(); return; }
      outgoing.writeHead(500, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      outgoing.end(JSON.stringify({ error: '服务暂时不可用，请稍后重试。' }));
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createNodeServer(process.env);
  const port = Number(process.env.PORT || 3000);
  server.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`Editor listening on port ${port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
}
