package canvas

import (
	"github.com/gin-gonic/gin"

	"github.com/wangweihong/omnimam/apis/iapiserver"
	srvv1 "github.com/wangweihong/omnimam/internal/apiserver/service/v1"
	"github.com/wangweihong/omnimam/internal/apiserver/store"
	"github.com/wangweihong/omnimam/pkg/core"
)

type CanvasController struct {
	srv srvv1.Service
}

func NewController(storeIns store.Factory) *CanvasController {
	return &CanvasController{
		srv: srvv1.NewService(storeIns),
	}
}

func (cc *CanvasController) ListCanvases(c *gin.Context) {
	core.Run(c, nil, func(_ any) (any, error) {
		return cc.srv.Canvases().CanvasList(c)
	})
}

func (cc *CanvasController) ListTrash(c *gin.Context) {
	core.Run(c, nil, func(_ any) (any, error) {
		return cc.srv.Canvases().CanvasTrashList(c)
	})
}

func (cc *CanvasController) CreateCanvas(c *gin.Context) {
	core.Run(c, &iapiserver.CanvasCreateRequest{}, func(r *iapiserver.CanvasCreateRequest) (any, error) {
		return cc.srv.Canvases().CanvasCreate(c, r)
	})
}

func (cc *CanvasController) GetCanvas(c *gin.Context) {
	core.Run(c, nil, func(_ any) (any, error) {
		return cc.srv.Canvases().CanvasGet(c, c.Param("canvas_id"))
	})
}

func (cc *CanvasController) GetCanvasMeta(c *gin.Context) {
	core.Run(c, nil, func(_ any) (any, error) {
		return cc.srv.Canvases().CanvasGetMeta(c, c.Param("canvas_id"))
	})
}

func (cc *CanvasController) UpdateCanvasMeta(c *gin.Context) {
	req := &iapiserver.CanvasMetaUpdateRequest{}
	req.ID = c.Param("canvas_id")
	core.Run(c, req, func(r *iapiserver.CanvasMetaUpdateRequest) (any, error) {
		return cc.srv.Canvases().CanvasUpdateMeta(c, r)
	})
}

func (cc *CanvasController) SaveCanvas(c *gin.Context) {
	req := &iapiserver.CanvasSaveRequest{}
	req.ID = c.Param("canvas_id")
	core.Run(c, req, func(r *iapiserver.CanvasSaveRequest) (any, error) {
		return cc.srv.Canvases().CanvasSave(c, r)
	})
}

func (cc *CanvasController) TouchCanvas(c *gin.Context) {
	core.Run(c, nil, func(_ any) (any, error) {
		return cc.srv.Canvases().CanvasTouch(c, c.Param("canvas_id"))
	})
}

func (cc *CanvasController) DeleteCanvas(c *gin.Context) {
	core.Run(c, nil, func(_ any) (any, error) {
		if err := cc.srv.Canvases().CanvasSoftDelete(c, c.Param("canvas_id")); err != nil {
			return nil, err
		}
		return gin.H{"ok": true}, nil
	})
}

func (cc *CanvasController) RestoreCanvas(c *gin.Context) {
	core.Run(c, nil, func(_ any) (any, error) {
		return cc.srv.Canvases().CanvasRestore(c, c.Param("canvas_id"))
	})
}

func (cc *CanvasController) PurgeCanvas(c *gin.Context) {
	core.Run(c, nil, func(_ any) (any, error) {
		if err := cc.srv.Canvases().CanvasPurge(c, c.Param("canvas_id")); err != nil {
			return nil, err
		}
		return gin.H{"ok": true}, nil
	})
}

func (cc *CanvasController) ListProjects(c *gin.Context) {
	core.Run(c, nil, func(_ any) (any, error) {
		return cc.srv.Canvases().ProjectList(c)
	})
}

func (cc *CanvasController) CreateProject(c *gin.Context) {
	core.Run(c, &iapiserver.ProjectCreateRequest{}, func(r *iapiserver.ProjectCreateRequest) (any, error) {
		return cc.srv.Canvases().ProjectCreate(c, r)
	})
}

func (cc *CanvasController) UpdateProject(c *gin.Context) {
	req := &iapiserver.ProjectUpdateRequest{}
	req.ID = c.Param("project_id")
	core.Run(c, req, func(r *iapiserver.ProjectUpdateRequest) (any, error) {
		return cc.srv.Canvases().ProjectUpdate(c, r)
	})
}

func (cc *CanvasController) DeleteProject(c *gin.Context) {
	req := &iapiserver.ProjectDeleteRequest{}
	req.ID = c.Param("project_id")
	core.Run(c, req, func(r *iapiserver.ProjectDeleteRequest) (any, error) {
		moved, err := cc.srv.Canvases().ProjectDelete(c, r)
		if err != nil {
			return nil, err
		}
		return gin.H{"ok": true, "moved": moved}, nil
	})
}
