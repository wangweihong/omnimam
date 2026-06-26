# 后端设计

生成日期：2026-06-26

## 1. 技术结构

| 层 | 路径 | 说明 |
|---|---|---|
| Binary | `backend/cmd/apiserver`、`backend/cmd/taskworker` | apiserver 和 taskworker 入口。 |
| App/Config | `backend/internal/apiserver/app.go`、`options/`、`config/` | 初始化配置、日志和运行函数。 |
| HTTP Server | `backend/internal/apiserver/server.go` | 完成数据库初始化并构建 HTTP server。 |
| Router | `backend/internal/apiserver/route.go` | 注册 `/api/v1` 下所有 API。 |
| Controller | `backend/internal/apiserver/controller/v1` | 请求绑定、参数读取、响应写入。 |
| Service | `backend/internal/apiserver/service/v1` | 模块业务逻辑。 |
| Store | `backend/internal/apiserver/store` | Store factory 抽象和 PostgreSQL/GORM 实现。 |
| API Types | `backend/apis/iapiserver` | 请求、响应和数据库元模型。 |

## 2. 路由分组

| 分组 | 主要接口 | 状态 | 证据 |
|---|---|---|---|
| 平台能力 | `/me`、`/providers`、`/provider-presets`、`/system-llm-config`、`/storage-backends` | 可用/部分可用 | `backend/internal/apiserver/route.go`、`controller/v1/platform/platform.go` |
| 平台资产 | `/assets`、`/asset-groups`、`/canvas-assets` | 可用 | `backend/internal/apiserver/route.go`、`controller/v1/platform/platform.go` |
| 任务 | `/tasks` | 可用 | `backend/internal/apiserver/route.go`、`controller/v1/platform/platform.go` |
| 画布 | `/canvases`、`/projects` | 可用 | `backend/internal/apiserver/route.go`、`controller/v1/canvas/canvas.go` |
| 素材库 | `/asset-library/*` | 部分可用 | `backend/internal/apiserver/route.go`、`controller/v1/asset/asset.go` |
| 提示词库 | `/prompt-libraries/*` | 部分可用 | `backend/internal/apiserver/route.go`、`controller/v1/prompt/prompt.go` |
| 认证/SSO | `/auth/otp/*`、`/auth/sso/*`、`/setting/sso/*` | 部分可用 | `backend/internal/apiserver/route.go`、`controller/v1/authentication`、`controller/v1/setting` |

## 3. Service 和 Store

- `service/v1/service.go` 聚合 Settings、Identities、Assets、Prompts、Canvases、Platforms。
- `store/factory.go` 定义模块级 Store 接口，包括 Users、Assets、Prompts、Canvases、Providers、Tasks、Roles、Permissions 等。
- `store/postgresql/*.go` 提供 GORM 实现。
- 数据模型位于 `backend/apis/iapiserver/meta_*.go`，启动时由 `server.go` 传入 `EnsureScheme(...)`。

## 4. 中间件与错误

| 能力 | 状态 | 证据 |
|---|---|---|
| RequestID | 可用 | `backend/internal/apiserver/route.go` 中 `genericmiddleware.RequestID()` |
| Context | 可用 | `backend/internal/apiserver/route.go` 中 `genericmiddleware.Context()` |
| 请求日志 | 可用 | `backend/internal/apiserver/route.go` 中 `genericmiddleware.LoggerMiddleware()` |
| 404 响应 | 可用 | `backend/internal/apiserver/route.go` 中 `g.NoRoute` |
| 统一错误码 | 可用 | `backend/internal/pkg/code/code.go`、`backend/internal/pkg/code/code_generated.go` |
| 审计 | 未知 | 未发现独立 audit 路由、模型或 service。 |

## 5. 待确认

- 运行时鉴权中间件和认证策略需要进一步确认；当前前端使用 `/me` 返回的 permissions 控制可见性。
- Provider API key/credential 的安全存储策略需要确认。
- 任务 worker 的部署拓扑、并发数、队列隔离和重试策略需要确认。
