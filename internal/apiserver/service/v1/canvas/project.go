package canvas

import (
	"context"

	"github.com/wangweihong/gotoolbox/pkg/errors"
	"github.com/wangweihong/omnimam/apis/iapiserver"
	"github.com/wangweihong/omnimam/internal/apiserver/store"
)

type CanvasSrv interface {
	ProjectList(ctx context.Context) (*iapiserver.ProjectListResponse, error)
	ProjectCreate(ctx context.Context, req *iapiserver.ProjectCreateRequest) (*iapiserver.ProjectCreateResponse, error)
	ProjectUpdate(ctx context.Context, req *iapiserver.ProjectUpdateRequest) (*iapiserver.ProjectRecord, error)
	ProjectDelete(ctx context.Context, req *iapiserver.ProjectDeleteRequest) (int, error)

	CanvasList(ctx context.Context) (*iapiserver.CanvasListResponse, error)
	CanvasTrashList(ctx context.Context) (*iapiserver.CanvasTrashResponse, error)
	CanvasCreate(ctx context.Context, req *iapiserver.CanvasCreateRequest) (*iapiserver.CanvasCreateResponse, error)
	CanvasGet(ctx context.Context, id string) (*iapiserver.CanvasGetResponse, error)
	CanvasGetMeta(ctx context.Context, id string) (*iapiserver.CanvasMetaResponse, error)
	CanvasUpdateMeta(ctx context.Context, req *iapiserver.CanvasMetaUpdateRequest) (*iapiserver.CanvasRecord, error)
	CanvasSave(ctx context.Context, req *iapiserver.CanvasSaveRequest) (*iapiserver.Canvas, error)
	CanvasTouch(ctx context.Context, id string) (*iapiserver.CanvasTouchResponse, error)
	CanvasSoftDelete(ctx context.Context, id string) error
	CanvasRestore(ctx context.Context, id string) (*iapiserver.CanvasRestoreResponse, error)
	CanvasPurge(ctx context.Context, id string) error
}

type canvasService struct {
	store store.Factory
}

func NewService(str store.Factory) *canvasService {
	return &canvasService{store: str}
}

func (s *canvasService) ensureDefaultProject(ctx context.Context) error {
	_, err := s.store.Projects().Get(ctx, iapiserver.DefaultProjectID)
	if err == nil {
		return nil
	}
	def := &iapiserver.Project{}
	def.ID = iapiserver.DefaultProjectID
	def.Name = "默认项目"
	def.SortOrder = 0
	_, err = s.store.Projects().Add(ctx, def)
	return err
}

func (s *canvasService) toCanvasRecord(c *iapiserver.Canvas) *iapiserver.CanvasRecord {
	nodeCount := 0
	if nodes, ok := c.Extend["nodes"]; ok {
		if arr, ok := nodes.([]any); ok {
			nodeCount = len(arr)
		}
	}
	return &iapiserver.CanvasRecord{Canvas: c, NodeCount: nodeCount}
}

func (s *canvasService) ProjectList(ctx context.Context) (*iapiserver.ProjectListResponse, error) {
	if err := s.ensureDefaultProject(ctx); err != nil {
		return nil, errors.WithStack(err)
	}

	projects, err := s.store.Projects().List(ctx)
	if err != nil {
		return nil, errors.WithStack(err)
	}

	records := make([]*iapiserver.ProjectRecord, 0, len(projects))
	for _, p := range projects {
		count, _ := s.store.Canvases().CountByProject(ctx, p.ID)
		records = append(records, &iapiserver.ProjectRecord{Project: p, CanvasCount: count})
	}
	return &iapiserver.ProjectListResponse{Projects: records}, nil
}

func (s *canvasService) ProjectCreate(ctx context.Context, req *iapiserver.ProjectCreateRequest) (*iapiserver.ProjectCreateResponse, error) {
	if err := s.ensureDefaultProject(ctx); err != nil {
		return nil, errors.WithStack(err)
	}

	projects, err := s.store.Projects().List(ctx)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	maxOrder := 0
	for _, p := range projects {
		if p.SortOrder > maxOrder {
			maxOrder = p.SortOrder
		}
	}

	p := &iapiserver.Project{}
	p.Name = req.Name
	p.SortOrder = maxOrder + 1

	created, err := s.store.Projects().Add(ctx, p)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	return &iapiserver.ProjectCreateResponse{
		Project: &iapiserver.ProjectRecord{Project: created, CanvasCount: 0},
	}, nil
}

