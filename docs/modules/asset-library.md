# 素材库

## 1. 模块概述

素材库提供后端 Library、Category、Item 的管理接口，并支持批量创建、批量删除、移动和分类。当前未发现对应 Web 独立页面。

## 2. 模块状态

状态：部分可用

### 状态说明

后端路由、controller、service、store 和数据库表模型存在；当前 Web 路由中未发现 `/asset-library` 独立页面。

### 状态证据

- 路由：`/api/v1/asset-library/*` 在 `backend/internal/apiserver/route.go` 注册。
- 函数名：`AssetController.ListLibraries`、`CreateCategory`、`BatchCreateItems` 等。
- 文件路径：`backend/internal/apiserver/service/v1/asset/0_service.go`。
- 数据库表：`asset_libraries`、`asset_categories`、`asset_items` 定义于 `backend/apis/iapiserver/meta_asset.go`。
- 文件路径：`apps/web/src/App.tsx` 未发现 `/asset-library` 路由。

## 3. 功能清单

| 功能 | 子功能 | 状态 | 前端入口 | 后端接口 | 数据表 | 证据 |
|---|---|---|---|---|---|---|
| Library | 列表、创建、更新、删除 | 部分可用 | 未发现 | `/api/v1/asset-library/libraries` | `asset_libraries` | `route.go`、`asset.go` |
| Category | 列表、创建、更新、删除 | 部分可用 | 未发现 | `/api/v1/asset-library/categories` | `asset_categories` | `route.go`、`asset_category.go` |
| Item | 列表、创建、批量创建、更新、删除、移动、分类 | 部分可用 | 未发现 | `/api/v1/asset-library/items*` | `asset_items` | `route.go`、`asset_item.go` |

## 4. 子模块清单

| 子模块 | 状态 | 说明 | 证据 |
|---|---|---|---|
| AssetLibrary | 部分可用 | 后端 CRUD 存在。 | `store/postgresql/asset_library.go` |
| AssetCategory | 部分可用 | 后端 CRUD 存在。 | `store/postgresql/asset_category.go` |
| AssetItem | 部分可用 | 后端 CRUD 和批量操作存在。 | `store/postgresql/asset_item.go` |

## 5. 页面详细设计

当前未发现独立页面。`apps/web/src/App.tsx` 中没有 `/asset-library` 或类似素材库管理路由。

## 6. 前端交互流程

待确认。当前代码未提供独立 Web 交互流程。

## 7. 业务逻辑和规则

- Library 创建时检查同名；证据：`store/postgresql/asset_library.go`。
- Category 创建时检查同 library 下同名；证据：`store/postgresql/asset_category.go`。
- Item 支持 library/category/kind 过滤；证据：`store/postgresql/asset_item.go`。

## 8. 后端功能逻辑

`route.go` 将 `/asset-library` 路由注册到 `AssetController`。controller 调用 asset service，service 使用 AssetLibraries、AssetCategories、AssetItems store。

## 9. 后端接口设计

- Method：GET/POST/PATCH/DELETE
- Path：`/api/v1/asset-library/libraries`、`/categories`、`/items`
- Request：见 `backend/apis/iapiserver/request_asset.go`
- Response：见 `request_asset.go`
- 权限要求：待确认
- 校验规则：request binding 和 store 重名检查
- 错误处理：后端通过统一响应写出，前端页面未发现
- 代码证据：`backend/internal/apiserver/controller/v1/asset/asset.go`

## 10. 数据库表设计

| 表 | 说明 | 证据 |
|---|---|---|
| `asset_libraries` | 素材库。 | `meta_asset.go` |
| `asset_categories` | 分类，包含 `library_id` index、`type`、`dir`、`sort_order`。 | `meta_asset.go` |
| `asset_items` | 条目，包含 `library_id`、`category_id`、`url`、`kind`、`size`、`format`。 | `meta_asset.go` |

## 11. 状态变更记录

| 日期 | 功能 | 原状态 | 新状态 | 说明 |
|---|---|---|---|---|
| 2026-06-26 | 素材库 | 未知 | 部分可用 | 后端存在，Web 独立页面缺失。 |

## 12. 已实现证据

| 类型 | 文件/对象 | 说明 |
|---|---|---|
| API | `/api/v1/asset-library/*` | 素材库接口。 |
| Service | `backend/internal/apiserver/service/v1/asset/0_service.go` | 素材库服务。 |
| DB | `asset_libraries`、`asset_categories`、`asset_items` | 素材库表。 |

## 13. 未完成事项

| 事项 | 类型 | 建议状态 | 说明 |
|---|---|---|---|
| Web 页面 | 前端 | 待开发 | 当前未发现素材库独立页面。 |
| 与平台资产边界 | 设计 | 未知 | 需明确素材库与平台资产模块关系。 |

## 14. 后续开发建议

- 增加素材库 Web 页面或明确该模块仅作为后端 API。
- 补充分类移动、批量分类的业务规则。
