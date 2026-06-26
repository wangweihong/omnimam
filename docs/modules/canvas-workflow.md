# 画布工作流

## 1. 模块概述

画布工作流用于创建和编辑 classic/smart canvas，维护节点、连线、视口、工作流导入导出、工作流包和节点/画布运行。

## 2. 模块状态

状态：可用

### 状态说明

Web 画布列表和编辑器、后端画布/项目 API、运行 API、`canvases`/`projects` 表模型均存在。

### 状态证据

- 文件路径：`apps/web/src/pages/Canvases.tsx`、`apps/web/src/pages/CanvasEditor.tsx`。
- 路由：`/api/v1/canvases`、`/api/v1/projects`、画布运行路由在 `backend/internal/apiserver/route.go`。
- 函数名：`CanvasController.*` 和 `PlatformController.RunCanvas*`。
- 数据库表：`canvases`、`projects` 定义于 `backend/apis/iapiserver/meta_asset.go`。

## 3. 功能清单

| 功能 | 子功能 | 状态 | 前端入口 | 后端接口 | 数据表 | 证据 |
|---|---|---|---|---|---|---|
| 画布列表 | 创建、重命名、删除、导入导出 | 可用 | `/canvases` | `/api/v1/canvases` | `canvases` | `Canvases.tsx` |
| 画布编辑 | 节点、连线、视口、保存 | 可用 | `/canvases/:canvasId` | `GET/PUT /api/v1/canvases/:canvas_id` | `canvases` | `CanvasEditor.tsx` |
| Workflow | 导入导出、package | 可用 | `/canvases/:canvasId` | `/workflows/export*`、`/workflows/import*` | `canvases`、`assets` | `route.go` |
| 运行 | 画布运行、节点运行、取消 | 可用 | `/canvases/:canvasId` | `/run`、`/nodes/:node_id/run`、`/runs/:task_id` | `tasks` | `platform.go` |
| 项目 | 项目列表、创建、更新、删除 | 可用 | 待确认 | `/api/v1/projects` | `projects` | `route.go` |

## 4. 子模块清单

| 子模块 | 状态 | 说明 | 证据 |
|---|---|---|---|
| Canvas CRUD | 可用 | 画布元数据和图结构保存。 | `controller/v1/canvas/canvas.go` |
| Canvas Editor | 可用 | 前端节点编辑器。 | `CanvasEditor.tsx` |
| Canvas Run | 可用 | 创建和取消运行任务。 | `PlatformController.RunCanvas` |

## 5. 页面详细设计

`Canvases.tsx` 是画布列表；`CanvasEditor.tsx` 是全功能编辑器，包含节点类型、拖拽、连线、选择、缩放、历史、导入导出、运行和资产输出相关交互。

## 6. 前端交互流程

1. 用户进入 `/canvases` 查看画布列表。
2. 创建 classic/smart 画布后跳转到 `/canvases/:canvasId`。
3. 编辑器加载画布详情，用户编辑节点和连线。
4. 用户保存画布、导入导出 workflow 或运行画布/节点。
5. 运行输出可注册为资产。

## 7. 业务逻辑和规则

- 前端定义多种节点类型，包括 image、prompt、llm、generator、output、smart-* 等；证据：`CanvasEditor.tsx`。
- 画布删除支持软删除、恢复和 purge；证据：`route.go`、`CanvasStore`。
- 节点运行语义和每类节点输入输出需确认。

## 8. 后端功能逻辑

`CanvasController` 处理画布和项目 CRUD、导入导出。`PlatformController` 处理运行、下载画布资产、注册输出。Canvas service 使用 `Canvases()` 和 `Projects()` store。

## 9. 后端接口设计

- Method：GET/POST/PUT/PATCH/DELETE
- Path：`/api/v1/canvases*`、`/api/v1/projects*`
- Request：见 `backend/apis/iapiserver/request_asset.go`
- Response：见 `request_asset.go` 和前端 canvas 类型
- 权限要求：待确认；前端导航使用 `canvas.read`
- 校验规则：request binding 和 service 校验
- 错误处理：前端 `ApiErrorView`
- 代码证据：`backend/internal/apiserver/route.go`、`controller/v1/canvas/canvas.go`

## 10. 数据库表设计

| 表 | 说明 | 证据 |
|---|---|---|
| `canvases` | 画布元数据、kind、project_id、deleted_at、board 坐标。 | `meta_asset.go` |
| `projects` | 画布项目和 sort_order。 | `meta_asset.go` |
| `tasks` | 运行任务。 | `meta_platform.go` |
| `assets`、`asset_relations` | 画布资产输入输出和关系。 | `meta_platform.go` |

## 11. 状态变更记录

| 日期 | 功能 | 原状态 | 新状态 | 说明 |
|---|---|---|---|---|
| 2026-06-26 | 画布工作流 | 未知 | 可用 | 初始化文档时根据代码证据确认。 |

## 12. 已实现证据

| 类型 | 文件/对象 | 说明 |
|---|---|---|
| 前端 | `Canvases.tsx`、`CanvasEditor.tsx` | 画布页面。 |
| API | `/api/v1/canvases` | 画布 API。 |
| DB | `canvases`、`projects` | 画布表。 |

## 13. 未完成事项

| 事项 | 类型 | 建议状态 | 说明 |
|---|---|---|---|
| 节点运行契约 | 待确认 | 未知 | 每种节点类型的输入输出和错误处理需确认。 |

## 14. 后续开发建议

- 补充 workflow package 版本兼容策略。
- 建立画布运行任务的可观测性和失败重试说明。
