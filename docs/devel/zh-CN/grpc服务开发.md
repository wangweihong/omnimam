
# GRPC 服务
GRPC服务同时支持tcp和unix两种协议，可以同时启用

## (m)TLS验证
gRPC服务支持tcp协议的TLS和mTLS验证。
* TLS要求服务端提供证书以及私钥, 当建立连接时客户端可以通过CA证书来验证服务端证书是否合法(验签)
    * 客户端可以选择跳过证书验证(注意客户端必须TLS连接，然后才能选择是否跳过证书检测)。
        * 在gRPC客户端可以选择不进行TLS连接,如grpcurl的`-plaintext`参数或者grpc go客户端
        `grpc.WithInsecure`. 当然服务端会根据是否配置了TLS,来选择拒绝客户端的非TLS连接。
* mTLS要求服务端、客户端均提供证书、私钥。当建立连接后,服务端/客户端会通过CA证书来验证
客户端/服务端证书是否合法(验签).  
    * 当服务端开启mTLS, 客户端无法跳过验证。客户端必须要提供自己证书和私钥。

**NOTE**:实际的证书校验是发生在请求服务接口时。
```golang
conn, err := grpc.Dial(conf.Addr, grpc.WithTransportCredentials(creds))
// 这里并不会校验证书
if err != nil {
 ...
}


// 证书校验发生在这里!!
_, err = debug.NewDebugServiceClient(conn).
	Sleep(context.Background(), &debug.SleepRequest{Duration: durationpb.New(50 * time.Millisecond)})
if err != nil {
    ....
}
```
    
默认情况下gRPC服务不开启TLS验证。

通过修改配置或者运行参数可以开启TLS或者mTLS
```
tcp:
  tls-enable: true # 是否开启TLS服务
  tls:
    cert-dir:  # TLS 证书所在的目录
    pair-name:  # TLS 证书私钥对名称
    cert-data:
      cert: # TLS 证书PEM数据
      key:  # TLS 私钥PEM数据
    cert-key:
      cert-file: /root/go/src/omnimam/_output/cert/example-grpc-server.crt # 包含 x509 证书的文件路径，用于 TLS 认证
      private-key-file: /root/go/src/omnimam/_output/cert/example-grpc-server.key # TLS 私钥
    client-ca-data: # 客户端CA证书PEM数据
    client-ca-path: # 客户端CA证书路径
```
* 设置`tls-enable`为true表示开启Tls,需要同时设置tls下面的参数对任意一堆,优先级如下：
    1. `cert-data.cert`/`cert-data.key`
    2. `cert-key.cert-file`/`cert-key.private-key-file`
    3. `cert-dir`/`pair-name`
* 通过设置client-ca-data或者client-ca-path来开启mTLS,优先级如下:
    1. `client-ca-data`
    2. `client-ca-path`

## gRPC通用模块服务添加
1. internal/pkg/grpcserver/proto目录,添加自定义模块目录并在里面生成.proto文件
2. 执行`make proto`,将会在internal/pkg/grpcserver/apis生成对应的模块的*.pb.go
3. 在`internal/pkg/grpcserver/service`中编写通用模块服务逻辑以及注册逻辑
```
// RegisterDebugServer  register debug service to gRPC.
func RegisterDebugServer(s *grpc.Server) {
	debug.RegisterDebugServiceServer(s, &debugService{})
}
```
4. 在`internal/pkg/grpcserver/server.go`中注册该服务
```
versionservice.RegisterVersionService(s.Server)
```

# 测试
## 手动测试
手动测试可以通过grpc客户端工具如`grpcurl`来测试. 

注意事项 **前提是grpc服务需要启动reflect服务。**
否则执行命令时会报`server does not support the reflection API`

