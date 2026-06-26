# 提示词库

## 1. 模块概述

提示词库提供后端提示词 Library、Category、Item 管理能力。当前未发现独立 Web 页面。

## 2. 模块状态

状态：部分可用

### 状态说明

后端路由、controller、service、store 和数据库表模型存在；当前 Web 路由未发现 `/prompt-libraries` 页面。

### 状态证据

- 路由：`/api/v1/prompt-libraries/*` 在 `backend/internal/apiserver/route.go` 注册。
- 函数名：`PromptController.ListLibraries`、`CreateItem`、`BatchDeleteItems` 等。
- 文件路径：`backend/internal/apiserver/service/v1/prompt/prompt.go`。
- 数据库表：`prompt_libraries`、`prompt_categories`、`prompt_items` 定义于 `backend/apis/iapiserver/meta_asset.go`。
- 文件路径：`apps/web/src/App.tsx` 未发现 `/prompt-libraries` 路由。

## 3. 功能清单

| 功能 | 子功能 | 状态 | 前端入口 | 后端接口 | 数据表 | 证据 |
|---|---|---|---|---|---|---|
| Prompt Library | 列表、创建、更新、删除 | 部分可用 | 未发现 | `/api/v1/prompt-libraries` | `prompt_libraries` | `route.go` |
| Prompt Category | 创建、更新、删除 | 部分可用 | 未发现 | `/api/v1/prompt-libraries/categories` | `prompt_categories` | `prompt.go` |
| Prompt Item | 创建、更新、删除、批量删除 | 部分可用 | 未发现 | `/api/v1/prompt-libraries/items` | `prompt_items` | `prompt.go` |

## 4. 子模块清单

| 子模块 | 状态 | 说明 | 证据 |
|---|---|---|---|
| PromptLibrary | 部分可用 | 后端 CRUD 存在。 | `store/postgresql/prompt_libraryy.go` |
| PromptCategory | 部分可用 | 后端 CRUD 存在。 | `store/postgresql/prompt_category.go` |
| PromptItem | 部分可用 | 后端 CRUD 和批量删除存在。 | `store/postgresql/prompt_item.go` |

## 5. 页面详细设计

当前未发现独立页面。`apps/web/src/App.tsx` 没有 `/prompt-libraries` 路由。

## 6. 前端交互流程

待确认。当前代码未提供独立 Web 交互流程。

## 7. 业务逻辑和规则

- PromptLibrary 可设置 active；证据：`PromptLibraryStore.SetActive`。
- PromptItem 包含 positive、negative、scene 和 params；证据：`backend/apis/iapiserver/meta_asset.go`。
- 删除 library 时会删除相关 category 和 item；证据：`store/postgresql/prompt_libraryy.go`。

## 8. 后端功能逻辑

`route.go` 将 `/prompt-libraries` 注册到 `PromptController`。controller 调用 prompt service，service 使用 PromptLibraries、PromptCategories、PromptItems store。

## 9. 后端接口设计

- Method：GET/POST/PATCH/DELETE
- Path：`/api/v1/prompt-libraries*`
- Request：见 `backend/apis/iapiserver/request_asset.go`
- Response：见 `request_asset.go`
- 权限要求：待确认
- 校验规则：request binding 和 service/store 校验
- 错误处理：后端统一响应；前端页面未发现
- 代码证据：`backend/internal/apiserver/controller/v1/prompt/prompt.go`

## 10. 数据库表设计

| 表 | 说明 | 证据 |
|---|---|---|
| `prompt_libraries` | 提示词库，含 system、active、readonly。 | `meta_asset.go` |
| `prompt_categories` | 提示词分类，关联 `library_id`。 | `meta_asset.go` |
| `prompt_items` | 提示词条目，含 positive、negative、scene。 | `meta_asset.go` |

## 11. 状态变更记录

| 日期 | 功能 | 原状态 | 新状态 | 说明 |
|---|---|---|---|---|
| 2026-06-26 | 提示词库 | 未知 | 部分可用 | 后端存在，Web 独立页面缺失。 |

## 12. 已实现证据

| 类型 | 文件/对象 | 说明 |
|---|---|---|
| API | `/api/v1/prompt-libraries/*` | 提示词库接口。 |
| Service | `backend/internal/apiserver/service/v1/prompt/prompt.go` | 提示词库服务。 |
| DB | `prompt_libraries`、`prompt_categories`、`prompt_items` | 提示词库表。 |

## 13. 未完成事项

| 事项 | 类型 | 建议状态 | 说明 |
|---|---|---|---|
| Web 页面 | 前端 | 待开发 | 当前未发现提示词库独立页面。 |
| 导入导出 | 功能 | 未知 | 未发现提示词库导入导出接口。 |

## 14. 后续开发建议

- 增加提示词库 Web 页面。
- 明确 active/system/readonly 的业务规则和权限限制。
