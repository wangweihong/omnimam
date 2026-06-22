# 错误码

！！系统错误码列表，由 `codegen -type=int -doc` 命令生成，不要对此文件做任何更改。

## 功能说明

如果返回结果中存在 `code` 字段，则表示调用 API 接口失败。例如：

```json
{
  "code": 100101,
  "messageEN": "Database error",
  "messageCN": "数据库出错"
}
```

上述返回中 `code` 表示错误码，`message` 表示该错误的具体信息。每个错误同时也对应一个 HTTP 状态码，比如上述错误码对应了 HTTP 状态码 500(Internal Server Error)。

## 错误码列表

系统支持的错误码列表如下：

| Identifier | Code | HTTP Code | Description |  中文描述 	|
| ---------- | ---- | --------- | ----------- | ----------- |
| ErrSuccess | 100001 | 200 | Success. | 请求成功 |
| ErrUnknown | 100002 | 500 | Internal server error. | 服务器出错 |
| ErrBind | 100003 | 400 | Error occurred while binding the request body to the struct. | 解析结构体出错 |
| ErrValidation | 100004 | 400 | Validation failed. | 参数校验失败 |
| ErrTokenInvalid | 100005 | 401 | Token invalid. | 令牌无效 |
| ErrPageNotFound | 100006 | 404 | Page not found. | 请求路由不存在 |
| ErrOperationBatchExecute | 100007 | 200 | Operation batch execute. | 批量执行操作 |
| ErrDatabase | 100101 | 500 | Database error. | 数据库出错 |
| ErrEncrypt | 100201 | 401 | Error occurred while encrypting the user password. | 用户密码加密失败 |
| ErrSignatureInvalid | 100202 | 401 | Signature is invalid. | 签名无效 |
| ErrExpired | 100203 | 401 | Token expired. | 令牌 |
| ErrInvalidAuthHeader | 100204 | 401 | Invalid authorization header. | 无效的请求授权头部 |
| ErrMissingHeader | 100205 | 401 | The `Authorization` header was empty. | 请求授权头部为空 |
| ErrPasswordIncorrect | 100206 | 401 | Password was incorrect. | 密码验证失败 |
| ErrPermissionDenied | 100207 | 403 | Permission denied. | 请求无权限执行 |
| ErrEncodingFailed | 100301 | 500 | Encoding failed due to an error with the data. | 数据编码出错 |
| ErrDecodingFailed | 100302 | 500 | Decoding failed due to an error with the data. | 数据解码出错 |
| ErrInvalidJSON | 100303 | 500 | Data is not valid JSON. | 数据非有效JSON结构 |
| ErrEncodingJSON | 100304 | 500 | JSON data could not be encoded. | JSON数据编码失败 |
| ErrDecodingJSON | 100305 | 500 | JSON data could not be decoded. | JSON数据解码失败 |
| ErrInvalidYaml | 100306 | 500 | Data is not valid Yaml. | 数据非有效YAML结构 |
| ErrEncodingYaml | 100307 | 500 | Yaml data could not be encoded. | YAML数据编码失败 |
| ErrDecodingYaml | 100308 | 500 | Yaml data could not be decoded. | YAML数据编码失败 |
| ErrHTTPError | 100501 | 500 | HTTP request error. | HTTP请求失败 |
| ErrHTTPResponseDataParseError | 100502 | 500 | Decode data from http response error. | 解析HTTP服务返回数据失败 |
| ErrHTTPClientGenerateError | 100503 | 500 | Generate HTTP client error. | 生成HTTP客户端失败 |
| ErrGRPCClientGenerateError | 100701 | 500 | Generate gRPC client error. | 生成gRPC客户端失败 |
| ErrGRPCClientCertificateError | 100702 | 500 | Validate gRPC client certificate error. | gRPC客户端证书错误 |
| ErrGRPCClientDialError | 100703 | 500 | Dial to gRPC server error. | gRPC客户端连接失败 |
| ErrGRPCClientInvokeServiceError | 100704 | 500 | Invoke gRPC server service function error. | gRPC客户端访问服务接口失败 |
| ErrGRPCResponseDataParseError | 100705 | 500 | Decode data from gRPC service error. | 解析gRPC服务返回数据失败 |

