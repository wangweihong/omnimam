# OmniMAM Agent 协作规范

## 项目方向 Project Direction

- OmniMAM 是以 Go backend 为主、frontend 独立部署的前后端分离项目。
- 正式 frontend source code 统一放在 `frontend/` 目录。
- OmniMAM 的定位是 AI capability hub、多模态 Asset 管理、Async Task 编排平台。
- Backend 负责稳定 API contract、metadata、permission、task state、provider abstraction、storage abstraction。

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

## 当前 Backend Contract

- 核心 domain 包括 `Provider`、`ProviderModel`、`SystemLLMConfig`、`StorageBackend`、`Asset`、`AssetThumbnail`、`Tag`、`AssetGroup`、`AssetRelation`、`Task`、`FeatureFlag`、`Role`、`Permission`、`Canvas`。

## 工程工作流 Engineering Workflow
- 修改后按用户要求提交 commit；如果用户没有要求提交，不要擅自提交。
- Commit message 必须满足仓库 `commit-msg` hook，并遵循 Conventional Commit，例如 `feat(frontend): add web console`。
- Commit body 每行长度必须小于或等于 72 个字符；body 建议全部小写开头，不使用句号结尾。
- 提交前应先按 `.gitlint` 或 `go-gitlint --msg-file=<file>` 校验复杂 commit message，避免反复触发 hook 失败。
- 如果工具调用失败，先检查 `Makefile` 是否存在对应 install、setup 或 generate rule；没有规则时再手动处理。
- 对外公共库放在 `/pkg`。
- 项目内公共库放在 `/internal/pkg`。
- Backend 代码新增 string、map、slice、set、convert 等通用 helper 或 function 前，必须优先检查仓库 `/pkg` 和 `github.com/wangweihong/gotoolbox` 是否已有公共函数。
- 如果 `/pkg` 和 `github.com/wangweihong/gotoolbox` 没有合适公共函数，必须先判断该能力是否可以写成可复用的通用泛型函数，避免直接新增只能服务单个业务场景的局部 helper。
- Backend 代码新增 HTTP client 请求、外部 API 调用封装、provider 或 gateway 调用时，必须优先使用 `github.com/wangweihong/gotoolbox` 的 `httpcli` 包。
- 只有在 `httpcli` 不能满足明确需求时，才允许使用标准库或其他 HTTP client，并且实现前必须说明原因和 trade-off。
- 新增 public 或 internal library code 时必须补单元测试。
- Library unit test 沿用当前项目 GoConvey 约定，使用 `github.com/smartystreets/goconvey/convey` 的 dot import

## 新增组件 Makefile 规则 Component Makefile Rules

- 新增运行组件时，入口必须放在 `cmd/<component>/`；`make build` 默认从 `cmd/*` 推导 `BINS`。
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

## Frontend 目录规则 Frontend Layout

- 正式 frontend source code 必须放在 `frontend/`。
- `frontend/` 由 nginx 独立托管，API 通过 `/api/v1` 反向代理到 Go `API Server`。
- Agent 不使用 `npm run build` 作为正式 frontend 验证命令。
- `static/` 只能保留为参考页面、交互原型或历史能力清单；不能在 `static/` 中继续扩展正式产品功能。
- 新增 frontend 功能时，需要先读取 `/api/v1/me`，根据 permission 和 `FeatureFlag` 动态显示菜单、按钮、provider、task entry。
- 弹窗中的表单提交、异步请求、校验或保存失败，错误信息必须在弹窗内展示，不能只用全局 toast 或跳出弹窗上下文。
- 弹窗关闭必须由用户明确点击关闭按钮、`x` 号或取消按钮触发，禁止点击遮罩层、页面空白处或其他非弹窗区域直接关闭。

### Frontend 操作反馈建议 Feedback Guidance

- 普通按钮或页面内轻量操作成功后，建议优先使用全局 toast 展示结果，例如保存成功、连接成功、同步完成、启用或禁用完成。
- 普通按钮或页面内轻量操作失败后，建议优先使用全局 error toast 展示失败原因，避免在页面顶部插入临时错误块打断主布局扫描。
- Toast 文案应面向用户表达动作结果，避免直接透出后端英文原文；技术细节、HTTP status、business code 等可作为辅助 detail，但不应成为主标题。
- Toast 适合短暂、非阻断、可恢复的反馈；如果操作结果需要用户长期查看、比较或继续处理，应优先考虑页面内状态、任务列表、详情面板或日志视图。
- 页面初始加载、核心数据不可用、权限不足、关键配置缺失等阻断性错误，建议继续使用页面内错误状态或空状态，而不是只使用 toast。
- 弹窗中的表单提交、异步请求、校验或保存失败，错误信息必须保留在弹窗内；可以额外补充 error toast，但不能只依赖 toast。
- 长耗时操作建议使用按钮 loading、进度条、任务状态或 async `Task` 入口反馈；toast 只用于开始、完成或失败的短提示。
- 如果某个场景存在比 toast 更清晰、更可追踪或更符合业务语义的反馈方式，AI 应先说明推荐方案和 trade-off，并询问用户是否采用该方式。

