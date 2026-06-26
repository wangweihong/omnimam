# 身份与权限

## 1. 模块概述

身份与权限模块覆盖用户、角色、权限、用户角色关联和 feature flag。当前代码具备模型和当前用户能力接口，但未发现完整管理页面与 CRUD 路由。

## 2. 模块状态

状态：开发中

### 状态说明

`GET /me`、权限过滤、用户/角色/权限表模型存在；用户、角色、权限管理页面和完整 CRUD API 未发现。

### 状态证据

- 路由：`GET /api/v1/me` 在 `backend/internal/apiserver/route.go`。
- 文件路径：`apps/web/src/shared/auth/features.ts` 定义权限判断。
- 数据库表：`users`、`roles`、`permissions`、`user_roles`、`feature_flags`。
- 文件路径：`apps/web/src/App.tsx` 使用 permissions 过滤导航。

## 3. 功能清单

| 功能 | 子功能 | 状态 | 前端入口 | 后端接口 | 数据表 | 证据 |
|---|---|---|---|---|---|---|
| 当前用户能力 | 用户、角色、权限、feature flags | 可用 | App 初始化 | `GET /api/v1/me` | `users`、`roles`、`permissions`、`feature_flags` | `App.tsx`、`route.go` |
| 前端权限过滤 | 导航和写操作控制 | 可用 | 侧边导航、页面 props | 无 | 无 | `features.ts` |
| 用户管理 | CRUD | 开发中 | 未发现 | 未发现完整 CRUD | `users` | `meta_identity.go` |
| 角色权限管理 | CRUD/绑定 | 开发中 | 未发现 | 未发现完整 CRUD | `roles`、`permissions`、`user_roles` | `meta_platform.go` |

## 4. 子模块清单

| 子模块 | 状态 | 说明 | 证据 |
|---|---|---|---|
| Me | 可用 | 当前用户能力接口。 | `route.go` |
| User | 开发中 | 表模型和 store 存在，管理 API 未完整暴露。 | `store/store.go`、`meta_identity.go` |
| Role/Permission | 开发中 | 表模型和 store 接口存在，页面与 CRUD 待确认。 | `meta_platform.go` |
| FeatureFlag | 开发中 | 表模型和前端读取存在，管理入口待确认。 | `apps/web/src/pages/Dashboard.tsx` |

## 5. 页面详细设计

当前没有独立身份与权限管理页面。Dashboard 展示当前用户、角色和 feature flags；导航依据 permission 控制可见性。

## 6. 前端交互流程

1. App 初始化时调用 `getMe()`。
2. 读取 `me.permissions` 过滤导航。
3. Dashboard 展示 `me.user`、`me.roles`、`me.feature_flags`。

## 7. 业务逻辑和规则

- 空 permission 表示无需权限。
- 非空 permission 需要存在于 `me.permissions`。
- 具体后端权限判定、角色绑定、feature flag 生效范围待确认。

## 8. 后端功能逻辑

当前确认 `/me` 路由由 platform controller 暴露；store 层包含 Users、FeatureFlags、Roles、Permissions、UserRoles。完整管理流程未发现。

## 9. 后端接口设计

- Method：GET
- Path：`/api/v1/me`
- Request：无显式请求体
- Response：用户、角色、权限、feature flags
- 权限要求：待确认
- 校验规则：待确认
- 错误处理：前端启动失败页
- 代码证据：`backend/internal/apiserver/route.go`、`apps/web/src/shared/api/types.ts`

## 10. 数据库表设计

| 表 | 说明 | 证据 |
|---|---|---|
| `users` | 用户基础信息。 | `meta_identity.go` |
| `roles` | 角色，含 system 标识。 | `meta_platform.go` |
| `permissions` | 权限 key。 | `meta_platform.go` |
| `user_roles` | 用户角色关联。 | `meta_platform.go` |
| `feature_flags` | feature flag key 和 enabled。 | `meta_platform.go` |

## 11. 状态变更记录

| 日期 | 功能 | 原状态 | 新状态 | 说明 |
|---|---|---|---|---|
| 2026-06-26 | 身份与权限 | 未知 | 开发中 | 模型和当前用户能力存在，管理能力未完整确认。 |

## 12. 已实现证据

| 类型 | 文件/对象 | 说明 |
|---|---|---|
| API | `GET /api/v1/me` | 当前用户能力。 |
| 前端 | `features.ts` | 权限判断。 |
| DB | `users`、`roles`、`permissions`、`user_roles`、`feature_flags` | 权限相关表。 |

## 13. 未完成事项

| 事项 | 类型 | 建议状态 | 说明 |
|---|---|---|---|
| 用户管理页面 | 前端 | 待开发 | 未发现。 |
| 角色权限 CRUD | 后端/前端 | 待开发 | 未发现完整接口和页面。 |
| 后端鉴权策略 | 设计 | 未知 | 需确认 API 层权限 enforcement。 |

## 14. 后续开发建议

- 明确权限 key 命名规范和模块映射。
- 补充用户/角色/权限 CRUD 和审计要求。
