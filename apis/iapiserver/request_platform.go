package iapiserver

import "github.com/wangweihong/omnimam/apis/imachinery"

type (
	MeResponse struct {
		User         MeUser          `json:"user"`
		Roles        []string        `json:"roles"`
		Permissions  []string        `json:"permissions"`
		FeatureFlags map[string]bool `json:"feature_flags"`
	}

	MeUser struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	}
)

type (
	ProviderListRequest struct {
		imachinery.BasicQueryParam
		Type    string `json:"type" form:"type"`
		Enabled *bool  `json:"enabled" form:"enabled"`
	}

	ProviderListResponse struct {
		imachinery.ListRet
		Providers []*Provider `json:"providers"`
	}

	ProviderCreateRequest struct {
		Name          string `json:"name" binding:"required"`
		Type          string `json:"type" binding:"required"`
		Enabled       *bool  `json:"enabled"`
		BaseURL       string `json:"base_url"`
		AuthType      string `json:"auth_type"`
		CredentialRef string `json:"credential_ref"`
	}

	ProviderUpdateRequest struct {
		ID            string  `json:"id"`
		Name          *string `json:"name"`
		Type          *string `json:"type"`
		Enabled       *bool   `json:"enabled"`
		BaseURL       *string `json:"base_url"`
		AuthType      *string `json:"auth_type"`
		CredentialRef *string `json:"credential_ref"`
	}

	ProviderModelListRequest struct {
		imachinery.BasicQueryParam
		ProviderID string `json:"provider_id" form:"provider_id"`
		Enabled    *bool  `json:"enabled" form:"enabled"`
		Capability string `json:"capability" form:"capability"`
	}

	ProviderModelListResponse struct {
		imachinery.ListRet
		Models []*ProviderModel `json:"models"`
	}

	ProviderModelCreateRequest struct {
		ProviderID    string         `json:"provider_id"`
		Name          string         `json:"name" binding:"required"`
		Model         string         `json:"model" binding:"required"`
		Capabilities  []string       `json:"capabilities"`
		Enabled       *bool          `json:"enabled"`
		DefaultParams map[string]any `json:"default_params"`
	}

	ProviderModelUpdateRequest struct {
		ID            string          `json:"id"`
		ProviderID    string          `json:"provider_id"`
		Name          *string         `json:"name"`
		Model         *string         `json:"model"`
		Capabilities  *[]string       `json:"capabilities"`
		Enabled       *bool           `json:"enabled"`
		DefaultParams *map[string]any `json:"default_params"`
	}
)

type (
	SystemLLMConfigListResponse struct {
		Configs []*SystemLLMConfig `json:"configs"`
	}

	SystemLLMConfigUpsertRequest struct {
		Configs []*SystemLLMConfigSpec `json:"configs" binding:"required"`
	}

	SystemLLMConfigSpec struct {
		Purpose    string `json:"purpose" binding:"required"`
		ProviderID string `json:"provider_id" binding:"required"`
		ModelID    string `json:"model_id"`
		Model      string `json:"model"`
		Enabled    *bool  `json:"enabled"`
	}
)

type (
	StorageBackendListRequest struct {
		imachinery.BasicQueryParam
		Type    string `json:"type" form:"type"`
		Enabled *bool  `json:"enabled" form:"enabled"`
	}

	StorageBackendListResponse struct {
		imachinery.ListRet
		Backends []*StorageBackend `json:"backends"`
	}

	StorageBackendCreateRequest struct {
		Name     string         `json:"name" binding:"required"`
		Type     string         `json:"type" binding:"required"`
		Root     string         `json:"root"`
		Config   map[string]any `json:"config"`
		Enabled  *bool          `json:"enabled"`
		Readonly *bool          `json:"readonly"`
		Quota    int64          `json:"quota"`
	}

	StorageBackendUpdateRequest struct {
		ID       string          `json:"id"`
		Name     *string         `json:"name"`
		Type     *string         `json:"type"`
		Root     *string         `json:"root"`
		Config   *map[string]any `json:"config"`
		Enabled  *bool           `json:"enabled"`
		Readonly *bool           `json:"readonly"`
		Quota    *int64          `json:"quota"`
	}
)

