# Makefile



# 调试
## 案例
###  1.解析/运行时变量混淆问题
Makefile包含解析和运行时两个阶段。这意味着有些命令是在解析阶段执行如`eval`，有些命令则是
在运行时执行。

```
.PHONY: go.build.%
go.build.%:
	$(eval COMMAND := $(word 2,$(subst ., ,$*)))
	$(eval PLATFORM := $(word 1,$(subst ., ,$*)))
	$(eval OS := $(word 1,$(subst _, ,$(PLATFORM))))
	$(eval ARCH := $(word 2,$(subst _, ,$(PLATFORM))))
	@echo $(OS)
ifeq ($(OS),windows)
	@echo $(OS)
	@echo "aaaa"
	$(eval GO_OUT_EXT := .exe)
else
	@echo "bbbbb"
	@echo $(OS)
endif  
	@CGO_ENABLED=0 GOOS=$(OS) GOARCH=$(ARCH) $(GO) build $(GO_BUILD_FLAGS) -o $(OUTPUT_DIR)/platforms/$(OS)/$(ARCH)/$(COMMAND)$(GO_OUT_EXT) $(ROOT_PACKAGE)/cmd/$(COMMAND)

.PHONY: go.build.multiarch
go.build.multiarch: go.build.verify $(foreach p,$(subst /,_,$(PLATFORMS)),$(addprefix go.build., $(addprefix $(p)., $(BINS))))

```
如上规则，我们的目的是在当编译windows平台的代码时,加上后缀`.exe`。但实际执行规则`make PLATFORMS="windows/amd64" build.multiarch`
时,输出的却是
```
windows
bbbbb
windows
```
这是为什么？这是因为`ifeq $(OS)`判断的是运行时的OS变量,`eval OS`是解析
时的变量。
也即是解析后的实际Makefile规则为
```
.PHONY: go.build.windows_adm64.binary
go.build.windows_adm64.binary:
	@echo windows
ifeq ($(OS),windows)
	@echo windows
	@echo "aaaa"
	$(eval GO_OUT_EXT := .exe)
else
	@echo "bbbbb"
	@echo windows
endif  
	@CGO_ENABLED=0 GOOS=windows GOARCH=$(ARCH) $(GO) build $(GO_BUILD_FLAGS) -o $(OUTPUT_DIR)/platforms/windows/amd64/$(COMMAND)$(GO_OUT_EXT) $(ROOT_PACKAGE)/cmd/$(COMMAND)
```
然后运行时再根据上述规则运行。这时候`ifeq ($(OS),windows)`就会从Makefile变量或者环境变量中查找`OS`变量
因为没有设置,所以`OS`为空(而不是windows).

可以通过`make PLATFORMS="windows/amd64" OS="windows" build.multiarch`来主动传递OS值。这时候会发现输出了
`aaaa`。

这些问题应该如何调试？
#### 解决方法
将运行时的ifeq语句，替换成解析时的条件语句.
https://www.gnu.org/software/make/manual/html_node/Conditional-Functions.html

```
# 由于makefile目标名不能包含"/",因此在go.build/go.build.multiarch中将架构"linux/amd64"分隔符转换成"linux_amd64"
.PHONY: go.build.%
go.build.%:
	$(eval COMMAND := $(word 2,$(subst ., ,$*)))
	$(eval PLATFORM := $(word 1,$(subst ., ,$*)))
	$(eval OS := $(word 1,$(subst _, ,$(PLATFORM))))
	$(eval ARCH := $(word 2,$(subst _, ,$(PLATFORM))))
	# 在解析阶段, 根据OS的值,设置GO_OUT_EXT
		$(if $(filter windows,$(OS)),$(eval GO_OUT_EXT := .exe),$(eval GO_OUT_EXT := ))
	@echo "===========> Building binary $(COMMAND) $(VERSION) for $(OS)/$(ARCH),Output:$(OUTPUT_DIR)/platforms/$(OS)/$(ARCH)/$(COMMAND)$(GO_OUT_EXT)"
	@mkdir -p $(OUTPUT_DIR)/platforms/$(OS)/$(ARCH)
	@CGO_ENABLED=0 GOOS=$(OS) GOARCH=$(ARCH) $(GO) build $(GO_BUILD_FLAGS) -o $(OUTPUT_DIR)/platforms/$(OS)/$(ARCH)/$(COMMAND)$(GO_OUT_EXT) $(ROOT_PACKAGE)/cmd/$(COMMAND)

```


## 调试手段

### `make -n`显示Makefile解析后的规则而不实际执行
查看`make PLATFORMS="windows/amd64" build.multiarch`实际执行的结果。
```
make go.build.multiarch
echo windows
echo "bbbbb"
echo windows
echo "===========> Building binary dingtalkhook 300e10b for windows/amd64,Output:/root/go/src/dingtalkhook/_output/platforms/windows/amd64/dingtalkhook"
mkdir -p /root/go/src/dingtalkhook/_output/platforms/windows/amd64
CGO_ENABLED=0 GOOS=windows GOARCH=amd64 go build -ldflags "-X dingtalkhook/pkg/version.GitVersion=300e10b -X dingtalkhook/pkg/version.GitCommit=300e10b960f8168cd4c69f518fe652731b3b9535 -X dingtalkhook/pkg/version.GitTreeState="dirty" -X dingtalkhook/pkg/version.BuildDate=2023-08-17T03:34:32Z" -o /root/go/src/dingtalkhook/_output/platforms/windows/amd64/dingtalkhook dingtalkhook/cmd/dingtalkhook

```
