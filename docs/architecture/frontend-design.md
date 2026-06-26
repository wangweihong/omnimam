# 前端设计

生成日期：2026-06-26

## 1. 技术和入口

| 项 | 结论 | 证据 |
|---|---|---|
| 框架 | React 18 + Vite + TypeScript | `apps/web/package.json` |
| 应用入口 | `main.tsx` 挂载 Web 应用 | `apps/web/src/main.tsx` |
| 路由入口 | `App.tsx` 使用 `Routes`/`Route` | `apps/web/src/App.tsx` |
| API Client | 默认 baseURL 为 `/api/v1` | `apps/web/src/shared/api/client.ts` |
| API 封装 | Provider、Asset、Task、Canvas 等封装在 platform API | `apps/web/src/shared/api/platform.ts` |

## 2. 页面与导航

| 页面 | 路由 | 状态 | 关键能力 | 证据 |
|---|---|---|---|---|
| 工作台 | `/dashboard` | 可用 | 展示当前用户、角色、feature flags 和能力概览。 | `apps/web/src/pages/Dashboard.tsx` |
| 资产 | `/assets` | 可用 | 上传、分片上传、搜索解析、筛选、预览、重命名、删除。 | `apps/web/src/pages/Assets.tsx` |
| 任务 | `/tasks` | 可用 | 任务列表、状态筛选、取消任务。 | `apps/web/src/pages/Tasks.tsx` |
| 画布列表 | `/canvases` | 可用 | 创建、导入、导出、重命名、删除、进入编辑器。 | `apps/web/src/pages/Canvases.tsx` |
| 画布编辑器 | `/canvases/:canvasId` | 可用 | 节点编辑、连线、保存、运行、workflow 导入导出、资产注册。 | `apps/web/src/pages/CanvasEditor.tsx` |
| 设置首页 | `/settings` | 可用 | 提供模型设置入口。 | `apps/web/src/pages/SettingsHome.tsx` |
| 模型设置 | `/providers` | 可用 | Provider CRUD、模型管理、同步、测试、默认模型。 | `apps/web/src/pages/Providers.tsx` |

## 3. 权限与状态

- `App.tsx` 通过 `getMe()` 获取当前用户能力；证据：`apps/web/src/App.tsx`。
- `hasPermission(me, permission)` 用于导航可见性和页面写权限；证据：`apps/web/src/shared/auth/features.ts`。
- 导航权限包括 `asset.read`、`task.read`、`canvas.read`、`provider.manage`；证据：`apps/web/src/App.tsx` 的 `navItems`。
- 写权限包括 `asset.create`、`task.cancel`、`provider.manage`；证据：`apps/web/src/App.tsx` 路由 props。

## 4. 已确认缺口

| 缺口 | 建议状态 | 证据 |
|---|---|---|
| 素材库独立页面 | 待开发 | `apps/web/src/App.tsx` 未发现 `/asset-library` 路由。 |
| 提示词库独立页面 | 待开发 | `apps/web/src/App.tsx` 未发现 `/prompt-libraries` 路由。 |
| SSO 设置页面 | 待开发 | `apps/web/src/App.tsx` 未发现 SSO 设置路由。 |
| 用户/角色/权限管理页面 | 待开发 | `apps/web/src/App.tsx` 未发现用户、角色、权限管理路由。 |
| 存储后端管理页面 | 待开发 | `apps/web/src/App.tsx` 未发现 `/storage-backends` 路由。 |