func (s *canvasService) ProjectUpdate(ctx context.Context, req *iapiserver.ProjectUpdateRequest) (*iapiserver.ProjectRecord, error) {
	p := &iapiserver.Project{}
	p.ID = req.ID
	if req.Name != nil {
		p.Name = *req.Name
	}
	if req.SortOrder != nil {
		p.SortOrder = *req.SortOrder
	}

	updated, err := s.store.Projects().Update(ctx, p)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	count, _ := s.store.Canvases().CountByProject(ctx, p.ID)
	return &iapiserver.ProjectRecord{Project: updated, CanvasCount: count}, nil
}

func (s *canvasService) ProjectDelete(ctx context.Context, req *iapiserver.ProjectDeleteRequest) (int, error) {
	if req.ID == iapiserver.DefaultProjectID {
		return 0, errors.Errorf("default project cannot be deleted")
	}
	_, err := s.store.Projects().Get(ctx, req.ID)
	if err != nil {
		return 0, errors.WithStack(err)
	}

	moved, err := s.store.Canvases().ReassignProject(ctx, req.ID, iapiserver.DefaultProjectID)
	if err != nil {
		return 0, errors.WithStack(err)
	}

	if err := s.store.Projects().Delete(ctx, req.ID); err != nil {
		return 0, errors.WithStack(err)
	}
	return moved, nil
}

func (s *canvasService) CanvasList(ctx context.Context) (*iapiserver.CanvasListResponse, error) {
	_ = s.store.Canvases().CleanupExpiredTrash(ctx, 30)

	canvases, err := s.store.Canvases().List(ctx, false)
	if err != nil {
		return nil, errors.WithStack(err)
	}

	records := make([]*iapiserver.CanvasRecord, 0, len(canvases))
	for _, c := range canvases {
		records = append(records, s.toCanvasRecord(c))
	}
	return &iapiserver.CanvasListResponse{Canvases: records}, nil
}

func (s *canvasService) CanvasTrashList(ctx context.Context) (*iapiserver.CanvasTrashResponse, error) {
	canvases, err := s.store.Canvases().List(ctx, true)
	if err != nil {
		return nil, errors.WithStack(err)
	}

	records := make([]*iapiserver.CanvasRecord, 0, len(canvases))
	for _, c := range canvases {
		records = append(records, s.toCanvasRecord(c))
	}
	return &iapiserver.CanvasTrashResponse{Canvases: records, RetentionDays: 30}, nil
}

func (s *canvasService) CanvasCreate(ctx context.Context, req *iapiserver.CanvasCreateRequest) (*iapiserver.CanvasCreateResponse, error) {
	if err := s.ensureDefaultProject(ctx); err != nil {
		return nil, errors.WithStack(err)
	}

	kind := iapiserver.CanvasKindClassic
	if req.Kind == iapiserver.CanvasKindSmart {
		kind = iapiserver.CanvasKindSmart
	}

	projectID := req.Project
	if projectID == "" {
		projectID = iapiserver.DefaultProjectID
	}

	title := req.Title
	if title == "" {
		if kind == iapiserver.CanvasKindSmart {
			title = "智能画布"
		} else {
			title = "未命名画布"
		}
	}

	icon := req.Icon
	if icon == "" {
		if kind == iapiserver.CanvasKindSmart {
			icon = "sparkles"
		} else {
			icon = "layers"
		}
	}

	c := &iapiserver.Canvas{}
	c.Title = title
	c.Icon = icon
	c.Kind = kind
	c.ProjectID = projectID
	c.BoardX = req.BoardX
	c.BoardY = req.BoardY
	c.Extend = map[string]any{
		"nodes":       []any{},
		"connections": []any{},
		"viewport":    map[string]any{"x": 0, "y": 0, "scale": 1},
		"logs":        []any{},
		"settings":    map[string]any{},
	}

	created, err := s.store.Canvases().Add(ctx, c)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	return &iapiserver.CanvasCreateResponse{Canvas: s.toCanvasRecord(created)}, nil
}

