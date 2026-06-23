package iapiserver

import "github.com/wangweihong/omnimam/apis/imachinery"

// --- AssetLibrary ---

type (
	AssetLibraryListRequest struct {
		imachinery.BasicQueryParam
	}

	AssetLibraryListResponse struct {
		imachinery.ListRet
		List []*AssetLibrary `json:"list"`
	}

	AssetLibraryCreateRequest struct {
		Name string `json:"name" binding:"required"`
	}

	AssetLibraryCreateResponse struct {
		AssetLibrary AssetLibrary `json:"asset_library"`
	}

	AssetLibraryUpdateRequest struct {
		imachinery.ObjectMeta
		Name string `json:"name" binding:"required"`
	}

	AssetLibraryDeleteRequest struct {
		imachinery.ObjectMeta
	}
)

// --- AssetCategory ---

type (
	AssetCategoryListRequest struct {
		imachinery.BasicQueryParam
		LibraryID string `json:"library_id" form:"library_id" binding:"required"`
	}

	AssetCategoryListResponse struct {
		imachinery.ListRet
		List []*AssetCategory `json:"list"`
	}

	AssetCategoryCreateRequest struct {
		LibraryID string `json:"library_id" binding:"required"`
		Name      string `json:"name" binding:"required"`
		Type      string `json:"type"`
	}

	AssetCategoryCreateResponse struct {
		Category AssetCategory `json:"category"`
	}

	AssetCategoryUpdateRequest struct {
		imachinery.ObjectMeta
		LibraryID string `json:"library_id"`
		Name      string `json:"name" binding:"required"`
	}

	AssetCategoryDeleteRequest struct {
		imachinery.ObjectMeta
		LibraryID string `json:"library_id"`
	}
)

// --- AssetItem ---

type (
	AssetItemListRequest struct {
		imachinery.BasicQueryParam
		LibraryID  string `json:"library_id" form:"library_id"`
		CategoryID string `json:"category_id" form:"category_id"`
		Kind       string `json:"kind" form:"kind"`
	}

	AssetItemListResponse struct {
		imachinery.ListRet
		List []*AssetItem `json:"list"`
	}

	AssetItemCreateRequest struct {
		LibraryID  string `json:"library_id" binding:"required"`
		CategoryID string `json:"category_id" binding:"required"`
		URL        string `json:"url" binding:"required"`
		Name       string `json:"name"`
	}

	AssetItemCreateResponse struct {
		Item AssetItem `json:"item"`
	}

	AssetItemBatchCreateRequest struct {
		LibraryID  string                   `json:"library_id" binding:"required"`
		CategoryID string                   `json:"category_id" binding:"required"`
		Items      []AssetItemCreateRequest `json:"items" binding:"required"`
	}

	AssetItemBatchCreateResponse struct {
		Items []*AssetItem `json:"items"`
	}

	AssetItemUpdateRequest struct {
		imachinery.ObjectMeta
		LibraryID string `json:"library_id"`
		Name      string `json:"name" binding:"required"`
	}

	AssetItemDeleteRequest struct {
		imachinery.ObjectMeta
		LibraryID string `json:"library_id"`
	}

	AssetItemBatchDeleteRequest struct {
		IDs       []string `json:"ids" binding:"required"`
		LibraryID string   `json:"library_id"`
	}

	AssetItemBatchMoveRequest struct {
		IDs              []string `json:"ids" binding:"required"`
		LibraryID        string   `json:"library_id"`
		TargetLibraryID  string   `json:"target_library_id"`
		TargetCategoryID string   `json:"target_category_id" binding:"required"`
	}

	AssetItemClassifyRequest struct {
		LibraryID string   `json:"library_id"`
		IDs       []string `json:"ids" binding:"required"`
		Provider  string   `json:"provider"`
		Model     string   `json:"model"`
		Prompt    string   `json:"prompt"`
	}

	AssetItemClassifyResponse struct {
		Count int                           `json:"count"`
		Items []AssetItemClassifyResultItem `json:"items"`
	}

	AssetItemClassifyResultItem struct {
		ID             string                   `json:"id"`
		OK             bool                     `json:"ok"`
		Classification *AssetItemClassification `json:"classification"`
		Error          string                   `json:"error"`
	}
)

const (
	SystemPromptLibraryID = "system"
	DefaultProjectID      = "default"
)

