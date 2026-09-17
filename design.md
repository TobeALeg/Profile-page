# Dandi (TobeALeg) 展示页设计规范：方案 B · 瑞士理性实验室 (Swiss Systems Lab)

> **定位主旨**：Systems Architect & Toolmaker —— 极简、高密度、工程理性，呈现一个专注于解耦架构与执行约束的思考型建造者。

---

## 1. 核心设计哲学 (Design Philosophy)

### 1.1 核心主线
整页的信息架构与叙事逻辑围绕三大基石展开：
- **Worket = What I'm building**（核心系统：关注状态持久化与执行者解耦）
- **Experiments = What I'm testing**（实验矩阵：活知识库、技能约束、人机管线）
- **Writing = What I'm thinking**（智性索引：AI 架构、工作未来、商业与创业判断）

### 1.2 明确拒绝的视觉反模式 (Anti-Patterns)
- ❌ **拒绝 SaaS Dashboard 化**：不堆砌圆润卡片、不搞浮夸投影（box-shadow）、不做指标仪表盘。
- ❌ **拒绝 Developer Resume 化**：不罗列技能点进度条、不搞学历履历流、不放无意义的代码统计图表。
- ❌ **拒绝纯博客时间流**：Writing 板块不按日期流水账排列，必须按“主题思想网络（Topic Clusters）”呈现。
- ❌ **拒绝泛滥的彩色渐变与发光特效**：以冷峻深灰、骨白文字为基底，仅用琥珀黄（System Amber）与冷灰边框构建精准的秩序感。

---

## 2. 设计令牌 (Design Tokens)

### 2.1 色彩系统 (Color Palette)

| 令牌名 | 色值 (Hex) | 用途说明 |
| :--- | :--- | :--- |
| `surface-ground` | `#0d0f12` | 主画布背景底色（暗岩深灰，略带冷调） |
| `surface-panel` | `#13161c` | 模块面板底色（深色微抬升表面） |
| `surface-subtle` | `#1a1d24` | 嵌套代码块、图表容器、二级底色 |
| `border-subtle` | `#1e2229` | 默认极细分割线与普通边框 (1px) |
| `border-strong` | `#2e3440` | 强调线、活跃状态边框 |
| `text-primary` | `#ffffff` / `#f0f2f5` | 一级大标题、核心金句、重点名称 |
| `text-secondary` | `#c1c6d0` | 叙述正文、说明段落 |
| `text-muted` | `#6c7380` | 标签元数据、注释、说明前缀 |
| `accent-amber` | `#f59e0b` | **核心系统高亮色**：编号 `01`、活跃状态、架构核心节点 |
| `accent-emerald` | `#10b981` | 状态灯、进行中实验标签 |

### 2.2 字体排印 (Typography)

| 层级 | 推荐字体家族 | 字重 | 尺寸 / 行高 | 应用场景 |
| :--- | :--- | :--- | :--- | :--- |
| **System Sans** | `Inter`, `-apple-system`, `PingFang SC` | 400 / 600 / 700 | 14px – 48px | 页面大标题、正文叙述、交互按钮 |
| **Precision Mono**| `JetBrains Mono`, `Space Mono`, `monospace` | 400 / 500 / 700 | 11px – 13px | 章节编号、元数据标签、拓扑图、代码 |

- **标题规格**：
  - `Hero H1`: 36px – 48px, Weight 600, `leading-tight`, `tracking-tight`
  - `Section H2`: 20px – 24px, Weight 700, 全大写 + 字距微宽
  - `Mono Eyebrow`: 10px – 11px, Weight 600, 全部大写，形如 `[01 // PRIMARY_SYSTEM]`
- **圆角规范**：
  - 全站严格统一为 `2px` 微圆角（或直接 `0px` 直角），严禁超过 `4px` 的药丸形与大圆角。

### 2.3 核心组件令牌 (Component Primitives)

所有组件均已固化为标准类名与 CSS 变量（完整定义见 `system-tokens.css`），严禁在业务模块中随意书写临时行内样式：

