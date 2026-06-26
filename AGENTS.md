# OmniMAM Agent 协作规范


## 模块规则索引
- backend/AGENTS.md：后端开发规则
- frontend/web/AGENTS.md：web前端开发规则
- docs/AGENTS.md：文档维护规则

## 架构原则 Architecture Principles
- API endpoint 统一使用 `/api/v1` 前缀。
- `API Server` 必须保持 stateless，便于横向扩展。
- `Worker` 必须作为独立进程运行，并可按 task type 或 queue 横向扩容。
- Database 只保存 metadata、task state、permission、setting 和 indexed search fields。
- Asset binary file 不能存入 database。
- Asset 在用户视角下是逻辑平面，不暴露本地绝对路径或云存储路径；组织方式通过 tag、group、dataset、project、search 完成。
- 物理存储位置必须隐藏在 `StorageBackend` 后面，并通过受控 content endpoint、thumbnail endpoint 或 signed URL 访问。
- 图片、视频、音频、PDF 等 heavy asset 在列表中必须使用 thumbnail、placeholder 或 derived preview，不能直接渲染原始文件。
- Long-running operation 必须通过 async `Task` 执行。
- Provider 集成必须基于 capability/protocol，不允许业务层硬编码到单一 vendor。
- Frontend 可见能力必须由 backend 返回的 permission 和 `FeatureFlag` 驱动，入口信息来自 `/api/v1/me`。
- Frontend hiding 不是安全边界；backend permission check 和 feature gate 始终是权威判断。
- 
## 工程工作流 Engineering Workflow
- 修改后按用户要求提交 commit；如果用户没有要求提交，不要擅自提交。
- Commit message 必须满足仓库 `commit-msg` hook，并遵循 Conventional Commit，例如 `feat(frontend): add web console`。
- Commit body 每行长度必须小于或等于 72 个字符；body 建议全部小写开头，不使用句号结尾。
- 提交前应先按 `.gitlint` 或 `go-gitlint --msg-file=<file>` 校验复杂 commit message，避免反复触发 hook 失败。
- 如果工具调用失败，先检查 `Makefile` 是否存在对应 install、setup 或 generate rule；没有规则时再手动处理。

## 新增组件 Makefile 规则 Component Makefile Rules
- 新增运行组件时，入口必须放在 `backend/cmd/<component>/`；`make build` 默认从 `backend/cmd/*` 推导 `BINS`。
- 单独验证某个 binary 时，使用 `make build BINS="<component>"`。
- 如果新组件需要通过 `make configs` 生成配置文件，必须更新 `scripts/make-rules/common.mk` 中的 `COMPONENTS`。
- 新增配置生成组件时，必须同步新增 `configs/<component>.yaml`，并更新 `configs/README.md` 说明用途。
- `CERTIFICATES` 只加入需要独立 TLS certificate 的组件，例如 `API Server` 或独立对外服务。
- `Worker`、`CLI`、后台 task process 默认不加入 `CERTIFICATES`，除非实际启用 TLS endpoint。
- 如果新组件需要 Docker image，必须新增 `build/docker/<component>/Dockerfile.build` 和 `build/docker/<component>/Dockerfile.gobuild`。
- `make image` 默认从 `build/docker/*` 推导 `IMAGES`；单独验证某个 image 时，使用 `make image IMAGES="<component>"`。
- 如果 `configs/<component>.yaml` 引用新的 environment variable，必须同步更新 `scripts/install/environment.sh`。
- 组件环境变量使用大写 component 前缀，例如 `TASKWORKER_RUNTIME_DEBUG_OUTPUT_DIR`、`TASKWORKER_INSECURE_BIND_PORT`。
- 新增 backend binary 组件后，日常修改阶段只需要检查相关 Makefile dry-run，例如 `make -n configs`、`make -n image`。
- 涉及配置模板或 `COMPONENTS` 变更时，还必须运行 `make configs`。
- 准备提交包含 Go code 或 backend binary 的改动前，必须运行 `go test ./...` 或项目约定的最小相关测试。



### Frontend 操作反馈建议 Feedback Guidance
- 普通按钮或页面内轻量操作成功后，建议优先使用全局 toast 展示结果，例如保存成功、连接成功、同步完成、启用或禁用完成。
- 普通按钮或页面内轻量操作失败后，建议优先使用全局 error toast 展示失败原因，避免在页面顶部插入临时错误块打断主布局扫描。
- Toast 文案应面向用户表达动作结果，避免直接透出后端英文原文；技术细节、HTTP status、business code 等可作为辅助 detail，但不应成为主标题。
- Toast 适合短暂、非阻断、可恢复的反馈；如果操作结果需要用户长期查看、比较或继续处理，应优先考虑页面内状态、任务列表、详情面板或日志视图。
- 页面初始加载、核心数据不可用、权限不足、关键配置缺失等阻断性错误，建议继续使用页面内错误状态或空状态，而不是只使用 toast。
- 弹窗中的表单提交、异步请求、校验或保存失败，错误信息必须保留在弹窗内；可以额外补充 error toast，但不能只依赖 toast。
- 长耗时操作建议使用按钮 loading、进度条、任务状态或 async `Task` 入口反馈；toast 只用于开始、完成或失败的短提示。
- 如果某个场景存在比 toast 更清晰、更可追踪或更符合业务语义的反馈方式，AI 应先说明推荐方案和 trade-off，并询问用户是否采用该方式。
- 提供给用户的输入参数，必须包含必要的校验逻辑，避免用户输入无效数据导致系统异常。如字符长度、格式、范围，数字范围，资产存储容量等。尽可能使用公共函数实现校验逻辑，避免重复代码。除特殊情况外，也需要专门封装校验函数，以便通用化。

