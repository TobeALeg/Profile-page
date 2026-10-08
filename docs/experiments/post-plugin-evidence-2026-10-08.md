# Post 与发布插件证据

整理日期：2026-10-08。状态：内容研究材料，未发布，未写入网页。

## 发布插件：本人已确认的动机

本人本轮确认：插件用于半自动发布，是当前条件下最简单的实现方式。这是本人叙述；下面通过代码核查实现与版本，不从 commit 反推动机。

## 发布插件：当前可核查状态

核查路径：`/Users/dandi/geo/.codex/worktrees/multi-post`，该 worktree 存在。Git worktree 列表同时登记主工作区 `/Users/dandi/multi-post`。

| 检查项 | 本轮结果 |
| --- | --- |
| 研究 worktree 分支 | `codex/v6-mentti-bridge` |
| 研究 worktree HEAD | `5cba1b0e0c7edd1cffc37a31c09066d196fb9a4e`，2026-09-01 |
| 研究 worktree 工作区 | `git status --short` 无输出，clean |
| 主工作区分支 | `main` |
| 本地 main / 缓存 origin/main | 均为 `7cea91f9b9f4129a70096b3bc26d3e7a37a691ca`，2026-08-21 |
| 主工作区状态 | clean |
| V6 桥接与 main 的关系 | V6 有四个分支提交，尚未包含在上述 main；没有 fetch，origin/main 是本地缓存 |
| 浏览器实际安装版本、构建包与上线 | 本轮未检查，不能由本地 HEAD 断言已经安装或上线 |

本轮只读 README、Git 历史、源码及测试，没有读取 `.env`、浏览器存储或真实业务记录，没有修改插件仓库，也没有重新执行构建或测试。

## 发布插件：沿用能力与新增集成

[README](/Users/dandi/geo/.codex/worktrees/multi-post/README.md) 仍明确项目为 MultiPost，链接原项目文档并将当前内部构建称为 fork；[package.json](/Users/dandi/geo/.codex/worktrees/multi-post/package.json) 保留上游作者标记和版本 1.4.5。不能将此描述成从零开发的多平台发布框架。

在新增 Mentti 集成之前的 `4d9714a1f9132eadc7071b3977e9b4acf76d7c28`（2026-08-01）中，知乎、头条、百家号及公共同步代码已经存在。检查当时 `src/sync/article/toutiao.ts`，已经包含标题、正文、封面填入，以及由 `isAutoPublish` 决定是否点发布按钮。因此平台编辑器适配、填稿与可选自动点击属于沿用的 MultiPost 基础。后续 fork 确有平台修复和调整，但不宜把所有平台能力都列为本人原创新增。

**本地 fork 新增的主要价值是把平台操作接回 Mentti 工作流：** Word 与渠道识别、出稿箱文章绑定、发布记录、抓取链接后回填，再到 V6 发布尝试身份、接收回执和观察结果。来源见下方关键提交。

8 月多项集成的 Git author 为 `kyu-z`，9 月 V6 桥接为 `Dandi`。这些只是提交作者标记，尚未核实账号关系与真实分工；可以写“在现有插件上补齐 Mentti 集成”，不能据当前证据写成“所有代码由我独立完成”。

## 发布插件：四个关键实现转折

历史事实以完整 SHA 下的文件为准。文件链接便于定位当前 worktree；复核历史可使用 `git -C /Users/dandi/geo/.codex/worktrees/multi-post show <SHA> -- <文件>`。

**MP1｜2026-08-20 至 2026-08-21｜把半自动操作的结果写回出稿箱。**

新增绑定与回填的起点：`34e2d3dd61532215461999287a4a4c14d7941e18`，2026-08-20。提交新增 `src/sync/mentti.ts`、`menttiCapture.ts`、出稿箱 MAIN/isolated 脚本及后台消息处理，并扩展文章导入与发布记录。检查文件清单以及 main 中的 ArticleTab：Word 文件按标题与渠道匹配出稿箱，SyncData 带 tenant/post 路径，UI 明示已绑定或未绑定。

手动发布也回填：`d1eb15a6b41fd50ea450705707ad841279018895`，2026-08-21。检查代码 diff：后台及发布历史移除 `isAutoPublish` 的回填门禁，只要有绑定和 URL 就请求 Mentti；知乎手动模式继续等待公开地址，最长约 30 分钟。随后 main 的 `7cea91f9b9f4129a70096b3bc26d3e7a37a691ca` 将 ArticleTab 的自动发布初始值设为 false，已检查当时代码。

来源：[Mentti 绑定与回填](/Users/dandi/geo/.codex/worktrees/multi-post/src/sync/mentti.ts)、[文章导入与绑定 UI](/Users/dandi/geo/.codex/worktrees/multi-post/src/components/Sync/ArticleTab.tsx)、[发布历史与后台同步](/Users/dandi/geo/.codex/worktrees/multi-post/src/background/services/publish-history.ts)、[使用说明](/Users/dandi/geo/.codex/worktrees/multi-post/docs/mentti-url-backfill.md)。