| 组件类名 | 语义定位 | 视觉规范 |
| :--- | :--- | :--- |
| `.sys-rule` / `.sys-rule-strong` | 结构分割线 | 1px 实线，`#1e2229` / 强调线 `#2e3440` |
| `.sys-eyebrow` | 章节与系统标识 | 11px 等宽大写，字间距 0.08em，带 `.sys-dot-live` 呼吸脉冲点 |
| `.sys-tag` / `.sys-tag-amber` | 状态与元数据标签 | 10.5px 等宽，2px 圆角，深色微抬升底或琥珀黄微光底 |
| `.sys-panel` | 内容与模块底板 | 基础 `#13161c`，1px 细边，Hover 边框提亮至 `#2e3440`，无投影 |
| `.sys-quote` | 核心金句引文 | 左侧 2px 琥珀黄实线，18px 加粗正文，字距 -0.01em |
| `.sys-btn-primary` | 一级实心操作键 | 纯白底黑字，Hover 渐变至琥珀黄，2px 微圆角 |
| `.sys-btn-ghost` | 二级外框操作键 | 透明底，细边框，Hover 显琥珀微光与浅黄文字 |
| `.sys-topo-in` / `.sys-topo-core` | 拓扑架构节点 | 输入节点细边框；核心持久化节点 1px 琥珀黄外框 + 微外发光 |

---

## 3. 页面模块与信息架构 (Information Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│ [TOP NAV]: DANDI // TobeALeg ── 01.Worket  02.Exp  03.Writing│
├─────────────────────────────────────────────────────────────┤
│ [HERO]: I build and write about how AI changes work.        │
│         Projects, experiments, and notes...                 │
├─────────────────────────────────────────────────────────────┤
│ [01 WORKET]: "Work should survive the agent..."            │
│ ┌───────────────────────────┐ ┌───────────────────────────┐ │
│ │ Introduction & Philosophy │ │ Pipeline Topology (Diagram)│ │
│ └───────────────────────────┘ └───────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ [02 EXPERIMENTS]: What I'm testing                          │
│ ┌───────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│ │ LLM Wiki      │ │ Agent Skills     │ │ AI Workflows     │ │
│ └───────────────┘ └──────────────────┘ └──────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ [03 WRITING]: Topic-led Thought Matrix                      │
│ ┌───────────────┐ ┌──────────────────┐ ┌──────────────────┐ │
│ │ AI & Agents   │ │ Future of Work   │ │ Startup Notes    │ │
│ └───────────────┘ └──────────────────┘ └──────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ [FOOTER]: System metadata, build version & external links   │
└─────────────────────────────────────────────────────────────┘
```

---

### 3.1 导航与 Hero (Top Metabar & Hero)

- **顶部横向导航 (Top Nav)**：
  - 左侧：`DANDI` `// TobeALeg`
  - 右侧：`01.Worket`、`02.Experiments`、`03.Writing`，右端带外链 `GitHub ↗`。
  - 不设繁杂的二级下拉菜单，点击平滑滚动至对应锚点。
- **Hero 核心内容**：
  - **Eyebrow**: `SYS: BUILDER & WRITER // ARCHITECTURE & AGENTS`（附带琥珀黄微光圆点）
  - **主文案 (H1)**：`I build and write about how AI changes the way we work.`
  - **副文案 (P)**：`Projects, experiments, and notes on AI, agents, work, and the future.`

---

### 3.2 01 WORKET —— 核心项目大展示 (What I'm building)

这是页面的最大重心，采用**左文右图（双栏分发架构）**。

#### 左侧：理念与系统定位
- **状态标头**：`[01 // PRIMARY_SYSTEM]` + `macOS arm64 Local Utility`
- **核心论点 (Quote)**：
  > *“Work should survive the agent that executes it.”*
- **简短说明**：
  - Worket 是一个本地 macOS 工作记录工具。
  - 识别前台 Codex 或 WorkBuddy 工作上下文，把可见 Prompt、回复、工具记录与资料引用整理成独立的 `WorkInstance` / `WorkRecord`。
  - 核心属性：Persistent work, Context, State, Artifacts。
  - 架构优势：Executor（执行者）随时可替换。
- **行动点**：`Explore Worket →` 与 `GitHub: TobeALeg/worket ↗`

