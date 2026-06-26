# Roadmap

生成日期：2026-06-26

## 待开发

| 功能 | 所属模块 | 优先级 | 说明 | 来源 |
|---|---|---|---|---|
| 素材库 Web 页面 | 素材库 | P2 | 后端 `/api/v1/asset-library/*` 已存在，当前 Web 未发现独立页面。 | `backend/internal/apiserver/route.go`、`apps/web/src/App.tsx` |
| 提示词库 Web 页面 | 提示词库 | P2 | 后端 `/api/v1/prompt-libraries/*` 已存在，当前 Web 未发现独立页面。 | `backend/internal/apiserver/route.go`、`apps/web/src/App.tsx` |
| SSO 设置 Web 页面 | 认证与 SSO 设置 | P2 | 后端 `/api/v1/setting/sso/*` 已存在，当前 Web 未发现配置页面。 | `backend/internal/apiserver/route.go`、`apps/web/src/App.tsx` |
| 存储后端管理页面 | 存储后端 | P3 | 后端 `/api/v1/storage-backends` 已存在，当前 Web 未发现管理页面。 | `backend/internal/apiserver/route.go`、`apps/web/src/App.tsx` |

## 开发中

| 功能 | 所属模块 | 当前进度 | 缺口 | 证据 |
|---|---|---|---|---|
| 用户/角色/权限管理 | 身份与权限 | 数据模型、`GET /me` 和前端权限过滤存在。 | 缺少完整 CRUD 路由和 Web 管理页面。 | `backend/apis/iapiserver/meta_identity.go`、`backend/apis/iapiserver/meta_platform.go`、`apps/web/src/shared/auth/features.ts` |

## 后续优化

| 功能 | 所属模块 | 说明 |
|---|---|---|
| 数据库迁移策略 | 数据库 | 当前确认 AutoMigrate，生产 migration 策略需明确。 |
| 审计日志 | 后端基础能力 | 未发现独立审计模块，若有合规需求需补充。 |
| Provider credential 安全 | 模型提供商管理 | 需确认密钥加密、脱敏、外部 Secret 管理策略。 |
| Worker 运维参数 | 异步任务管理 | 需明确队列、并发、重试、死信或超时策略。 |
