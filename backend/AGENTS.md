# Backend 开发规则
- 使用 Go。
- 所有代码必须在 `backend/` 目录下。
- 
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
- 后端的入参需要检验字段合法性,通过bingding tag或者实现validate.Validate()来进行校验。避免过长字符串直接存储到数据库中
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

## 接口注释要求 Interface Comment Requirements

- 新增或修改 HTTP API、service interface、store interface、provider adapter interface、worker task interface 时，必须补充对应功能注释。
- 在apis/iaiserver的结构体必须要补充对应的字段的功能注释
- 注释至少说明接口用途、主要 input/output、关键 side effect 或 async behavior。
- Public API 注释需要说明 permission 或 `FeatureFlag` 的影响。
- Public API 注释需要说明 endpoint 是否返回原始 asset content、只返回 metadata/thumbnail，或是否创建 async `Task`。
- Internal helper function 不要求长注释，但 exported interface method 和 controller endpoint 必须有清晰功能说明。
- 注释使用中文标注