#### 右侧：解耦系统拓扑图 (Pipeline Topology)
用工整的模块框与 ASCII 流向表示：

```text
┌───────────────────────────────────────────────────────────┐
│                     TOPOLOGY SCHEMATIC                    │
├───────────────────────────────────────────────────────────┤
│  [Context]           [State]           [Artifacts]        │
│  Prompts & Cites     Goals & Progress  Files & Output     │
└──────────┬──────────────┬────────────────────┬────────────┘
           │              │                    │
           └──────────────┼────────────────────┘
                          ▼
┌───────────────────────────────────────────────────────────┐
│               WORK INSTANCE (Persistent Node)             │
│               任务实体与模型解耦，跨会话独立存续                │
└─────────────────────────┬─────────────────────────────────┘
                          ▼
┌───────────────────────────────────────────────────────────┐
│                 HOT-SWAPPABLE EXECUTORS                   │
│   [ Codex Desktop ]  /  [ WorkBuddy ]  /  [ Next Agent ]  │
└───────────────────────────────────────────────────────────┘
```

---

### 3.3 02 EXPERIMENTS —— 实验矩阵 (What I'm testing)

采用 **3 个横向并列的项目方块**，排版保持紧凑、克制，比 Worket 轻盈，体现活跃探索状态。

| 项目 | 标签 | 核心一句话 | 链接目标 |
| :--- | :--- | :--- | :--- |
| **LLM Wiki** | `MCP_HTTP_SERVICE` | 把零散 AI 对话和资料沉淀成长期活知识，提供 MCP Streamable HTTP 检索与协作服务。 | `TobeALeg/llm-wiki-online` ↗ |
| **Agent Skills** | `REUSABLE_AGENT_SKILLS` | 对 reusable skills、agent workflow、执行约束的系统化实验，沉淀 TrekMind UI 与评估器规范。 | `TobeALeg/SKILLS` ↗ |
| **AI Workflows** | `FIELD_PIPELINES` | 实际工作中的人机协作实验：AI 内容工作流、自动化管线、约束工程与执行效能验证。 | `Field Experiments (Ongoing)` |

---

### 3.4 03 WRITING —— 思想议题矩阵 (What I'm thinking)

**绝不按时间发布顺序倒排**。采用 **3 栏主题聚类矩阵（Topic Clusters）**，先建立思考框架，再承载具体论述文章：

#### 专栏 1：AI & Agents (Interfaces, Constraints & Harness)
- **Constraint Engineering**: 为什么 Agent 需要物理级护栏而不是 Prompt 约束
- **Harness & Context**: 让 Agent 在超长上下文与任务切换中生存的架构
- **Human–AI Interface**: 为什么桌宠与浮标交互优于传统侧边栏

#### 专栏 2：Future of Work (Work as an Object & Decoupling)
- **Work ≠ Executor**: 工作实例从特定 AI 执行模型中解耦的必然性
- **AI 作为新执行能力**: 组织如何真正沉淀属于自己的核心知识资产
- **AI-Native 协同组织**: 从对话驱动模式转向状态机持久化驱动

