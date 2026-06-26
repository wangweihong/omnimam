# Backend 开发规则
- 使用 Go。
- 所有代码必须在 `backend/` 目录下。
  
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
