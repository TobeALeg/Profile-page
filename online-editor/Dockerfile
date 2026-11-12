FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY scripts/render.mjs scripts/modules.mjs scripts/content-model.mjs ./scripts/
COPY module-copy.mjs ./
COPY online-editor/app.mjs online-editor/config.mjs online-editor/github.mjs online-editor/session.mjs online-editor/server.mjs ./online-editor/
COPY online-editor/public/ ./online-editor/public/
USER node
CMD ["node", "online-editor/server.mjs"]
