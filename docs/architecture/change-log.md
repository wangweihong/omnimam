## 2026-06-26 - 系统设计文档体系初始化

### 变更类型

文档更新

### 影响模块

- Web 应用壳
- 模型提供商管理
- 平台资产管理
- 异步任务管理
- 画布工作流
- 素材库
- 提示词库
- 认证与 SSO 设置
- 身份与权限
- 存储后端

### 代码变更

- 无。本次仅修改 `docs/` 下文档。

### 文档变更

- `docs/module-manifest.yaml`：初始化模块 manifest。
- `docs/doc-map.yaml`：按当前仓库路径更新代码变更到文档的映射。
- `docs/development-checklist.md`：补齐开发前、中、后文档同步检查项。
- `docs/generated/code-inventory.md`：生成代码事实清单。
- `docs/generated/api-inventory.md`：生成 API 事实清单。
- `docs/generated/frontend-inventory.md`：生成前端事实清单。
- `docs/generated/db-inventory.md`：生成数据库事实清单。
- `docs/architecture/*.md`：生成系统总览、模块索引、前端、后端、数据库、roadmap。
- `docs/modules/*.md`：为识别到的模块生成详细设计文档。

### 功能状态变化

| 功能 | 原状态 | 新状态 | 说明 |
|---|---|---|---|
| Web 应用壳 | 未知 | 可用 | `apps/web/src/App.tsx` 存在路由、导航和 `getMe()` 初始化。 |
| 模型提供商管理 | 未知 | 可用 | Web 页面、后端路由和数据库模型均有代码证据。 |
| 平台资产管理 | 未知 | 可用 | Web 页面、后端路由和数据库模型均有代码证据。 |
| 异步任务管理 | 未知 | 可用 | Web 页面、任务 API、Task 表和 worker processor 均有代码证据。 |
| 画布工作流 | 未知 | 可用 | Web 页面、画布 API、运行 API 和表模型均有代码证据。 |
| 素材库 | 未知 | 部分可用 | 后端接口和表模型存在，未发现 Web 页面。 |
| 提示词库 | 未知 | 部分可用 | 后端接口和表模型存在，未发现 Web 页面。 |
| 认证与 SSO 设置 | 未知 | 部分可用 | 后端 OTP/SSO/设置接口和表模型存在，未发现 Web 页面。 |
| 身份与权限 | 未知 | 开发中 | 数据模型和 `/me` 能力存在，完整管理界面与 CRUD 未发现。 |
| 存储后端 | 未知 | 部分可用 | 后端接口和表模型存在，未发现 Web 页面。 |

### 待确认事项

- 当前状态基于静态代码扫描，未执行运行时 smoke check。
- 数据库生产 migration 策略、外键约束、运行数据状态待确认。
- Provider credential、SSO secret、审计日志和部署级鉴权策略待确认。

## YYYY-MM-DD - 变更标题

### 变更类型

新增功能 / 修改功能 / 删除功能 / 重构 / 修复 / 文档更新

### 影响模块

- 模块名称

### 代码变更

- 文件路径：说明

### 文档变更

- 文件路径：说明

### 功能状态变化

| 功能 | 原状态 | 新状态 | 说明 |
|---|---|---|---|

### 待确认事项

- 如无，填写“无”
## 2026-06-26 - 前端目录架构调整

### 变更类型

重构 / 文档更新

### 影响模块

- Web 前端工程结构

### 代码变更

- `apps/web/`：由 `frontend/apps/web/` 迁移为根级 Web 应用目录。
- `apps/web/src/shared/`：合并原 `frontend/packages/shared/src/` 的 Web 共享 API 与权限工具代码。
- `apps/web/package.json`：移除 npm workspace 本地包依赖，改为独立 Web 应用依赖。
- `apps/web/vite.config.ts`、`apps/web/tsconfig.json`：将 `@omnimam/shared` 解析到 `apps/web/src/shared`。
- `build/docker/frontend/Dockerfile.build`：改为从 `apps/web` 安装依赖并构建静态资源。
- `.gitignore`、`AGENTS.md`：更新前端目录忽略规则和 Web 前端规则索引。

### 文档变更

- `docs/doc-map.yaml`、`docs/design/doc-map.yaml`：更新前端页面和模块匹配路径为 `apps/web/**`。
- `docs/generated/code-inventory.md`：记录新的 Web 前端入口和构建配置路径。

### 功能状态变化

| 功能 | 原状态 | 新状态 | 说明 |
|---|---|---|---|
| Web 前端工程结构 | 部分可用 | 部分可用 | 仅调整目录和构建路径，未改变页面、接口或业务能力。 |

### 待确认事项

- 是否需要后续将 Docker 镜像名称 `frontend` 一并重命名为 `web`。