## Error Code 与 HTTP Status 规则

- 对外接口调用失败时，必须返回正确的 business error code 和 HTTP status code。
- 新增或调整错误码时，按 `internal/pkg/code/base.go` 的写法添加注释，至少包含：  - `@HTTP`：对应 HTTP status code。
  - `@CN`：中文错误说明。
  - `@EN`：英文错误说明。
- 修改错误码后必须使用 `codegen` 生成错误码相关代码和文档；优先运行 `make gen`。
- 如果 `codegen` 不存在，先在 `Makefile` 和 `scripts/make-rules/` 中查找安装规则；当前项目优先使用 `make tools` 或对应 `install.codegen` 规则。
- Provider、Storage、external API gateway、local model service 等外部调用失败时，不能统一吞成 `500`；需要按失败类型映射为合适的 error code 和 HTTP status，例如认证失败、权限不足、资源不存在、请求超时、上游不可用、响应解析失败。

## Backend API Controller 规则
- Go backend API request struct，例如 `ProviderModelCreateRequest`，字段参数校验必须优先通过 `binding` tag 触发 `pkg/validate` 或现有 `pkg/validator` 接入的校验能力。
- 当校验需要跨字段、条件判断，或无法用 `binding` tag 清晰表达时，使用 `github.com/wangweihong/gotoolbox/pkg/validation.Validator` 风格实现 `Validate()`。
- 仅当需要在绑定后做参数归一化、派生字段填充、列表拆分等 post-bind 处理时，才实现 `imachinery.PostBinder`；普通字段有效性校验不得优先放进 `PostBind()`。
- 无外部依赖、无 database 依赖、无特殊业务依赖的字段参数有效性检测，应尽可能在 Controller 层通过 `core.Run` / `core.DecodeParameter` 完成。
- 对象不存在时必须返回明确的 business error code 和 message，例如 `provider model not found`；不能只通过裸 `404` HTTP status 表达对象不存在。
- 接口响应应尽可能统一通过 `core.WriteResponse` 返回；文件下载、流式响应、SSE、redirect 等特殊响应可以例外，但错误返回仍需保持一致。如果其他特殊情况，询问用户方案
  
## Backend Database 规则
- 确认对象字段值全局唯一时，一定要通过数据库语法保证唯一性。不能只通过业务逻辑校验。比如使用通过在事务所中使用postgresql.CheckExists检测
- 必须要通过事务来保证连续多个数据库操作的原子性，如查询是否存在同名对象，不存在才执行创建操作
- postgresql添加新函数时，优先查询helper.go文件辅助函数是否可以复用。或者增加新的可复用函数到helper中
- 元数据非postgresql数据表支持的类型，采用Extend/ExtendShadow进行保存

## Backend apis包结构体字段规则
- 如果入参结构体中的字段只支持特定的值，比如AuthType只支持"API_KEY"和"SecretKEY"两个值，则必须要字段的binding tag中指定校验规则，例如`"binding":"required,oneof=API_KEY SecretKEY"`。
- 所有存储数据库的元数据结构体，必须要实现`TableName`,`BeforeCreate`,`AfterCreate`,`BeforeUpdate`,`AfterUpdate方`法, 用于在创建和更新对象时执行自定义逻辑。如果没有需要修改的逻辑，可以实现为空函数预留。
- 如果入参结构体字段需要处理当为零值时设置特定的值或者需要清理字符串等操作，则应实现`imachinery.DefaultSetter`,或者`imachinery.PostBinder`接口，尽可能在controller层调用core.DecodeParameter/core.Run处理完成，不要在service增加这些逻辑
- 所有查询列表接口的都必须有入参，入参接口体必须嵌入imachinery.BasicQueryParam。并且在store层通过ToStore方法转换成Sql查询如
```go
  filter := func(q *gorm.DB) *gorm.DB {
		if req.Capability != "" {
			q = q.Where("capabilities LIKE ?", "%"+req.Capability+"%")
		}
		return q
	}
  query := req.ToQuery(ctx, s.ds.db.Model(&iapiserver.ProviderModel{}), filter)
	if err := query.Find(&items).Count(&total).Error; err != nil {
		return nil, 0, errors.WithStack(err)
	}
	return items, total, nil
``` 

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
- 所有大的涉及 feature、information architecture、data structure、permission model 或 main layout 的调整，都要询问用户是否同步更新 `/docs` 中对应文档，并提出更新大纲。
- 定期检查当前项目实际功能、UI、data model、interaction flow 是否与 `/docs` 规范一致。
- 当 implementation 与 documentation 发生偏离时，AI 必须说明偏离点、偏离原因、潜在影响。
- 发现偏差时，AI 应提醒用户选择：更新 code、更新 docs，或记录 deviation reason。

### 用户能力提升 User Capability Building
- AI 在给出实现结果时，应适度解释关键 engineering judgment，让用户理解为什么这样做，而不只是交付代码。
- AI 不应一味迎合用户的即时指令；当更好的长期方案存在时，应礼貌但明确地提出。
- 当长期方案与短期指令冲突时，AI 应说明 trade-off，并推荐更稳妥的路径。
