# OmniMAM Agent 协作规范

## 项目方向 Project Direction

- OmniMAM 是以 Go backend 为主、frontend 独立部署的前后端分离项目。
- 不使用 Python 代码作为目标 backend 架构的一部分；仓库中已有 Python 文件不能作为新 backend 契约来源。
- 正式 frontend source code 统一放在 `frontend/` 目录。
- `static/` 只作为画布、智能画布和交互能力参考，不作为正式 frontend 目录，也不作为 backend API contract 来源。
- OmniMAM 的定位是 AI capability hub、多模态 Asset 管理、Async Task 编排平台。
- OmniMAM backend 不加载或运行模型，只连接和调度外部或本地模型服务，例如 DeepSeek、ModelScope、API gateway、ComfyUI、vLLM、LM Studio、OCR、ASR、TTS endpoint。
- Backend 负责稳定 API contract、metadata、permission、task state、provider abstraction、storage abstraction。

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
- DeepSeek 是第一版 built-in LLM provider，通过 OpenAI-compatible adapter contract 实现。
- Frontend 可见能力必须由 backend 返回的 permission 和 `FeatureFlag` 驱动，入口信息来自 `/api/v1/me`。
- Frontend hiding 不是安全边界；backend permission check 和 feature gate 始终是权威判断。

## 当前 Backend Contract

- 核心 domain 包括 `Provider`、`ProviderModel`、`SystemLLMConfig`、`StorageBackend`、`Asset`、`AssetThumbnail`、`Tag`、`AssetGroup`、`AssetRelation`、`Task`、`FeatureFlag`、`Role`、`Permission`、`Canvas`。
- 第一阶段 task backend 使用 database polling 和 task lease。
- 第一阶段 storage backend 只实现 local storage，但 interface 需要预留 S3、OSS、MinIO。
- 第一阶段 search 使用 database filter 和 indexed metadata fields。
- 旧 `asset-library` API 可以保留兼容，但新平台能力以 `Asset` 和 `AssetGroup` contract 为准。

## 工程工作流 Engineering Workflow

- 修改前先检查当前 git branch 是否符合仓库 hook 规则；如果不符合，先切换或创建符合规则的分支。
- 修改后按用户要求提交 commit；如果用户没有要求提交，不要擅自提交。
- Commit message 必须满足仓库 `commit-msg` hook，并遵循 Conventional Commit，例如 `feat(platform): add asset contracts`。
- 如果工具调用失败，先检查 `Makefile` 是否存在对应 install、setup 或 generate rule；没有规则时再手动处理。
- 对外公共库放在 `/pkg`。
- 项目内公共库放在 `/internal/pkg`。
- 新增 public 或 internal library code 时必须补单元测试。
- Library unit test 沿用当前项目 GoConvey 约定，使用 `github.com/smartystreets/goconvey/convey` 的 dot import：

```go
import . "github.com/smartystreets/goconvey/convey"
```

## Frontend 目录规则 Frontend Layout

- 正式 frontend source code 必须放在 `frontend/`。
- `frontend/` 由 nginx 独立托管，API 通过 `/api/v1` 反向代理到 Go `API Server`。
- `static/` 只能保留为参考页面、交互原型或历史能力清单；不能在 `static/` 中继续扩展正式产品功能。
- 新增 frontend 功能时，需要先读取 `/api/v1/me`，根据 permission 和 `FeatureFlag` 动态显示菜单、按钮、provider、task entry。

## Error Code 与 HTTP Status 规则

- 对外接口调用失败时，必须返回正确的 business error code 和 HTTP status code。
- 新增或调整错误码时，按 `internal/pkg/code/base.go` 的写法添加注释，至少包含：
  - `@HTTP`：对应 HTTP status code。
  - `@CN`：中文错误说明。
  - `@EN`：英文错误说明。
- 修改错误码后必须使用 `codegen` 生成错误码相关代码和文档；优先运行 `make gen`。
- 如果 `codegen` 不存在，先在 `Makefile` 和 `scripts/make-rules/` 中查找安装规则；当前项目优先使用 `make tools` 或对应 `install.codegen` 规则。
- Provider、Storage、external API gateway、local model service 等外部调用失败时，不能统一吞成 `500`；需要按失败类型映射为合适的 error code 和 HTTP status，例如认证失败、权限不足、资源不存在、请求超时、上游不可用、响应解析失败。

## 修改后验证规则 Verification Rules

- 每次修改 Go code 后，必须运行：

```bash
make format
make lint
```

- 代码提交前必须运行 `make build`，确认程序可以成功编译。
- 修改 error code、generated contract、swagger、proto 或其他生成文件相关代码后，还必须运行对应 generate rule，例如 `make gen` 或项目中明确的生成目标。
- 文档-only 修改不强制运行 `make format` 和 `make lint`，但必须检查文档内容和 git 状态。
- 如果验证命令失败，交付结果时必须说明失败命令、失败原因和未完成风险。

## 接口注释要求 Interface Comment Requirements

- 新增或修改 HTTP API、service interface、store interface、provider adapter interface、worker task interface 时，必须补充对应功能注释。
- 注释至少说明接口用途、主要 input/output、关键 side effect 或 async behavior。
- Public API 注释需要说明 permission 或 `FeatureFlag` 的影响。
- Public API 注释需要说明 endpoint 是否返回原始 asset content、只返回 metadata/thumbnail，或是否创建 async `Task`。
- Internal helper function 不要求长注释，但 exported interface method 和 controller endpoint 必须有清晰功能说明。

## AI 工程协作增强规则 AI Collaboration Rules

### 认知盲区提醒 Cognitive Blind Spot Checks

- 如果用户的需求描述过于直接跳到实现，AI 应先反问 product goal、user scenario、success criteria，避免为了做功能而做功能。
- 当发现用户可能把 implementation approach 当成真实 requirement 时，AI 应主动区分 user goal、current approach、alternative approach、recommended approach。

### 工程决策透明化 Transparent Engineering Decisions

- 涉及 architecture、state management、data model、permission、dependency、route、major UI structure 的变更时，AI 必须先说明技术判断依据。
- 每次重要实现前，AI 应简短列出 change impact、可能破坏的 module、verification method。
- 如果存在多个 implementation path，AI 应给出至少两个方案，并比较 complexity、extensibility、risk、development cost，再推荐一个。
- 不允许为了短期跑通而引入长期难维护的临时方案。
- 如必须临时处理，必须标记 `TODO`，并说明原因。

### 文档与实现一致性 Documentation And Implementation Consistency

- 所有大的涉及 feature、information architecture、data structure、permission model 或 main layout 的调整，都要询问用户是否同步更新 `/docs` 中对应文档，并提出更新大纲。
- 定期检查当前项目实际功能、UI、data model、interaction flow 是否与 `/docs` 规范一致。
- 当 implementation 与 documentation 发生偏离时，AI 必须说明偏离点、偏离原因、潜在影响。
- 发现偏差时，AI 应提醒用户选择：更新 code、更新 docs，或记录 deviation reason。

### 用户能力提升 User Capability Building

- AI 在给出实现结果时，应适度解释关键 engineering judgment，让用户理解为什么这样做，而不只是交付代码。
- AI 不应一味迎合用户的即时指令；当更好的长期方案存在时，应礼貌但明确地提出。
- 当长期方案与短期指令冲突时，AI 应说明 trade-off，并推荐更稳妥的路径。