参考自[服务的方法列表](https://chai2010.cn/advanced-go-programming-book/ch4-rpc/ch4-08-grpcurl.html)

###  gRPC服务启动反射服务
默认reflect服务是关闭的, 可以通过参数`--service.reflect`来开启。

`example-grpc --service.reflect=true`

如果正常启动，可以看到对应的启动日志
```
2023-07-25 07:02:05.986 INFO    grpcserver/config.go:59 gRPC service run with reflect service
``` 

### 查看gRPC服务
#### 查看gRPC安装的服务
查看gRPC服务器安装的服务`grpcurl -plaintext localhost:8081 list`
* `-plaintext`: Use plain-text HTTP/2 when connecting to server (no TLS)
    * 注意这个并不是跳过证书检测. 而是grpcurl通过非TLS HTTP2协议连接服务端. 如果服务端
    开启了TLS,则该连接会被
    * 如果需要跳过TLS(服务端证书)检测, 则需要传递`-insecure`参数。如果服务端开启了mTLS
    即服务端要求客户端提供证书, 则`-insecure`
    * 对应的是gRPC客户端的`grpc.WithInsecure`,作用是客户端通过非TLS连接服务端(可能会
    被服务端拒绝连接)。而不是进行TLS连接，跳过证书检测。
* 如果gRPC开启了TLS验证, grpcurl无法通过`-plaintext`来像curl跳过对服务端证书的验证，
必须通过`-cacert`来指定服务端ca证书进行检测。

```
root@wwhvw:~/go/src/omnimam# grpcurl -plaintext localhost:8081 list
grpc.reflection.v1alpha.ServerReflection
version.VersionService
```

继续使用 list 子命令还可以查看 HelloService 服务的方法列表
```
root@wwhvw:~/go/src/omnimam# grpcurl -plaintext localhost:8081 list version.VersionService
version.VersionService.Version
```

#### 查看gRPC方法的具体信息
如果还想了解方法的细节，可以使用 grpcurl 提供的 describe 子命令查看更详细的描述信息
```
version.VersionService is a service:
service VersionService {
  rpc Version ( .version.VersionRequest ) returns ( .version.VersionResponse );
}
```

也可以通过describe查看请求参数信息
```

root@wwhvw:~/go/src/omnimam# grpcurl -plaintext localhost:8081 describe  .version.VersionResponse
version.VersionResponse is a message:
message VersionResponse {
  string GitVersion = 1;
  string GitCommit = 2;
  string GitTreeState = 3;
  string BuildDate = 4;
  string GoVersion = 5;
  string Compiler = 6;
  string Platform = 7;
}

root@wwhvw:~/go/src/omnimam# grpcurl -plaintext localhost:8081 describe  .version.VersionRequest
version.VersionRequest is a message:
message VersionRequest {
}

```

### 调用方法进行测试
上面的命令可以看到version方法的参数和返回值。version不需要传参，因此
```
root@wwhvw:~/go/src/omnimam# grpcurl -plaintext -d '{}' localhost:8081 version.VersionService/Version
{
  "GitVersion": "f9f71a2",
  "GitCommit": "f9f71a24d71abfb295b2912bee529fb95bd62299",
  "GitTreeState": "dirty",
  "BuildDate": "2023-07-25T07:29:42Z",
  "GoVersion": "go1.17.13",
  "Compiler": "gc",
  "Platform": "linux/amd64"
}
```

如果需要参数`$ grpcurl -plaintext -d '{"value":"gopher"}' 
          localhost:1234 HelloService.HelloService/Hello`


## TLS服务测试


# GRPC框架调试
```
export GRPC_GO_LOG_SEVERITY_LEVEL=info
export GRPC_GO_LOG_VERBOSITY_LEVEL=2
```
可以在grpc服务看到grpc框架的日志信息如 ：
```
023/08/08 11:32:21 INFO: [core] [Server #1 ListenSocket #2] ListenSocket created
2023-08-08 11:32:21.920 INFO    example-grpc    grpcserver/server.go:60 gRPC Listen at [::]:8081
2023/08/08 11:32:21 INFO: [core] [Server #1 ListenSocket #3] ListenSocket created



2023/08/08 11:32:31 INFO: [core] [Server #1] grpc: Server.Serve failed to create ServerTransport: connection error: desc = "ServerHandshake(\"192.168.134.1:58130\") failed: tls: first record does not look like a TLS handshake"

```