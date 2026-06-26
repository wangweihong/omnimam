# 存储后端

## 1. 模块概述

存储后端模块管理资产存储后端元数据，包括类型、根路径、配置、启用状态、只读状态和配额。当前后端接口存在，Web 独立页面未发现。

## 2. 模块状态

状态：部分可用

### 状态说明

后端 `/storage-backends` 路由、controller、store 和 `storage_backends` 表模型存在；当前 Web 未发现管理页面。

### 状态证据

- 路由：`/api/v1/storage-backends` 在 `backend/internal/apiserver/route.go` 注册。
- 函数名：`PlatformController.ListStorageBackends`、`CreateStorageBackend`、`UpdateStorageBackend`。
- 数据库表：`storage_backends` 定义于 `backend/apis/iapiserver/meta_platform.go`。
- 文件路径：`apps/web/src/App.tsx` 未发现 `/storage-backends` 路由。

## 3. 功能清单

| 功能 | 子功能 | 状态 | 前端入口 | 后端接口 | 数据表 | 证据 |
|---|---|---|---|---|---|---|
| 存储后端列表 | list | 部分可用 | 未发现 | `GET /api/v1/storage-backends` | `storage_backends` | `route.go` |
| 存储后端创建 | create | 部分可用 | 未发现 | `POST /api/v1/storage-backends` | `storage_backends` | `platform.go` |
| 存储后端更新 | update | 部分可用 | 未发现 | `PATCH /api/v1/storage-backends/:backend_id` | `storage_backends` | `platform.go` |

## 4. 子模块清单

| 子模块 | 状态 | 说明 | 证据 |
|---|---|---|---|
| StorageBackend API | 部分可用 | 后端接口存在。 | `controller/v1/platform/platform.go` |
| StorageBackend Store | 部分可用 | GORM store 存在。 | `store/postgresql/platform.go` |

## 5. 页面详细设计

当前未发现独立 Web 页面。资产模块会间接依赖存储后端，但没有管理入口证据。

## 6. 前端交互流程

待确认。当前没有独立前端流程。

## 7. 业务逻辑和规则

- `StorageBackend` 包含 `type`、`root`、`config`、`enabled`、`readonly`、`quota`。
- 默认本地存储获取逻辑在 store 中存在；证据：`StorageBackendStore.GetDefaultLocal`。
- 多存储类型、配额 enforcement、只读策略待确认。

## 8. 后端功能逻辑

`route.go` 将 `/storage-backends` 路由注册到 `PlatformController`，controller 调用 platform service/store 操作 `storage_backends`。

## 9. 后端接口设计

- Method：GET/POST/PATCH
- Path：`/api/v1/storage-backends`
- Request：见 `backend/apis/iapiserver/request_platform.go`
- Response：见 `request_platform.go`
- 权限要求：待确认
- 校验规则：待确认
- 错误处理：前端页面未发现
- 代码证据：`backend/internal/apiserver/controller/v1/platform/platform.go`

## 10. 数据库表设计

`storage_backends` 表包含类型、根路径、配置 shadow、启用状态、只读状态和配额。证据：`backend/apis/iapiserver/meta_platform.go`。

## 11. 状态变更记录

| 日期 | 功能 | 原状态 | 新状态 | 说明 |
|---|---|---|---|---|
| 2026-06-26 | 存储后端 | 未知 | 部分可用 | 后端接口和表模型存在，Web 页面缺失。 |

## 12. 已实现证据

| 类型 | 文件/对象 | 说明 |
|---|---|---|
| API | `/api/v1/storage-backends` | 存储后端接口。 |
| DB | `storage_backends` | 存储后端表。 |
| Store | `StorageBackendStore` | Store 接口和实现。 |

## 13. 未完成事项

| 事项 | 类型 | 建议状态 | 说明 |
|---|---|---|---|
| Web 管理页面 | 前端 | 待开发 | 未发现。 |
| 配额和只读规则 | 设计 | 未知 | 需确认是否由 service 强制执行。 |

## 14. 后续开发建议

- 增加存储后端管理页面。
- 补充存储后端健康检查、容量统计和迁移策略。
