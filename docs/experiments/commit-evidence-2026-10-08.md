# 四个项目的 Git 证据：完成项目与控制设计

整理日期：2026-10-08。状态：研究材料，未发布，未写入网页。

本轮只读核查 JetBao、mentti-dashboard、Menti-Probe、llm-wiki-online 的本地 Git 历史。先读本仓库案例记录，再检查提交涉及的代码、规格和测试；以下不是只根据提交标题整理的功能清单。没有操作生产环境、重新运行历史测试或修改四个上游仓库。

## 本人已确认的叙述

以下仅取自本仓库已有内容记录，不从 Git 反推本人当时的想法。

- [JetBao](2026-05-jetbao.md)：本人原先认为报销工具能用就行；自测满意后交给同事，才发现对方最想要的“随手记”没有做进去，之后继续改功能和 UI。
- [Dashboard](mentti-dashboard.md)、[Probe](probe.md)：本人说明 GEO 从验证、展示走向真实规划管理和发布，mentti 等工具逐步产生；希望重点展示 Dashboard 的设计。
- [LLM Wiki](llm-wiki.md)：本人希望重点展示，尚未记录具体起因及个人设计判断。
- [AI 协作方法](ai-working-methods.md)：本人已提出从纯口头描述走向固定组件、design.md 和自己写 token 库，以及逐渐更重视 UX。具体方法变化的日期仍未确认。

## 两条叙事的提炼建议

**工程线可以围绕“把一个想法交到真实使用里，再把使用中暴露的问题做完”。** 最强案例是 JetBao：先记录后补票据不是一个漂亮按钮，而是完整状态流程；后面还有发布回滚、共享主机镜像清理、明确导出范围和下载反馈。Dashboard、Probe、Wiki 可补充跨应用身份、后台任务竞态和知识更新恢复。它们支撑的是实现与维护能力，不能仅凭仓库代码声称线上持续无故障或产生了量化业务收益。

**AI 设计线可以围绕“逐渐给 AI 明确的设计判断，而不是只要求好看”。** JetBao 9 月把颜色、状态、控件尺寸、主操作层级和动效集中成规则，随后收敛导航；Wiki 手机阅读将目录移出首屏并保留阅读位置，说明关注点已经深入真实使用路径。代码能证明规则落地；谁提出哪条规则、采用哪种 AI 工具、用了什么提示词，仍须结合本人记录或聊天证据，不能由 commit 标题补造。

建议两条线共享项目案例，按同一项目中的不同决策展开。JetBao 是当前证据最完整的桥梁，既有本人口述，也有历史界面对比及代码。Dashboard 当前工程证据比视觉方法证据更充足；仅“让卡片变宽”不够承担设计能力主案例。

## 仓库证据

所有 SHA 为完整提交标识。文件链接指向本地路径，便于定位；**历史事实以指定 SHA 下的文件为准**，不能把当前工作区文件当成当时版本。复核方式：`git -C <仓库> show <SHA> -- <文件>`；需要完整当时文件时使用 `git -C <仓库> show <SHA>:<文件>`。

### JetBao：把流程接到真实工作里

仓库：`/Users/dandi/jetBao`。

**J1｜2026-07-06｜`e48ef2aab7b8992487d466c10f93625283b47e40`｜随手记成为正式报销状态的一部分。**

检查了新增 product 文档与 `QuickDraftForm.vue`。表单接收事项、金额、月份、类别，按钮为“保存待补材料”；product 把“随手记”明确为待补的报销记录，只有匹配完整后才进入可导出台账，而非另建一个不关联发票的记账模块。该提交同时修改数据库、接口、前端 API 与状态类型，并加入 API 测试。

来源：[历史 product 对应文件](/Users/dandi/jetBao/docs/product.md)、`frontend/src/components/QuickDraftForm.vue`（该历史组件已不在当前工作区，使用 Git 对象读取）、`backend/app/routers/expenses.py`、`backend/tests/test_api.py`。以上均按 J1 SHA 查阅。