func (s *canvasService) CanvasGet(ctx context.Context, id string) (*iapiserver.CanvasGetResponse, error) {
	c, err := s.store.Canvases().Get(ctx, id)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	return &iapiserver.CanvasGetResponse{Canvas: c}, nil
}

func (s *canvasService) CanvasGetMeta(ctx context.Context, id string) (*iapiserver.CanvasMetaResponse, error) {
	c, err := s.store.Canvases().Get(ctx, id)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	return &iapiserver.CanvasMetaResponse{
		ID:        c.ID,
		UpdatedAt: c.UpdatedAt.UnixMilli(),
		Title:     c.Title,
		Icon:      c.Icon,
		Kind:      c.Kind,
	}, nil
}

func (s *canvasService) CanvasUpdateMeta(ctx context.Context, req *iapiserver.CanvasMetaUpdateRequest) (*iapiserver.CanvasRecord, error) {
	c, err := s.store.Canvases().Get(ctx, req.ID)
	if err != nil {
		return nil, errors.WithStack(err)
	}

	if req.Title != nil {
		c.Title = *req.Title
	}
	if req.Icon != nil {
		c.Icon = *req.Icon
	}
	if req.Owner != nil {
		c.Owner = *req.Owner
	}
	if req.Color != nil {
		c.Color = *req.Color
	}
	if req.Pinned != nil {
		c.Pinned = *req.Pinned
	}
	if req.Project != nil {
		c.ProjectID = *req.Project
	}
	if req.BoardX != nil {
		c.BoardX = *req.BoardX
	}
	if req.BoardY != nil {
		c.BoardY = *req.BoardY
	}

	updated, err := s.store.Canvases().Update(ctx, c)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	return s.toCanvasRecord(updated), nil
}

func (s *canvasService) CanvasSave(ctx context.Context, req *iapiserver.CanvasSaveRequest) (*iapiserver.Canvas, error) {
	c, err := s.store.Canvases().Get(ctx, req.ID)
	if err != nil {
		return nil, errors.WithStack(err)
	}

	if req.BaseUpdatedAt > 0 && c.UpdatedAt.UnixMilli() > 0 && req.BaseUpdatedAt < c.UpdatedAt.UnixMilli() {
		return nil, errors.Errorf("canvas has been updated by another session, conflict detected")
	}

	c.Title = req.Title
	c.Icon = req.Icon
	if req.Kind != "" {
		c.Kind = req.Kind
	}
	c.Extend["nodes"] = req.Nodes
	c.Extend["connections"] = req.Connections
	c.Extend["viewport"] = req.Viewport
	c.Extend["logs"] = req.Logs
	c.Extend["settings"] = req.Settings

	updated, err := s.store.Canvases().Update(ctx, c)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	return updated, nil
}

func (s *canvasService) CanvasTouch(ctx context.Context, id string) (*iapiserver.CanvasTouchResponse, error) {
	c, err := s.store.Canvases().Get(ctx, id)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	updated, err := s.store.Canvases().Update(ctx, c)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	return &iapiserver.CanvasTouchResponse{
		Canvas:    s.toCanvasRecord(updated),
		UpdatedAt: updated.UpdatedAt.UnixMilli(),
	}, nil
}

func (s *canvasService) CanvasSoftDelete(ctx context.Context, id string) error {
	return s.store.Canvases().SoftDelete(ctx, id)
}

func (s *canvasService) CanvasRestore(ctx context.Context, id string) (*iapiserver.CanvasRestoreResponse, error) {
	if err := s.store.Canvases().Restore(ctx, id); err != nil {
		return nil, errors.WithStack(err)
	}
	c, err := s.store.Canvases().Get(ctx, id)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	return &iapiserver.CanvasRestoreResponse{Canvas: c}, nil
}

func (s *canvasService) CanvasPurge(ctx context.Context, id string) error {
	return s.store.Canvases().Purge(ctx, id)
}