可写的前后变化：原来把文章填到平台后，还要把结果接回业务记录；现在即使发布按钮由本人点，插件仍可监听结果并回填，半自动也能形成可追踪的工作流。当前代码和文档不能证明每个平台此刻都稳定可用。

**MP2｜2026-09-01｜`aeafe2deadec9248b66ba87d848bf62c37da50c2`｜网页交付的是一条有身份的发布尝试。**

检查 `external-publish.ts`、后台入口及测试。外部消息仍使用 MultiPost 发布协议，但 publishMeta 扩展 workspace/post/revision/attempt 身份；异步接受任务后返回 `received`、extensionId 与对应 attemptId，失败返回 error。后台队列把任务关联到发布弹窗，避免只靠全局“当前文章”表达多个请求。

来源：[外部发布消息处理](/Users/dandi/geo/.codex/worktrees/multi-post/src/background/services/external-publish.ts)、[后台入口](/Users/dandi/geo/.codex/worktrees/multi-post/src/background/index.ts)、[消息处理测试](/Users/dandi/geo/.codex/worktrees/multi-post/src/background/services/external-publish.test.ts)、`src/sync/publishHistory.ts`。测试以 mock 验证返回身份，不是平台发布验收。

配套提交 `1d1f010144cf0b2c0472503de00ff6ad1571df0b`（同日）新增 dispatch 回执：调用 V6 workspace/attempt API，使用针对该次尝试的回调凭据和幂等键，设置 `credentials: omit`；不靠浏览器登录 Cookie 给任意请求授权。这里只记录凭据机制，不记录具体值。

**MP3｜2026-09-01｜`065e875550d089872499f6abaf698ce094213af5`｜回传候选链接、审核与发布状态的观察。**

检查 `mentti-v6.ts` 和 `publish-history.ts`。新增 observations API 请求及幂等键，后台将平台返回状态分别映射为 `platform_published`、`platform_auditing` 或 `candidate_url_observed`，附链接与扩展版本。原 tenant/post 回填与 V6 Observation 是不同路径，不应把新增桥接描述成旧逻辑换名。

来源：[V6 请求契约](/Users/dandi/geo/.codex/worktrees/multi-post/src/sync/mentti-v6.ts)、[观察回传调用处](/Users/dandi/geo/.codex/worktrees/multi-post/src/background/services/publish-history.ts)、[V6 单元测试](/Users/dandi/geo/.codex/worktrees/multi-post/src/sync/mentti-v6.test.ts)。

实现范围：类型还列出 content_filled/submitted/executor_failed，但本轮读取的调用处只在有 URL 时发送上述三类观察；不能把完整类型列表写成全部已端到端实现。V6 binding 存内存，持久化 pending 时主动排除回调凭据；因此不能依据该实现宣称浏览器后台重启后回执也完整恢复。

**MP4｜2026-09-01｜`5cba1b0e0c7edd1cffc37a31c09066d196fb9a4e`｜收紧网页桥接来源。**

检查完整 diff 及配置代码。Mentti 正式 Console 和本地开发 Console 的准确 origin 作为内建可信来源，供内容脚本网页桥与 API base 共用；相似子域或正式域的 HTTP origin 不自动信任。测试包含可信来源判断和拒绝向白名单外地址发送尝试凭据的断言。

来源：[网页桥](/Users/dandi/geo/.codex/worktrees/multi-post/src/contents/extension.ts)、[Mentti origin 配置](/Users/dandi/geo/.codex/worktrees/multi-post/src/sync/mentti-config.ts)、[V6 测试](/Users/dandi/geo/.codex/worktrees/multi-post/src/sync/mentti-v6.test.ts)。

## 发布插件：验证层级与旧版状态限制

[历史说明](/Users/dandi/geo/.codex/worktrees/multi-post/docs/mentti-url-backfill.md) 给出手动抓链与回填步骤、平台适配范围和已知限制，但步骤说明不是本轮实测结果。本轮确认测试代码存在，未重新运行，未登录平台、未发文、未检查公开链接。

旧版说明明确覆盖知乎、百家号、头条、搜狐的抓链回填；网易未实现抓链。各平台不能混成统一“发布成功”：

- 百家号可能保存草稿获得 article_id 后就拼出候选链接，状态为 auditing，插件不会自动等待审核通过并刷新。因此“有链接/已回填”可能早于真正发布与公开可读。
- 头条草稿也可能返回 pgc_id，文档将误报候选链接列为已知限制；是否真实公开需另外核验。
- “是否自动发布”仅表示由扩展还是本人点击平台发布按钮；与绑定后的 URL 回填相互独立。
- 插件发布记录存在浏览器本地，业务长期记录由 Mentti 服务端保存。不能把本地历史当长期可靠账本。