可支持的叙事：把同事提出的实际记录习惯接回完整业务流程。需求起因来自已有本人口述，代码只证明 7 月 6 日留存的实现。不把它写成“第一次真正上线”的日期。

**J2｜2026-07-31｜`1027ca0c17e522c8f6740763baf8b0d0738ebfcc`｜部署失败后确实重建旧应用版本。**

检查了完整 diff。回滚分支给 Compose 启动加入 `--force-recreate`；对应测试从只数启动次数，改为断言正常启动及回滚强制重建分别存在。测试名称还限定失败健康检查时回滚应用，不恢复数据库。

来源：[部署脚本](/Users/dandi/jetBao/scripts/deploy-production.sh)、[部署测试](/Users/dandi/jetBao/backend/tests/test_deploy_production.py)，按 J2 SHA 查阅。

可支持的叙事：完成应用之后，继续处理“更新失败怎么办”。代码及测试不等于本轮复核过生产回滚。

**J3｜2026-08-11｜`275114c95866208af0953b690df2223ce8606df1`｜清理 Docker 镜像时保留多服务回滚点。**

检查了完整 diff。保护镜像的配置读取从只识别 `IMAGE_TAG`，扩展为同时识别各服务的 `*_IMAGE_TAG`。新增测试覆盖 API/Web 等多服务标签，避免清理磁盘时删掉其他服务用于回滚的镜像。

来源：[镜像清理脚本](/Users/dandi/jetBao/scripts/prune_docker_images.py)、[镜像清理测试](/Users/dandi/jetBao/backend/tests/test_prune_docker_images.py)，按 J3 SHA 查阅。

可支持的叙事：维护关注点从单个应用延伸到同一主机上的多个服务。不能据此推断一定发生过生产事故。

**J4｜2026-09-14｜`26e291e99c0f1ee3e8b475a0b06a1d71c269b735`｜把视觉偏好写成可复用规则。**

检查了 `tailwind.config.js` 与 `MonthlyView.vue` 的 diff。颜色从零散 teal/amber 类名转为品牌、表面和五组状态语义；每个状态有背景、线和字色三件套。配置明确把强调色交给“需要用户动手”的状态，等待审核、已完成使用中性色。控件高度为 28/32/36px，圆角与阴影也统一；页面将三张大面积彩色统计卡合成账本摘要，操作按钮使用统一尺寸，金额使用 tabular 数字样式。

来源：[设计 token 配置](/Users/dandi/jetBao/frontend/tailwind.config.js)、[本月报销界面](/Users/dandi/jetBao/frontend/src/views/MonthlyView.vue)、`frontend/src/style.css`、`frontend/styleguide/tokens-v3.html`，按 J4 SHA 查阅。styleguide 存在由提交文件清单确认；本轮未重新渲染该文件。

可支持的叙事：设计控制从“换个颜色”进到语义与层级规则。颜色更好看属于编辑判断；真实前后对照优先复用 [已有六张历史版本截图及边界](2026-05-jetbao.md)。提交说明中声称的对比度数值未在本轮重新计算，不将该数值作为独立验收结论。

**J5｜2026-09-14｜`46a4aa7fe5c45c07a99d2209c904991be34d57e2`｜减少为了辅助信息切换整页。**

检查了新增指南抽屉及 ViewKey diff。指南支持右侧滑出、Esc 和遮罩关闭，打开时锁背景滚动；`ViewKey` 删除 guide/settings 页面入口，提交删掉 SettingsView，新增 UserMenu 承载原账号信息。抽屉样式尊重系统减少动态效果设置。

来源：[指南抽屉](/Users/dandi/jetBao/frontend/src/components/GuideDrawer.vue)、[用户菜单](/Users/dandi/jetBao/frontend/src/components/UserMenu.vue)、[视图类型](/Users/dandi/jetBao/frontend/src/types/index.ts)，按 J5 SHA 查阅。

