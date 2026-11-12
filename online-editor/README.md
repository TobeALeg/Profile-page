# 本人在线编辑服务

公开主页部署在 GitHub Pages。本人已选择现有 `jp-server` 服务器：`https://dandi.site/` 跳转公开主页，`https://dandi.site/editor/` 承载登录和编辑。独立部署目录为 `/opt/profile-editor`，不复用 Wiki 或 Worket 的容器、配置和凭证。

## 工作方式

GitHub 登录 → 服务端核对 GitHub 数字用户 ID `33229155` → 读取 `TobeALeg/Profile-page` 的 `main` → 使用现有页面和编辑器修改 → 只提交 `content.json` → Pages 工作流更新公开网站。

`app.mjs` 使用标准 Request/Response 和 Web Crypto；`server.mjs` 将它接入 Node.js 24 HTTP 服务。容器端口只映射到服务器 `127.0.0.1:18789`，宿主机 Nginx 终止 HTTPS 并转发 `/editor/`。公开请求地址由固定的 `PUBLIC_ORIGIN` 配置生成，不信任请求携带的转发头。页面图片与样式来自公开站点，编辑脚本由严格白名单提供。

`github.mjs` 集中管理 GitHub API。写入前再次验证用户身份，并基于打开页面时的仓库提交创建新提交；非快进更新失败，不覆盖其他修改。字段与模块复制结构复用本地编辑和静态构建的校验逻辑。

登录使用 state 和 PKCE，GitHub 访问令牌仅保存在加密且带认证的 HttpOnly/Secure Cookie 中，最长一小时。保存和退出要求同源 Origin 及会话 CSRF 值。未登录、非本人、无效请求、超量内容或版本冲突均不写入仓库。公开页面不包含访问令牌或客户端密钥。

## 接入所需配置

需要一个仅安装到 `Profile-page` 的私有 GitHub App，Repository permissions 仅设置 Contents 为 Read and write；关闭 webhook，回调地址为 `https://dandi.site/editor/auth/callback`。

服务端配置三项秘密值：`GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、`SESSION_SECRET`。会话密钥应使用至少 32 个随机字节的 base64url 表示。通过托管平台的秘密管理写入，不写入代码、Git 或公开页面。

运行 `npm run build:editor` 准备四个共用编辑资源。将 Dockerfile 需要的代码复制到 `/opt/profile-editor`，在该目录的 `.env` 保存秘密值，权限设为 600。`configure-auth.py` 可从标准输入接收客户端信息，原子更新秘密文件并重新创建独立容器，不输出秘密。

```sh
sudo docker compose -f /opt/profile-editor/online-editor/compose.yml up -d --build
```

Nginx 配置见 `nginx.conf`；首次签发证书前先启用其中的 HTTP 段，以 `/var/www/letsencrypt` 的 webroot 为 `dandi.site` 签发证书，再启用完整配置。复用已存在的 Certbot 续期定时器与 Nginx reload hook。编辑路由关闭 access log，避免记录 OAuth callback code。

`GET /editor/health` 只返回配置是否完整。缺少登录配置时返回 503，此时不能声称在线编辑已可用；公开主页不受影响。

正式开放前还需：验证真实账号登录、仅授权该仓库、线上保存触发 Pages 成功、匿名/其他账号无法保存，然后将公开站点的编辑入口指向已验证服务。

## 已验证范围

`npm test` 包含模拟 GitHub 的请求级测试，覆盖 OAuth state/PKCE、身份检查、无效会话、跨站写入、内容校验、仓库冲突与双语/模块保存，以及已有本地编辑测试。模拟测试不等于真实 OAuth 或云端部署验收。