因此，已有 main 版本可作为“半自动发布 + 结果回填”的实现证据；V6 分支可作为“发布尝试身份与观察桥接”的实现进度。**二者都不能只凭本地代码写成各渠道已完成无人值守自动发布、公开发布状态已经独立核验，或 V6 桥接已经正式上线。**

## 发布插件：编辑建议

工程线适合写“没有为了全自动重新造一个发布系统，而是沿用现有平台适配，把填稿、人工确认和结果回写接成流程”。“当前条件下最简单”是本人确认的判断，不补造平台风控、成本或客户需求等具体原因。

旧版到 V6 的转折适合写“先让真实工作跑通，再把一次发布究竟处于填入、提交、审核还是公开的证据分清”。V6 只写已实现且待确认上线的桥接进度；不把全部状态契约当成已经验收的功能。

这里更强的是工程与工作流判断。本文未找到足够证据证明本人如何用 AI 控制插件视觉设计，不为凑两条主线硬加“通过 AI 做漂亮”的结论。

## Post：本轮定位结果

Post 指向 GEO Console / Mentti Post 工作面。它不是 MultiPost 插件仓库。证据来自本人本轮叙述、2026-08-28 原始会话及确认后的功能要求，三者主题可以对应。

| 检查项 | 本轮结果 |
| --- | --- |
| GEO 主工作区 | `/Users/dandi/geo`，当前分支 `future-architecture` |
| 重构 worktree | `/Users/dandi/geo/.codex/worktrees/v6-spec-implementation`，仍存在 |
| 重构分支 | `codex/v6-spec-implementation` |
| 重构 worktree HEAD | `6e904c7069752f8eea3f13c6ac6d84baba03c11c` |
| 重构工作区 | `git status --short` 无输出，clean |
| GEO 本地缓存 origin/main | `8a0a30eee54a825ef8fd06df5924b98bab12bbb8` |
| 包含关系 | 下方 PL1—PL4 及 `6e904c70` 均不属于上述缓存 origin/main 的祖先提交 |
| GitHub 实时状态 / 生产状态 | 本轮未 fetch 或检查生产，不据本地缓存断言最新远端状态 |

主工作区已有无关未提交修改；本轮通过 worktree / 固定历史读取，不修改或清理它们。

## Post：找回的本人原始决策

Codex 源文件 A：

`/Users/dandi/.codex/sessions/2026/08/28/rollout-2026-08-28T10-20-29-01a036b9-99d0-7e50-b31b-29be0bd22da0_01a0462b-2a72-7081-baa4-581191b432c4.jsonl`

只使用 `response_item` 中真实用户请求；网页环境上下文、delegation 通知、插件推荐块、工具结果均不视作本人口述。以下日期换算为 Asia/Shanghai 后仍是 2026-08-28。行号为 JSONL 物理行号，保留以便复核；不复制原始会话或真实客户资料到本仓库。

| 编号 | 源文件 A 行号 | 本人判断 | 支持的内容 |
| --- | --- | --- | --- |
| PC1 | 1464 | 内容稿展示来源与分类；初稿箱是尚未发布稿件的视图，实际是同一个东西 | 统一内容对象与业务视图 |
| PC2 | 1475 | 已发布页面记录渠道、URL、时间和发布版本，不搬动稿件；按生命周期看清工作量与下一步 | 重构目的与管理体验 |
| PC3 | 1497、1791 | 已做插件辅助部分发文，当时未接进系统；需要独立安装入口 | 定位插件仓库与集成阶段，不能把当时设计说成已接通 |
| PC4 | 1541 | 取决于 MultiPost 能拿到多少信息；信息不足时可在发布一天后 double check | 基于能力边界选择复查 |
| PC5 | 1574 | 手写和导入对系统都是外部资料，不必分成两套业务类型 | 简化业务模型的本人判断 |
| PC6 | 1679、1692 | 要一个唯一、通用、流通的 ActiveSnapshot 控制整体依赖；要求重设方案 | 来源一致性的主动架构要求 |
| PC7 | 1778 | 一次性迁移没有单独 Agent 做语义判断，固定流程得不偿失，选择迁移后人工判断和填充 | 何时保留人工、不额外建设长期自动化 |
| PC8 | 1834 | 要将确认后的功能要求与架构 spec 分别写入 `docs/20260828/` | 对话到规格的来源链 |

Codex 源文件 B：

`/Users/dandi/.codex/sessions/2026/08/28/rollout-2026-08-28T15-05-49-01a04730-6826-7483-aa05-716b061755a6.jsonl`

