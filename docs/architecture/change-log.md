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
