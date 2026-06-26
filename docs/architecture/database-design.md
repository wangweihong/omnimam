# 数据库设计

生成日期：2026-06-26

## 1. 初始化方式

当前代码通过 GORM AutoMigrate 初始化表结构。

代码证据：

- `backend/internal/apiserver/server.go`：`CompletedExtraConfig.New()` 调用 `storeIns.EnsureScheme(...)`。
- `backend/internal/apiserver/store/postgresql/0_pg.go`：`EnsureScheme` 内部调用 `ds.db.AutoMigrate(metaTypes...)`。
- `backend/apis/iapiserver/meta_*.go`：定义 `TableName()` 和 `gorm` tag。

未发现手写 migration 作为主 schema 变更路径；外键约束、生产数据库状态和已有数据量均为待确认。

## 2. 表分组

| 分组 | 表 | 说明 |
|---|---|---|
| 设置与 SSO | `settings`、`identity_providers`、`service_providers`、`one_time_tokens`、`user_otps` | SAML/OTP/设置相关表。 |
| 身份与权限 | `users`、`roles`、`permissions`、`user_roles`、`feature_flags` | 用户、角色、权限、feature flag 数据模型。 |
| 素材库 | `asset_libraries`、`asset_categories`、`asset_items` | 后端素材库 CRUD 模型。 |
| 提示词库 | `prompt_libraries`、`prompt_categories`、`prompt_items` | 后端提示词库 CRUD 模型。 |
| 画布 | `projects`、`canvases` | 画布项目、画布元信息和图结构持久化。 |
| 模型提供商 | `providers`、`provider_models`、`provider_capabilities`、`system_llm_configs` | Provider、模型和默认模型绑定。 |
| 平台资产 | `storage_backends`、`assets`、`asset_thumbnails`、`tags`、`asset_tags`、`asset_groups`、`asset_group_members`、`asset_relations` | 资产元数据、标签、缩略图、资产关系和存储后端。 |
| 异步任务 | `tasks` | DB-backed task 队列和状态。 |

## 3. 关键设计事实

- `canvases` 表中 `Nodes`、`Connections`、`Viewport`、`Logs`、`Settings` 为 `gorm:"-"` 字段，实际持久化细节需结合 service/store 更新逻辑确认；证据：`backend/apis/iapiserver/meta_asset.go`。
- Provider、ProviderModel、StorageBackend、Asset、Task 等模型使用 shadow text 字段存储 map/slice 类数据；证据：`backend/apis/iapiserver/meta_platform.go`。
- `system_llm_configs.purpose` 使用 `uniqueIndex`；证据：`backend/apis/iapiserver/meta_platform.go`。
- `tasks` 表包含 `status`、`priority`、`queue`、`lock_owner`、`locked_until`、`idempotency_key` 等任务队列字段；证据：`backend/apis/iapiserver/meta_platform.go`。

## 4. 待确认

| 事项 | 说明 |
|---|---|
| 外键 | 代码中多处使用 `*_id` 字段和索引，但未发现显式外键约束声明。 |
| migration 策略 | 当前静态扫描只确认 AutoMigrate，未确认生产环境是否允许自动变更 schema。 |
| 数据清理 | asset、thumbnail、task、trash canvas 的清理周期需确认。 |
| 加密字段 | provider credential、SSO secret、token payload 的加密和脱敏策略需确认。 |
