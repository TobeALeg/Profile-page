# 本人在线编辑服务

公开主页直接运行在已有的 `jp-server`：`https://dandi.site/` 无需登录，`https://dandi.site/editor/` 仅本人登录编辑。GitHub 保存版本记录，原 [GitHub Pages 地址](https://tobealeg.github.io/Profile-page/) 在后台更新，作为备用。独立目录 `/opt/profile-editor`、端口和数据卷不与 Wiki、Worket 共用。

## 保存与同步

编辑时，浏览器把文字和模块复制操作备份到 localStorage。点击“保存”后，服务器验证会话、同源请求、内容格式及修订号，将内容和同步任务写入持久数据卷；文件和目录 fsync 完成后返回 202。此时公开主页已读取新内容，GitHub 请求不在保存响应路径上。

后台串行同步到 `TobeALeg/Profile-page` 的 `main`，只提交 `content.json`。尚未开始的连续保存合并为最新版本，已经执行中的任务不会覆盖后续保存。GitHub 暂时不可用时自动重试；重启后恢复任务；提交成功但回应丢失时读取远端内容确认，避免重复提交。Pages 工作流继续异步发布备用网站。

服务器上的内容是当前版本。编辑页刷新不会从 GitHub 覆盖它。修改页面结构后需要同步部署服务器代码；若改变文本键或模块标记，必须先迁移已保存内容。构造服务时会用当前模板验证持久内容，避免上线不兼容模板。

浏览器草稿、服务器已保存、GitHub 已同步是独立状态。刷新可恢复兼容的本机草稿；旧版本冲突时提供下载并保留，直到本人主动清除。多标签页旧修订返回 409。服务器与仓库内容冲突时停止同步并保留服务器内容，不强推覆盖；处理冲突后可点击“重试同步”。后台凭证过期时需要重新登录并重试。

## 服务与权限

`server.mjs` 接入 Node.js 24；`public-site.mjs` 只提供公开主页与样式、脚本、图片白名单。公开 HTML 不注入编辑器或凭证，并使用 no-store 确保刷新拿到最新文字。编辑页沿用 `app.mjs` 的 GitHub state/PKCE 登录和数字用户 ID `33229155` 限制，保存、退出和重试要求有效会话、同源 Origin 和 CSRF 值。后台每次 GitHub 写入再次检查账号身份，以非强制更新保护仓库。

访问令牌位于加密的 HttpOnly/Secure/SameSite Cookie；排队任务中的令牌也使用会话密钥认证加密，随会话到期。数据文件权限为 600。Cookie、密钥、待同步凭证不进入公开页面、镜像或 Git。

Nginx 终止 HTTPS，将公开页与 `/editor/` 转发到独立容器的 `127.0.0.1:18789`。固定 PUBLIC_ORIGIN，不信任转发头。编辑路由关闭 access log，避免记录 OAuth callback code。

## 配置与部署

已有私有 GitHub App 仅安装到 `Profile-page`，Contents 为 Read and write，关闭 webhook，回调地址 `https://dandi.site/editor/auth/callback`。更新不需要重新创建应用。

`/opt/profile-editor/.env` 保留 `GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、`SESSION_SECRET`，权限 600，不纳入源代码包。`compose.yml` 配置 DATA_DIR 并挂载命名卷 `editor-data`；容器替换不会删除已保存内容或队列。不要使用 `docker compose down -v`，备份数据卷时同时保管现有会话密钥。

运行 `npm run build:editor` 准备共用编辑资源；部署 Dockerfile 所列源文件和公开资源后运行：

```sh
sudo docker compose -f /opt/profile-editor/online-editor/compose.yml up -d --build
```

Nginx 配置见 `nginx.conf`，复用现有 Certbot 证书、续期计时器和 reload hook。`GET /editor/health` 只返回身份配置是否完整，匿名保存返回 401。完成更新后刷新编辑页加载新脚本。

## 验证

自动测试覆盖身份/CSRF、模块与双语内容、快速持久保存、后台串行同步、重启和丢失回应恢复、旧修订与远端冲突、凭证过期、磁盘写入失败、匿名主页即时更新、资源白名单，以及既有本地编辑。

2026-11-12 原有真实 GitHub 登录和同步发布已由本人操作验证，产生提交 `550c87e` 和 [Pages 部署 43175598392](https://github.com/TobeALeg/Profile-page/actions/runs/43175598392)。异步保存与直接托管的本机隔离对照中，模拟每个 GitHub 请求耗时 80ms，保存确认由约 500ms 降到 19ms，确认前 GitHub 请求由 8 次降到 0 次；该结果不包含用户到服务器的实际网络延迟。

隔离浏览器验收通过：文字草稿刷新恢复、保存期间继续输入仍显示未保存、保存后刷新、后台同步完成、模块复制草稿恢复及保存、390px 手机宽度无横向溢出。测试使用临时内容与模拟 GitHub，没有修改本人网页文案。
