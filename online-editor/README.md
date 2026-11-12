# 本人在线编辑服务（待接入）

公开主页已部署在 GitHub Pages。本目录是待接入的服务端实现；尚未创建云端服务或 GitHub App，也未向公开页面添加编辑入口。用户要求先了解后端方案，托管选择仍待确认。

## 工作方式

GitHub 登录 → 服务端核对 GitHub 数字用户 ID `33229155` → 读取 `TobeALeg/Profile-page` 的 `main` → 使用现有页面和编辑器修改 → 只提交 `content.json` → Pages 工作流更新公开网站。

`worker.mjs` 使用标准 Request/Response 和 Web Crypto，`wrangler.jsonc` 是 Cloudflare Worker 的候选配置。页面图片与样式来自公开站点，编辑脚本由服务端的静态资源绑定提供。编辑页保持同源，避免跨站登录 Cookie 问题。

`github.mjs` 集中管理 GitHub API。写入前再次验证用户身份，并基于打开页面时的仓库提交创建新提交；非快进更新失败，不覆盖其他修改。字段与模块复制结构复用本地编辑和静态构建的校验逻辑。

登录使用 state 和 PKCE，GitHub 访问令牌仅保存在加密且带认证的 HttpOnly/Secure Cookie 中，最长一小时。保存和退出要求同源 Origin 及会话 CSRF 值。未登录、非本人、无效请求、超量内容或版本冲突均不写入仓库。公开页面不包含访问令牌或客户端密钥。

## 接入所需配置

需要一个仅安装到 `Profile-page` 的私有 GitHub App，Repository permissions 仅设置 Contents 为 Read and write；关闭 webhook，回调地址为实际编辑服务地址的 `/auth/callback`。

服务端配置三项秘密值：`GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、`SESSION_SECRET`。会话密钥应使用至少 32 个随机字节的 base64url 表示。通过托管平台的秘密管理写入，不写入代码、Git 或公开页面。

若确定采用 Cloudflare，先运行 `npm run build:editor` 准备四个共用编辑资源，再由 Wrangler 部署本目录。部署前需要完成 Cloudflare 登录和 GitHub App 注册。`GET /health` 只返回是否配置完整，不返回任何秘密。

正式开放前还需：验证真实账号登录、仅授权该仓库、线上保存触发 Pages 成功、匿名/其他账号无法保存，然后将公开站点的编辑入口指向已验证服务。

## 已验证范围

`npm test` 包含模拟 GitHub 的请求级测试，覆盖 OAuth state/PKCE、身份检查、无效会话、跨站写入、内容校验、仓库冲突与双语/模块保存，以及已有本地编辑测试。模拟测试不等于真实 OAuth 或云端部署验收。
