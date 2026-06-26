# 平台资产管理

## 1. 模块概述

平台资产管理负责资产上传、分片上传、列表筛选、自然语言检索解析、预览、缩略图、标签、资产组和画布资产注册。

## 2. 模块状态

状态：可用

### 状态说明

Web 资产页面、资产 API、上传/分片上传接口、资产表模型和标签/缩略图 store 均存在。

### 状态证据

- 文件路径：`apps/web/src/pages/Assets.tsx` 实现资产页面。
- 路由：`/api/v1/assets`、`/api/v1/assets/upload`、`/api/v1/assets/uploads/chunks/*` 在 `backend/internal/apiserver/route.go`。
- 函数名：`PlatformController.UploadAsset`、`ListAssets`、`ParseAssetSearch`。
- 数据库表：`assets`、`asset_thumbnails`、`tags`、`asset_tags`、`asset_groups` 等定义于 `backend/apis/iapiserver/meta_platform.go`。

## 3. 功能清单

| 功能 | 子功能 | 状态 | 前端入口 | 后端接口 | 数据表 | 证据 |
|---|---|---|---|---|---|---|
| 资产列表 | 筛选、刷新 | 可用 | `/assets` | `GET /api/v1/assets` | `assets` | `Assets.tsx`、`route.go` |
| 上传 | 普通上传、分片上传、取消 | 可用 | `/assets` | `/api/v1/assets/upload`、`/uploads/chunks/*` | `assets`、`tasks` | `Assets.tsx`、`platform.go` |
| 搜索 | 自然语言解析、资产查询 | 可用 | `/assets` | `/api/v1/assets/search`、`/search/parse` | `assets`、`tags` | `platform.ts` |
| 预览 | 内容、缩略图 | 可用 | `/assets` | `/assets/:asset_id/content`、`/thumbnail` | `asset_thumbnails` | `Assets.tsx` |
| 资产维护 | 重命名、删除 | 可用 | `/assets` | `PATCH/DELETE /assets/:asset_id` | `assets` | `platform.ts` |

## 4. 子模块清单

| 子模块 | 状态 | 说明 | 证据 |
|---|---|---|---|
| Asset | 可用 | 元数据、内容和删除。 | `meta_platform.go` |
| Thumbnail | 可用 | 缩略图元数据。 | `AssetThumbnail` |
| Tag | 可用 | 标签与 asset_tag 关联。 | `Tag`、`AssetTag` |
| Canvas Asset | 可用 | 画布资产下载和输出注册。 | `route.go` |

## 5. 页面详细设计

`Assets.tsx` 包含筛选工具栏、自然语言搜索、上传按钮、分片上传进度、资产列表、预览、详情、右键菜单、重命名和删除操作。

## 6. 前端交互流程

1. 页面加载时调用 `listAssets`。
2. 用户设置筛选条件或提交自然语言搜索。
3. 小文件走普通上传，大文件按 SHA-256 和 chunk 上传。
4. 上传完成后刷新列表并展示可能创建的任务。
5. 用户可预览、下载、重命名或删除资产。

## 7. 业务逻辑和规则

- 前端 `CHUNK_UPLOAD_THRESHOLD` 和 `CHUNK_SIZE` 均为 1 MiB；证据：`Assets.tsx`。
- 删除为接口语义删除，数据库 `assets.deleted_at` 字段表示软删除；证据：`meta_platform.go`。
- 对象存储路径、配额和清理策略待确认。

## 8. 后端功能逻辑

资产 API 在 `route.go` 注册到 `PlatformController`。controller 调用 platform service，service/store 操作资产、缩略图、标签、资产组、任务和存储后端表。

## 9. 后端接口设计

- Method：GET/POST/PUT/PATCH/DELETE
- Path：`/api/v1/assets*`、`/api/v1/asset-groups`、`/api/v1/canvas-assets/*`
- Request：见 `backend/apis/iapiserver/request_platform.go`
- Response：见 `request_platform.go` 和 `apps/web/src/shared/api/types.ts`
- 权限要求：待确认；前端写权限使用 `asset.create`
- 校验规则：request binding 和 service/store 校验
- 错误处理：前端 `ApiErrorView`
- 代码证据：`backend/internal/apiserver/controller/v1/platform/platform.go`

## 10. 数据库表设计

| 表 | 说明 | 证据 |
|---|---|---|
| `assets` | 资产元数据、对象 key、尺寸、checksum、format、source、deleted_at。 | `meta_platform.go` |
| `asset_thumbnails` | 缩略图对象和状态。 | `meta_platform.go` |
| `tags`、`asset_tags` | 标签和资产标签关联。 | `meta_platform.go` |
| `asset_groups`、`asset_group_members` | 资产组和成员。 | `meta_platform.go` |
| `asset_relations` | 资产之间和任务相关关系。 | `meta_platform.go` |
| `storage_backends` | 存储后端元数据。 | `meta_platform.go` |

## 11. 状态变更记录

| 日期 | 功能 | 原状态 | 新状态 | 说明 |
|---|---|---|---|---|
| 2026-06-26 | 平台资产管理 | 未知 | 可用 | 初始化文档时根据代码证据确认。 |

## 12. 已实现证据

| 类型 | 文件/对象 | 说明 |
|---|---|---|
| 前端 | `apps/web/src/pages/Assets.tsx` | 资产页面。 |
| API | `/api/v1/assets` | 资产 API。 |
| DB | `assets`、`asset_thumbnails`、`tags` | 资产相关表。 |

## 13. 未完成事项

| 事项 | 类型 | 建议状态 | 说明 |
|---|---|---|---|
| 生产存储策略 | 待确认 | 未知 | 存储根路径、对象生命周期和容量待确认。 |

## 14. 后续开发建议

- 补充资产清理、缩略图生成失败重试和对象存储健康检查文档。