type (
	AssetListRequest struct {
		imachinery.BasicQueryParam
		MediaType        string   `json:"media_type" form:"media_type"`
		MimeType         string   `json:"mime_type" form:"mime_type"`
		StorageBackendID string   `json:"storage_backend_id" form:"storage_backend_id"`
		SourceType       string   `json:"source_type" form:"source_type"`
		Format           string   `json:"format" form:"format"`
		MinSize          int64    `json:"min_size" form:"min_size"`
		MaxSize          int64    `json:"max_size" form:"max_size"`
		Width            int      `json:"width" form:"width"`
		Height           int      `json:"height" form:"height"`
		MinWidth         int      `json:"min_width" form:"min_width"`
		MaxWidth         int      `json:"max_width" form:"max_width"`
		MinHeight        int      `json:"min_height" form:"min_height"`
		MaxHeight        int      `json:"max_height" form:"max_height"`
		MinDuration      int64    `json:"min_duration" form:"min_duration"`
		MaxDuration      int64    `json:"max_duration" form:"max_duration"`
		Tags             []string `json:"tags" form:"tags"`
	}

	AssetSearchRequest struct {
		Query AssetListRequest `json:"query"`
	}

	AssetSearchParseRequest struct {
		Text string `json:"text" binding:"required"`
	}

	AssetSearchParseResponse struct {
		Query  AssetListRequest `json:"query"`
		TaskID string           `json:"task_id,omitempty"`
	}

	AssetListResponse struct {
		imachinery.ListRet
		Assets []*AssetRecord `json:"assets"`
	}

	AssetRecord struct {
		*Asset
		Thumbnail *AssetThumbnail `json:"thumbnail,omitempty"`
		Tags      []*Tag          `json:"tags,omitempty"`
	}

	AssetUploadResponse struct {
		Asset *AssetRecord `json:"asset"`
		Tasks []*Task      `json:"tasks"`
	}

	AssetUpdateRequest struct {
		ID          string          `json:"id"`
		Name        *string         `json:"name"`
		SourceType  *string         `json:"source_type"`
		SourceRef   *string         `json:"source_ref"`
		Metadata    *map[string]any `json:"metadata"`
		TagNames    *[]string       `json:"tag_names"`
		TagSource   string          `json:"tag_source"`
		Description *string         `json:"description"`
	}
)

type (
	AssetGroupCreateRequest struct {
		Name        string         `json:"name" binding:"required"`
		Type        string         `json:"type"`
		Description string         `json:"description"`
		DynamicRule map[string]any `json:"dynamic_rule"`
		AssetIDs    []string       `json:"asset_ids"`
	}

	AssetGroupCreateResponse struct {
		Group   *AssetGroup         `json:"group"`
		Members []*AssetGroupMember `json:"members"`
	}
)

type (
	TaskCreateRequest struct {
		Name           string         `json:"name"`
		Type           string         `json:"type" binding:"required"`
		Priority       int            `json:"priority"`
		Queue          string         `json:"queue"`
		Input          map[string]any `json:"input"`
		MaxAttempts    int            `json:"max_attempts"`
		IdempotencyKey string         `json:"idempotency_key"`
	}

	TaskListRequest struct {
		imachinery.BasicQueryParam
		Type   string `json:"type" form:"type"`
		Status string `json:"status" form:"status"`
		Queue  string `json:"queue" form:"queue"`
	}

	TaskListResponse struct {
		imachinery.ListRet
		Tasks []*Task `json:"tasks"`
	}

	TaskCancelResponse struct {
		Task *Task `json:"task"`
	}
)
