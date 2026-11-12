import fs from 'node:fs';
import path from 'node:path';
import { renderPage } from '../scripts/render.mjs';

const types = { '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml' };

export function createPublicSite(root, current) {
  const template = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const fallback = JSON.parse(fs.readFileSync(path.join(root, 'content.json'), 'utf8'));
  let cached;
  return {
    template,
    async fetch(request) {
      const headers = { 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' };
      if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405, headers: { ...headers, Allow: 'GET, HEAD' } });
      const pathname = new URL(request.url).pathname;
      if (pathname === '/' || pathname === '/index.html') {
        const snapshot = current();
        const revision = snapshot?.revision || 'bundled';
        if (cached?.revision !== revision) cached = { revision, html: renderPage(template, snapshot?.content || fallback) };
        return new Response(request.method === 'HEAD' ? null : cached.html, {
          headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
        });
      }
      const filename = pathname.slice(1);
      const isAsset = ['portfolio.js', 'portfolio.css', 'system-tokens.css'].includes(filename)
        || /^(assets\/|output\/playwright\/jetbao\/)[a-zA-Z0-9_/-]+\.(png|jpg|jpeg|webp|svg)$/.test(filename);
      if (!isAsset) return new Response('Not found', { status: 404, headers });
      try {
        const body = await fs.promises.readFile(path.join(root, filename));
        return new Response(request.method === 'HEAD' ? null : body, {
          headers: { ...headers, 'Content-Type': types[path.extname(filename)] },
        });
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        return new Response('Not found', { status: 404, headers });
      }
    },
  };
}
