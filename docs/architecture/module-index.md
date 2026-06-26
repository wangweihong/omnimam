# 模块索引

生成日期：2026-06-26

| 模块 | 子模块 | 状态 | 前端入口 | 后端接口 | 数据表 | 文档 | 说明 |
|---|---|---|---|---|---|---|---|
| Web 应用壳 | 导航、路由、当前用户能力 | 可用 | `/dashboard`、`/assets`、`/tasks`、`/canvases`、`/settings`、`/providers` | `GET /api/v1/me` | 无 | [web-shell](../modules/web-shell.md) | `apps/web/src/App.tsx` 定义路由和权限过滤。 |
| 模型提供商管理 | Provider、Model、Preset、默认模型 | 可用 | `/settings`、`/providers` | `/api/v1/providers`、`/api/v1/provider-presets`、`/api/v1/system-llm-config` | `providers`、`provider_models`、`system_llm_configs` | [provider-management](../modules/provider-management.md) | Web 页面和后端 CRUD 均存在。 |
| 平台资产管理 | 资产、标签、缩略图、资产组、画布资产 | 可用 | `/assets` | `/api/v1/assets`、`/api/v1/asset-groups`、`/api/v1/canvas-assets` | `assets`、`asset_thumbnails`、`tags`、`asset_tags` | [platform-assets](../modules/platform-assets.md) | 支持上传、分片上传、检索和预览。 |
| 异步任务管理 | Task、Worker | 可用 | `/tasks` | `/api/v1/tasks` | `tasks` | [task-management](../modules/task-management.md) | 支持任务列表、创建、取消和事件接口。 |
| 画布工作流 | Canvas、Project、Workflow、Run | 可用 | `/canvases`、`/canvases/:canvasId` | `/api/v1/canvases`、`/api/v1/projects` | `canvases`、`projects` | [canvas-workflow](../modules/canvas-workflow.md) | 支持画布编辑、导入导出和运行。 |
| 素材库 | Library、Category、Item | 部分可用 | 未发现 | `/api/v1/asset-library/*` | `asset_libraries`、`asset_categories`、`asset_items` | [asset-library](../modules/asset-library.md) | 后端存在，Web 独立页面缺失。 |
| 提示词库 | Library、Category、Item | 部分可用 | 未发现 | `/api/v1/prompt-libraries/*` | `prompt_libraries`、`prompt_categories`、`prompt_items` | [prompt-library](../modules/prompt-library.md) | 后端存在，Web 独立页面缺失。 |
| 认证与 SSO 设置 | OTP、SAML、IdP、SP、Metadata | 部分可用 | 未发现 | `/api/v1/auth/*`、`/api/v1/setting/sso/*` | `identity_providers`、`service_providers`、`settings`、`user_otps`、`one_time_tokens` | [auth-sso-settings](../modules/auth-sso-settings.md) | 后端接口存在，Web 配置页面缺失。 |
| 身份与权限 | User、Role、Permission、FeatureFlag | 开发中 | 导航权限使用 | `GET /api/v1/me` | `users`、`roles`、`permissions`、`user_roles`、`feature_flags` | [identity-permission](../modules/identity-permission.md) | 模型和当前用户能力存在，管理界面与 CRUD 待确认。 |
| 存储后端 | StorageBackend | 部分可用 | 未发现 | `/api/v1/storage-backends` | `storage_backends` | [storage-backend](../modules/storage-backend.md) | 后端接口存在，Web 管理入口缺失。 |
