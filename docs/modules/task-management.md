# 异步任务管理

## 1. 模块概述

异步任务管理提供 DB-backed task 列表、创建、取消、事件接口和 taskworker 处理器。

## 2. 模块状态

状态：可用

### 状态说明

任务页面、任务 API、`tasks` 表模型和 worker processor 均存在。

### 状态证据

- 文件路径：`apps/web/src/pages/Tasks.tsx` 实现任务列表和取消操作。
- 路由：`/api/v1/tasks` 在 `backend/internal/apiserver/route.go` 注册。
- 函数名：`PlatformController.ListTasks`、`CreateTask`、`CancelTask`。
- 数据库表：`tasks` 定义于 `backend/apis/iapiserver/meta_platform.go`。
- 文件路径：`backend/internal/apiserver/worker/processor.go` 定义任务处理器。

## 3. 功能清单

| 功能 | 子功能 | 状态 | 前端入口 | 后端接口 | 数据表 | 证据 |
|---|---|---|---|---|---|---|
| 任务列表 | 按状态筛选 | 可用 | `/tasks` | `GET /api/v1/tasks` | `tasks` | `Tasks.tsx`、`route.go` |
| 任务创建 | 创建 Task | 可用 | 未直接暴露通用 UI | `POST /api/v1/tasks` | `tasks` | `platform.go` |
| 任务取消 | 取消未完成任务 | 可用 | `/tasks` | `POST /api/v1/tasks/:task_id/cancel` | `tasks` | `Tasks.tsx` |
| 任务事件 | 事件流/查询 | 可用 | 未发现前端消费 | `GET /api/v1/tasks/:task_id/events` | `tasks` | `route.go` |
| Worker | 处理任务 | 可用 | 无 | 无 | `tasks` | `worker/processor.go` |

## 4. 子模块清单

| 子模块 | 状态 | 说明 | 证据 |
|---|---|---|---|
| Task API | 可用 | API 管理任务状态。 | `controller/v1/platform/platform.go` |
| Worker Processor | 可用 | 后台处理任务。 | `worker/processor.go` |

## 5. 页面详细设计

`Tasks.tsx` 提供状态筛选 select、刷新按钮、任务表格、进度、重试次数、错误信息和取消按钮。

## 6. 前端交互流程

1. 页面加载调用 `listTasks`。
2. 用户选择状态并应用筛选。
3. 对非终态任务，如果有 `task.cancel` 权限则显示取消按钮。
4. 取消后刷新任务列表。

## 7. 业务逻辑和规则

- 终态包括 `succeeded`、`failed`、`canceled`；证据：`Tasks.tsx`。
- `tasks` 表含 status、priority、queue、progress、attempts、max_attempts、lock_owner、locked_until、idempotency_key。

## 8. 后端功能逻辑

任务路由由 `PlatformController` 处理，数据通过 `TaskStore` 访问 `tasks` 表；worker processor 负责后台执行，具体任务类型和调度策略需确认。

## 9. 后端接口设计

- Method：GET/POST
- Path：`/api/v1/tasks`、`/api/v1/tasks/:task_id`、`/api/v1/tasks/:task_id/cancel`、`/api/v1/tasks/:task_id/events`
- Request：见 `backend/apis/iapiserver/request_platform.go`
- Response：见 `request_platform.go` 和前端 `Task` 类型
- 权限要求：待确认；前端取消使用 `task.cancel`
- 校验规则：待确认
- 错误处理：前端 `ApiErrorView`
- 代码证据：`backend/internal/apiserver/route.go`

## 10. 数据库表设计

`tasks` 表记录类型、状态、优先级、队列、输入输出 shadow、进度、错误、尝试次数、锁和幂等键。证据：`backend/apis/iapiserver/meta_platform.go`。

## 11. 状态变更记录

| 日期 | 功能 | 原状态 | 新状态 | 说明 |
|---|---|---|---|---|
| 2026-06-26 | 异步任务管理 | 未知 | 可用 | 初始化文档时根据代码证据确认。 |

## 12. 已实现证据

| 类型 | 文件/对象 | 说明 |
|---|---|---|
| 前端 | `apps/web/src/pages/Tasks.tsx` | 任务页面。 |
| 后端 | `backend/internal/apiserver/worker/processor.go` | Worker 处理器。 |
| DB | `tasks` | 任务表。 |

## 13. 未完成事项

| 事项 | 类型 | 建议状态 | 说明 |
|---|---|---|---|
| 队列运维策略 | 待确认 | 未知 | worker 数、队列隔离、死信、超时策略待确认。 |

## 14. 后续开发建议

- 补充任务类型目录和每类任务输入输出契约。
