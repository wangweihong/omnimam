# 镜像构建
 镜像构建支持多架构构建
## 控制变量
* `IMAGES`: 用于指定生成的镜像的程序`IMAGES="example-grpc example-server"`。如果不指定，默认以`build/docker/`子目录名作为IMAGES赋值。
* `PLATFORMS`: 用于指定生成镜像的多架构`PLATFORMS="linux/amd64 linux/arm64"`。默认架构为`linux/amd64 linux/arm64`。
    * 仅用于多架构构建命令，如`make image.multiarch`和`make build.image.multiarch`
* `VERSION`: 用于指定生成的镜像TAG中的版本号.
* `REGISTRY_PREFIX`: 用于指定生成的镜像的仓库前缀(推送的镜像仓库)。默认是`docker.io/omnimam`
* `BASE_IMAGE`: 用于指定运行时基础镜像。默认为`ubuntu:18.04`
## 命令

### 单一架构 (当前架构)
* 在本地编译当前架构程序并构建镜像(不支持异构架构)
    `make IMAGES=example-grpc image`
* 在本地编译当前架构程序并构建镜像(不支持异构架构)并推送给到指定镜像仓库 
    `make IMAGES=example-grpc REGISTRY_PREFIX=192.168.134.134/library push`

### 多架构
* 在golang容器交叉编译中构建默认平台架构(linux/amd64,linux/arm64)指定应用的镜像并推送到镜像仓库
    `make IMAGES=example-grpc REGISTRY_PREFIX=192.168.134.134/library  gobuild.push.multiarch`
* 在本地交叉编译多平台架构并构建多架构镜像推送到镜像仓库
    `make REGISTRY_PREFIX=192.168.134.134/library push.multiarch`
    
# 镜像运行
* 通过卷来替换容器内应用启动配置
    `docker run -v /root/go/src/omnimam/_output/configs/example-grpc.yaml:/etc/omnimam/example-grpc.yaml omnimam/example-grpc:v0.01-6-g7ddf4cb-amd64`
