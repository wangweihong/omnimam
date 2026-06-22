## Code 设计规范

错误代码说明：100101
+ 10: 服务
+ 01: 模块
+ 01: 模块下的错误码序号，每个模块可以注册 100 个错误


### 服务和模块说明

|服务|模块|说明(服务 - 模块)|
|----|----|----|
|10|00|通用 - 基本错误|
|10|01|通用 - 数据库类错误|
|10|02|通用 - 认证授权类错误|
|10|03|通用 - 加解码类错误|
|10|04|通用 - 通用HTTP服务端错误|
|10|05|通用 - 通用HTTP客户端错误|
|10|06|通用 - 通用gRPC服务端错误|
|10|07|通用 - 通用gRPC客户端错误|

> **通用：**所有服务都适用的错误，提高复用性，避免重复造轮子

## 错误记录规范

在错误产生的最原始位置调用日志，打印错误信息，其它位置通过封装后返回。

当错误发生时，调用log包打印错误，通过log包的caller功能，可以定位到log语句的位置，也即能够定位到错误发生的位置。当使用这种方式来打印日志时，需要中遵循以下规范：

- 只在错误产生的最初位置打印日志，其它地方直接返回错误，不需要再对错误进行封装。
- 当代码调用第三方包的函数时，第三方包函数出错时，打印错误信息。并通过errors包记录出错栈后返回。
    - 调用者可以逐一对错误添加调用栈,并保留最初的错误码
    - 也可以构建新的错误码,保留栈,但覆盖原始错误码

```go
func doSomething() error {
    if err := os.Chdir("/root"); err != nil {
        log.Errorf("change dir failed: %v", err)
        return errors.WrapError(code.ErrOpenFile,)
    }
    return nil
}

// 保留原错误码
func call()error{
    if err:= doSomething();err!=nil{
        return errors.UpdateStack(err)
    }
}

// 覆盖错误码
func call2()error{
    if err:= doSomething();err!=nil{
        return errors.WrapError(code.ErrCall,err)
    }
}
```

- 如果错误发生在某个请求中, 则打印错误信息时, 应调用F(ctx)以记录该请求的日志链。这在后续调试过程
可以快速的定位出某次请求的日志信息,而不会因为某个请求大量并发触发后无法确认日志属于哪次请求。
```
func DoSomething(ctx context.Context) error {
    if err := os.Chdir("/root"); err != nil {
        log.F(ctx).Errorf("change dir failed: %v", err)
        return errors.WrapError(code.ErrOpenFile,)
    }
    return nil
}
```