# 个人主页架构说明

## module architecture

### module relationship

- index.html：页面结构模板，`data-copy` 标识可编辑文字。
- content.json：中英文网页文案的唯一内容源，按稳定键保存。
- portfolio.js：读取页面内嵌内容并切换语言。
- scripts/content.mjs、scripts/render.mjs：文案结构校验、版本检查、原子保存与静态 HTML 渲染。
- scripts/preview.mjs：仅监听 127.0.0.1 的预览服务，提供文案读取与保存接口。
- local-editor.js、local-editor.css：仅本地注入的直接编辑工具，不进入静态构建。
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
