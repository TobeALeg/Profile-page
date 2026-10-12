# 本地网页验收 · 2026-10-12

- `npm run build`：通过，零依赖静态产物位于 dist。
- `npm run check`：通过，脚本语法、ID 唯一、页面锚点和本地图片/样式存在；五个案例。
- 类型检查：不适用，原生 HTML/CSS/JavaScript，没有 TypeScript。
- Chrome：1440×1000 桌面与 360×800、390×844、430×932 手机宽度无横向溢出。390 手机及桌面实际截图检查。
- 页面交互：时间线锚点正常；中英切换覆盖案例和方法；HTML lang / aria-pressed 正常；刷新保留英文选择；已恢复中文。
- 四张已引用图片加载成功，原图链接本地路径有效。
- 控制台：无捕获到的 error / warn。
- 外部链接：GitHub 个人页、Worket、Observation-Notes HTTP 200；LLM Wiki 首次 HTTP 探测握手超时，随后 Chrome 正常打开公开仓库。
- 截图：output/playwright/portfolio 下的 desktop.jpg、desktop-timeline.jpg、mobile-390.jpg，另有首屏截图。

未部署、推送或修改共享权限。截图是浏览器模拟手机宽度，没有实体手机验收。既有案例仍保留原有内容缺口：LLM Wiki 缘起、部分案例视觉和结果未知；不阻碍现有材料形成可浏览网页。

## 02 倒序补充验证

- 五个节点严格反转为 LLM Wiki → Dashboard → GEO → JetBao → 首次 Agent 协作；节点内容及其他 HTML 与前次提交完全一致，CSS 未改。
- 构建、静态检查、git diff --check 通过，dist/index.html 与源文件一致。
- Chrome 1440×1000 / 390×844，中英文四种组合显示顺序一致，节点实际纵坐标递增；手机无横向溢出。
- 本地预览已恢复：http://127.0.0.1:4173/，页面、两份 CSS、全部引用图片 HTTP 200。服务由临时用户 launchctl 任务 local.codex.github-portfolio-preview 保持，无开机启动配置，仅绑定本机地址；可执行 `launchctl remove local.codex.github-portfolio-preview` 停止。
- 新截图：reverse-desktop.jpg、reverse-mobile.jpg。
