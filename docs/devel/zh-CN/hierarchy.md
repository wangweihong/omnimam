# 源码架构

* `api/`:  swagger和openapi文档
* `build/` - 安装包和持续集成文件目录
    * `build/package`: 存放docker, 系统(deb,rpm,pkg)的包和配置脚本
    * `build/ci`: 存放ci(travis,circle,drone)的配置文件和脚本
    * `build/docker`: 存放各个组件的Dockerfile文件。
* `cmd/`: 存放各个组件的启动命令包代码
* `configs/`: 存放各个组件的配置文件**模板**.
* `deployments/`: 用于存放容器编排部署模板和配置(docker-compose, kubernetes/helm, Terraform, Bosh)
* `docs/`: 用于存放文档。
    * `docs/devel`: 开发文档
    * `docs/guide`: 对外使用操作文档
* `internal/`: 组件内部代码逻辑
    * `internal/pkg`: 组件间通用逻辑包
* `pkg/`: 对外通用逻辑包
* `scripts`: 存放脚本
    * `scripts/githooks`: 存放git钩子脚本。
    * `scripts/install`: 存放安装类的脚本
    * `scripts/lib`: 通用script脚本库
    * `scripts/make-files`: Makefile子规则库
* `test`: 测试
* `third_party`: 第三方forked的代码
* `tools`: 一些辅助工具
    * `tools/codegen`: 用于解析注释生成错误码文件和文档
    * `tools/deepcopy-gen`: 用于生成复杂结构的deepcopy函数
* `.gitattributes`: 用于告知git不同类型文件的换行符要怎么处理。
* `.gitignore`: 用于告知git忽略哪些类型的文件。也可以通过`git add -f file`强制添加。
* `.gitlint`: 用于go-gitlint检测git commit信息以提高git commit信息的规范化。
    * `scripts/githooks/commit-msg`脚本会执行`go-gitlint --msg-file="$1"`
        进行检测。
    * `scripts/githooks/commit-msg`脚本在每次Makefile执行时自动拷贝到`.git/hooks`目录,
        然后在每次git commit触发钩子时执行。
* `.golangci.yaml`: golangci-lint配置文件，用于控制golangci-lint的行为
    以及内置linter的行为。