# OmniMAM Agent 协作规范

本文件是仓库根级规则，适用于整个项目。  
子目录存在更具体的 `AGENTS.md` 时，遵循就近优先。

## 规则索引

- `backend/AGENTS.md`：后端开发规则
- `frontend/apps/web/AGENTS.md`：Web 前端开发规则
- `docs/AGENTS.md`：系统设计文档维护规则

## 核心原则

1. 代码是事实来源，文档必须反映当前系统真实能力。
2. 功能性代码变更必须同步检查 `docs/AGENTS.md`，并按其规则更新系统设计文档。
3. 禁止把没有代码证据的功能标记为“可用”。
4. 禁止编造不存在的接口、页面、数据库表或业务逻辑。
5. 无法判断功能状态时，必须标记为“未知”或“待确认”。
6. 不允许为短期跑通引入长期难维护的临时方案；如必须临时处理，必须标记 `TODO` 并说明原因。

## 开发前要求

当用户要求新增、修改、删除功能时，Codex 必须先判断影响范围。

涉及以下内容时，必须先查看 `docs/AGENTS.md`：

- 前端页面、路由、组件、表单、交互流程、接口调用
- 后端接口、Handler、Controller、Service、业务规则
- 数据库表、字段、索引、迁移脚本、ORM Model
- 权限、认证、配置、任务调度、日志、审计
- 功能模块、子模块、功能状态

涉及架构、状态管理、数据模型、权限、依赖、路由、主要 UI 结构或跨模块调用时，Codex 应先说明：

- 技术判断依据
- 影响范围
- 可能破坏的模块
- 验证方式

如存在多个方案，应比较复杂度、扩展性、风险和开发成本，再推荐一个方案。

## 开发中要求

1. 优先复用现有模式和项目约定。
2. 不引入不必要的新依赖。
3. 不绕过 Makefile、生成脚本、校验脚本或 Git hook。
4. 工具调用失败时，先检查 Makefile 是否存在对应 `install`、`setup`、`generate` 或相关目标。
5. 修改 generated、contract、swagger、proto、inventory 等文件时，必须确认并执行对应生成规则。
6. 不允许只改代码而不检查文档。
7. 不允许删除已有文档内容，除非用户明确要求。

## Git 与 Commit

- 仅在用户明确要求时提交 commit。
- Commit message 必须满足仓库 `commit-msg` hook。
- Commit body 每行长度必须小于或等于 72 个字符。
- 复杂 commit message 提交前应使用 `.gitlint` 或 `go-gitlint --msg-file=<file>` 校验。

## 新增组件规则

新增 backend binary 时：
* 入口必须放在 `backend/cmd/<component>/`
* 单独构建使用 `make build BINS="<component>"`
* 如需要配置生成，必须更新 `scripts/make-rules/common.mk` 中的 `COMPONENTS`
* 必须新增 `configs/<component>.yaml`，并更新 `configs/README.md`
* 如配置引用新的环境变量，必须同步更新 `scripts/install/environment.sh`
* 组件环境变量使用大写组件名前缀，例如 `TASKWORKER_RUNTIME_DEBUG_OUTPUT_DIR`

新增 Docker image 时：

* 必须新增 `build/docker/<component>/Dockerfile.build`
* 必须新增 `build/docker/<component>/Dockerfile.gobuild`
* 单独构建使用 `make image IMAGES="<component>"`

`CERTIFICATES` 只加入需要独立 TLS certificate 的组件。Worker、CLI、后台 task process 默认不加入。

## 验证规则

 需要验证通过 `make compose` 生成验证环境。
`make compose` 成功后，必须按改动范围做 smoke check，例如访问页面、调用接口、查看容器状态或日志。

例外：

* Frontend-only 修改不强制运行 Go 的 format、lint、test、build，但应执行前端最小验证。
* Docs-only 修改不强制运行 build、test、compose，但必须检查 `git diff` 和 `git status`。
* 包含 Go code 或 backend binary 的改动，提交前必须运行 `go test ./...` 或项目约定的最小相关测试。

如果验证失败，最终回复必须说明失败命令、失败原因、已完成检查和未完成风险。

## 文档同步规则

功能性变更必须遵守 `docs/AGENTS.md`。

最少检查：

1. 是否新增或修改功能模块、子模块。
2. 是否影响前端页面、后端接口、数据库结构。
3. 是否影响权限、认证、配置、日志、审计、任务调度。
4. 是否改变功能状态。
5. 是否需要更新 roadmap、change-log、inventory 或模块设计文档。

功能状态只能使用：

* 可用
* 部分可用
* 开发中
* 待开发
* 废弃
* 未知

状态判断必须引用代码证据，例如文件路径、函数名、路由、HTTP 方法、页面路由、组件名、数据库表、ORM Model、迁移文件、配置项或权限标识。

## 代码注释规则

注释应解释设计意图、业务原因、约束来源和兼容性背景，不要逐行翻译代码。

仅在以下场景添加注释：

* 复杂业务逻辑
* 非显而易见的算法或实现
* 跨模块或跨层关键数据流转
* 容易误解或踩坑的实现
* Magic Number、复杂正则、锁、并发控制、类型强制转换
* 外部依赖降级策略
* 修复历史 bug 时说明原因、回归风险或兼容性背景

禁止添加解释基础语法、复述代码字面意思、变量名解释、简单 getter/setter 说明、逐行注释。

单行注释放在代码上方。整体目标是注释密度低、信息密度高。

## AI 协作规则

Codex 不应只机械执行用户指令，应帮助识别更稳妥的工程路径。

当用户需求直接跳到实现时，应区分：

* 用户目标
* 当前方案
* 可选方案
* 推荐方案

当长期方案与短期指令冲突时，应说明 trade-off，并推荐更稳妥的路径。

## 最终回复要求

每次完成代码或文档变更后，最终回复必须包含：

1. 修改了哪些代码。
2. 更新了哪些文档。
3. 哪些功能状态发生变化。
4. 哪些事项仍需人工确认。
5. 是否执行了测试、构建或静态检查。
6. 如果未执行必要验证，说明原因和风险。
7. 如果文档未更新，说明判断依据或未更新原因。

## 禁止行为

1. 不允许只改代码而不检查文档。
2. 不允许把未来计划写成已完成。
3. 不允许在没有代码证据的情况下标记“可用”。
4. 不允许编造不存在的接口、页面、表结构或业务规则。
5. 不允许忽略 `docs/AGENTS.md`。
6. 不允许擅自提交 commit。
7. 不允许绕过已有 Makefile、generate rule、hook 或项目约定。
8. 不允许为了通过验证而删除测试、降低校验强度或隐藏错误。
9. 不允许用 mock、stub、TODO 伪装已完成功能。

