package code

//go:generate codegen -type=int
//go:generate codegen -type=int -doc -output ../../../docs/guide/zh-CN/api/error_code_generated.md

// Common: basic errors.
// Code must start with 1xxxxx.
const (

	// @HTTP 200
	// @CN 请求成功
	// @EN Success.
	ErrSuccess int = iota + 100001

	// @HTTP 500
	// @CN 服务器出错
	// @EN Internal server error.
	ErrUnknown

	// @HTTP 400
	// @CN 解析结构体出错
	// @EN Error occurred while binding the request body to the struct.
	ErrBind

	// @HTTP 400
	// @CN  参数校验失败
	// @EN  Validation failed.
	ErrValidation

	// @HTTP 401
	// @CN  令牌无效
	// @EN  Token invalid.
	ErrTokenInvalid

	// @HTTP 404
	// @CN  请求路由不存在
	// @EN  Page not found.
	ErrPageNotFound

	// ErrOperationBatchExecute 表明当前操作为批量操作,需解析结构确认批量结果
	// @HTTP 200
	// @CN  批量执行操作
	// @EN  Operation batch execute.
	ErrOperationBatchExecute
)

// common: database errors.
const (
	// @HTTP 500
	// @CN  数据库出错
	// @EN  Database error.
	ErrDatabase int = iota + 100101
)

// common: authorization and authentication errors.
const (
	// @HTTP 401
	// @CN  用户密码加密失败
	// @EN  Error occurred while encrypting the user password.
	ErrEncrypt int = iota + 100201

	// @HTTP 401
	// @CN  签名无效
	// @EN  Signature is invalid.
	ErrSignatureInvalid

	// @HTTP 401
	// @CN  令牌
	// @EN  Token expired.
	ErrExpired

	// @HTTP 401
	// @CN  无效的请求授权头部
	// @EN  Invalid authorization header.
	ErrInvalidAuthHeader

	// @HTTP 401
	// @CN  请求授权头部为空
	// @EN  The `Authorization` header was empty.
	ErrMissingHeader

	// @HTTP 401
	// @CN  密码验证失败
	// @EN  Password was incorrect.
	ErrPasswordIncorrect

	// @HTTP 403
	// @CN  请求无权限执行
	// @EN  Permission denied.
	ErrPermissionDenied
)

// common: encode/decode errors.
const (
	// @HTTP 500
	// @CN  数据编码出错
	// @EN  Encoding failed due to an error with the data.
	ErrEncodingFailed int = iota + 100301

	// @HTTP 500
	// @CN  数据解码出错
	// @EN  Decoding failed due to an error with the data.
	ErrDecodingFailed

	// @HTTP 500
	// @CN  数据非有效JSON结构
	// @EN   Data is not valid JSON.
	ErrInvalidJSON

	// @HTTP 500
	// @CN  JSON数据编码失败
	// @EN  JSON data could not be encoded.
	ErrEncodingJSON

	// @HTTP 500
	// @CN  JSON数据解码失败
	// @EN  JSON data could not be decoded.
	ErrDecodingJSON

	// @HTTP 500
	// @CN  数据非有效YAML结构
	// @EN  Data is not valid Yaml.
	ErrInvalidYaml

	// @HTTP 500
	// @CN  YAML数据编码失败
	// @EN  Yaml data could not be encoded.
	ErrEncodingYaml

	// @HTTP 500
	// @CN  YAML数据编码失败
	// @EN  Yaml data could not be decoded.
	ErrDecodingYaml
)

// common: Http  server error.
const ()

// common: Http  client error.
const (
	// @HTTP 500
	// @CN  HTTP请求失败
	// @EN  HTTP request error.
	ErrHTTPError int = iota + 100501

	// @HTTP 500
	// @CN  解析HTTP服务返回数据失败
	// @EN  Decode data from http response error.
	ErrHTTPResponseDataParseError

	// @HTTP 500
	// @CN  生成HTTP客户端失败
	// @EN  Generate HTTP client error.
	ErrHTTPClientGenerateError
)

// common: gRPC  server error.
const ()

// common: gRPC  client error.
const (
	// @HTTP 500
	// @CN  生成gRPC客户端失败
	// @EN  Generate gRPC client error.
	ErrGRPCClientGenerateError int = iota + 100701

	// @HTTP 500
	// @CN  gRPC客户端证书错误
	// @EN   Validate gRPC client certificate error.
	ErrGRPCClientCertificateError

	// @HTTP 500
	// @CN  gRPC客户端连接失败
	// @EN   Dial to gRPC server error.
	ErrGRPCClientDialError

	// @HTTP 500
	// @CN  gRPC客户端访问服务接口失败
	// @EN   Invoke gRPC server service function error.
	ErrGRPCClientInvokeServiceError

	// @HTTP 500
	// @CN  解析gRPC服务返回数据失败
	// @EN  Decode data from gRPC service error.
	ErrGRPCResponseDataParseError
)