#### 专栏 3：Startup Notes (Judgment, Timing & Market)
- **[创业判断日志 (Observation-Notes)](https://tobealeg.github.io/Observation-Notes/)**: 现场分歧与现实验证的 Case 沉淀 ↗
- **技术变化期切入点**: Infra / Product / Interface 的代际迁移机会
- **FDE (Forward Deployed Engineer) 视角**: 小微应用想法的六维评估体系

---

## 4. 两种载体的落地实施指南 (Implementation Roadmap)

### 4.1 载体 A：GitHub Profile README (`TobeALeg/TobeALeg`)
作为任何人访问 `https://github.com/TobeALeg` 时看到的门面：
- **约束**：GitHub 限制外部 CSS 和 JavaScript，不支持自定义 web 字体。
- **实现手段**：
  - 使用 GitHub Flavored Markdown 语法；
  - 章节使用 `### [01 // WORKET]` 等等宽命名法；
  - Worket 架构拓扑采用标准代码块（` ```text `）或 SVG 矢量图；
  - 表格采用紧凑的 Markdown 表格；
  - 顶部与底部放置细线（`---`）。

### 4.2 载体 B：独立 GitHub Pages 站点 (`tobealeg.github.io`)
作为完整的交互式个人主页：
- **技术栈建议**：纯静态 HTML + Tailwind CSS（单文件极简维护）或 Astro。
- **增强特性**：
  - 完美加载 `JetBrains Mono` 与 `Inter` 字体；
  - 平滑的锚点滚动与微交互；
  - 支持直接将 Writing 条目链接至 Notion / 独立 Markdown 页面。

---

## 5. 验收清单 (Checklist)

- [ ] 页面无任何紫色渐变、发光阴影或软萌圆角卡片。
- [ ] 严格贯彻“Worket (Build) / Experiments (Test) / Writing (Think)”三段叙事。
- [ ] Worket 拓扑图清晰呈现“三元输入 $\to$ 独立持久化 WorkInstance $\to$ 可插拔 Executors”的解耦思想。
- [ ] Writing 模块严格按 3 个主题分栏，不出现传统博客的发布日期流。
- [ ] 关联的 3 个关键公开仓库（`worket`、`llm-wiki-online`、`SKILLS`）及 `Observation-Notes` 链接无误。

---

## 6. 双语系统与文案对齐规范 (Bilingual Architecture)

展示页支持中英文无缝切换（EN / 中文）。为保证双语状态下均保持硬核工学质感，文案严格遵循以下双语对齐字典：

| 模块 | 英文版本 (EN) | 中文版本 (ZH) | 设计与排版注意 |
| :--- | :--- | :--- | :--- |
| **Hero Eyebrow** | `SYS: BUILDER & WRITER // ARCHITECTURE & AGENTS` | `SYS: 建造者与写作者 // 架构与智能体` | 保持等宽与大写，中文版字间距保持 0.05em |
| **Hero H1** | `I build and write about how AI changes the way we work.` | **我构建工具，也记录 AI 如何重塑我们的工作方式。** | 中文标题字重 600，行高 1.3，避免生硬机翻 |
| **Hero Subtitle** | `Projects, experiments, and notes on AI, agents, work, and the future.` | 围绕 AI、智能体、工作本质与未来的项目、实验与思考笔记。 | 中文字号 15px，保持与英文相同的视觉平衡 |
| **Worket Quote** | *“Work should survive the agent that executes it.”* | **“工作应当存续于执行它的 Agent 之外。”** | 中文金句直接触达内核，左侧琥珀线保持一致 |
| **Worket Subtitle**| `Persistent work / Context / State / Artifacts` | `持久化工作实体 / 上下文 / 状态 / 制品` | 专有名词保留中英双语可读性 |
| **Topology Core** | `Work Instance (Persistent Node)` | `Work Instance 工作实例 (独立持久化节点)` | 关键对象名统一保留 `WorkInstance` 代码原名 |
| **Topology Exec** | `Hot-swappable Executors (Codex / WorkBuddy)` | `可插拔执行层 (Codex / WorkBuddy / 下一代 Agent)` | 强调解耦与执行环境任意替换 |
| **Exp 01** | `LLM Wiki (MCP Streamable HTTP Service)` | `LLM Wiki (MCP 活知识库检索与同步服务)` | 明确 MCP Streamable HTTP 协议属性 |
| **Exp 02** | `Agent Skills (Reusable Skills & Constraint Specs)` | `Agent Skills (可复用技能、执行约束与 TrekMind 规范)` | 关联用户真实仓库与设计系统 |
| **Exp 03** | `AI Workflows (Field Pipelines & Human-AI Collab)` | `AI Workflows (人机协同管线、自动化与效能实验)` | 标注 Ongoing / 持续迭代状态 |
| **Writing Col 1** | `AI & AGENTS` | `AI 与智能体` (约束工程 / Harness / 上下文生存) | 主题式分栏，不写日期 |
| **Writing Col 2** | `FUTURE OF WORK` | `工作的未来` (Work ≠ Executor / 组织资产) | 主题式分栏，不写日期 |
| **Writing Col 3** | `STARTUP NOTES` | `创业与判断` (现场分歧 Case / 代际切入点 / FDE) | 包含 `Observation-Notes` 真实外链 |

