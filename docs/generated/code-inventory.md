# Code Inventory

生成日期：2026-06-26

## 1. 技术栈

| 层 | 技术 | 代码证据 |
|---|---|---|
| 后端语言 | Go 1.26 | `go.mod` |
| 后端 HTTP 框架 | Gin | `go.mod`、`backend/internal/apiserver/route.go` |
| 后端 CLI | Cobra / Viper 风格应用配置 | `go.mod`、`backend/internal/apiserver/app.go`、`backend/internal/apiserver/options/options.go` |
| 数据访问 | GORM | `go.mod`、`backend/internal/apiserver/store/postgresql/0_pg.go` |
| 数据库驱动 | PostgreSQL、MySQL 依赖均存在；当前 store 命名和工厂以 database/postgresql 为主 | `go.mod`、`backend/internal/apiserver/store/database/db.go`、`backend/internal/apiserver/store/postgresql/0_pg.go` |
| 前端框架 | React 18 + Vite + TypeScript | `apps/web/package.json`、`apps/web/src/main.tsx` |
| 前端路由 | react-router-dom | `apps/web/package.json`、`apps/web/src/App.tsx` |
| 图标 | lucide-react | `apps/web/package.json`、`apps/web/src/App.tsx` |
| 构建入口 | Makefile 聚合 Go、镜像、前端镜像、生成规则 | `Makefile`、`scripts/make-rules/*.mk` |

## 2. 主要目录结构

| 目录 | 作用 | 代码证据 |
|---|---|---|
| `backend/cmd/apiserver` | apiserver binary 入口 | `backend/cmd/apiserver/apiserver.go` |
| `backend/cmd/taskworker` | taskworker binary 入口 | `backend/cmd/taskworker/taskworker.go` |
| `backend/internal/apiserver` | HTTP 服务、路由、配置、controller、service、store、worker | `backend/internal/apiserver/route.go`、`backend/internal/apiserver/server.go` |
| `backend/apis/iapiserver` | API 请求/响应和 GORM 元模型 | `backend/apis/iapiserver/request_*.go`、`backend/apis/iapiserver/meta_*.go` |
| `apps/web/src` | Web 前端入口、页面、组件、共享 API client | `apps/web/src/App.tsx`、`apps/web/src/shared/api/platform.ts` |
| `configs` | apiserver/taskworker 配置样例 | `configs/apiserver.yaml`、`configs/taskworker.yaml` |
| `build/docker` | apiserver、taskworker、frontend Docker 构建目录 | `build/docker/apiserver`、`build/docker/taskworker`、`build/docker/frontend` |
| `deployments` | 部署编排 | `deployments/docker-compose.yaml` |
| `docs` | 系统设计和事实清单 | `docs/AGENTS.md` |

## 3. 前端入口

| 对象 | 路径 | 说明 |
|---|---|---|
| Web 应用入口 | `apps/web/src/main.tsx` | 挂载 React 应用。 |
| Web 根组件 | `apps/web/src/App.tsx` | 定义导航、权限过滤、路由和 `/api/v1/me` 加载。 |
| Web API Client | `apps/web/src/shared/api/client.ts` | 默认 baseURL 为 `/api/v1`。 |
| Web API 封装 | `apps/web/src/shared/api/platform.ts` | 封装 provider、asset、task、canvas 等接口调用。 |
| Web 构建配置 | `apps/web/package.json`、`apps/web/vite.config.ts`、`apps/web/tsconfig.json` | Vite/TypeScript 构建。 |
| Web Docker 镜像 | `build/docker/frontend/Dockerfile.build` | 前端镜像构建。 |

## 4. 后端入口

| 对象 | 路径 | 说明 |
|---|---|---|
| apiserver binary | `backend/cmd/apiserver/apiserver.go` | 启动 apiserver 应用。 |
| taskworker binary | `backend/cmd/taskworker/taskworker.go` | 启动 taskworker 应用。 |
| apiserver App | `backend/internal/apiserver/app.go` | 初始化 options、config、log 和 Run。 |
| HTTP server | `backend/internal/apiserver/server.go` | 创建 server、初始化数据库 schema、安装路由。 |
| 路由 | `backend/internal/apiserver/route.go` | 注册 `/api/v1` 下所有 API。 |
| 服务聚合 | `backend/internal/apiserver/service/v1/service.go` | 聚合 Settings、Identities、Assets、Prompts、Canvases、Platforms。 |
| Store 工厂 | `backend/internal/apiserver/store/factory.go` | 定义数据库 store factory 接口。 |

## 5. 配置文件

| 配置 | 路径 | 说明 |
|---|---|---|
| apiserver 配置 | `configs/apiserver.yaml` | apiserver 运行配置。 |
| taskworker 配置 | `configs/taskworker.yaml` | taskworker 运行配置。 |
| 配置说明 | `configs/README.md` | 配置目录说明。 |
| Options 类型 | `backend/internal/apiserver/options/options.go` | server、log、feature、database、asset-upload 配置结构。 |

## 6. 认证、权限和用户能力

| 能力 | 状态 | 代码证据 |
|---|---|---|
| 当前用户能力接口 | 可用 | `backend/internal/apiserver/route.go` 注册 `GET /api/v1/me`；`apps/web/src/App.tsx` 调用 `getMe()`。 |
| 前端权限过滤 | 可用 | `apps/web/src/shared/auth/features.ts` 定义 `hasPermission`；`apps/web/src/App.tsx` 对导航和页面写权限做判断。 |
| OTP | 部分可用 | `backend/internal/apiserver/route.go` 注册 `/auth/otp/qrcode`、`/auth/otp/validate`；`backend/apis/iapiserver/meta_identity.go` 定义 `UserOTP`。 |
| SAML SSO | 部分可用 | `backend/internal/apiserver/route.go` 注册 `/auth/sso/*`、`/setting/sso/*`；`backend/apis/iapiserver/meta_sso.go` 定义 IdP/SP 模型。 |
| 用户/角色/权限管理 | 开发中 | `backend/apis/iapiserver/meta_identity.go`、`backend/apis/iapiserver/meta_platform.go` 定义用户和权限模型；未发现完整 CRUD 路由和 Web 页面。 |

## 7. 任务、日志、审计

| 能力 | 状态 | 代码证据 |
|---|---|---|
| 异步任务 | 可用 | `backend/internal/apiserver/route.go` 注册 `/tasks`；`backend/internal/apiserver/worker/processor.go` 定义 Processor；`backend/apis/iapiserver/meta_platform.go` 定义 `Task`。 |
| 请求日志中间件 | 可用 | `backend/internal/apiserver/route.go` 中 `InstallMiddleware` 使用 `genericmiddleware.LoggerMiddleware()`。 |
| RequestID/Context 中间件 | 可用 | `backend/internal/apiserver/route.go` 中 `InstallMiddleware` 使用 `RequestID()` 和 `Context()`。 |
| 审计日志 | 未知 | 未发现独立 audit 模型、路由或 service，需确认。 |
