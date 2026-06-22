# 架构
镜像仓库IP: 192.168.134.134
代码机器IP: 192.168.134.139

# 流程
## 搭建harbor
1. 在192.168.134.134机器生成证书ca证书等
2. 拷贝ca证书、服务器证书、密钥到/etc/docker/certs.d/192.168.134.134/
3. system restart docker重启docker
4. 执行harbor部署prepare **注意这一步是必须的，如果证书重新生成必须执行一次prepare**
5. docker-compose up -d 启动harbor仓库


## 代码机器
1. 拷贝192.168.134.134/etc/docker/certs.d/192.168.134.134中的ca证书、服务器证书和密钥到当前/etc/docker/certs.d/192.168.134.134目录
2. 重启docker daemon
3. 确认证书有效
`curl --cacert /etc/docker/certs.d/192.168.134.134/ca.crt https://192.168.134.134/api/v2.0/systeminfo`
4. docker login 192.168.134.134 
5. 简单go代码 get_cpu_os.go
```
package main

import (
   "fmt"
   "runtime"
)

func main() {
   fmt.Println("CPU Arch: ", runtime.GOARCH)
   fmt.Println("Operating System:", runtime.GOOS)
}

```
5. 编写Dockerfile
```
FROM  --platform=$TARGETPLATFORM 192.168.134.134/library/golang AS builder
ARG TARGETPLATFORM
ARG BUILDPLATFORM
WORKDIR /gobuild
COPY  get-cpu-os.go  .
RUN go build get-cpu-os.go

FROM --platform=$TARGETPLATFORM 192.168.134.134/library/golang
ARG TARGETPLATFORM
ARG BUILDPLATFORM
WORKDIR /gorun
COPY --from=builder /gobuild/get-cpu-os .
CMD ["./get-cpu-os"]
```
6. 安装依赖`docker run --privileged --rm tonistiigi/binfmt --install all`
6. 创建buildx实例
参考 https://docs.docker.com/build/buildkit/configure/#setting-registry-certificates
创建/etc/buildkitd.toml用于指定私有镜像仓库证书
```
# /etc/buildkitd.toml
debug = true
[registry."192.168.134.134"]
  ca=["/etc/docker/certs.d/192.168.134.134/ca.crt"]
  [[registry."192.168.134.134".keypair]]
    key="/etc/docker/certs.d/192.168.134.134/192.168.134.134.key"
    cert="/etc/docker/certs.d/192.168.134.134/192.168.134.134.cert"
```
创建实例
`docker buildx create --use --bootstrap   --name test   --driver docker-container   --config /etc/buildkitd.toml`
确认证书已经加载进去
* `docker exec <实例容器> cat  /etc/buildkit/buildkit.yaml`
* `docker exec <实例容器> ls /etc/buildkit/certs/192.168.134.134`

7. 配置系统级CA证书
UBUNTU系统：
    * 拷贝/etc/docker/certs.d/192.168.134.134/ca.crt到 /usr/local/share/ca-certificates/ca.crt
        * 最好重命名成ca-certificates-192.168.134.134.crt 
    * `update-ca-certificates --fresh`更新证书到/etc/ssl/certs
    * 用系统级证书来验证192.168.134.134服务是否有效`openssl s_client -connect 192.168.134.134:443 -CApath /etc/ssl/certs`。如果返回码为0，则系统CA证书生效
    ```
    Timeout   : 7200 (sec)
    Verify return code: 0 (ok)
    Extended master secret: yes

    ```
8. 构建
```
docker buildx build --builder test \
-t 192.168.134.134/library/get-cpu-os:v4 \
--platform linux/amd64,linux/arm64 \
-f Dockerfile \
--push .
```
构建后，镜像会自动推送到192.168.134.134私有镜像仓库

# 问题处理
## `curl --cacert /etc/docker/certs.d/192.168.134.134/ca.crt https://192.168.134.134/api/v2.0/systeminfo`如果报错

如果报`self-signed certificates`之类的错误，很有可能ca证书不匹配导致。很有可能是重新生成了ca，服务器证书但没有应用到运行的harbor服务. 

1. docker-compose down先停掉harbor服务
2. prepare
3. docker-compose up -d 


## 如果docker buildx build的过程中报`ERROR: failed to solve: failed to push 192.168.134.134/library/get-cpu-os:v4: unexpected status from POST request to https://192.168.134.134/v2/library/get-cpu-os/blobs/uploads/: 401 Unauthorized`

这可能是因为没有`docker login 192.168.134.134` 


## `ERROR: failed to solve: 192.168.134.134/library/golang: 192.168.134.134/library/golang:latest: not found`


如果Dockerfile中引用了私有仓库的镜像，如果这些镜像是多架构的，以<tag>-架构作为标签，需要构建一个manifest供docker buildx根据不同架构对应下载。

1. `docker manifest create 192.168.134.134/library/golang:latest 192.168.134.134/library/golang:latest-arm64 192.168.134.134/library/golang:latest-amd64`
2. `docker manifest push 192.168.134.134/library/golang:latest`


## 如果构建过程报`ERROR: failed to solve: 192.168.134.134/library/golang: failed to do request: Head "https://192.168.134.134/v2/library/golang/manifests/latest": tls: failed to verify certificate: x509: certificate signed by unknown authority`

这是因为在构建实例过程中，没有将harbor服务的证书通过配置导入到实例。
此时docker exec <实例容器> ls /etc/buildkit/certs/192.168.134.134/里面
应该是空的。



## 如果构建过程报`ERROR: failed to solve: 192.168.134.134/library/golang: failed to authorize: failed to fetch oauth token: Post "https://192.168.134.134/service/token": tls: failed to verify certificate: x509: certificate signed by unknown authority`

* https://github.com/docker/setup-buildx-action/issues/112
这种情况原因是没有配置把镜像仓库的自签名CA证书添加到系统端。
通过`openssl s_client -connect 192.168.134.134:443 -CApath /etc/ssl/certs`得到的结果是
```

    Start Time: 1693296541
    Timeout   : 7200 (sec)
    Verify return code: 21 (unable to verify the first certificate)
    Extended master secret: yes

```
注意不同的操作系统配置系统级CA证书的路径不同！

7. 配置系统级CA证书
UBUNTU系统：
    * 拷贝/etc/docker/certs.d/192.168.134.134/ca.crt到 /usr/local/share/ca-certificates/ca.crt
    * `update-ca-certificates --fresh`更新证书到/etc/ssl/certs
    * 用系统级证书来验证192.168.134.134服务是否有效`openssl s_client -connect 192.168.134.134:443 -CApath /etc/ssl/certs`。如果返回码为0，则系统CA证书生效
    ```
    Timeout   : 7200 (sec)
    Verify return code: 0 (ok)
    Extended master secret: yes

    ```