# Dashboard：动态添加应用的证据

整理日期：2026-10-08。状态：内容研究材料，未发布，未写入网页。

## 可以讲的核心转折

原来首页入口写在代码配置里；后来管理员可以在后台登记已经部署好的应用地址、名称、图标、标签、配色和位置，保存后进入首页目录。再往后，将入口资料与身份接入收敛为同一个应用对象，减少重复配置和接入时的错误。

这段最适合工程线：从自己维护几个入口，走向能让同事的项目接进来、持续管理的工具。**后台添加入口不等于替同事部署项目，也不等于任意应用无需代码适配就能统一登录。**

## 原始本人请求

以下从原始 Codex JSONL 的 `response_item`、`role=user`、`input_text` 提取。引用没有采用自动注入的浏览器上下文、AGENTS 指令、Agent 摘要或记忆摘要。时间换算为北京时间；省略号只是缩短原句，不补写当时动机。

**2026-08-18 11:21｜先把添加入口变为动态行为。**

> “那我们先做动态更新这个事情，这个做完之后我只需要知道同事的项目部署地址就好了，我就不管他是 Sites，还是 coolify，还是 netlify 了。”

原文有口语空格，上引仅整理空格与标点。该条还要求图标备选，并明确授权规划后交给子代理实现。

来源：[原始会话，第 227 行](/Users/dandi/.codex/sessions/2026/08/18/rollout-2026-08-18T10-07-17-01a0129f-7c6b-74b1-b1f6-a119d3e09e71.jsonl:227)。该会话第 9 行提出同事无 coding 基础、代码在 GitHub、需要可添加标签/icon/链接；第 212 行询问动态项目目录的含义。这说明最终采用“登记部署地址”是澄清后的范围，而非把 GitHub 仓库 URL 当成可运行应用。

**2026-08-18 12:48｜入口之后还要有身份接入。**

> “这样子接项目，可以沿用我的身份证明吗？”

来源：[同一原始会话，第 958 行](/Users/dandi/.codex/sessions/2026/08/18/rollout-2026-08-18T10-07-17-01a0129f-7c6b-74b1-b1f6-a119d3e09e71.jsonl:958)。这是需求，不是已实现证明。

**2026-08-20 17:28｜入口和身份其实是同一件管理工作。**

> “现在的这个子系统接入，和项目管理里的新建项目是分开的，但他们其实是一件事情呀。”

来源：[原始会话，第 2430 行](/Users/dandi/.codex/sessions/2026/08/20/rollout-2026-08-20T13-22-00-01a01d9e-7942-7890-8e85-0d3f350f755a.jsonl:2430)；第 2442 行明确要求修改并本地运行给本人查看。

**2026-08-21｜进一步减少手填和部署方式耦合。**

同一会话第 3391 行（10:48）要求回调/Webhook 地址最好不要手填，因为容易出错；第 4447 行（14:26）提出 `*.app.mentti.work` 子域规则；第 5070 行（15:16）要求增加直接跳转选项、无需反代，同时仍接统一身份。

来源：[第 3391 行](/Users/dandi/.codex/sessions/2026/08/20/rollout-2026-08-20T13-22-00-01a01d9e-7942-7890-8e85-0d3f350f755a.jsonl:3391)、[第 4447 行](/Users/dandi/.codex/sessions/2026/08/20/rollout-2026-08-20T13-22-00-01a01d9e-7942-7890-8e85-0d3f350f755a.jsonl:4447)、[第 5070 行](/Users/dandi/.codex/sessions/2026/08/20/rollout-2026-08-20T13-22-00-01a01d9e-7942-7890-8e85-0d3f350f755a.jsonl:5070)。本文不复制其中任何凭据具体值或真实业务记录。

## 四个实现节点

仓库：`/Users/dandi/mentti-dashboard`。以下查阅指定 SHA 的代码/diff，未将当前未提交修改当成历史实现。

