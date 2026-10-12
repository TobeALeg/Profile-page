# Dandi / TobeALeg — Github Portfolio

个人主页沿用 **Swiss Systems Lab** 设计系统：深色画布、琥珀强调色、清晰分隔与系统图。纯 HTML / CSS / JavaScript，无运行时依赖。

## 内容

- Worket：保留既有项目介绍与工作记录结构，不新增未经整理的经历。
- AI Experiments：首次 Agent 协作、JetBao 三阶段界面、GEO 的事实与目的、Dashboard 两个设计/工程转折，以及 LLM Wiki 的留存实现。
- Writing & Methods：已有协作方法记录，以及真实的 Observation-Notes 链接。

案例依据 [内容索引](docs/experiments/README.md)；截图标明版本、重截和演示数据范围。LLM Wiki 的代码日期不作为个人探索起点。未整理的过程和业务成果不补猜。

## 本地预览

```sh
npm run preview
```

打开 http://127.0.0.1:4173 。也可直接打开 `index.html`。双语切换会保留语言选择。

## 构建与检查

需 Node.js 和 Python 3；无需安装 npm 依赖。

```sh
npm run check
npm run build
```

`dist/` 是自包含的静态产物。`check` 验证脚本语法、唯一 ID、页面锚点、图片/样式路径及案例数量。本项目无 TypeScript，类型检查不适用。

## 文件

- `index.html`：双语内容、语义 HTML、语言切换。
- `system-tokens.css`：既有设计令牌。
- `portfolio.css`：响应式页面布局、交互与减少动态效果支持。
- `scripts/`：零依赖构建和静态检查。
- `docs/`：产品、架构和案例证据。
- `output/playwright/portfolio/`：桌面与手机验证截图。

当前只完成网页实现与本地预览，未部署、推送或变更共享权限。