## 修改后验证规则 Verification Rules
- 每次修改 frontend code、backend code、Docker、compose、Makefile 或 config 后，必须运行 `make compose`，重建 backend/frontend image 并启动整套服务。
- `make compose` 成功后，必须按改动范围做 smoke check，例如访问 frontend 页面、调用相关 `/api/v1` endpoint、查看容器状态或日志。
- 如果用户明确要求本轮不要执行 `make compose`，必须在交付结果中说明未执行以及对应风险。
- Frontend-only 修改不强制运行 Go 的 `make format`、`make lint`、`go test` 和 `make build`。
- 修改 docs-only 文件不强制运行 `make format`、`make lint`、`go test`、`make build`，但必须检查文档内容和 git 状态。
- 修改 error code、generated contract、swagger、proto 或其他生成文件相关代码后，还必须运行对应 generate rule，例如 `make gen` 或项目中明确的生成目标。
- 如果验证命令失败，交付结果时必须说明失败命令、失败原因和未完成风险。

## 接口注释要求 Interface Comment Requirements

- 新增或修改 HTTP API、service interface、store interface、provider adapter interface、worker task interface 时，必须补充对应功能注释。
- 在apis/iaiserver的结构体必须要补充对应的字段的功能注释
- 注释至少说明接口用途、主要 input/output、关键 side effect 或 async behavior。
- Public API 注释需要说明 permission 或 `FeatureFlag` 的影响。
- Public API 注释需要说明 endpoint 是否返回原始 asset content、只返回 metadata/thumbnail，或是否创建 async `Task`。
- Internal helper function 不要求长注释，但 exported interface method 和 controller endpoint 必须有清晰功能说明。
- 注释使用中文标注

## 代码逻辑注释规则 Code Logic Comment Rules
- 本节适用于 frontend 和 backend 的实现逻辑注释，不替代 `接口注释要求 Interface Comment Requirements` 中对 exported interface method、controller endpoint 和 public API 的注释要求。
- 仅在复杂业务逻辑、非显而易见的算法或实现、跨模块或跨层调用的关键数据流转、容易误解或踩坑的实现、使用非常规或非直观的库或接口行为时，才允许并应优先考虑添加注释。
- `Magic Number`、复杂正则、锁或并发控制、类型强制转换、外部依赖降级策略属于必须重点检查的注释触发场景；遇到这些实现时，默认先判断是否需要通过注释说明设计意图、约束来源或风险。
- 修复 bug 时，允许并要求添加注释解释修改原因，重点说明为什么这样改、在防什么回归、涉及什么兼容性或历史问题；禁止只复述代码字面行为。
- 禁止解释关键字或基础语法，例如 `for`、`if`、`switch`、`await`、`try/catch`。
- 禁止复述代码字面意思，禁止变量名或函数名字面解释型注释，禁止为简单 getter/setter、结构体字段、明显语义代码添加说明。
- 注释必须优先解释设计意图、业务原因、约束来源、兼容性背景，而不是逐行翻译代码。
- 避免冗余注释堆叠，不要为每一行代码添加注释；如果代码本身已经足够自解释，则不允许额外添加注释。
- 单行注释必须放在代码上方，而不是写在行尾；行尾注释只允许用于极短的对齐型注记，不允许承载逻辑说明或修改原因。
- 每 50 行代码平均不超过 3 条注释，复杂算法或复杂控制流可以例外，但整体目标必须保持注释密度低、信息密度高。
- “如果未来接手这段代码的同事看到注释后依然要反复读代码，那这个注释就是失败的；如果注释能让他跳过读代码直接理解意图，那它就是必要的。”

## AI 工程协作增强规则 AI Collaboration Rules

### 认知盲区提醒 Cognitive Blind Spot Checks
- 如果用户的需求描述过于直接跳到实现，AI 应先反问 product goal、user scenario、success criteria，避免为了做功能而做功能。
- 当发现用户可能把 implementation approach 当成真实 requirement 时，AI 应主动区分 user goal、current approach、alternative approach、recommended approach。

### 工程决策透明化 Transparent Engineering Decisions
- 涉及 architecture、state management、data model、permission、dependency、route、major UI structure 的变更时，AI 必须先说明技术判断依据。
- 每次重要实现前，AI 应简短列出 change impact、可能破坏的 module、verification method。
- 如果存在多个 implementation path，AI 应给出至少两个方案，并比较 complexity、extensibility、risk、development cost，再推荐一个。
- 不允许为了短期跑通而引入长期难维护的临时方案。
- 如必须临时处理，必须标记 `TODO`，并说明原因。

### 文档与实现一致性 Documentation And Implementation Consistency
- 任何功能性代码变更都必须同步更新系统设计文档；如果无法确定应更新哪些文档，必须基于 git diff 分析影响范围，并在最终回复中说明未更新的原因。
- 所有大的涉及 feature、information architecture、data structure、permission model 或 main layout 的调整，都要询问用户是否同步更新 `/docs` 中对应文档，并提出更新大纲。
- 定期检查当前项目实际功能、UI、data model、interaction flow 是否与 `/docs` 规范一致。
- 当 implementation 与 documentation 发生偏离时，AI 必须说明偏离点、偏离原因、潜在影响。
- 发现偏差时，AI 应提醒用户选择：更新 code、更新 docs，或记录 deviation reason。

### 用户能力提升 User Capability Building
- AI 在给出实现结果时，应适度解释关键 engineering judgment，让用户理解为什么这样做，而不只是交付代码。
- AI 不应一味迎合用户的即时指令；当更好的长期方案存在时，应礼貌但明确地提出。
- 当长期方案与短期指令冲突时，AI 应说明 trade-off，并推荐更稳妥的路径。