| 日期 | 完整 SHA | 经过代码核查的前后行为 | 关键历史文件 |
| --- | --- | --- | --- |
| 2026-08-18 | `6e7bf4493aae001a54e1053f8bef27367f6d0dcf` | 首页从 `src/config/projects.ts` 的静态数组改为数据库读取，强制动态渲染；新增管理员项目 API、表单、列表及 SQLite 目录，支持创建、修改、启停和删除。URL 限于 HTTP/HTTPS，未登录和非管理员分别拒绝。图标使用 Lucide 受控选项。 | `src/app/page.tsx`、`src/app/api/admin/projects/route.ts`、`src/components/AdminProjectForm.tsx`、`src/lib/projects/index.ts`、`src/lib/db/schema.ts` |
| 2026-08-20 | `6194c01a5b95faa25a69f78d1840b4b5774ae1ec` | 入口与身份配置合为应用表单；后台从邮箱/项目/子系统接入三个面板收敛为邮箱/应用两个面板。项目行与受管 SSO 客户端通过同一事务创建、更新、删除，避免孤立数据。 | `src/components/AdminManagementTabs.tsx`、`src/components/ProjectAuthFields.tsx`、`src/lib/applications/admin.ts`、`docs/product.md` |
| 2026-08-21 | `f9b81b6351dc9174bea62a804c1db2fc7bd86183` | 输入合法应用标识自动生成 `<标识>.app.mentti.work` 访问地址；手动改为外部地址后不被继续修改标识覆盖。文档和 Nginx 模板明确通配符 DNS 只解决解析，网关仍需登记真实服务，创建记录不会自动部署。 | `src/components/AdminProjectForm.tsx`、`deploy/nginx/app-domain-catchall.conf`、`docs/product.md` |
| 2026-08-21 | `d8ff708340618df630af6a303d23672e4ee28216` | 增加“直接部署/跳转外部系统”模式；跳转只负责浏览器导航，SSO 回调与成员 Webhook 指向外部真实后端。前后端均禁止外部跳转使用共享 Cookie。受管 SSO 应用地址修改时同步派生认证接口地址。 | `src/components/AdminProjectForm.tsx`、`src/lib/applications/admin.ts`、`public/integration.md`、`tests/identity-integration.mjs` |

当前路径定位：[首页](/Users/dandi/mentti-dashboard/src/app/page.tsx)、[应用管理表单](/Users/dandi/mentti-dashboard/src/components/AdminProjectForm.tsx)、[管理 API](/Users/dandi/mentti-dashboard/src/app/api/admin/projects/route.ts)、[应用聚合](/Users/dandi/mentti-dashboard/src/lib/applications/admin.ts)、[身份接入文档](/Users/dandi/mentti-dashboard/public/integration.md)。历史复核用 `git -C /Users/dandi/mentti-dashboard show <SHA>:<文件>`。

## 身份接入边界

`6e7bf44` 的 product 已明确：Dashboard 只登记元数据和最终访问地址，不创建、构建、部署或停止外部项目，不保存部署平台凭据，GitHub 地址仅是可选维护线索。目录区域不等于授权控制，目录删除不删除外部仓库、部署或业务数据。

`d8ff708` 的公开接入文档要求子系统自行实现回调、state 校验、授权码兑换、本地会话，以及启用广播时的成员 Webhook。MentiHub 提供稳定身份资料，子系统维护自己的业务角色；统一登录不自动赋予业务权限，新身份默认待分配。外部域不能读取 MentiHub Cookie，所以后台选择 SSO 只是登记认证配置，不会自动替外部系统编写这些接口。

来源：上述 SHA 下 `docs/product.md`、`public/integration.md`、`src/lib/applications/admin.ts`；集成测试包含跨域跳转+shared_cookie 返回 409、HTTPS 校验、地址切换后回调更新等断言。本轮未重跑测试，不把测试存在写成此次验证通过。

## 已实现、已合并与上线证据分开看

本轮 checkout 为 `codex/unified-app-management`，HEAD `4bfe9e0d021229d96510f93cbc4844e22ad7347c`，存在多项未提交前端/API 修改和 output；本轮全部保留。缓存 main/origin/main 为 `4cc95b5c4c68f93476c4d641d38083da27b9da68`：前三个节点在其中，d8ff708 在另一分支。没有 fetch，不能用陈旧缓存断言后者从未合并。

原始 8 月 21 日会话有比本地缓存更晚的工具结果：[第 5677 行](/Users/dandi/.codex/sessions/2026/08/20/rollout-2026-08-20T13-22-00-01a01d9e-7942-7890-8e85-0d3f350f755a.jsonl:5677) 返回 PR 成功合并，merge SHA 为 `f5227482345ab47689089a73648d3c0f9d9bbaba`；[第 5800 行](/Users/dandi/.codex/sessions/2026/08/20/rollout-2026-08-20T13-22-00-01a01d9e-7942-7890-8e85-0d3f350f755a.jsonl:5800) 确认 PR #17 merged、该 SHA 的部署 workflow `32460854259` completed/success。这是当时远端交付证据，本轮未联网刷新。

当时会话最后仍记录外部系统未完成自身登录回调，因此不能把 Dashboard 已合并/已部署写成任意接入应用已完成 SSO。本轮没有核查当前生产界面、安装版本或外部系统，最终文案宜写已实现的行为及历史交付，而非今天所有路径已验收。

## 可供主案例采用的短稿

同事的项目开始接进来之后，我不想每加一个入口都改首页代码。于是把它做成后台可以维护的应用目录：只需要知道项目部署后的地址，就能设置图标、标签和卡片位置，不必关心它部署在什么平台。后来又发现，项目入口和身份接入在后台被分成了两件事，但使用上其实是同一件事；于是把它们收进同一个应用对象，再自动生成容易填错的接入地址。入口可以动态添加，外部系统自己的登录接口与权限仍需按契约接好。

上段为基于本人原始请求与代码的编辑草稿，不当作本人原话。
