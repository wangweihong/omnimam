package platform

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/wangweihong/omnimam/apis/iapiserver"
	srvv1 "github.com/wangweihong/omnimam/internal/apiserver/service/v1"
	"github.com/wangweihong/omnimam/internal/apiserver/store"
	"github.com/wangweihong/omnimam/pkg/core"
)

type PlatformController struct {
	srv srvv1.Service
}

func NewController(storeIns store.Factory) *PlatformController {
	return &PlatformController{srv: srvv1.NewService(storeIns)}
}

func (pc *PlatformController) Me(c *gin.Context) {
	core.Run(c, nil, func(_ any) (any, error) {
		return pc.srv.Platforms().Me(c)
	})
}

func (pc *PlatformController) ListProviders(c *gin.Context) {
	core.Run(c, &iapiserver.ProviderListRequest{}, func(r *iapiserver.ProviderListRequest) (any, error) {
		return pc.srv.Platforms().ProviderList(c, r)
	})
}

func (pc *PlatformController) CreateProvider(c *gin.Context) {
	core.Run(c, &iapiserver.ProviderCreateRequest{}, func(r *iapiserver.ProviderCreateRequest) (any, error) {
		return pc.srv.Platforms().ProviderCreate(c, r)
	})
}

func (pc *PlatformController) UpdateProvider(c *gin.Context) {
	req := &iapiserver.ProviderUpdateRequest{ID: c.Param("provider_id")}
	if err := c.ShouldBindJSON(req); err != nil {
		core.WriteResponse(c, err, nil)
		return
	}
	ret, err := pc.srv.Platforms().ProviderUpdate(c, req)
	core.WriteResponse(c, err, ret)
}

func (pc *PlatformController) ListProviderModels(c *gin.Context) {
	req := &iapiserver.ProviderModelListRequest{ProviderID: c.Param("provider_id")}
	core.Run(c, req, func(r *iapiserver.ProviderModelListRequest) (any, error) {
		if r.ProviderID == "" {
			r.ProviderID = c.Param("provider_id")
		}
		return pc.srv.Platforms().ProviderModelList(c, r)
	})
}

func (pc *PlatformController) CreateProviderModel(c *gin.Context) {
	req := &iapiserver.ProviderModelCreateRequest{ProviderID: c.Param("provider_id")}
	core.Run(c, req, func(r *iapiserver.ProviderModelCreateRequest) (any, error) {
		if r.ProviderID == "" {
			r.ProviderID = c.Param("provider_id")
		}
		return pc.srv.Platforms().ProviderModelCreate(c, r)
	})
}

func (pc *PlatformController) UpdateProviderModel(c *gin.Context) {
	req := &iapiserver.ProviderModelUpdateRequest{
		ID:         c.Param("model_id"),
		ProviderID: c.Param("provider_id"),
	}
	if err := c.ShouldBindJSON(req); err != nil {
		core.WriteResponse(c, err, nil)
		return
	}
	ret, err := pc.srv.Platforms().ProviderModelUpdate(c, req)
	core.WriteResponse(c, err, ret)
}

func (pc *PlatformController) GetSystemLLMConfig(c *gin.Context) {
	core.Run(c, nil, func(_ any) (any, error) {
		return pc.srv.Platforms().SystemLLMConfigList(c)
	})
}

func (pc *PlatformController) PutSystemLLMConfig(c *gin.Context) {
	core.Run(
		c,
		&iapiserver.SystemLLMConfigUpsertRequest{},
		func(r *iapiserver.SystemLLMConfigUpsertRequest) (any, error) {
			return pc.srv.Platforms().SystemLLMConfigUpsert(c, r)
		},
	)
}

func (pc *PlatformController) ListStorageBackends(c *gin.Context) {
	core.Run(c, &iapiserver.StorageBackendListRequest{}, func(r *iapiserver.StorageBackendListRequest) (any, error) {
		return pc.srv.Platforms().StorageBackendList(c, r)
	})
}

func (pc *PlatformController) CreateStorageBackend(c *gin.Context) {
	core.Run(
		c,
		&iapiserver.StorageBackendCreateRequest{},
		func(r *iapiserver.StorageBackendCreateRequest) (any, error) {
			return pc.srv.Platforms().StorageBackendCreate(c, r)
		},
	)
}

func (pc *PlatformController) UpdateStorageBackend(c *gin.Context) {
	req := &iapiserver.StorageBackendUpdateRequest{ID: c.Param("backend_id")}
	if err := c.ShouldBindJSON(req); err != nil {
		core.WriteResponse(c, err, nil)
		return
	}
	ret, err := pc.srv.Platforms().StorageBackendUpdate(c, req)
	core.WriteResponse(c, err, ret)
}

