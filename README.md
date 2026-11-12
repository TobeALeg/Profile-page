# Dandi / TobeALeg — Github Portfolio

个人主页沿用 **Swiss Systems Lab** 设计系统：深色画布、琥珀强调色、清晰分隔与系统图。纯 HTML / CSS / JavaScript，无运行时依赖。

## 内容

- Worket：保留既有项目介绍与工作记录结构，不新增未经整理的经历。
- AI Experiments：首次 Agent 协作、JetBao 三阶段界面、GEO 的事实与目的、Dashboard 两个设计/工程转折，以及 LLM Wiki 的留存实现。
- Writing & Methods：已有协作方法记录，以及真实的 Observation-Notes 链接。

案例依据 [内容索引](docs/experiments/README.md)；截图标明版本、重截和演示数据范围。LLM Wiki 的代码日期不作为个人探索起点。未整理的过程和业务成果不补猜。

## 本地编辑

使用 Node.js 24，首次运行先安装构建依赖：

```sh
npm ci
npm run preview
```

打开 http://127.0.0.1:4173 ，点击“编辑页面”修改中英文文字或复制模块。“保存”写入 `content.json`，不会自动发布。双语切换会保留语言选择。不要直接打开模板 `index.html`，正文需要由内容源渲染。

## GitHub Pages

公开地址：https://tobealeg.github.io/Profile-page/

`.github/workflows/pages.yml` 在 `main` 更新后自动检查、测试、构建并发布 `dist/`。仓库 Settings → Pages 的 Source 设为 GitHub Actions。也可在 Actions 中手动运行部署。

公开构建只包含访客页面、样式、语言切换脚本及图片，不包含本地编辑脚本、保存接口或源文档。本机保存的内容需提交并推送至 `main` 才会更新网站。发布进度见仓库 Actions。

## 在线编辑

`https://dandi.site/` 跳转公开主页，访客无需登录。页脚“编辑 / Edit”进入 `https://dandi.site/editor/`，使用 GitHub 登录后，服务端仅允许 TobeALeg 本人编辑。

在编辑页修改文字或复制模块，点击“保存并发布”即可写回仓库并触发 Pages 更新。中英文分别保存。公开网站需等待部署完成才会更新；保存冲突或登录过期时会保留当前草稿并提示。完成后可“退出登录”。

服务端部署在现有个人服务器，运行方式及验证范围见 [在线编辑说明](online-editor/README.md)。

## 构建与检查

构建依赖通过 `npm ci` 安装；访客浏览无需任何运行时依赖。

```sh
npm run check
npm test
npm run build
```

`dist/` 是自包含的静态产物。`check` 验证脚本语法、唯一 ID、页面锚点、图片/样式路径及案例数量。本项目无 TypeScript，类型检查不适用。

## 文件

- `index.html`：带稳定文字键与模块标记的 HTML 模板。
- `content.json`：手动保存的中英文内容与模块复制记录。
- `system-tokens.css`：既有设计令牌。
- `portfolio.css`：响应式页面布局、交互与减少动态效果支持。
- `scripts/`：内容渲染、本机预览、构建与检查。
- `docs/`：产品、架构和案例证据。
- `output/playwright/portfolio/`：桌面与手机验证截图。

GitHub Pages 部署仅上传 `dist/`，不会将整个仓库作为网站目录。
