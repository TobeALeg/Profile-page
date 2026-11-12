FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY scripts/render.mjs scripts/modules.mjs scripts/content-model.mjs ./scripts/
COPY module-copy.mjs ./
COPY index.html content.json portfolio.js portfolio.css system-tokens.css ./
COPY assets/ ./assets/
COPY output/playwright/jetbao/ ./output/playwright/jetbao/
COPY online-editor/app.mjs online-editor/config.mjs online-editor/github.mjs online-editor/session.mjs online-editor/server.mjs online-editor/draft-store.mjs online-editor/content-sync.mjs online-editor/public-site.mjs ./online-editor/
COPY online-editor/public/ ./online-editor/public/
RUN mkdir -p /var/lib/profile-editor && chown node:node /var/lib/profile-editor
USER node
CMD ["node", "online-editor/server.mjs"]