func (pc *PlatformController) UploadAsset(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		core.WriteResponse(c, err, nil)
		return
	}
	tags := splitTags(c.PostForm("tags"))
	sourceType := c.PostForm("source_type")
	ret, err := pc.srv.Platforms().AssetUpload(c, file, tags, sourceType)
	core.WriteResponse(c, err, ret)
}

func (pc *PlatformController) ListAssets(c *gin.Context) {
	core.Run(c, &iapiserver.AssetListRequest{}, func(r *iapiserver.AssetListRequest) (any, error) {
		return pc.srv.Platforms().AssetList(c, r)
	})
}

func (pc *PlatformController) SearchAssets(c *gin.Context) {
	core.Run(c, &iapiserver.AssetSearchRequest{}, func(r *iapiserver.AssetSearchRequest) (any, error) {
		return pc.srv.Platforms().AssetSearch(c, r)
	})
}

func (pc *PlatformController) ParseAssetSearch(c *gin.Context) {
	core.Run(c, &iapiserver.AssetSearchParseRequest{}, func(r *iapiserver.AssetSearchParseRequest) (any, error) {
		return pc.srv.Platforms().AssetSearchParse(c, r)
	})
}

func (pc *PlatformController) GetAsset(c *gin.Context) {
	core.Run(c, nil, func(_ any) (any, error) {
		return pc.srv.Platforms().AssetGet(c, c.Param("asset_id"))
	})
}

func (pc *PlatformController) UpdateAsset(c *gin.Context) {
	req := &iapiserver.AssetUpdateRequest{ID: c.Param("asset_id")}
	if err := c.ShouldBindJSON(req); err != nil {
		core.WriteResponse(c, err, nil)
		return
	}
	ret, err := pc.srv.Platforms().AssetUpdate(c, req)
	core.WriteResponse(c, err, ret)
}

func (pc *PlatformController) GetAssetContent(c *gin.Context) {
	path, mimeType, err := pc.srv.Platforms().AssetContentPath(c, c.Param("asset_id"))
	if err != nil {
		core.WriteResponse(c, err, nil)
		return
	}
	if mimeType != "" {
		c.Header("Content-Type", mimeType)
	}
	c.File(path)
}

func (pc *PlatformController) GetAssetThumbnail(c *gin.Context) {
	path, mimeType, err := pc.srv.Platforms().AssetThumbnailPath(c, c.Param("asset_id"))
	if err != nil {
		core.WriteResponse(c, err, nil)
		return
	}
	if mimeType != "" {
		c.Header("Content-Type", mimeType)
	}
	c.File(path)
}

func (pc *PlatformController) CreateAssetGroup(c *gin.Context) {
	core.Run(c, &iapiserver.AssetGroupCreateRequest{}, func(r *iapiserver.AssetGroupCreateRequest) (any, error) {
		return pc.srv.Platforms().AssetGroupCreate(c, r)
	})
}

func (pc *PlatformController) ListTasks(c *gin.Context) {
	core.Run(c, &iapiserver.TaskListRequest{}, func(r *iapiserver.TaskListRequest) (any, error) {
		return pc.srv.Platforms().TaskList(c, r)
	})
}

func (pc *PlatformController) CreateTask(c *gin.Context) {
	core.Run(c, &iapiserver.TaskCreateRequest{}, func(r *iapiserver.TaskCreateRequest) (any, error) {
		return pc.srv.Platforms().TaskCreate(c, r)
	})
}

func (pc *PlatformController) GetTask(c *gin.Context) {
	core.Run(c, nil, func(_ any) (any, error) {
		return pc.srv.Platforms().TaskGet(c, c.Param("task_id"))
	})
}

func (pc *PlatformController) CancelTask(c *gin.Context) {
	core.Run(c, nil, func(_ any) (any, error) {
		return pc.srv.Platforms().TaskCancel(c, c.Param("task_id"))
	})
}

func (pc *PlatformController) TaskEvents(c *gin.Context) {
	task, err := pc.srv.Platforms().TaskGet(c, c.Param("task_id"))
	if err != nil {
		core.WriteResponse(c, err, nil)
		return
	}
	c.JSON(http.StatusOK, gin.H{"events": []any{task}})
}

func (pc *PlatformController) RunCanvas(c *gin.Context) {
	req := &iapiserver.TaskCreateRequest{
		Name:  "canvas-run",
		Type:  "canvas.run",
		Queue: "default",
		Input: map[string]any{"canvas_id": c.Param("canvas_id")},
	}
	ret, err := pc.srv.Platforms().TaskCreate(c, req)
	core.WriteResponse(c, err, ret)
}

func splitTags(raw string) []string {
	if raw == "" {
		return nil
	}
	parts := strings.FieldsFunc(raw, func(r rune) bool {
		return r == ',' || r == '，' || r == ';' || r == '；' || r == '\n' || r == '\t'
	})
	tags := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			tags = append(tags, part)
		}
	}
	return tags
}
