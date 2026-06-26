# Documentation Agent Rules

## 目标

`docs/` 目录用于维护系统架构、功能模块、页面设计、接口设计、数据库设计、roadmap 和变更记录。

Codex 在修改 `docs/` 目录时，必须保证文档结构稳定、状态清晰、证据明确、可长期维护。

## 文档目录结构

推荐保持以下结构：

```text
docs/
├── AGENTS.md
├── module-manifest.yaml
├── doc-map.yaml
├── development-checklist.md
│
├── architecture/
│   ├── system-overview.md
│   ├── module-index.md
│   ├── frontend-design.md
│   ├── backend-design.md
│   ├── database-design.md
│   ├── roadmap.md
│   └── change-log.md
│
├── modules/
│   ├── provider-management.md
│   ├── model-management.md
│   ├── log-settings.md
│   └── user-management.md
│
└── generated/
    ├── code-inventory.md
    ├── api-inventory.md
    ├── frontend-inventory.md
    └── db-inventory.md
```

## 文档类型说明

| 文件                                     | 作用                          |
| -------------------------------------- | --------------------------- |
| `docs/module-manifest.yaml`            | 系统模块元数据，维护模块、子模块、状态、路由、接口、表 |
| `docs/doc-map.yaml`                    | 代码变更与文档更新的映射规则              |
| `docs/development-checklist.md`        | 功能开发前后检查清单                  |
| `docs/architecture/system-overview.md` | 总系统架构                       |
| `docs/architecture/module-index.md`    | 功能模块总清单                     |
| `docs/architecture/frontend-design.md` | 总页面设计和前端交互                  |
| `docs/architecture/backend-design.md`  | 后端架构、业务逻辑、接口设计              |
| `docs/architecture/database-design.md` | 数据库表、字段、关系、约束               |
| `docs/architecture/roadmap.md`         | 未来规划                        |
| `docs/architecture/change-log.md`      | 文档和功能变更记录                   |
| `docs/modules/*.md`                    | 每个功能模块的详细设计                 |
| `docs/generated/*.md`                  | Codex 基于代码扫描生成的事实清单         |

## 文档生成顺序

当用户要求总结当前系统能力、生成架构文档、更新文档或检查一致性时，必须按以下顺序执行：

1. 扫描项目目录结构。
2. 扫描后端路由、Handler、Controller、Service、Request、Response。
3. 扫描前端路由、页面、组件、状态管理、API 调用。
4. 扫描数据库 Model、Migration、SQL、索引、约束。
5. 扫描配置、权限、认证、任务调度、日志、审计。
6. 扫描 README、已有 docs、TODO、roadmap。
7. 生成或更新 `docs/generated/*` 事实清单。
8. 更新 `docs/module-manifest.yaml`。
9. 更新 `docs/architecture/*` 总设计文档。
10. 更新 `docs/modules/{module-id}.md` 模块设计文档。
11. 更新 `docs/architecture/change-log.md`。
12. 检查文档与代码是否一致。

## generated 文档规则

`docs/generated/` 下的文档是代码事实清单，应尽量客观，不做过度设计推断。

### `code-inventory.md`

记录：

* 项目技术栈
* 主要目录结构
* 前端入口
* 后端入口
* 配置文件
* 认证/权限相关代码
* 定时任务/日志/审计相关代码

### `api-inventory.md`

记录所有后端接口,参考已有接口

### `frontend-inventory.md`
记录所有前端页面,参考已有路由

### `db-inventory.md`
记录所有数据库表
## 模块文档模板
每个 `docs/modules/{module-id}.md` 必须使用以下结构：

```markdown
# 模块名称

## 1. 模块概述

说明模块用途、边界、主要用户、核心能力。

## 2. 模块状态

状态：可用 / 部分可用 / 开发中 / 待开发 / 废弃 / 未知

### 状态说明

说明为什么是该状态。

### 状态证据

- 文件路径：说明
- 函数名：说明
- 路由：说明
- 数据库表：说明

## 3. 功能清单

| 功能 | 子功能 | 状态 | 前端入口 | 后端接口 | 数据表 | 证据 |
|---|---|---|---|---|---|---|

## 4. 子模块清单

| 子模块 | 状态 | 说明 | 证据 |
|---|---|---|---|

## 5. 页面详细设计

说明页面、路由、组件、表单、表格、弹窗、按钮、校验规则。

## 6. 前端交互流程

使用步骤或流程描述用户如何操作。

## 7. 业务逻辑和规则

描述业务约束、校验规则、状态流转、异常处理。

## 8. 后端功能逻辑

描述 Handler、Service、DAO、Model 的职责和调用关系。

## 9. 后端接口设计

每个接口包含：

- Method
- Path
- Request
- Response
- 权限要求
- 校验规则
- 错误处理
- 代码证据

## 10. 数据库表设计

说明相关表、字段、索引、约束、关联关系。

## 11. 状态变更记录

| 日期 | 功能 | 原状态 | 新状态 | 说明 |
|---|---|---|---|---|

## 12. 已实现证据

| 类型 | 文件/对象 | 说明 |
|---|---|---|

## 13. 未完成事项

| 事项 | 类型 | 建议状态 | 说明 |
|---|---|---|---|

## 14. 后续开发建议

列出后续可开发、可优化、需确认的内容。
```

## 总模块清单规则

`docs/architecture/module-index.md` 要求：

1. 每个模块必须有状态。
2. 每个模块必须链接到 `docs/modules/{module-id}.md`。
3. 未来功能可以列出，但状态必须是“待开发”或“开发中”。
4. 如果代码中已经实现，但没有模块归属，需要加入“待归类模块”或补充 manifest。

## roadmap 规则

`docs/architecture/roadmap.md` 用于维护未来计划。参考现有格式。


## change-log 规则

每次功能或文档发生明显变化，都必须追加

## module-manifest.yaml 规则
`docs/module-manifest.yaml` 是模块事实与规划的结构化来源。参考现有格式修改。
## doc-map.yaml 规则
`docs/doc-map.yaml` 用于说明不同代码变更需要更新哪些文档。参考现有格式修改

## 一致性检查规则

当用户要求检查文档一致性时，需要检查：

1. 代码已实现但文档未记录。
2. 文档标记为“可用”但代码证据不足。
3. 前端路由与文档不一致。
4. 后端接口路径与文档不一致。
5. 数据库字段与文档不一致。
6. module-manifest 与 modules 文档不一致。
7. roadmap 中的功能状态与代码事实不一致。
8. change-log 是否缺失本次变更记录。

## 禁止行为

1. 禁止删除已有人工编写内容，除非用户明确要求重建文档。
2. 禁止在没有代码证据的情况下标记“可用”。
3. 禁止把 planned 功能写成 available。
4. 禁止只更新 generated 文档而不更新 architecture/modules 文档。
5. 禁止只更新模块文档而不更新 module-index。
6. 禁止忽略 change-log。