可支持的叙事：漂亮开始包含信息放在哪里，以及辅助操作会不会打断主要工作。本轮仅做代码阅读，不声称该抽屉完成所有可访问性要求。

**J6｜2026-09-15｜`f83d677ad1e4c9b12a72806608948ceeaafaf020`｜导出的范围与等待过程变得明确。**

检查了 product diff、新增下载存储代码及前端下载函数。导出确认明确展示月份、主体、可导出笔数、金额和待补数量；页面上员工/状态筛选不隐式决定导出范围。前端分段请求使用 HTTP Range 和 `Promise.all`，按实际收到字节汇总进度；后端临时包限制 ID 形状，设置文件权限及一小时过期清理。

来源：[product](/Users/dandi/jetBao/docs/product.md)、[导出下载存储](/Users/dandi/jetBao/backend/app/services/export_downloads.py)、[前端 API/下载函数](/Users/dandi/jetBao/frontend/src/services/api.ts)、`frontend/src/components/ExportPackageModal.vue`、`backend/tests/test_api.py`，按 J6 SHA 查阅。

可支持的叙事：一次“导出”要把范围、产物和反馈做完整。代码能证明并行分段，不能证明真实网络下下载快了多少。

### mentti-dashboard：入口背后逐渐长出管理与身份契约

仓库：`/Users/dandi/mentti-dashboard`。

**D0｜2026-07-16｜`aae31c5e7a21e44fd09ab7fdc59ef37c0c6a0ea0`｜早期留存界面为静态项目卡片入口。**

检查了当时 `src/app/page.tsx`：从 `src/config/projects.ts` 导入静态项目列表，映射为 ProjectCard，采用响应式网格。Git author 标记为 `kyu-z`。这是仓库初始界面的证据，不能凭作者字段确定参与者身份，更不能将全部实现独占归到本人。

来源：[首页](/Users/dandi/mentti-dashboard/src/app/page.tsx)、`src/config/projects.ts`、`src/components/ProjectCard.tsx`，按 D0 SHA 查阅。

**D1｜2026-08-18｜`cbb6e5d33c112a80ef531d882eeb2fb3d37fa642`｜分组排序成为保存后稳定的管理行为。**

检查了 product、architecture 与后台列表 diff。main/internal 各自查询与排序；数据库迁移一次性重排旧数据，此后启动不覆盖管理员排序。管理后台分别展示主面板和内部工具。product 明确 group 只决定目录位置，不代表权限。

来源：[architecture](/Users/dandi/mentti-dashboard/docs/architecture.md)、[product](/Users/dandi/mentti-dashboard/docs/product.md)、[项目管理表](/Users/dandi/mentti-dashboard/src/components/AdminProjectTable.tsx)、`src/lib/db/index.ts`，按 D1 SHA 查阅。

可支持的叙事：从摆几个入口到能长期维护的目录，连排序迁移和权限语义都要交代清楚。

**D2｜2026-08-20｜`6194c01a5b95faa25a69f78d1840b4b5774ae1ec`｜把应用与认证配置合成一个管理对象。**

检查了 product/architecture diff 与文件清单。后台从邮箱、项目、SSO 客户端三个面板收敛为邮箱与应用两个面板；认证方式成为应用表单的一部分。新增 `src/lib/applications/admin.ts` 负责跨 projects/sso_clients 的事务性增删改，避免入口有了却留下孤立凭据，或删除不完整；旧环境接入保留兼容约束。

来源：[architecture](/Users/dandi/mentti-dashboard/docs/architecture.md)、[product](/Users/dandi/mentti-dashboard/docs/product.md)、[应用聚合模块](/Users/dandi/mentti-dashboard/src/lib/applications/admin.ts)、`tests/identity-integration.mjs`，按 D2 SHA 查阅。

可支持的叙事：减少用户要理解的管理对象，同时把数据一致性收进实现。它同时是工程和 UX 素材，不需要硬拆成只属于一条线。

