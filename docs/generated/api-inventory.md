# API Inventory

生成日期：2026-06-26

事实来源：`backend/internal/apiserver/route.go`，Controller 证据来自 `backend/internal/apiserver/controller/v1/`。

| 模块 | Method | Path | Handler | Service/Store 证据 | Request/Response 证据 | 状态 | 证据 |
|---|---|---|---|---|---|---|---|
| Web 应用壳 | GET | `/api/v1/me` | `PlatformController.Me` | `backend/internal/apiserver/service/v1/platform/service.go` | `backend/apis/iapiserver/request_platform.go` | 可用 | `backend/internal/apiserver/route.go` |
| 模型提供商管理 | GET | `/api/v1/provider-presets` | `PlatformController.ListProviderPresets` | `service/v1/platform/service.go` | `request_platform.go` | 可用 | `route.go` |
| 模型提供商管理 | POST | `/api/v1/provider-presets/:preset_key/install` | `PlatformController.InstallProviderPreset` | `service/v1/platform/service.go` | `request_platform.go` | 可用 | `route.go` |
| 模型提供商管理 | GET | `/api/v1/providers` | `PlatformController.ListProviders` | `store/postgresql/platform.go` | `request_platform.go` | 可用 | `route.go` |
| 模型提供商管理 | POST | `/api/v1/providers` | `PlatformController.CreateProvider` | `store/postgresql/platform.go` | `request_platform.go` | 可用 | `route.go` |
| 模型提供商管理 | PATCH | `/api/v1/providers/:provider_id` | `PlatformController.UpdateProvider` | `store/postgresql/platform.go` | `request_platform.go` | 可用 | `route.go` |
| 模型提供商管理 | DELETE | `/api/v1/providers/:provider_id` | `PlatformController.DeleteProvider` | `store/postgresql/platform.go` | `request_platform.go` | 可用 | `route.go` |
| 模型提供商管理 | POST | `/api/v1/providers/:provider_id/test` | `PlatformController.TestProvider` | `provider/openai_compatible.go` | `request_platform.go` | 可用 | `route.go` |
| 模型提供商管理 | GET | `/api/v1/providers/:provider_id/models` | `PlatformController.ListProviderModels` | `store/postgresql/platform.go` | `request_platform.go` | 可用 | `route.go` |
| 模型提供商管理 | POST | `/api/v1/providers/:provider_id/models` | `PlatformController.CreateProviderModel` | `store/postgresql/platform.go` | `request_platform.go` | 可用 | `route.go` |
| 模型提供商管理 | POST | `/api/v1/providers/:provider_id/models/sync` | `PlatformController.SyncProviderModels` | `service/v1/platform/service.go` | `request_platform.go` | 可用 | `route.go` |
| 模型提供商管理 | PATCH | `/api/v1/providers/:provider_id/models/:model_id` | `PlatformController.UpdateProviderModel` | `store/postgresql/platform.go` | `request_platform.go` | 可用 | `route.go` |
| 模型提供商管理 | DELETE | `/api/v1/providers/:provider_id/models/:model_id` | `PlatformController.DeleteProviderModel` | `store/postgresql/platform.go` | `request_platform.go` | 可用 | `route.go` |
| 模型提供商管理 | GET | `/api/v1/system-llm-config` | `PlatformController.GetSystemLLMConfig` | `store/postgresql/platform.go` | `request_platform.go` | 可用 | `route.go` |
| 模型提供商管理 | PUT | `/api/v1/system-llm-config` | `PlatformController.PutSystemLLMConfig` | `store/postgresql/platform.go` | `request_platform.go` | 可用 | `route.go` |
| 存储后端 | GET | `/api/v1/storage-backends` | `PlatformController.ListStorageBackends` | `store/postgresql/platform.go` | `request_platform.go` | 部分可用 | `route.go` |
| 存储后端 | POST | `/api/v1/storage-backends` | `PlatformController.CreateStorageBackend` | `store/postgresql/platform.go` | `request_platform.go` | 部分可用 | `route.go` |
| 存储后端 | PATCH | `/api/v1/storage-backends/:backend_id` | `PlatformController.UpdateStorageBackend` | `store/postgresql/platform.go` | `request_platform.go` | 部分可用 | `route.go` |
| 平台资产管理 | GET | `/api/v1/assets` | `PlatformController.ListAssets` | `store/postgresql/platform.go` | `request_platform.go` | 可用 | `route.go` |
| 平台资产管理 | POST | `/api/v1/assets/upload` | `PlatformController.UploadAsset` | `service/v1/platform/service.go` | `request_platform.go` | 可用 | `route.go` |
| 平台资产管理 | POST | `/api/v1/assets/uploads/chunks/init` | `PlatformController.InitAssetChunkUpload` | `service/v1/platform/service.go` | `request_platform.go` | 可用 | `route.go` |
| 平台资产管理 | PUT | `/api/v1/assets/uploads/chunks/:checksum/:index` | `PlatformController.UploadAssetChunk` | `service/v1/platform/service.go` | `request_platform.go` | 可用 | `route.go` |
| 平台资产管理 | POST | `/api/v1/assets/uploads/chunks/:checksum/complete` | `PlatformController.CompleteAssetChunkUpload` | `service/v1/platform/service.go` | `request_platform.go` | 可用 | `route.go` |
| 平台资产管理 | DELETE | `/api/v1/assets/uploads/chunks/:checksum` | `PlatformController.CancelAssetChunkUpload` | `service/v1/platform/service.go` | `request_platform.go` | 可用 | `route.go` |
| 平台资产管理 | POST | `/api/v1/assets/search` | `PlatformController.SearchAssets` | `service/v1/platform/service.go` | `request_platform.go` | 可用 | `route.go` |
| 平台资产管理 | POST | `/api/v1/assets/search/parse` | `PlatformController.ParseAssetSearch` | `service/v1/platform/service.go` | `request_platform.go` | 可用 | `route.go` |
| 平台资产管理 | GET | `/api/v1/assets/:asset_id` | `PlatformController.GetAsset` | `store/postgresql/platform.go` | `request_platform.go` | 可用 | `route.go` |
| 平台资产管理 | PATCH | `/api/v1/assets/:asset_id` | `PlatformController.UpdateAsset` | `store/postgresql/platform.go` | `request_platform.go` | 可用 | `route.go` |
| 平台资产管理 | DELETE | `/api/v1/assets/:asset_id` | `PlatformController.DeleteAsset` | `store/postgresql/platform.go` | `request_platform.go` | 可用 | `route.go` |
| 平台资产管理 | GET | `/api/v1/assets/:asset_id/content` | `PlatformController.GetAssetContent` | `service/v1/platform/service.go` | `request_platform.go` | 可用 | `route.go` |
| 平台资产管理 | GET | `/api/v1/assets/:asset_id/thumbnail` | `PlatformController.GetAssetThumbnail` | `service/v1/platform/service.go` | `request_platform.go` | 可用 | `route.go` |
| 平台资产管理 | POST | `/api/v1/asset-groups` | `PlatformController.CreateAssetGroup` | `store/postgresql/platform.go` | `request_platform.go` | 可用 | `route.go` |
| 平台资产管理 | POST | `/api/v1/canvas-assets/download` | `PlatformController.DownloadCanvasAssets` | `service/v1/platform/service.go` | `request_asset.go` | 可用 | `route.go` |
| 平台资产管理 | POST | `/api/v1/canvas-assets/check` | `PlatformController.SearchAssets` | `service/v1/platform/service.go` | `request_platform.go` | 可用 | `route.go` |
| 平台资产管理 | POST | `/api/v1/canvas-assets/register-output` | `PlatformController.RegisterCanvasOutput` | `service/v1/platform/service.go` | `request_asset.go` | 可用 | `route.go` |
| 异步任务管理 | GET | `/api/v1/tasks` | `PlatformController.ListTasks` | `store/postgresql/platform.go` | `request_platform.go` | 可用 | `route.go` |
| 异步任务管理 | POST | `/api/v1/tasks` | `PlatformController.CreateTask` | `store/postgresql/platform.go` | `request_platform.go` | 可用 | `route.go` |
| 异步任务管理 | GET | `/api/v1/tasks/:task_id` | `PlatformController.GetTask` | `store/postgresql/platform.go` | `request_platform.go` | 可用 | `route.go` |
| 异步任务管理 | POST | `/api/v1/tasks/:task_id/cancel` | `PlatformController.CancelTask` | `store/postgresql/platform.go` | `request_platform.go` | 可用 | `route.go` |
| 异步任务管理 | GET | `/api/v1/tasks/:task_id/events` | `PlatformController.TaskEvents` | `service/v1/platform/service.go` | `request_platform.go` | 可用 | `route.go` |
| 画布工作流 | GET | `/api/v1/canvases` | `CanvasController.ListCanvases` | `service/v1/canvas/project.go` | `request_asset.go` | 可用 | `route.go` |
| 画布工作流 | GET | `/api/v1/canvases/trash` | `CanvasController.ListTrash` | `service/v1/canvas/project.go` | `request_asset.go` | 可用 | `route.go` |
| 画布工作流 | POST | `/api/v1/canvases` | `CanvasController.CreateCanvas` | `service/v1/canvas/project.go` | `request_asset.go` | 可用 | `route.go` |
| 画布工作流 | POST | `/api/v1/canvases/import` | `CanvasController.ImportCanvas` | `service/v1/canvas/project.go` | `request_asset.go` | 可用 | `route.go` |
| 画布工作流 | GET | `/api/v1/canvases/:canvas_id` | `CanvasController.GetCanvas` | `service/v1/canvas/project.go` | `request_asset.go` | 可用 | `route.go` |
| 画布工作流 | GET | `/api/v1/canvases/:canvas_id/export` | `CanvasController.ExportCanvas` | `service/v1/canvas/project.go` | `request_asset.go` | 可用 | `route.go` |
| 画布工作流 | PATCH | `/api/v1/canvases/:canvas_id` | `CanvasController.UpdateCanvasMeta` | `service/v1/canvas/project.go` | `request_asset.go` | 可用 | `route.go` |
| 画布工作流 | GET | `/api/v1/canvases/:canvas_id/meta` | `CanvasController.GetCanvasMeta` | `service/v1/canvas/project.go` | `request_asset.go` | 可用 | `route.go` |
| 画布工作流 | POST | `/api/v1/canvases/:canvas_id/meta` | `CanvasController.UpdateCanvasMeta` | `service/v1/canvas/project.go` | `request_asset.go` | 可用 | `route.go` |
| 画布工作流 | PUT | `/api/v1/canvases/:canvas_id` | `CanvasController.SaveCanvas` | `service/v1/canvas/project.go` | `request_asset.go` | 可用 | `route.go` |
| 画布工作流 | POST | `/api/v1/canvases/:canvas_id/workflows/export` | `CanvasController.ExportWorkflow` | `service/v1/canvas/project.go` | `request_asset.go` | 可用 | `route.go` |
| 画布工作流 | POST | `/api/v1/canvases/:canvas_id/workflows/import` | `CanvasController.ImportWorkflow` | `service/v1/canvas/project.go` | `request_asset.go` | 可用 | `route.go` |
| 画布工作流 | POST | `/api/v1/canvases/:canvas_id/workflows/export-package` | `CanvasController.ExportWorkflowPackage` | `service/v1/canvas/project.go` | `request_asset.go` | 可用 | `route.go` |
| 画布工作流 | POST | `/api/v1/canvases/:canvas_id/workflows/import-package` | `CanvasController.ImportWorkflowPackage` | `service/v1/canvas/project.go` | `request_asset.go` | 可用 | `route.go` |
| 画布工作流 | POST | `/api/v1/canvases/:canvas_id/touch` | `CanvasController.TouchCanvas` | `service/v1/canvas/project.go` | `request_asset.go` | 可用 | `route.go` |
| 画布工作流 | DELETE | `/api/v1/canvases/:canvas_id` | `CanvasController.DeleteCanvas` | `service/v1/canvas/project.go` | `request_asset.go` | 可用 | `route.go` |
| 画布工作流 | POST | `/api/v1/canvases/:canvas_id/restore` | `CanvasController.RestoreCanvas` | `service/v1/canvas/project.go` | `request_asset.go` | 可用 | `route.go` |
| 画布工作流 | DELETE | `/api/v1/canvases/:canvas_id/purge` | `CanvasController.PurgeCanvas` | `service/v1/canvas/project.go` | `request_asset.go` | 可用 | `route.go` |
| 画布工作流 | POST | `/api/v1/canvases/:canvas_id/run` | `PlatformController.RunCanvas` | `service/v1/platform/service.go` | `request_asset.go` | 可用 | `route.go` |
| 画布工作流 | POST | `/api/v1/canvases/:canvas_id/nodes/:node_id/run` | `PlatformController.RunCanvasNode` | `service/v1/platform/service.go` | `request_asset.go` | 可用 | `route.go` |
| 画布工作流 | GET | `/api/v1/canvases/:canvas_id/runs/:task_id` | `PlatformController.GetCanvasRun` | `service/v1/platform/service.go` | `request_asset.go` | 可用 | `route.go` |
| 画布工作流 | POST | `/api/v1/canvases/:canvas_id/runs/:task_id/cancel` | `PlatformController.CancelCanvasRun` | `service/v1/platform/service.go` | `request_asset.go` | 可用 | `route.go` |
| 画布工作流 | GET | `/api/v1/projects` | `CanvasController.ListProjects` | `service/v1/canvas/project.go` | `request_asset.go` | 可用 | `route.go` |
| 画布工作流 | POST | `/api/v1/projects` | `CanvasController.CreateProject` | `service/v1/canvas/project.go` | `request_asset.go` | 可用 | `route.go` |
| 画布工作流 | POST | `/api/v1/projects/:project_id` | `CanvasController.UpdateProject` | `service/v1/canvas/project.go` | `request_asset.go` | 可用 | `route.go` |
| 画布工作流 | DELETE | `/api/v1/projects/:project_id` | `CanvasController.DeleteProject` | `service/v1/canvas/project.go` | `request_asset.go` | 可用 | `route.go` |
| 素材库 | GET | `/api/v1/asset-library/libraries` | `AssetController.ListLibraries` | `service/v1/asset/0_service.go` | `request_asset.go` | 部分可用 | `route.go` |
| 素材库 | POST | `/api/v1/asset-library/libraries` | `AssetController.CreateLibrary` | `service/v1/asset/0_service.go` | `request_asset.go` | 部分可用 | `route.go` |
| 素材库 | PATCH | `/api/v1/asset-library/libraries/:library_id` | `AssetController.UpdateLibrary` | `service/v1/asset/0_service.go` | `request_asset.go` | 部分可用 | `route.go` |
| 素材库 | DELETE | `/api/v1/asset-library/libraries/:library_id` | `AssetController.DeleteLibrary` | `service/v1/asset/0_service.go` | `request_asset.go` | 部分可用 | `route.go` |
| 素材库 | GET | `/api/v1/asset-library/categories` | `AssetController.ListCategories` | `service/v1/asset/0_service.go` | `request_asset.go` | 部分可用 | `route.go` |
| 素材库 | POST | `/api/v1/asset-library/categories` | `AssetController.CreateCategory` | `service/v1/asset/0_service.go` | `request_asset.go` | 部分可用 | `route.go` |
| 素材库 | PATCH | `/api/v1/asset-library/categories/:category_id` | `AssetController.UpdateCategory` | `service/v1/asset/0_service.go` | `request_asset.go` | 部分可用 | `route.go` |
| 素材库 | DELETE | `/api/v1/asset-library/categories/:category_id` | `AssetController.DeleteCategory` | `service/v1/asset/0_service.go` | `request_asset.go` | 部分可用 | `route.go` |
| 素材库 | GET | `/api/v1/asset-library/items` | `AssetController.ListItems` | `service/v1/asset/0_service.go` | `request_asset.go` | 部分可用 | `route.go` |
| 素材库 | POST | `/api/v1/asset-library/items` | `AssetController.CreateItem` | `service/v1/asset/0_service.go` | `request_asset.go` | 部分可用 | `route.go` |
| 素材库 | POST | `/api/v1/asset-library/items/batch` | `AssetController.BatchCreateItems` | `service/v1/asset/0_service.go` | `request_asset.go` | 部分可用 | `route.go` |
| 素材库 | PATCH | `/api/v1/asset-library/items/:item_id` | `AssetController.UpdateItem` | `service/v1/asset/0_service.go` | `request_asset.go` | 部分可用 | `route.go` |
| 素材库 | DELETE | `/api/v1/asset-library/items/:item_id` | `AssetController.DeleteItem` | `service/v1/asset/0_service.go` | `request_asset.go` | 部分可用 | `route.go` |
| 素材库 | POST | `/api/v1/asset-library/items/delete` | `AssetController.BatchDeleteItems` | `service/v1/asset/0_service.go` | `request_asset.go` | 部分可用 | `route.go` |
| 素材库 | POST | `/api/v1/asset-library/items/move` | `AssetController.BatchMoveItems` | `service/v1/asset/0_service.go` | `request_asset.go` | 部分可用 | `route.go` |
| 素材库 | POST | `/api/v1/asset-library/items/classify` | `AssetController.ClassifyItems` | `service/v1/asset/0_service.go` | `request_asset.go` | 部分可用 | `route.go` |
| 提示词库 | GET | `/api/v1/prompt-libraries` | `PromptController.ListLibraries` | `service/v1/prompt/prompt.go` | `request_asset.go` | 部分可用 | `route.go` |
| 提示词库 | POST | `/api/v1/prompt-libraries` | `PromptController.CreateLibrary` | `service/v1/prompt/prompt.go` | `request_asset.go` | 部分可用 | `route.go` |
| 提示词库 | PATCH | `/api/v1/prompt-libraries/:library_id` | `PromptController.UpdateLibrary` | `service/v1/prompt/prompt.go` | `request_asset.go` | 部分可用 | `route.go` |
| 提示词库 | DELETE | `/api/v1/prompt-libraries/:library_id` | `PromptController.DeleteLibrary` | `service/v1/prompt/prompt.go` | `request_asset.go` | 部分可用 | `route.go` |
| 提示词库 | POST | `/api/v1/prompt-libraries/items` | `PromptController.CreateItem` | `service/v1/prompt/prompt.go` | `request_asset.go` | 部分可用 | `route.go` |
| 提示词库 | PATCH | `/api/v1/prompt-libraries/items/:item_id` | `PromptController.UpdateItem` | `service/v1/prompt/prompt.go` | `request_asset.go` | 部分可用 | `route.go` |
| 提示词库 | DELETE | `/api/v1/prompt-libraries/items/:item_id` | `PromptController.DeleteItem` | `service/v1/prompt/prompt.go` | `request_asset.go` | 部分可用 | `route.go` |
| 提示词库 | POST | `/api/v1/prompt-libraries/items/delete` | `PromptController.BatchDeleteItems` | `service/v1/prompt/prompt.go` | `request_asset.go` | 部分可用 | `route.go` |
| 提示词库 | POST | `/api/v1/prompt-libraries/categories` | `PromptController.CreateCategory` | `service/v1/prompt/prompt.go` | `request_asset.go` | 部分可用 | `route.go` |
| 提示词库 | PATCH | `/api/v1/prompt-libraries/categories/:category_id` | `PromptController.UpdateCategory` | `service/v1/prompt/prompt.go` | `request_asset.go` | 部分可用 | `route.go` |
| 提示词库 | DELETE | `/api/v1/prompt-libraries/categories/:category_id` | `PromptController.DeleteCategory` | `service/v1/prompt/prompt.go` | `request_asset.go` | 部分可用 | `route.go` |
| 认证与 SSO 设置 | GET | `/api/v1/auth/otp/qrcode` | `AuthController.OTPGenerateOrGet` | `service/v1/identity/otp.go` | `request_otp.go` | 部分可用 | `route.go` |
| 认证与 SSO 设置 | POST | `/api/v1/auth/otp/validate` | `AuthController.OTPValidate` | `service/v1/identity/otp.go` | `request_otp.go` | 部分可用 | `route.go` |
| 认证与 SSO 设置 | GET | `/api/v1/auth/sso/sp/saml/metadata` | `AuthController.SpSsoSamlInitiator` | `service/v1/setting/sso_auth_sp_saml.go` | `request_sso_auth.go` | 部分可用 | `route.go` |
| 认证与 SSO 设置 | POST | `/api/v1/auth/sso/sp/saml/initiator` | `AuthController.SpSsoSamlInitiator` | `service/v1/setting/sso_auth_sp_saml.go` | `request_sso_auth.go` | 部分可用 | `route.go` |
| 认证与 SSO 设置 | POST | `/api/v1/auth/sso/sp/saml/acs` | `AuthController.SpSsoSamlAcs` | `service/v1/setting/sso_auth_sp_saml.go` | `request_sso_auth.go` | 部分可用 | `route.go` |
| 认证与 SSO 设置 | POST | `/api/v1/auth/sso/sp/saml/slo` | `AuthController.SpSsoSamlSLO` | `service/v1/setting/sso_auth_sp_saml.go` | `request_sso_auth.go` | 部分可用 | `route.go` |
| 认证与 SSO 设置 | POST | `/api/v1/auth/sso/idp/saml/answer` | `AuthController.IdpServeSAMLProtocolSSO` | `service/v1/setting/sso_auth_idp_saml.go` | `request_sso_auth.go` | 部分可用 | `route.go` |
| 认证与 SSO 设置 | POST | `/api/v1/setting/sso/saml/idp/metadata/upsert` | `SettingController.IdentityProviderSAMLMetadataUpsert` | `service/v1/setting/sso_meta.go` | `request_setting.go` | 部分可用 | `route.go` |
| 认证与 SSO 设置 | GET | `/api/v1/setting/sso/saml/idp/metadata/get` | `SettingController.IdentityProviderSAMLMetadataGet` | `service/v1/setting/sso_meta.go` | `request_setting.go` | 部分可用 | `route.go` |
| 认证与 SSO 设置 | GET | `/api/v1/setting/sso/saml/idp/metadata/download` | `SettingController.IdentityProviderSAMLMetadataDownload` | `service/v1/setting/sso_meta.go` | `request_setting.go` | 部分可用 | `route.go` |
| 认证与 SSO 设置 | POST | `/api/v1/setting/sso/saml/sp/metadata/upsert` | `SettingController.ServiceProviderSAMLMetadataUpsert` | `service/v1/setting/sso_meta.go` | `request_setting.go` | 部分可用 | `route.go` |
| 认证与 SSO 设置 | GET | `/api/v1/setting/sso/saml/sp/metadata/get` | `SettingController.ServiceProviderSAMLMetadataGet` | `service/v1/setting/sso_meta.go` | `request_setting.go` | 部分可用 | `route.go` |
| 认证与 SSO 设置 | GET | `/api/v1/setting/sso/saml/sp/metadata/download` | `SettingController.ServiceProviderSAMLMetadataDownload` | `service/v1/setting/sso_meta.go` | `request_setting.go` | 部分可用 | `route.go` |
| 认证与 SSO 设置 | 多个 | `/api/v1/setting/sso/app/idp/*`、`/api/v1/setting/sso/app/sp/*` | `SettingController.IdentityProvider*`、`SettingController.ServiceProvider*` | `service/v1/setting/sso_idp.go`、`sso_sp.go` | `request_sso.go` | 部分可用 | `route.go` |