type (
	PromptLibraryListResponse struct {
		ActiveLibraryID string               `json:"active_library_id"`
		Libraries       []*PromptLibraryFull `json:"libraries"`
	}

	PromptLibraryFull struct {
		PromptLibrary
		Categories []*PromptCategory `json:"categories"`
		Items      []*PromptItem     `json:"items"`
	}

	PromptLibraryCreateRequest struct {
		Name string `json:"name" binding:"required"`
	}

	PromptLibraryUpdateRequest struct {
		imachinery.ObjectMeta
		Name string `json:"name" binding:"required"`
	}

	PromptLibraryDeleteRequest struct {
		imachinery.ObjectMeta
	}

	PromptItemCreateRequest struct {
		LibraryID  string `json:"library_id" binding:"required"`
		Name       string `json:"name"`
		CategoryID string `json:"category_id"`
		Positive   string `json:"positive" binding:"required"`
		Negative   string `json:"negative"`
		Scene      string `json:"scene"`
	}

	PromptItemCreateResponse struct {
		Item *PromptItem `json:"item"`
	}

	PromptItemUpdateRequest struct {
		imachinery.ObjectMeta
		LibraryID  string `json:"library_id"`
		Name       string `json:"name"`
		CategoryID string `json:"category_id"`
		Positive   string `json:"positive" binding:"required"`
		Negative   string `json:"negative"`
		Scene      string `json:"scene"`
	}

	PromptItemDeleteRequest struct {
		imachinery.ObjectMeta
	}

	PromptItemBatchDeleteRequest struct {
		IDs []string `json:"ids" binding:"required"`
	}

	PromptCategoryCreateRequest struct {
		LibraryID string `json:"library_id" binding:"required"`
		Name      string `json:"name" binding:"required"`
	}

	PromptCategoryUpdateRequest struct {
		imachinery.ObjectMeta
		Name string `json:"name" binding:"required"`
	}

	PromptCategoryDeleteRequest struct {
		imachinery.ObjectMeta
		LibraryID string `json:"library_id"`
	}

	ProjectListResponse struct {
		Projects []*ProjectRecord `json:"projects"`
	}

	ProjectRecord struct {
		*Project
		CanvasCount int `json:"canvas_count"`
	}

	ProjectCreateRequest struct {
		Name string `json:"name" binding:"required"`
	}

	ProjectCreateResponse struct {
		Project *ProjectRecord `json:"project"`
	}

	ProjectUpdateRequest struct {
		imachinery.ObjectMeta
		Name      *string `json:"name"`
		SortOrder *int    `json:"order"`
	}

	ProjectDeleteRequest struct {
		imachinery.ObjectMeta
	}

	CanvasListResponse struct {
		Canvases []*CanvasRecord `json:"canvases"`
	}

	CanvasTrashResponse struct {
		Canvases      []*CanvasRecord `json:"canvases"`
		RetentionDays int             `json:"retention_days"`
	}

	CanvasRecord struct {
		*Canvas
		NodeCount int `json:"node_count"`
	}

	CanvasCreateRequest struct {
		Title   string  `json:"title"`
		Icon    string  `json:"icon"`
		Kind    string  `json:"kind"`
		Project string  `json:"project"`
		BoardX  float64 `json:"board_x"`
		BoardY  float64 `json:"board_y"`
	}

	CanvasCreateResponse struct {
		Canvas *CanvasRecord `json:"canvas"`
	}

	CanvasGetResponse struct {
		Canvas *Canvas `json:"canvas"`
	}

	CanvasMetaResponse struct {
		ID        string `json:"id"`
		UpdatedAt int64  `json:"updated_at"`
		Title     string `json:"title"`
		Icon      string `json:"icon"`
		Kind      string `json:"kind"`
	}

	CanvasMetaUpdateRequest struct {
		imachinery.ObjectMeta
		Title   *string  `json:"title"`
		Icon    *string  `json:"icon"`
		Owner   *string  `json:"owner"`
		Color   *string  `json:"color"`
		Pinned  *bool    `json:"pinned"`
		Project *string  `json:"project"`
		BoardX  *float64 `json:"board_x"`
		BoardY  *float64 `json:"board_y"`
	}

	CanvasSaveRequest struct {
		imachinery.ObjectMeta
		BaseUpdatedAt int64          `json:"base_updated_at"`
		Title         string         `json:"title"`
		Icon          string         `json:"icon"`
		Kind          string         `json:"kind"`
		Nodes         map[string]any `json:"nodes"`
		Connections   map[string]any `json:"connections"`
		Viewport      map[string]any `json:"viewport"`
		Logs          map[string]any `json:"logs"`
		Settings      map[string]any `json:"settings"`
	}

	CanvasTouchResponse struct {
		Canvas    *CanvasRecord `json:"canvas"`
		UpdatedAt int64         `json:"updated_at"`
	}

	CanvasRestoreResponse struct {
		Canvas *Canvas `json:"canvas"`
	}
)