**D3｜2026-08-20｜`4a21efbe985444ff26ff6329182d4c4d60ef921b`｜处理旧配置悄悄重新生效的边界。**

检查了完整代码与测试 diff：删除或切换数据库受管客户端前，先检查同名环境客户端是否仍存在，存在则拒绝；测试断言解绑与删除返回 409，而被停用旧授权仍为 401。避免 UI 看似删除了，旧配置又变成有效凭据。

来源：[应用管理模块](/Users/dandi/mentti-dashboard/src/lib/applications/admin.ts)、[身份集成测试](/Users/dandi/mentti-dashboard/tests/identity-integration.mjs)，按 D3 SHA 查阅。未读取任何真实密钥。

可支持的叙事：完成集成还要管旧系统兼容和撤销。不能据此宣称通过独立安全审计。

设计补充：2026-08-20 的 `2d0d2488db8dca5e6d60fd1b848b3384b5ca1d93` 仅移除 DashboardContent 两处 `max-w-3xl`，使主区和内部工具网格使用可用宽度；已读完整 diff。它可补截图变化，但证据量不足以单独支撑“成熟设计系统”的叙事。

### Menti-Probe：把分析、异步状态和用户操作做完整

仓库：`/Users/dandi/Menti-Probe`。

**P1｜2026-07-30｜`3ec98b3f9c6fb0c58d0170a56cd25ed27a4bf961`｜发布协议包含前后端与公开访问检查。**

检查了部署脚本。使用主机级锁串行部署，从现有 API/Web 容器提取一致的版本作为回滚基线；启动候选前拉取镜像，之后检查本地 API/Web 与公开 API/Web 地址，全部通过后才替换 release 文件，失败分支尝试恢复旧 release。提交含相应部署测试。这里只确认脚本当时如何设计，不声称今天线上状态已经核实，也不把此脚本表述成无条件可靠的回滚保障。

来源：[部署脚本](/Users/dandi/Menti-Probe/scripts/deploy-production.sh)、`api/tests/test_deploy_production.py`、`compose.production.yml`，按 P1 SHA 查阅。

**P2｜2026-08-24｜`0ab76223a4a620be746ab015b0da7bd73fb59bd0`｜报告结论的含义不由模型措辞随意决定。**

检查了 architecture diff 和 `_extract_ranked_recommendation` / `_extract_recommended`。推荐统计优先读取明确的第一名、建议顺序或最终选择，再考虑没有最终结论时的局部条件语句。竞品候选必须出现在原文，模型改写上下文时回到原句；推荐追问同时要求关系与明确选择语言，避免把“提及”算作“推荐”。

来源：[竞品分析引擎](/Users/dandi/Menti-Probe/engine/competitor_analysis.py)、[竞品实体处理](/Users/dandi/Menti-Probe/engine/competitor_entities.py)、[architecture](/Users/dandi/Menti-Probe/docs/architecture.md)、`api/tests/test_competitor_analysis_engine.py`、`api/tests/test_competitor_entities.py`，按 P2 SHA 查阅。

可支持的叙事：让 AI 报告可核查，工程上承担统计口径与证据归属。这是 AI 结果控制能力的补充，不直接等同于视觉设计能力，也不能凭测试断言所有自然语言情况下都准确。

**P3｜2026-08-24｜`0fd65d3da43ecf5a1d272eeaf36f95f980456273`｜用户删除与后台任务形成同一契约。**

检查了存储代码和回归测试 diff。会话删除先写独立删除标记；各 JSON 写入在创建目录、写临时文件和替换前都检查，拒绝向已删除会话重新落盘；测试在删除后再调用后台状态更新，要求报错且目录不复活。

来源：[会话存储](/Users/dandi/Menti-Probe/api/app/services/probe/store.py)、[竞品存储](/Users/dandi/Menti-Probe/api/app/services/probe/competitor_store.py)、[API 回归测试](/Users/dandi/Menti-Probe/api/tests/test_competitor_analysis_api.py)，按 P3 SHA 查阅。

