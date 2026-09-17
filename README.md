# Dandi (TobeALeg) Profile Page & Design System

> Personal showcase page & design system specification for Dandi (@TobeALeg).  
> **Aesthetic Philosophy:** Swiss Systems Lab (方案 B · 瑞士理性实验室) — Systems Architect & Toolmaker.

---

## 📑 仓库资产清单 (Repository Manifest)

| 文件 | 描述 |
| :--- | :--- |
| [`design.md`](./design.md) | **展示页完整设计系统规范文档**：涵盖定位主旨、设计反模式、色彩系统、字体排印、核心组件令牌 (`.sys-*`)、Worket 解耦拓扑图规范、三段式信息架构及中英双语对齐字典。 |
| [`system-tokens.css`](./system-tokens.css) | **标准化设计令牌与组件原子库**：包含 `--sys-ground`、`--sys-panel`、`--sys-amber` 以及 `.sys-eyebrow`、`.sys-tag`、`.sys-quote`、`.sys-btn-primary`、`.sys-topo-core` 等标准 CSS 类。 |
| [`index.html`](./index.html) | **双语实机展示页源码**：开箱即用的单页 Web 应用，支持中英文即时无缝切换，原生集成了 Worket 架构拓扑、活跃实验矩阵与议题式写作索引。 |

---

## 🧭 核心内容结构 (Information Architecture)

- **01 WORKET (What I'm building)**  
  *“Work should survive the agent that executes it.”*  
  展现状态持久化与执行者（Codex / WorkBuddy / 下一代 Agent）热替换的解耦架构。
- **02 EXPERIMENTS (What I'm testing)**  
  展示实际探索的 3 个技术矩阵：`LLM Wiki` (MCP 活知识库)、`Agent Skills` (可复用技能与约束规范)、`AI Workflows` (人机协同管线)。
- **03 WRITING (What I'm thinking)**  
  非时间流、议题式 3 栏思想网络：`AI & Agents`、`Future of Work`、`Startup Notes` (包含 [`Observation-Notes`](https://tobealeg.github.io/Observation-Notes/) 创业判断日志)。

---

## 🚀 部署与预览

### 本地预览
直接在浏览器中打开 [`index.html`](./index.html) 即可浏览完整效果与双语切换。

### 部署至 GitHub Pages
1. 在 GitHub 仓库设置中进入 **Settings → Pages**；
2. **Build and deployment** 选择 `Deploy from a branch`；
3. Branch 选择 `main` / `/ (root)`，点击 Save；
4. 即可在 `https://tobealeg.github.io/Profile-page/` 获得公开访问的个人主页。
