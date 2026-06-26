# 模型提供商管理

## 1. 模块概述

模型提供商管理用于维护 LLM provider、provider model、provider preset、模型同步、连通性测试和系统默认模型绑定。

## 2. 模块状态

状态：可用

### 状态说明

Web 页面、后端路由、controller/service/store 和数据库表模型均存在。

### 状态证据

- 文件路径：`apps/web/src/pages/Providers.tsx` 实现模型设置页面。
- 路由：`/api/v1/providers`、`/api/v1/provider-presets`、`/api/v1/system-llm-config` 在 `backend/internal/apiserver/route.go` 注册。
- 函数名：`PlatformController.ListProviders`、`CreateProvider`、`SyncProviderModels` 等在 `backend/internal/apiserver/controller/v1/platform/platform.go`。
- 数据库表：`providers`、`provider_models`、`provider_capabilities`、`system_llm_configs` 定义于 `backend/apis/iapiserver/meta_platform.go`。

## 3. 功能清单

| 功能 | 子功能 | 状态 | 前端入口 | 后端接口 | 数据表 | 证据 |
|---|---|---|---|---|---|---|
| Provider | 列表、创建、更新、删除 | 可用 | `/providers` | `/api/v1/providers` | `providers` | `Providers.tsx`、`route.go`、`meta_platform.go` |
| Provider Preset | 列表、安装 | 可用 | `/providers` | `/api/v1/provider-presets` | `providers` | `Providers.tsx`、`route.go` |
| Provider Model | 列表、创建、更新、删除、同步 | 可用 | `/providers` | `/api/v1/providers/:provider_id/models` | `provider_models` | `platform.ts`、`platform.go` |
| 默认模型 | 读取、保存 | 可用 | `/providers` | `/api/v1/system-llm-config` | `system_llm_configs` | `Providers.tsx`、`meta_platform.go` |
| 连通性测试 | provider test | 可用 | `/providers` | `/api/v1/providers/:provider_id/test` | 无 | `provider/openai_compatible.go` |

## 4. 子模块清单

| 子模块 | 状态 | 说明 | 证据 |
|---|---|---|---|
| Provider CRUD | 可用 | 管理 provider 元数据。 | `controller/v1/platform/platform.go` |
| Model CRUD | 可用 | 管理 provider 下模型。 | `store/postgresql/platform.go` |
| 默认模型 | 可用 | 维护 purpose 到 provider/model 的绑定。 | `SystemLLMConfig` |

## 5. 页面详细设计

`Providers.tsx` 提供 services/defaults 分区、provider 列表、搜索、添加 provider、模型管理、模型同步、默认用途模型配置、删除确认和 toast 错误提示。

## 6. 前端交互流程

1. 进入 `/settings` 后点击模型设置进入 `/providers`。
2. 页面加载 providers、models 和 system llm config。
3. 用户新增或编辑 provider 后保存。
4. 用户选择 provider 后管理模型、同步模型或测试连接。
5. 用户在默认模型区保存 purpose 绑定。

## 7. 业务逻辑和规则

- 前端写权限由 `provider.manage` 控制。
- Provider type 选项在前端包括 `deepseek` 和 `openai-compatible`。
- Provider preset 安装和模型同步依赖后端 service 实现，具体外部 API 兼容性待确认。

## 8. 后端功能逻辑

`route.go` 注册 provider 路由到 `PlatformController`，controller 调用 platform service，service 使用 store factory 访问 `providers`、`provider_models`、`system_llm_configs` 等表。

## 9. 后端接口设计

- Method：GET/POST/PATCH/DELETE
- Path：`/api/v1/providers`、`/api/v1/provider-presets`、`/api/v1/system-llm-config`
- Request：见 `backend/apis/iapiserver/request_platform.go`
- Response：见 `backend/apis/iapiserver/request_platform.go` 和前端 `apps/web/src/shared/api/types.ts`
- 权限要求：待确认
- 校验规则：request struct binding 和 service/store 检查
- 错误处理：前端 `ApiErrorView`、`ToastViewport`
- 代码证据：`backend/internal/apiserver/route.go`、`controller/v1/platform/platform.go`

## 10. 数据库表设计

| 表 | 说明 | 证据 |
|---|---|---|
| `providers` | Provider 基础信息、base_url、auth_type、credential_ref、preset_key、config shadow。 | `meta_platform.go` |
| `provider_models` | 模型元数据、能力、类型、默认参数、价格 shadow。 | `meta_platform.go` |
| `provider_capabilities` | provider capability 元数据。 | `meta_platform.go` |
| `system_llm_configs` | purpose 唯一绑定到 provider/model。 | `meta_platform.go` |

## 11. 状态变更记录

| 日期 | 功能 | 原状态 | 新状态 | 说明 |
|---|---|---|---|---|
| 2026-06-26 | 模型提供商管理 | 未知 | 可用 | 初始化文档时根据代码证据确认。 |

## 12. 已实现证据

| 类型 | 文件/对象 | 说明 |
|---|---|---|
| 前端 | `apps/web/src/pages/Providers.tsx` | Provider 管理页面。 |
| API | `backend/internal/apiserver/route.go` | Provider 路由。 |
| DB | `backend/apis/iapiserver/meta_platform.go` | Provider 相关表。 |

## 13. 未完成事项

| 事项 | 类型 | 建议状态 | 说明 |
|---|---|---|---|
| credential 安全策略 | 待确认 | 未知 | 需要确认 API key 加密、脱敏和 Secret 管理。 |

## 14. 后续开发建议

- 明确 provider preset 来源和版本管理。
- 补充 provider 测试失败码和用户可见错误说明。