可支持的叙事：不只做前端删除按钮，也完成异步运行时真正删除的行为。

**P4｜2026-08-24｜`f4366618d23a2503ee7b6fcc4dd42e8e9bf669f8`｜操作体验包含键盘与返回焦点。**

检查了完整 diff。删除弹窗记录之前的焦点；打开后聚焦取消按钮，Tab/Shift+Tab 在弹窗内循环；关闭恢复背景滚动和原焦点，Esc 在非删除中允许关闭。

来源：[删除确认弹窗](/Users/dandi/Menti-Probe/web/src/components/delete-competitive-analysis-dialog.tsx)，按 P4 SHA 查阅。

可支持的叙事：UX 细节超出颜色和布局。但该提交本身没有证明是谁通过怎样的 AI 对话决定这些行为。

布局补充：2026-08-21 的 `eff901d5be9d133a89bd398593bf36aeefa46030` 将新建探针的品牌信息与引擎设置改为宽屏两列，问题输入随后独占一行；已检查 `web/src/app/probe/new/page.tsx` diff。可作为版本对照，不据此推断效率提升。2026-07-30 HTML 导出提交 `a029a9be26fefe1b633c8529c97031c3c6cd6e2a` 的 Git author 为 `kyu-z`，本轮只核查文件清单，未作为本人独立实现的证据。

### LLM Wiki：把 AI 整理过程变成可恢复、可追溯的产品

仓库：`/Users/dandi/llm-wiki-online`。最早留存提交为迁移 skill，不能把 2026-09-15 直接写成开始探索 Wiki 的日期。

**W1｜2026-09-15｜`fa822ec5c9f9d17cc2041f78dd606eaecf7e01fb`｜共享知识更新是一笔明确的提交。**

检查了新增 store.py：提交包先校验来源；SQLite 事务内同时写来源、页面、版本、审计与幂等请求记录。相同幂等键且同请求返回既有结果，不同请求拒绝；base_version 不匹配则拒绝，避免覆盖别人新增的知识。

来源：[共享存储](/Users/dandi/llm-wiki-online/plugins/llm-wiki/llm_wiki_mcp/store.py)、`tests/test_shared_store.py`，按 W1 SHA 查阅。

**W2｜2026-09-15｜`a87ae57dc8d93969d3c773ce9b2903ff31d2553a`｜历史恢复保留新的恢复记录。**

检查了完整 diff 和测试：恢复历史正文生成新版本，记录 restore 行为和操作者，原历史仍保留；相同恢复请求可重试且不重复生效。此提交修正了幂等核验顺序与请求指纹检查。

来源：[共享存储](/Users/dandi/llm-wiki-online/plugins/llm-wiki/llm_wiki_mcp/store.py)、[共享服务测试](/Users/dandi/llm-wiki-online/tests/test_shared_service.py)，按 W2 SHA 查阅。

**W3｜2026-09-16｜`ea2c83f6c003e2f6f46d887dd5c5a722b8e364ac`｜长文不再只吃开头，却记成全部完成。**

检查了提交说明，并继续核查当时 wiki.py 中旧状态迁移、run manifest、批次校验、`commit_update` 和 `discard_run`，以及 e2e 测试名称。结构分块替代长文截断；完成进度落在 manifest，全部块和页面写入完成后才关闭运行。旧版无覆盖记录的来源设为 unverified 以重跑。坏输出不能先记为完成；最终提交失败时丢弃不可用草稿、重置块进度，避免下次重试零请求却反复卡在同一坏草稿。

来源：[Wiki 整理器](/Users/dandi/llm-wiki-online/skills/lw/scripts/wiki.py)、[分块器](/Users/dandi/llm-wiki-online/skills/lw/scripts/chunking.py)、[摄取 e2e 测试](/Users/dandi/llm-wiki-online/tests/test_lw_ingest_e2e.py)、`tests/test_lw_ingest.py`，按 W3 SHA 查阅。

