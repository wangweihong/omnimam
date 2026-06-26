# 认证与 SSO 设置

## 1. 模块概述

认证与 SSO 设置包含 OTP、SAML SP/IdP、SSO 元数据和 IdP/SP 应用配置接口。当前未发现独立 Web 配置页面。

## 2. 模块状态

状态：部分可用

### 状态说明

后端 OTP、SSO、setting 路由、controller、service 和表模型存在；Web 未发现 SSO 配置页面。

### 状态证据

- 路由：`/api/v1/auth/otp/*`、`/api/v1/auth/sso/*`、`/api/v1/setting/sso/*` 在 `backend/internal/apiserver/route.go`。
- 文件路径：`backend/internal/apiserver/controller/v1/authentication/*.go`。
- 文件路径：`backend/internal/apiserver/controller/v1/setting/*.go`。
- 数据库表：`identity_providers`、`service_providers`、`settings`、`user_otps`、`one_time_tokens`。
- 文件路径：`apps/web/src/App.tsx` 未发现 SSO 设置页面路由。

## 3. 功能清单

| 功能 | 子功能 | 状态 | 前端入口 | 后端接口 | 数据表 | 证据 |
|---|---|---|---|---|---|---|
| OTP | QRCode、validate | 部分可用 | 未发现 | `/api/v1/auth/otp/*` | `user_otps` | `route.go`、`otp.go` |
| SAML SP | metadata、initiator、ACS、SLO | 部分可用 | 未发现 | `/api/v1/auth/sso/sp/saml/*` | `service_providers`、`one_time_tokens` | `sso_sp.go` |
| SAML IdP | answer | 部分可用 | 未发现 | `/api/v1/auth/sso/idp/saml/answer` | `identity_providers` | `sso_idp.go` |
| SSO Metadata | upsert、get、download | 部分可用 | 未发现 | `/api/v1/setting/sso/saml/*` | `settings` | `setting/sso.go` |
| IdP/SP App | add、delete、update、get、list | 部分可用 | 未发现 | `/api/v1/setting/sso/app/*` | `identity_providers`、`service_providers` | `setting/sso_idp.go`、`sso_sp.go` |

## 4. 子模块清单

| 子模块 | 状态 | 说明 | 证据 |
|---|---|---|---|
| OTP | 部分可用 | 后端接口和表存在。 | `request_otp.go`、`meta_identity.go` |
| SAML SP | 部分可用 | SP metadata/ACS/SLO 接口存在。 | `controller/v1/authentication/sso_sp.go` |
| SAML IdP | 部分可用 | IdP answer 接口存在。 | `controller/v1/authentication/sso_idp.go` |
| SSO 设置 | 部分可用 | 元数据和应用配置接口存在。 | `controller/v1/setting/*.go` |

## 5. 页面详细设计

当前未发现独立页面。`apps/web/src/App.tsx` 没有 OTP/SSO 设置路由。

## 6. 前端交互流程

待确认。当前代码未提供 Web 配置流程。

## 7. 业务逻辑和规则

- SSO 路由注释提示修改路由需同步 `iapiserver.SsoURL` 常量；证据：`backend/internal/apiserver/route.go`。
- `ServiceProvider.Protocol` binding 要求 `saml oauth2` 之一；证据：`backend/apis/iapiserver/meta_sso.go`。
- 证书、密钥、重定向 URL 和安全策略需确认。

## 8. 后端功能逻辑

认证 controller 处理运行时 OTP/SSO 请求；setting controller 处理 IdP/SP 元数据和应用配置；setting service 包含 SAML/OAuth2 相关实现文件。

## 9. 后端接口设计

- Method：GET/POST
- Path：`/api/v1/auth/otp/*`、`/api/v1/auth/sso/*`、`/api/v1/setting/sso/*`
- Request：见 `request_otp.go`、`request_sso.go`、`request_sso_auth.go`、`request_setting.go`
- Response：见对应 request 文件
- 权限要求：待确认
- 校验规则：binding tag 和 service 校验
- 错误处理：后端统一响应；Web 页面未发现
- 代码证据：`backend/internal/apiserver/route.go`

## 10. 数据库表设计

| 表 | 说明 | 证据 |
|---|---|---|
| `identity_providers` | IdP 配置，含 protocol、endpoint、SAML/OAuth2 shadow。 | `meta_sso.go` |
| `service_providers` | SP 配置，含 protocol、endpoint、type、SAML/OAuth2 shadow。 | `meta_sso.go` |
| `settings` | SSO metadata 设置存储。 | `meta_setting.go` |
| `user_otps` | 用户 OTP secret。 | `meta_identity.go` |
| `one_time_tokens` | SSO one-time token，含 payload_hash、expires_at、used。 | `meta_token.go` |

## 11. 状态变更记录

| 日期 | 功能 | 原状态 | 新状态 | 说明 |
|---|---|---|---|---|
| 2026-06-26 | 认证与 SSO 设置 | 未知 | 部分可用 | 后端存在，Web 页面和运行策略待确认。 |

## 12. 已实现证据

| 类型 | 文件/对象 | 说明 |
|---|---|---|
| API | `/api/v1/auth/*`、`/api/v1/setting/sso/*` | 认证与设置接口。 |
| Service | `backend/internal/apiserver/service/v1/setting/*.go` | SSO 服务。 |
| DB | `identity_providers`、`service_providers` | SSO 表。 |

## 13. 未完成事项

| 事项 | 类型 | 建议状态 | 说明 |
|---|---|---|---|
| Web 配置页面 | 前端 | 待开发 | 当前未发现 SSO 设置页面。 |
| 安全策略 | 设计 | 未知 | 证书轮换、密钥保护、回调域名校验需确认。 |

## 14. 后续开发建议

- 增加 SSO 配置页面和配置校验。
- 补充 SSO 登录/登出时序图和安全边界。
