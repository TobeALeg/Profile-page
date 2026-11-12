# 个人主页架构说明

## module architecture

### module relationship

- index.html：页面结构模板，`data-copy` 标识可编辑文字。
- content.json：中英文网页文案的唯一内容源，按稳定键保存。
- portfolio.js：读取页面内嵌内容并切换语言。
- scripts/content.mjs、scripts/render.mjs：文案结构校验、版本检查、原子保存与静态 HTML 渲染。
- scripts/preview.mjs：仅监听 127.0.0.1 的预览服务，提供文案读取与保存接口。
- local-editor.js、local-editor.css：仅本地注入的文字编辑、模块选择与保存工具，不进入静态构建。
- local-modules.mjs：浏览器模块选择、复制和编辑标记清理。
- module-copy.mjs、scripts/modules.mjs：客户端与服务端共用标识重命名规则；服务端从模板重建副本。
- system-tokens.css：现有设计令牌与组件样式。
- design.md：既有视觉规范；其中 Experiments 三卡片方案早于本轮时间线决定。
- docs/product.md：产品定位与已确认的内容原则。
- docs/experiments/README.md：案例索引、范围和整理状态。
- docs/experiments/*.md：每个案例或跨项目主题的叙述、素材与待补问题。
- docs/experiments/future-of-work.md：01 未来工作愿景与当下实践的内容记录，保存 BP 来源、被否定的首稿、本人对人与 AI 分工的最新纠正及第二版场景稿；第二版已接入本地页面。
- docs/experiments/two-tracks.md：工程与 AI 两条叙事的编辑草稿、GEO 提交和 CC 对话来源。
- docs/experiments/commit-evidence-2026-10-08.md：其他候选案例的固定历史提交证据，保留贡献与验证边界。
- docs/experiments/post-plugin-evidence-2026-10-08.md：Post 重构的原始对话与 worktree 留存，以及插件旧版回填 / V6 桥接的分支证据。
- docs/experiments/dashboard-dynamic-app-evidence-2026-10-08.md：Dashboard 后台动态目录与身份接入的固定证据；Private 设计对话与版本记录放在 Dashboard 案例中。
- assets/experiments/、output/playwright/jetbao/：已保存截图，案例文档通过相对路径引用。

### data flow

本人叙述与只读仓库核查 → 对应案例 Markdown → 截图匿名处理和版本说明 → 后续再将确认内容整合进网页。

历史核查只读上游仓库与本机聊天记录；引用固定 SHA、相关文件、会话 ID 和物理行号。摘录有关的本人文本，排除工具结果、自动注入 Skill 与续聊摘要；不将完整私有聊天复制进网页仓库。核查结果先记录为证据，再提炼成两条叙事，编辑建议保持独立标记。

新增本人叙述先进入对应案例的“已确认经历”，再同步相关串联草稿和索引。本人提供的思考先后与 Git 的版本日期分别保存，避免用代码时间替代动机或将口述顺序硬换算成提交日期。

目前 Markdown 是内容整理文件，index.html 不会自动读取它们；没有实现 Wiki 同步或自动发布。

### status flow

待讨论 → 已记录经历 → 草稿与素材整理 → 网页整合 → 发布。

记录信息与认可定稿分开：文件落盘不代表本人已认可所有编辑措辞，也不代表页面已修改或发布。当前案例进度以索引为准。

## 2026-10-12 实现结构

`index.html` 现在直接呈现案例摘要与双语文案；仍不自动读取 Markdown。`portfolio.css` 使用原生 CSS 实现桌面双栏、时间线日期、三阶段图片，以及手机单栏；引用既有 `system-tokens.css`。浏览器仅执行语言切换与 localStorage 偏好持久化，未增加 API、分析或账号服务。

`npm run check` 执行零依赖静态检查；`npm run build` 把 HTML、两个 CSS 与实际图片复制为 `dist/` 静态产物。`npm run preview` 使用 Python HTTP 服务，仅绑定 127.0.0.1:4173。无 TypeScript 或框架编译链。

2026-11-09：移除 Hero 介绍段落及中英文 `hero-sub` 词条，语言切换不再维护该文案。

截图 QA 位于 `output/playwright/portfolio/`，不进入网页构建产物。修改原有案例记录仍需按 AGENTS.md 保持来源与不确定性边界。状态已进入网页整合，没有进入公开发布。

2026-11-09：01 改为未来工作场景与 Worket 实践，沿用 `#worket` 锚点；`portfolio.css` 用双栏叙事和移动端单栏替代旧工作对象结构图，旧图样式同步移除。

## 2026-11-09：可持久保存的本地编辑

当前内容流：`content.json` + `index.html` 模板 → 本地预览 / `npm run build` 的共同渲染器 → 带中文正文及内嵌双语 JSON 的 HTML → `portfolio.js` 切换语言。每个可编辑元素只承担一个文本字段，不允许嵌套可编辑内容。输出文字进行 HTML 转义，内嵌 JSON 转义 `<`，浏览器采用 `textContent` 渲染；换行通过 `white-space: pre-wrap` 保留。

编辑状态：浏览 → 编辑 → 本地未保存 → 保存中 → 已保存；失败继续保留本地修改。用户每次只修改当前语言，同一编辑会话可包含双语变更。保存快照与保存过程中后续输入分别保留，不能将较晚输入误标为已保存；“完成”只有全部内容保存后才退出。

`PUT /__editor/content` 仅接受本地同源 JSON 请求及本次服务的随机 token。页面加载时取得与显示内容对应的 SHA-256 修订号，保存前再次核对文件版本；冲突返回 409，字段集合或类型无效返回 400。通过同目录临时文件加 rename 原子替换 `content.json`。服务只读公开资源白名单，不暴露源文档或 Git 目录；每次启动生成新 token，不使用在线服务或登录系统。

`npm run preview` 现在启动 Node 零依赖本地服务，替代旧 Python 静态服务；仍使用 127.0.0.1:4173。`npm run build` 输出中文已渲染的 HTML、语言脚本、样式与图片，不复制编辑脚本、接口、token 或源文档。未增加框架或外部依赖。

`npm test` 用隔离临时目录验证双语保存、刷新与服务重启后的持久性、静态渲染、HTML 转义、冲突保护及本地接口边界；不改真实网页内容。文案的后续人工编辑以 `content.json` 为准，讨论 Markdown 不自动覆盖它。

2026-11-09 后续：恢复 Hero 主标题下的 `hero-sub` 字段，以 `data-copy` 接入现有文案源与编辑器；新增 `hero-note` 样式，不恢复旧的内嵌字典。

## 2026-11-09：可复用的模块复制

模板通过 `data-editor-root` 标识编辑区域，通过稳定且唯一的 `data-module` 标识可复制模块；`data-copy` 仍标识独立双语文本。模块可以嵌套。编辑器使用事件委托，新副本立即具备文字编辑能力。

`content.json` 保持既有文案键不变，首次复制时增加 `_modules` 数组，按发生顺序保存 `{source, id}`；副本文字使用新键保存。浏览器复制当前 DOM，服务端使用 parse5 从可信模板按同一操作序列重建，保存接口不接收任意 HTML。共用的 `module-copy.mjs` 为文本、嵌套模块、HTML ID 及内部锚点/标签引用分配新标识，避免副本修改原文或产生重复 ID。

副本放在来源后方，可继续复制副本或包含副本的外层模块。构建与本地预览共用重建逻辑，静态页面带有最终模块和完整双语内容，不需要客户端编辑脚本。parse5 是构建和本地服务依赖，普通访客页面仍不依赖框架或在线服务。

编辑保存同时固定内容快照和当前布局快照；撤销恢复到上次保存的文案与模块结构。沿用原子写入和版本冲突检查。原有纯文案文件无需迁移；复制记录结构、来源、标识及最终文本键集合都在服务端验证。

改版时副本采用当前模板的布局，而非旧 outerHTML 快照。保留模块与文本键即可延续副本；删除或改名涉及已有复制记录时需同步迁移，缺失来源明确报错，不静默丢弃内容。新增通用模块无需改编辑器代码。

## 2026-11-12：GitHub Pages 发布

`.github/workflows/pages.yml` 响应 `main` 推送或手动运行：安装锁定依赖 → 静态检查 → 编辑保存测试 → 静态构建 → 上传 `dist/` → GitHub Pages 发布。构建任务只有仓库读取权限；发布任务具有 Pages 写入与 OIDC 权限。部署串行执行，避免正在发布时被后续构建取消。

静态文件采用相对地址，支持 `/Profile-page/` 项目路径；编辑服务、源文档、Git 元数据及 npm 依赖均不进入发布包。保存本地文件与线上发布是两个状态，推送后以 GitHub Actions 的部署结果判断是否公开更新。

用户已选择线上登录编辑。下一步需将身份验证与内容写回仓库放在后端，并在服务端限制为本人 GitHub 身份；静态页面隐藏按钮不能替代写入权限验证。此阶段部署流程不包含在线身份服务。

## 在线编辑服务

`online-editor/app.mjs` 处理登录回调、本人编辑页和保存路由；`session.mjs` 管理带认证加密的安全会话 Cookie；`github.mjs` 集中访问固定仓库。权限以数字用户 ID 验证，每次写入再次查询 GitHub 身份。保存创建以已读提交为父的新提交，再以非强制方式更新 `main`，并发更新返回冲突。

`scripts/content-model.mjs` 抽出不依赖文件系统的文字校验，供本地和在线渲染共用。现有编辑脚本通过注入的 `online` 配置区分文案和退出操作，默认本地行为保持不变。`scripts/build-editor.mjs` 单独复制编辑资源，不改变公开 Pages 构建的资源白名单。

本人已确定使用现有服务器，候选 Cloudflare 配置已移除。`server.mjs` 提供 Node.js HTTP 适配并固定公共 Origin，`compose.yml` 将容器映射到回环端口 18789，Nginx 将 `dandi.site/editor/` 代理到该端口。根路径跳转 Pages。会话 Cookie 仅适用于 `dandi.site`，公开访客不触发登录。

服务器部署在 `/opt/profile-editor`，仅此服务读取该目录下权限为 600 的 `.env`。GitHub App 配置与会话密钥不进入镜像或仓库。`configure-auth.py` 从标准输入接收客户端信息并重建独立容器。GitHub App 注册及服务器配置已完成，公开页脚链接到独立编辑服务。完整接入步骤与验收边界见 `online-editor/README.md`。

2026-11-12 实际状态流已验证：本人登录 → 保存 `content.json` → 提交 `550c87e` → Pages 工作流 `43175598392` 成功 → 公开 HTML 与保存内容渲染结果一致。保存成功表示仓库写入完成；公开更新以部署完成为准，两者不混为同一个状态。
