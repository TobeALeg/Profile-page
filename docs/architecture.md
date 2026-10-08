# 个人主页架构说明

## module architecture

### module relationship

- index.html：现有静态双语页面。
- system-tokens.css：现有设计令牌与组件样式。
- design.md：既有视觉规范；其中 Experiments 三卡片方案早于本轮时间线决定。
- docs/product.md：产品定位与已确认的内容原则。
- docs/experiments/README.md：案例索引、范围和整理状态。
- docs/experiments/*.md：每个案例或跨项目主题的叙述、素材与待补问题。
- docs/experiments/two-tracks.md：工程与 AI 两条叙事的编辑草稿、GEO 提交和 CC 对话来源。
- docs/experiments/commit-evidence-2026-10-08.md：其他候选案例的固定历史提交证据，保留贡献与验证边界。
- assets/experiments/、output/playwright/jetbao/：已保存截图，案例文档通过相对路径引用。

### data flow

本人叙述与只读仓库核查 → 对应案例 Markdown → 截图匿名处理和版本说明 → 后续再将确认内容整合进网页。

历史核查只读上游仓库与本机聊天记录；引用固定 SHA、相关文件、会话 ID 和物理行号。摘录有关的本人文本，排除工具结果、自动注入 Skill 与续聊摘要；不将完整私有聊天复制进网页仓库。核查结果先记录为证据，再提炼成两条叙事，编辑建议保持独立标记。

目前 Markdown 是内容整理文件，index.html 不会自动读取它们；没有实现 Wiki 同步或自动发布。

### status flow

待讨论 → 已记录经历 → 草稿与素材整理 → 网页整合 → 发布。

记录信息与认可定稿分开：文件落盘不代表本人已认可所有编辑措辞，也不代表页面已修改或发布。当前案例进度以索引为准。
