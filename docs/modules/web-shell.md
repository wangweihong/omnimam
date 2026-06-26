# Web 应用壳

## 1. 模块概述

Web 应用壳负责加载当前用户能力、渲染侧边导航、进行前端权限过滤并挂载业务页面。主要用户是 Web 控制台用户。

## 2. 模块状态

状态：可用

### 状态说明

代码中已存在 React 应用入口、路由、导航、`GET /me` 调用和基于 permission 的导航过滤。

### 状态证据

- 文件路径：`apps/web/src/App.tsx` 定义 `navItems`、`Routes` 和 `getMe()` 初始化。
- 文件路径：`apps/web/src/shared/auth/features.ts` 定义 `hasPermission`。
- 文件路径：`apps/web/src/shared/api/platform.ts` 定义 `getMe()` 调用 `/me`。
- 路由：`GET /api/v1/me` 在 `backend/internal/apiserver/route.go` 注册。

## 3. 功能清单

| 功能 | 子功能 | 状态 | 前端入口 | 后端接口 | 数据表 | 证据 |
|---|---|---|---|---|---|---|
| 应用壳 | 当前用户能力加载 | 可用 | `App` | `GET /api/v1/me` | 无 | `apps/web/src/App.tsx`、`backend/internal/apiserver/route.go` |
| 应用壳 | 导航权限过滤 | 可用 | 侧边导航 | 无 | 无 | `apps/web/src/shared/auth/features.ts` |
| 应用壳 | 页面路由 | 可用 | `/dashboard`、`/assets`、`/tasks`、`/canvases`、`/settings`、`/providers` | 无 | 无 | `apps/web/src/App.tsx` |

## 4. 子模块清单

| 子模块 | 状态 | 说明 | 证据 |
|---|---|---|---|
| 路由 | 可用 | React Router 管理页面切换。 | `apps/web/src/App.tsx` |
| 权限过滤 | 可用 | 前端根据 `me.permissions` 控制导航和部分写操作。 | `apps/web/src/App.tsx`、`apps/web/src/shared/auth/features.ts` |

## 5. 页面详细设计

`App` 使用侧边栏布局，导航项包括工作台、资产、任务、画布和设置。`/settings` 提供模型设置入口，`/providers` 是设置下的模型管理页面但也作为独立路由存在。

## 6. 前端交互流程

1. 页面启动时调用 `getMe()`。
2. 加载成功后根据 `hasPermission` 计算可见导航。
3. 用户点击导航进入对应业务页面。
4. 加载失败时显示 `ApiErrorView` 和重试按钮。

## 7. 业务逻辑和规则

- 空 permission 表示所有用户可见。
- 非空 permission 必须存在于 `me.permissions` 才显示导航。
- 写权限通过页面 props 控制，例如 `asset.create`、`task.cancel`、`provider.manage`。

## 8. 后端功能逻辑

`GET /api/v1/me` 由 `PlatformController.Me` 处理；具体用户、角色、权限来源需结合 `service/v1/platform/service.go` 继续确认。

## 9. 后端接口设计

- Method：GET
- Path：`/api/v1/me`
- Request：无显式请求体
- Response：`MeResponse`，前端类型包含 `user`、`roles`、`permissions`、`feature_flags`
- 权限要求：待确认
- 校验规则：待确认
- 错误处理：前端由 `ApiErrorView` 展示
- 代码证据：`backend/internal/apiserver/route.go`、`apps/web/src/shared/api/types.ts`

## 10. 数据库表设计

本模块自身不直接定义数据库表。`GET /me` 可能关联 `users`、`roles`、`permissions`、`feature_flags`，但具体查询路径需确认。

## 11. 状态变更记录

| 日期 | 功能 | 原状态 | 新状态 | 说明 |
|---|---|---|---|---|
| 2026-06-26 | Web 应用壳 | 未知 | 可用 | 初始化文档时根据代码证据确认。 |

## 12. 已实现证据

| 类型 | 文件/对象 | 说明 |
|---|---|---|
| 前端 | `apps/web/src/App.tsx` | 路由、导航、当前用户加载。 |
| 前端 | `apps/web/src/shared/auth/features.ts` | 权限判断。 |
| API | `GET /api/v1/me` | 当前用户能力接口。 |

## 13. 未完成事项

| 事项 | 类型 | 建议状态 | 说明 |
|---|---|---|---|
| 运行时鉴权策略 | 待确认 | 未知 | 需要确认后端认证中间件和部署鉴权方式。 |

## 14. 后续开发建议

- 补充登录/登出流程文档。
- 明确 `/me` 的后端权限来源和失败场景。
