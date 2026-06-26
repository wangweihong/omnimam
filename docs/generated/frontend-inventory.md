# Frontend Inventory

生成日期：2026-06-26

事实来源：`apps/web/src/App.tsx`、`apps/web/src/pages/`、`apps/web/src/shared/api/platform.ts`。

| 模块 | 页面 | 路由 | 组件 | 调用接口 | 交互说明 | 状态 | 证据 |
|---|---|---|---|---|---|---|---|
| Web 应用壳 | 应用壳 | `/`、`*`、侧边导航 | `App`、`ApiErrorView`、`ToastViewport` | `GET /api/v1/me` | 启动时加载当前用户，按 permission 过滤导航，异常时显示重试。 | 可用 | `apps/web/src/App.tsx`、`apps/web/src/shared/api/platform.ts` |
| Web 应用壳 | 工作台 | `/dashboard` | `Dashboard`、`PageHeader` | 无直接业务 API；使用 App 传入 `me` | 展示当前用户、角色、feature flags 和能力入口。 | 可用 | `apps/web/src/pages/Dashboard.tsx` |
| 平台资产管理 | 资产 | `/assets` | `Assets`、`ApiErrorView`、`PageHeader` | `GET /assets`、`POST /assets/upload`、分片上传接口、`POST /assets/search/parse`、`PATCH /assets/:asset_id`、`DELETE /assets/:asset_id` | 支持筛选、自然语言检索解析、上传/分片上传、预览、重命名、删除。 | 可用 | `apps/web/src/pages/Assets.tsx`、`apps/web/src/shared/api/platform.ts` |
| 异步任务管理 | 任务 | `/tasks` | `Tasks`、`StatusBadge`、`PageHeader` | `GET /tasks`、`POST /tasks/:task_id/cancel` | 支持按状态筛选、刷新、取消未完成任务。 | 可用 | `apps/web/src/pages/Tasks.tsx` |
| 画布工作流 | 画布列表 | `/canvases` | `Canvases`、`PageHeader` | `GET /canvases`、`POST /canvases`、`PATCH /canvases/:id`、`DELETE /canvases/:id`、导入导出接口 | 支持创建 classic/smart 画布、重命名、删除、导入 JSON、导出 JSON、进入编辑器。 | 可用 | `apps/web/src/pages/Canvases.tsx` |
| 画布工作流 | 画布编辑器 | `/canvases/:canvasId` | `CanvasEditor` | `GET /canvases/:id`、`PUT /canvases/:id`、`POST /canvases/:id/run`、节点运行、workflow 导入导出、资产注册 | 支持节点编辑、连线、缩放、保存、运行、导入导出 workflow/package、资产引用和输出注册。 | 可用 | `apps/web/src/pages/CanvasEditor.tsx` |
| 模型提供商管理 | 设置首页 | `/settings` | `SettingsHome` | 无直接业务 API | 提供模型设置入口，链接到 `/providers`。 | 可用 | `apps/web/src/pages/SettingsHome.tsx` |
| 模型提供商管理 | 模型设置 | `/providers` | `Providers`、`ConfirmDialog`、`ToastViewport` | provider、provider model、provider preset、system llm config 相关接口 | 支持 provider 增删改、模型增删改/同步、连通性测试、默认模型配置。 | 可用 | `apps/web/src/pages/Providers.tsx`、`apps/web/src/shared/api/platform.ts` |
| 素材库 | 独立页面 | 未发现 | 未发现 | 后端存在 `/asset-library/*`，前端未封装调用 | 当前 Web 没有独立素材库页面。 | 部分可用 | `apps/web/src/App.tsx` 未包含 `/asset-library` 路由 |
| 提示词库 | 独立页面 | 未发现 | 未发现 | 后端存在 `/prompt-libraries/*`，前端未封装调用 | 当前 Web 没有独立提示词库页面。 | 部分可用 | `apps/web/src/App.tsx` 未包含 `/prompt-libraries` 路由 |
| 认证与 SSO 设置 | 独立页面 | 未发现 | 未发现 | 后端存在 `/auth/*` 和 `/setting/sso/*` | 当前 Web 没有独立 OTP/SSO 设置页面。 | 部分可用 | `apps/web/src/App.tsx` 未包含 SSO 设置路由 |
| 身份与权限 | 用户/角色页面 | 未发现 | 未发现 | `GET /me` | 仅使用当前用户权限过滤导航，未发现用户/角色/权限管理页面。 | 开发中 | `apps/web/src/shared/auth/features.ts`、`apps/web/src/App.tsx` |
| 存储后端 | 独立页面 | 未发现 | 未发现 | 后端存在 `/storage-backends` | 当前 Web 没有独立存储后端管理页面。 | 部分可用 | `apps/web/src/App.tsx` 未包含 `/storage-backends` 路由 |
