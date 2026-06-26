# DB Inventory

生成日期：2026-06-26

事实来源：

- `backend/internal/apiserver/server.go` 的 `EnsureScheme(...)`
- `backend/internal/apiserver/store/postgresql/0_pg.go` 的 `AutoMigrate`
- `backend/apis/iapiserver/meta_*.go` 的 `TableName()` 和 `gorm` tag

## 1. 数据库初始化方式

| 项 | 结论 | 证据 |
|---|---|---|
| Schema 初始化 | 通过 Store `EnsureScheme` 调用 GORM `AutoMigrate` | `backend/internal/apiserver/server.go`、`backend/internal/apiserver/store/postgresql/0_pg.go` |
| 手写 migration | 未发现 | 当前扫描未发现 `backend/migrations` 或独立 SQL migration 作为主路径 |
| 外键关系 | 待确认 | 多数字段以 `*_id` 和 index tag 表达，未发现显式外键约束声明 |
| 生产数据状态 | 待确认 | 当前仅静态扫描代码，未连接运行数据库 |

## 2. 表清单

| 模块 | 表 | 模型 | 关键字段/索引证据 | 状态 | 证据 |
|---|---|---|---|---|---|
| 认证与 SSO 设置 | `settings` | `iapiserver.Setting` | `TableName()` 返回 `settings` | 部分可用 | `backend/apis/iapiserver/meta_setting.go` |
| 认证与 SSO 设置 | `service_providers` | `iapiserver.ServiceProvider` | `protocol`、`endpoint`、`type` | 部分可用 | `backend/apis/iapiserver/meta_sso.go` |
| 认证与 SSO 设置 | `identity_providers` | `iapiserver.IdentityProvider` | `enable`、`protocol`、`endpoint` | 部分可用 | `backend/apis/iapiserver/meta_sso.go` |
| 身份与权限 | `users` | `iapiserver.User` | `ObjectMeta`、`password`、`mail`、`phone`、`type`、`source` | 开发中 | `backend/apis/iapiserver/meta_identity.go` |
| 认证与 SSO 设置 | `one_time_tokens` | `iapiserver.OneTimeToken` | `payload_hash` not null、`expires_at` index、`used` index | 部分可用 | `backend/apis/iapiserver/meta_token.go` |
| 认证与 SSO 设置 | `user_otps` | `iapiserver.UserOTP` | `secret` not null、`user_id` | 部分可用 | `backend/apis/iapiserver/meta_identity.go` |
| 素材库 | `asset_libraries` | `iapiserver.AssetLibrary` | `TableName()` 返回 `asset_libraries` | 部分可用 | `backend/apis/iapiserver/meta_asset.go` |
| 素材库 | `asset_categories` | `iapiserver.AssetCategory` | `library_id` index、`type` default image、`sort_order` default 0 | 部分可用 | `backend/apis/iapiserver/meta_asset.go` |
| 素材库 | `asset_items` | `iapiserver.AssetItem` | `library_id` index、`category_id` index、`url` not null、`kind` default image | 部分可用 | `backend/apis/iapiserver/meta_asset.go` |
| 提示词库 | `prompt_libraries` | `iapiserver.PromptLibrary` | `system`、`active`、`readonly` boolean defaults | 部分可用 | `backend/apis/iapiserver/meta_asset.go` |
| 提示词库 | `prompt_categories` | `iapiserver.PromptCategory` | `library_id` index | 部分可用 | `backend/apis/iapiserver/meta_asset.go` |
| 提示词库 | `prompt_items` | `iapiserver.PromptItem` | `library_id` index、`category_id` index、`positive` text not null | 部分可用 | `backend/apis/iapiserver/meta_asset.go` |
| 画布工作流 | `projects` | `iapiserver.Project` | `sort_order` default 0 | 可用 | `backend/apis/iapiserver/meta_asset.go` |
| 画布工作流 | `canvases` | `iapiserver.Canvas` | `kind` default classic、`project_id` index、`deleted_at`、图数据字段为 `gorm:"-"` | 可用 | `backend/apis/iapiserver/meta_asset.go` |
| 模型提供商管理 | `providers` | `iapiserver.Provider` | `type` index、`enabled` not null、`preset_key` index、`config` text shadow | 可用 | `backend/apis/iapiserver/meta_platform.go` |
| 模型提供商管理 | `provider_models` | `iapiserver.ProviderModel` | `provider_id` index、`model` index、`endpoint_type` index、JSON shadow 字段 | 可用 | `backend/apis/iapiserver/meta_platform.go` |
| 模型提供商管理 | `provider_capabilities` | `iapiserver.ProviderCapability` | `TableName()` 返回 `provider_capabilities` | 可用 | `backend/apis/iapiserver/meta_platform.go` |
| 模型提供商管理 | `system_llm_configs` | `iapiserver.SystemLLMConfig` | `purpose` uniqueIndex、`provider_id` index、`model_id` index | 可用 | `backend/apis/iapiserver/meta_platform.go` |
| 存储后端 | `storage_backends` | `iapiserver.StorageBackend` | `type` index、`enabled` default true、`readonly` default false、`quota` | 部分可用 | `backend/apis/iapiserver/meta_platform.go` |
| 平台资产管理 | `assets` | `iapiserver.Asset` | `media_type`、`mime_type`、`storage_backend_id`、`checksum`、尺寸、格式、source、deleted_at 均含 index | 可用 | `backend/apis/iapiserver/meta_platform.go` |
| 平台资产管理 | `asset_thumbnails` | `iapiserver.AssetThumbnail` | `asset_id` index、`storage_backend_id` index、`status` default pending index | 可用 | `backend/apis/iapiserver/meta_platform.go` |
| 平台资产管理 | `tags` | `iapiserver.Tag` | `source` default user index | 可用 | `backend/apis/iapiserver/meta_platform.go` |
| 平台资产管理 | `asset_tags` | `iapiserver.AssetTag` | `asset_id` index、`tag_id` index、`source` index | 可用 | `backend/apis/iapiserver/meta_platform.go` |
| 平台资产管理 | `asset_groups` | `iapiserver.AssetGroup` | `type` default collection index、`dynamic_rule` text shadow | 可用 | `backend/apis/iapiserver/meta_platform.go` |
| 平台资产管理 | `asset_group_members` | `iapiserver.AssetGroupMember` | `group_id` index、`asset_id` index、`role` | 可用 | `backend/apis/iapiserver/meta_platform.go` |
| 平台资产管理 | `asset_relations` | `iapiserver.AssetRelation` | `source_asset_id` index、`target_asset_id` index、`task_id` index、`relation_type` index | 可用 | `backend/apis/iapiserver/meta_platform.go` |
| 异步任务管理 | `tasks` | `iapiserver.Task` | `type` index、`status` default pending index、`priority` index、`queue` index、`locked_until` index | 可用 | `backend/apis/iapiserver/meta_platform.go` |
| 身份与权限 | `feature_flags` | `iapiserver.FeatureFlag` | `key` uniqueIndex、`enabled` default true | 开发中 | `backend/apis/iapiserver/meta_platform.go` |
| 身份与权限 | `roles` | `iapiserver.Role` | `system` default false | 开发中 | `backend/apis/iapiserver/meta_platform.go` |
| 身份与权限 | `permissions` | `iapiserver.Permission` | `key` uniqueIndex | 开发中 | `backend/apis/iapiserver/meta_platform.go` |
| 身份与权限 | `user_roles` | `iapiserver.UserRole` | `user_id` index、`role_id` index | 开发中 | `backend/apis/iapiserver/meta_platform.go` |