- 第 9 行：要求检查 `docs/20260828/` 的架构 spec 是否符合功能要求。
- 第 127 行：同 Topic / 渠道的多篇内容通过 Angle 变体完成，并要求按 feedback 修正 spec。
- 第 685、887 行：本人表示 spec 已实现，要求检查刚提交的内容并修复检查问题。
- 第 1791 行（2026-08-31）：本人仅要求 push 该 branch，其他不动。历史授权说明当时交付范围，不是本轮合并或部署授权。

Claude Code 源文件 C：

`/Users/dandi/.claude/projects/-Users-dandi-geo/3ee4ca8f-f4f2-43c0-9f4f-759e41426c8b.jsonl`

第 7 行（2026-08-28）要求根据 Post lifecycle 架构 spec 逐一实现，功能要求在同目录；第 2930 行要求 commit。与源文件 B 的后续检查可以对上协作顺序，但不以 Agent 自述的成功摘要代替验证。

## Post：规格到实现的固定证据

下列 SHA 均已通过 Git 对象存在性及缓存主分支包含关系核查。查看了历史文件 / 提交清单，并在干净 worktree HEAD 回看相关实现；本轮未重新运行后端、前端或平台测试。

**PL1｜2026-08-28｜`2262c5246de62fc7793b11ecaf7015e0896ed740`｜将确认的业务判断固化为规格。**

新增 [功能要求](/Users/dandi/geo/.codex/worktrees/v6-spec-implementation/docs/20260828/post-lifecycle-feature-requirements.md)和[架构规格](/Users/dandi/geo/.codex/worktrees/v6-spec-implementation/docs/20260828/post-lifecycle-architecture-spec.md)。功能要求第 1—3 节记录内容数据源不一致、旧出稿箱与 V6 分裂、缺少发布身份等问题；第 5.5—5.10 节明确正文版本、工作视图、发布事实、复查、依赖变化和插件边界。规格存在不等于全部要求已验收。

**PL2｜2026-08-28｜`7317af41bfd5aa1ac8f76e6b4cd3f6fafb4d3895`｜内容版本、来源与发布进入同一生命周期模块。**

提交修改 `knowledge_runtime/post_lifecycle/` 的命令、模型、存储、状态、来源解析与测试。回看当前固定 HEAD 的 [module.py](/Users/dandi/geo/.codex/worktrees/v6-spec-implementation/knowledge_runtime/post_lifecycle/module.py) 第 68—96 行：填稿只追加证据，候选 URL、平台审核或插件称已发布都先进入 verifying；第 2984 行起有发布尝试、观察、核验与确认命令处理。[models.py](/Users/dandi/geo/.codex/worktrees/v6-spec-implementation/knowledge_runtime/post_lifecycle/models.py) 中包含 source snapshot、Revision 和不会改变 freshness 的人工旧稿发布例外。可以支持发布阶段与事实分开，不证明平台回调、调度复查和所有异常已端到端验收。

**PL3｜2026-08-28｜`3b4180e3d08247b2e8fb8b3dd2e8ea21f32289ad`｜将生命周期命令接进 Console。**

提交新增/修改 Post 命令 API、schema、运行时、读取 API、迁移模式与测试，并更新产品和架构说明。它支持后端/API 边界落地；提交名称虽包含“前端内容管理”，这一提交文件清单没有 Vue 页面，不仅凭标题断言该次完成了全部前端界面。

来源：[命令 API](/Users/dandi/geo/.codex/worktrees/v6-spec-implementation/console/routers/post_commands.py)、[Post API](/Users/dandi/geo/.codex/worktrees/v6-spec-implementation/console/routers/posts.py)、[Post 模式](/Users/dandi/geo/.codex/worktrees/v6-spec-implementation/console/services/post_mode.py)。

**PL4｜2026-09-01｜`55101608029bf90beb1d71f06bfb3a341a59fa59`、`6e904c7069752f8eea3f13c6ac6d84baba03c11c`｜Console 接收回执并交给插件执行。**

这两个提交接收 MultiPost 发布回执并增加网页桥接与发布编排。对应插件侧 MP2—MP4。已核查分支提交清单及 HEAD；现有桥接的实际平台验收与可用渠道范围不从 commit 标题推断，也不将旧版多渠道能力等同于 V6 已覆盖全部渠道。

## Post：适合写进叙事的转折

本人从事实与方法论推进到自动化判断时，仍在关注同一条内容的来源、版本、目的和结果如何对应。Post 重构让这些长期关系进入一个一致的模型；插件与一次性迁移则体现选择人工边界的判断。可用原话和实现共同支撑“哪些要系统化、哪些保留人”的故事。

“大重构”来自本人最新叙述；实现规模、规格范围和 worktree 留存可以佐证，但未核实生产交付与实际运营结果，因此只写重构经历和留存实现。