对应 e2e 包含长文尾部进入模型、材料集分批完成、停下后可见已完成与待处理部分、中途失败后重试完成。这里只记录测试代码的存在，本轮未重跑。可支持“把 AI 流程完成到可恢复的程度”，不能把所有异常路径都写成已经绝对覆盖。

**W4｜2026-09-17｜`6154a8fdf3621afec3a23b58eda321560b6dd17f`｜用真实输出失败修正写作契约，而非事后补造来源。**

检查了 `.scratch/chinese-knowledge/spec.md`、writing_rules.py、wiki_prompts.py 与 product diff。历史规格记录：真实样例第一轮前两份过度复述聊天，第三份缺来源字段被拒。随后规则要求按主题合并、去协作进度噪声，保留读者需要的细节；请求明确给合法来源 ID 和 JSON 字段形状，仍让缺来源输出被校验拒绝，不自动补造。product 也要求传可见原文而非先压缩成主题索引。

来源：[历史样例规格](/Users/dandi/llm-wiki-online/.scratch/chinese-knowledge/spec.md)、[写作规则](/Users/dandi/llm-wiki-online/plugins/llm-wiki/llm_wiki_mcp/writing_rules.py)、[模型请求契约](/Users/dandi/llm-wiki-online/plugins/llm-wiki/llm_wiki_mcp/wiki_prompts.py)，按 W4 SHA 查阅。

可支持的叙事：AI 质量控制有可审查的输出标准与失败反馈。规格是当时记录，本轮没有再次调用真实模型；具体样例内容及业务数据未复制到本文。

**W5｜2026-09-17｜`9669a8730aba1c617452a087ab91cd187bf8c0d6`｜手机首屏回到阅读本身。**

检查了 mobile-reader spec 与 webapp.py diff。旧手机样式只把侧栏和正文堆成单列，目录仍在正文前；新版常驻项目、搜索与目录入口，目录进入原生 dialog，同一侧栏节点在桌面与手机间移动，正文减少外层卡片留白，选择文章后回正文，表格/代码独立滚动。

历史规格记录浏览器视口检查 320×568、390×844、760×390、1280×800，以及开关目录前后正文位置均为 1412px。它明确未用实体手机，也未调用模型。本轮仅查阅历史记录，未重新执行这些检查。

来源：[手机阅读规格](/Users/dandi/llm-wiki-online/.scratch/mobile-reader/spec.md)、[阅读器实现](/Users/dandi/llm-wiki-online/plugins/llm-wiki/llm_wiki_mcp/webapp.py)，按 W5 SHA 查阅。

可支持的叙事：把漂亮定义为读者能直接看到内容、临时查目录不丢阅读位置。此处 UI 修改的工作内容可确认，AI 工具与本人具体提示仍须聊天证据。

## 编辑边界与未确认项

- Git 记录证明某版本有代码，不证明全部代码由本人独立完成。上文 D0 与 Probe 导出提交存在不同 author 标记；账号关系尚未核实，不据此猜测真实分工。
- 本地四个仓库均存在未提交/未跟踪内容；本轮通过指定 SHA 读取历史，不把未提交内容算作已交付版本，不修改或删除它们。
- 不把最早留存 commit、需求提出、首次 AI 尝试、部署成功及用户验收合成同一日期。
- 工程线目前最适合写具体问题与前后行为；不添加效率倍数、用户规模、收入、稳定性时长或事故经历。
- AI 设计线最适合先展示 JetBao token/导航和 Wiki 手机阅读；Dashboard 的视觉参考、design.md、本人写 token 的过程还需主研究中的聊天证据。不能由仓库风格或 branch 名称判断当时具体用了 Claude Code 还是 Codex。
- 本轮没有发布内容。正式 GitHub/个人主页文案需要保留以上事实边界，当前研究材料不是本人逐句确认的第一人称回忆。
