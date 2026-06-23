package platform

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/wangweihong/gotoolbox/pkg/errors"
	"github.com/wangweihong/omnimam/apis/iapiserver"
	"github.com/wangweihong/omnimam/apis/imachinery"
	"github.com/wangweihong/omnimam/internal/apiserver/store"
)

type PlatformSrv interface {
	Me(ctx context.Context) (*iapiserver.MeResponse, error)

	ProviderList(ctx context.Context, req *iapiserver.ProviderListRequest) (*iapiserver.ProviderListResponse, error)
	ProviderCreate(ctx context.Context, req *iapiserver.ProviderCreateRequest) (*iapiserver.Provider, error)
	ProviderUpdate(ctx context.Context, req *iapiserver.ProviderUpdateRequest) (*iapiserver.Provider, error)
	ProviderModelList(ctx context.Context, req *iapiserver.ProviderModelListRequest) (*iapiserver.ProviderModelListResponse, error)
	ProviderModelCreate(ctx context.Context, req *iapiserver.ProviderModelCreateRequest) (*iapiserver.ProviderModel, error)
	ProviderModelUpdate(ctx context.Context, req *iapiserver.ProviderModelUpdateRequest) (*iapiserver.ProviderModel, error)
	SystemLLMConfigList(ctx context.Context) (*iapiserver.SystemLLMConfigListResponse, error)
	SystemLLMConfigUpsert(ctx context.Context, req *iapiserver.SystemLLMConfigUpsertRequest) (*iapiserver.SystemLLMConfigListResponse, error)

	StorageBackendList(ctx context.Context, req *iapiserver.StorageBackendListRequest) (*iapiserver.StorageBackendListResponse, error)
	StorageBackendCreate(ctx context.Context, req *iapiserver.StorageBackendCreateRequest) (*iapiserver.StorageBackend, error)
	StorageBackendUpdate(ctx context.Context, req *iapiserver.StorageBackendUpdateRequest) (*iapiserver.StorageBackend, error)

	AssetUpload(ctx context.Context, file *multipart.FileHeader, tagNames []string, sourceType string) (*iapiserver.AssetUploadResponse, error)
	AssetList(ctx context.Context, req *iapiserver.AssetListRequest) (*iapiserver.AssetListResponse, error)
	AssetSearch(ctx context.Context, req *iapiserver.AssetSearchRequest) (*iapiserver.AssetListResponse, error)
	AssetSearchParse(ctx context.Context, req *iapiserver.AssetSearchParseRequest) (*iapiserver.AssetSearchParseResponse, error)
	AssetGet(ctx context.Context, id string) (*iapiserver.AssetRecord, error)
	AssetUpdate(ctx context.Context, req *iapiserver.AssetUpdateRequest) (*iapiserver.AssetRecord, error)
	AssetContentPath(ctx context.Context, id string) (string, string, error)
	AssetThumbnailPath(ctx context.Context, id string) (string, string, error)
	AssetGroupCreate(ctx context.Context, req *iapiserver.AssetGroupCreateRequest) (*iapiserver.AssetGroupCreateResponse, error)

	TaskList(ctx context.Context, req *iapiserver.TaskListRequest) (*iapiserver.TaskListResponse, error)
	TaskCreate(ctx context.Context, req *iapiserver.TaskCreateRequest) (*iapiserver.Task, error)
	TaskGet(ctx context.Context, id string) (*iapiserver.Task, error)
	TaskCancel(ctx context.Context, id string) (*iapiserver.TaskCancelResponse, error)
	TaskClaim(ctx context.Context, queue, worker string, limit int, lease time.Duration) ([]*iapiserver.Task, error)
	TaskUpdate(ctx context.Context, task *iapiserver.Task) (*iapiserver.Task, error)
}

type platformService struct {
	store store.Factory
}

func NewService(str store.Factory) *platformService {
	return &platformService{store: str}
}

func (s *platformService) Me(ctx context.Context) (*iapiserver.MeResponse, error) {
	flags, err := s.store.FeatureFlags().List(ctx)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	featureFlags := defaultFeatureFlags()
	for _, flag := range flags {
		if flag.Key != "" {
			featureFlags[flag.Key] = flag.Enabled
		}
	}
	permissions, err := s.store.Permissions().List(ctx)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	permissionKeys := defaultPermissions()
	for _, p := range permissions {
		if p.Key != "" {
			permissionKeys = appendUnique(permissionKeys, p.Key)
		}
	}
	return &iapiserver.MeResponse{
		User: iapiserver.MeUser{
			ID:   "system-admin",
			Name: "System Admin",
		},
		Roles:        []string{"admin"},
		Permissions:  permissionKeys,
		FeatureFlags: featureFlags,
	}, nil
}

func (s *platformService) ProviderList(ctx context.Context, req *iapiserver.ProviderListRequest) (*iapiserver.ProviderListResponse, error) {
	items, total, err := s.store.Providers().List(ctx, req)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	return &iapiserver.ProviderListResponse{ListRet: imachinery.ListRet{Total: total}, Providers: items}, nil
}

func (s *platformService) ProviderCreate(ctx context.Context, req *iapiserver.ProviderCreateRequest) (*iapiserver.Provider, error) {
	enabled := true
	if req.Enabled != nil {
		enabled = *req.Enabled
	}
	provider := &iapiserver.Provider{
		Type:          req.Type,
		Enabled:       enabled,
		BaseURL:       req.BaseURL,
		AuthType:      req.AuthType,
		CredentialRef: req.CredentialRef,
	}
	provider.Name = req.Name
	if provider.AuthType == "" && provider.CredentialRef != "" {
		provider.AuthType = iapiserver.ProviderAuthTypeAPIKey
	}
	if provider.Type == iapiserver.ProviderTypeDeepSeek && provider.BaseURL == "" {
		provider.BaseURL = "https://api.deepseek.com"
	}
	return s.store.Providers().Add(ctx, provider)
}

func (s *platformService) ProviderUpdate(ctx context.Context, req *iapiserver.ProviderUpdateRequest) (*iapiserver.Provider, error) {
	provider, err := s.store.Providers().Get(ctx, req.ID)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	if req.Name != nil {
		provider.Name = *req.Name
	}
	if req.Type != nil {
		provider.Type = *req.Type
	}
	if req.Enabled != nil {
		provider.Enabled = *req.Enabled
	}
	if req.BaseURL != nil {
		provider.BaseURL = *req.BaseURL
	}
	if req.AuthType != nil {
		provider.AuthType = *req.AuthType
	}
	if req.CredentialRef != nil {
		provider.CredentialRef = *req.CredentialRef
	}
	return s.store.Providers().Update(ctx, provider)
}

func (s *platformService) ProviderModelList(ctx context.Context, req *iapiserver.ProviderModelListRequest) (*iapiserver.ProviderModelListResponse, error) {
	items, total, err := s.store.ProviderModels().List(ctx, req)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	return &iapiserver.ProviderModelListResponse{ListRet: imachinery.ListRet{Total: total}, Models: items}, nil
}

func (s *platformService) ProviderModelCreate(ctx context.Context, req *iapiserver.ProviderModelCreateRequest) (*iapiserver.ProviderModel, error) {
	enabled := true
	if req.Enabled != nil {
		enabled = *req.Enabled
	}
	model := &iapiserver.ProviderModel{
		ProviderID:    req.ProviderID,
		Model:         req.Model,
		Capabilities:  req.Capabilities,
		Enabled:       enabled,
		DefaultParams: req.DefaultParams,
	}
	model.Name = req.Name
	return s.store.ProviderModels().Add(ctx, model)
}

func (s *platformService) ProviderModelUpdate(ctx context.Context, req *iapiserver.ProviderModelUpdateRequest) (*iapiserver.ProviderModel, error) {
	model, err := s.store.ProviderModels().Get(ctx, req.ID)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	if req.Name != nil {
		model.Name = *req.Name
	}
	if req.Model != nil {
		model.Model = *req.Model
	}
	if req.Capabilities != nil {
		model.Capabilities = *req.Capabilities
	}
	if req.Enabled != nil {
		model.Enabled = *req.Enabled
	}
	if req.DefaultParams != nil {
		model.DefaultParams = *req.DefaultParams
	}
	return s.store.ProviderModels().Update(ctx, model)
}

func (s *platformService) SystemLLMConfigList(ctx context.Context) (*iapiserver.SystemLLMConfigListResponse, error) {
	configs, err := s.store.SystemLLMConfigs().List(ctx)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	return &iapiserver.SystemLLMConfigListResponse{Configs: configs}, nil
}

func (s *platformService) SystemLLMConfigUpsert(ctx context.Context, req *iapiserver.SystemLLMConfigUpsertRequest) (*iapiserver.SystemLLMConfigListResponse, error) {
	for _, spec := range req.Configs {
		enabled := true
		if spec.Enabled != nil {
			enabled = *spec.Enabled
		}
		cfg := &iapiserver.SystemLLMConfig{
			Purpose:    spec.Purpose,
			ProviderID: spec.ProviderID,
			ModelID:    spec.ModelID,
			Model:      spec.Model,
			Enabled:    enabled,
		}
		cfg.Name = spec.Purpose
		if _, err := s.store.SystemLLMConfigs().Upsert(ctx, cfg); err != nil {
			return nil, errors.WithStack(err)
		}
	}
	return s.SystemLLMConfigList(ctx)
}

func (s *platformService) StorageBackendList(ctx context.Context, req *iapiserver.StorageBackendListRequest) (*iapiserver.StorageBackendListResponse, error) {
	items, total, err := s.store.StorageBackends().List(ctx, req)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	return &iapiserver.StorageBackendListResponse{ListRet: imachinery.ListRet{Total: total}, Backends: items}, nil
}

func (s *platformService) StorageBackendCreate(ctx context.Context, req *iapiserver.StorageBackendCreateRequest) (*iapiserver.StorageBackend, error) {
	enabled := true
	if req.Enabled != nil {
		enabled = *req.Enabled
	}
	readonly := false
	if req.Readonly != nil {
		readonly = *req.Readonly
	}
	backend := &iapiserver.StorageBackend{
		Type:     req.Type,
		Root:     req.Root,
		Config:   req.Config,
		Enabled:  enabled,
		Readonly: readonly,
		Quota:    req.Quota,
	}
	backend.Name = req.Name
	if backend.Type == iapiserver.StorageBackendTypeLocal {
		root, err := normalizeLocalRoot(backend.Root)
		if err != nil {
			return nil, err
		}
		backend.Root = root
	}
	return s.store.StorageBackends().Add(ctx, backend)
}

func (s *platformService) StorageBackendUpdate(ctx context.Context, req *iapiserver.StorageBackendUpdateRequest) (*iapiserver.StorageBackend, error) {
	backend, err := s.store.StorageBackends().Get(ctx, req.ID)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	if req.Name != nil {
		backend.Name = *req.Name
	}
	if req.Type != nil {
		backend.Type = *req.Type
	}
	if req.Root != nil {
		backend.Root = *req.Root
	}
	if req.Config != nil {
		backend.Config = *req.Config
	}
	if req.Enabled != nil {
		backend.Enabled = *req.Enabled
	}
	if req.Readonly != nil {
		backend.Readonly = *req.Readonly
	}
	if req.Quota != nil {
		backend.Quota = *req.Quota
	}
	if backend.Type == iapiserver.StorageBackendTypeLocal {
		root, err := normalizeLocalRoot(backend.Root)
		if err != nil {
			return nil, err
		}
		backend.Root = root
	}
	return s.store.StorageBackends().Update(ctx, backend)
}

func (s *platformService) AssetUpload(ctx context.Context, fileHeader *multipart.FileHeader, tagNames []string, sourceType string) (*iapiserver.AssetUploadResponse, error) {
	backend, err := s.ensureDefaultLocalBackend(ctx)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	assetID := uuid.New().String()
	filename := filepath.Base(fileHeader.Filename)
	objectKey := filepath.ToSlash(filepath.Join("assets", time.Now().Format("2006/01"), assetID, filename))
	absPath, err := localObjectPath(backend, objectKey)
	if err != nil {
		return nil, err
	}
	if err := os.MkdirAll(filepath.Dir(absPath), 0750); err != nil {
		return nil, errors.WithStack(err)
	}

	src, err := fileHeader.Open()
	if err != nil {
		return nil, errors.WithStack(err)
	}
	defer src.Close()
	dst, err := os.Create(absPath)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	defer dst.Close()

	hasher := sha256.New()
	head := make([]byte, 512)
	n, readErr := src.Read(head)
	if readErr != nil && readErr != io.EOF {
		return nil, errors.WithStack(readErr)
	}
	mimeType := http.DetectContentType(head[:n])
	w := io.MultiWriter(dst, hasher)
	if n > 0 {
		if _, err := w.Write(head[:n]); err != nil {
			return nil, errors.WithStack(err)
		}
	}
	size, err := io.Copy(w, src)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	size += int64(n)
	checksum := hex.EncodeToString(hasher.Sum(nil))

	mediaType, format := mediaTypeFromFile(mimeType, filename)
	width, height := imageDimensions(absPath)
	if sourceType == "" {
		sourceType = iapiserver.AssetSourceUserUpload
	}
	asset := &iapiserver.Asset{
		MediaType:        mediaType,
		MimeType:         mimeType,
		StorageBackendID: backend.ID,
		ObjectKey:        objectKey,
		Size:             size,
		Checksum:         checksum,
		Width:            width,
		Height:           height,
		Format:           format,
		SourceType:       sourceType,
		Metadata: map[string]any{
			"filename": filename,
		},
	}
	asset.ID = assetID
	asset.Name = safeObjectName(filename, "asset")
	created, err := s.store.AssetsV2().Add(ctx, asset)
	if err != nil {
		return nil, errors.WithStack(err)
	}

	thumbnail := &iapiserver.AssetThumbnail{
		AssetID:          created.ID,
		StorageBackendID: backend.ID,
		Status:           thumbnailInitialStatus(mediaType),
	}
	thumbnail.Name = safeObjectName(created.ID+"-thumbnail", "thumbnail")
	thumb, err := s.store.AssetThumbnails().Add(ctx, thumbnail)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	if len(tagNames) > 0 {
		if err := s.replaceAssetTags(ctx, created.ID, tagNames, iapiserver.TagSourceUser); err != nil {
			return nil, err
		}
	}

	probeTask, err := s.enqueueTask(ctx, iapiserver.TaskTypeAssetProbe, map[string]any{"asset_id": created.ID})
	if err != nil {
		return nil, err
	}
	thumbTask, err := s.enqueueTask(ctx, iapiserver.TaskTypeAssetThumbnail, map[string]any{"asset_id": created.ID, "thumbnail_id": thumb.ID})
	if err != nil {
		return nil, err
	}
	record, err := s.assetRecord(ctx, created)
	if err != nil {
		return nil, err
	}
	return &iapiserver.AssetUploadResponse{Asset: record, Tasks: []*iapiserver.Task{probeTask, thumbTask}}, nil
}

func (s *platformService) AssetList(ctx context.Context, req *iapiserver.AssetListRequest) (*iapiserver.AssetListResponse, error) {
	items, total, err := s.store.AssetsV2().List(ctx, req)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	records, err := s.assetRecords(ctx, items)
	if err != nil {
		return nil, err
	}
	return &iapiserver.AssetListResponse{ListRet: imachinery.ListRet{Total: total}, Assets: records}, nil
}

func (s *platformService) AssetSearch(ctx context.Context, req *iapiserver.AssetSearchRequest) (*iapiserver.AssetListResponse, error) {
	return s.AssetList(ctx, &req.Query)
}

func (s *platformService) AssetSearchParse(ctx context.Context, req *iapiserver.AssetSearchParseRequest) (*iapiserver.AssetSearchParseResponse, error) {
	query := parseNaturalAssetQuery(req.Text)
	task, err := s.enqueueTask(ctx, iapiserver.TaskTypeQueryParse, map[string]any{"text": req.Text, "fallback_query": query})
	if err != nil {
		return nil, errors.WithStack(err)
	}
	return &iapiserver.AssetSearchParseResponse{Query: query, TaskID: task.ID}, nil
}

func (s *platformService) AssetGet(ctx context.Context, id string) (*iapiserver.AssetRecord, error) {
	asset, err := s.store.AssetsV2().Get(ctx, id)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	return s.assetRecord(ctx, asset)
}

func (s *platformService) AssetUpdate(ctx context.Context, req *iapiserver.AssetUpdateRequest) (*iapiserver.AssetRecord, error) {
	asset, err := s.store.AssetsV2().Get(ctx, req.ID)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	if req.Name != nil {
		asset.Name = *req.Name
	}
	if req.SourceType != nil {
		asset.SourceType = *req.SourceType
	}
	if req.SourceRef != nil {
		asset.SourceRef = *req.SourceRef
	}
	if req.Metadata != nil {
		asset.Metadata = *req.Metadata
	}
	if req.Description != nil {
		asset.Description = *req.Description
	}
	updated, err := s.store.AssetsV2().Update(ctx, asset)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	if req.TagNames != nil {
		source := req.TagSource
		if source == "" {
			source = iapiserver.TagSourceUser
		}
		if err := s.replaceAssetTags(ctx, updated.ID, *req.TagNames, source); err != nil {
			return nil, err
		}
	}
	return s.assetRecord(ctx, updated)
}

func (s *platformService) AssetContentPath(ctx context.Context, id string) (string, string, error) {
	asset, err := s.store.AssetsV2().Get(ctx, id)
	if err != nil {
		return "", "", errors.WithStack(err)
	}
	backend, err := s.store.StorageBackends().Get(ctx, asset.StorageBackendID)
	if err != nil {
		return "", "", errors.WithStack(err)
	}
	path, err := localObjectPath(backend, asset.ObjectKey)
	if err != nil {
		return "", "", err
	}
	return path, asset.MimeType, nil
}

func (s *platformService) AssetThumbnailPath(ctx context.Context, id string) (string, string, error) {
	thumb, err := s.store.AssetThumbnails().GetByAsset(ctx, id)
	if err != nil {
		return "", "", errors.WithStack(err)
	}
	if thumb.Status != iapiserver.ThumbnailStatusReady || thumb.ObjectKey == "" {
		return "", "", errors.Errorf("thumbnail is not ready")
	}
	backend, err := s.store.StorageBackends().Get(ctx, thumb.StorageBackendID)
	if err != nil {
		return "", "", errors.WithStack(err)
	}
	path, err := localObjectPath(backend, thumb.ObjectKey)
	if err != nil {
		return "", "", err
	}
	return path, thumb.MimeType, nil
}

func (s *platformService) AssetGroupCreate(ctx context.Context, req *iapiserver.AssetGroupCreateRequest) (*iapiserver.AssetGroupCreateResponse, error) {
	groupType := req.Type
	if groupType == "" {
		groupType = iapiserver.AssetGroupTypeCollection
	}
	group := &iapiserver.AssetGroup{Type: groupType, DynamicRule: req.DynamicRule}
	group.Name = req.Name
	group.Description = req.Description
	created, err := s.store.AssetGroups().Add(ctx, group)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	members := make([]*iapiserver.AssetGroupMember, 0, len(req.AssetIDs))
	for _, assetID := range req.AssetIDs {
		member := &iapiserver.AssetGroupMember{GroupID: created.ID, AssetID: assetID}
		member.Name = "group-member"
		members = append(members, member)
	}
	createdMembers, err := s.store.AssetGroupMembers().BatchAdd(ctx, members)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	return &iapiserver.AssetGroupCreateResponse{Group: created, Members: createdMembers}, nil
}

func (s *platformService) TaskList(ctx context.Context, req *iapiserver.TaskListRequest) (*iapiserver.TaskListResponse, error) {
	tasks, total, err := s.store.Tasks().List(ctx, req)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	return &iapiserver.TaskListResponse{ListRet: imachinery.ListRet{Total: total}, Tasks: tasks}, nil
}

func (s *platformService) TaskCreate(ctx context.Context, req *iapiserver.TaskCreateRequest) (*iapiserver.Task, error) {
	task := &iapiserver.Task{
		Type:           req.Type,
		Priority:       req.Priority,
		Queue:          req.Queue,
		Input:          req.Input,
		MaxAttempts:    req.MaxAttempts,
		IdempotencyKey: req.IdempotencyKey,
	}
	task.Name = req.Name
	if task.Name == "" {
		task.Name = strings.ReplaceAll(req.Type, ".", "-")
	}
	return s.store.Tasks().Add(ctx, task)
}

func (s *platformService) TaskGet(ctx context.Context, id string) (*iapiserver.Task, error) {
	return s.store.Tasks().Get(ctx, id)
}

func (s *platformService) TaskCancel(ctx context.Context, id string) (*iapiserver.TaskCancelResponse, error) {
	task, err := s.store.Tasks().Cancel(ctx, id)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	return &iapiserver.TaskCancelResponse{Task: task}, nil
}

func (s *platformService) TaskClaim(ctx context.Context, queue, worker string, limit int, lease time.Duration) ([]*iapiserver.Task, error) {
	return s.store.Tasks().Claim(ctx, queue, worker, limit, lease)
}

func (s *platformService) TaskUpdate(ctx context.Context, task *iapiserver.Task) (*iapiserver.Task, error) {
	return s.store.Tasks().Update(ctx, task)
}

func (s *platformService) ensureDefaultLocalBackend(ctx context.Context) (*iapiserver.StorageBackend, error) {
	backend, err := s.store.StorageBackends().GetDefaultLocal(ctx)
	if err == nil {
		return backend, nil
	}
	root, err := normalizeLocalRoot("")
	if err != nil {
		return nil, err
	}
	backend = &iapiserver.StorageBackend{
		Type:    iapiserver.StorageBackendTypeLocal,
		Root:    root,
		Enabled: true,
	}
	backend.Name = "default-local"
	return s.store.StorageBackends().Add(ctx, backend)
}

func (s *platformService) assetRecord(ctx context.Context, asset *iapiserver.Asset) (*iapiserver.AssetRecord, error) {
	records, err := s.assetRecords(ctx, []*iapiserver.Asset{asset})
	if err != nil {
		return nil, err
	}
	if len(records) == 0 {
		return nil, errors.Errorf("asset record not found")
	}
	return records[0], nil
}

func (s *platformService) assetRecords(ctx context.Context, assets []*iapiserver.Asset) ([]*iapiserver.AssetRecord, error) {
	ids := make([]string, 0, len(assets))
	for _, asset := range assets {
		ids = append(ids, asset.ID)
	}
	thumbnails, err := s.store.AssetThumbnails().ListByAssetIDs(ctx, ids)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	thumbnailMap := map[string]*iapiserver.AssetThumbnail{}
	for _, thumbnail := range thumbnails {
		thumbnailMap[thumbnail.AssetID] = thumbnail
	}
	tagMap, err := s.store.Tags().ListByAssetIDs(ctx, ids)
	if err != nil {
		return nil, errors.WithStack(err)
	}
	records := make([]*iapiserver.AssetRecord, 0, len(assets))
	for _, asset := range assets {
		records = append(records, &iapiserver.AssetRecord{
			Asset:     asset,
			Thumbnail: thumbnailMap[asset.ID],
			Tags:      tagMap[asset.ID],
		})
	}
	return records, nil
}

func (s *platformService) replaceAssetTags(ctx context.Context, assetID string, tagNames []string, source string) error {
	tags := make([]*iapiserver.Tag, 0, len(tagNames))
	for _, name := range tagNames {
		name = strings.TrimSpace(name)
		if name == "" {
			continue
		}
		tag := &iapiserver.Tag{Source: source}
		tag.Name = name
		created, err := s.store.Tags().FirstOrCreate(ctx, tag)
		if err != nil {
			return errors.WithStack(err)
		}
		tags = append(tags, created)
	}
	return s.store.AssetTags().Replace(ctx, assetID, tags, source)
}

func (s *platformService) enqueueTask(ctx context.Context, taskType string, input map[string]any) (*iapiserver.Task, error) {
	task := &iapiserver.Task{
		Type:        taskType,
		Status:      iapiserver.TaskStatusPending,
		Queue:       "default",
		Input:       input,
		MaxAttempts: 3,
	}
	task.Name = strings.ReplaceAll(taskType, ".", "-")
	return s.store.Tasks().Add(ctx, task)
}

func defaultFeatureFlags() map[string]bool {
	return map[string]bool{
		"provider.deepseek":   true,
		"asset.upload":        true,
		"asset.smart_tagging": true,
		"asset.thumbnail":     true,
		"asset.search.parse":  true,
		"canvas.classic":      true,
		"canvas.smart":        true,
		"canvas.execute":      true,
		"task.async":          true,
		"storage.local":       true,
	}
}

func defaultPermissions() []string {
	return []string{
		"asset.create",
		"asset.read",
		"asset.update",
		"asset.delete",
		"asset.search",
		"asset.group.create",
		"provider.manage",
		"storage.manage",
		"task.create",
		"task.read",
		"task.cancel",
		"canvas.read",
		"canvas.write",
		"canvas.execute",
		"feature.manage",
	}
}

func appendUnique(items []string, item string) []string {
	for _, existing := range items {
		if existing == item {
			return items
		}
	}
	return append(items, item)
}

func normalizeLocalRoot(root string) (string, error) {
	if root == "" {
		root = os.Getenv("OMNIMAM_STORAGE_ROOT")
	}
	if root == "" {
		root = filepath.Join("data", "assets")
	}
	abs, err := filepath.Abs(root)
	if err != nil {
		return "", errors.WithStack(err)
	}
	return filepath.Clean(abs), nil
}

func localObjectPath(backend *iapiserver.StorageBackend, objectKey string) (string, error) {
	if backend.Type != iapiserver.StorageBackendTypeLocal {
		return "", errors.Errorf("storage backend %s is not local", backend.ID)
	}
	root, err := normalizeLocalRoot(backend.Root)
	if err != nil {
		return "", err
	}
	cleanKey := filepath.Clean(filepath.FromSlash(objectKey))
	if filepath.IsAbs(cleanKey) || strings.HasPrefix(cleanKey, ".."+string(filepath.Separator)) || cleanKey == ".." {
		return "", errors.Errorf("invalid object key")
	}
	path := filepath.Join(root, cleanKey)
	rel, err := filepath.Rel(root, path)
	if err != nil {
		return "", errors.WithStack(err)
	}
	if strings.HasPrefix(rel, ".."+string(filepath.Separator)) || rel == ".." {
		return "", errors.Errorf("object key escapes storage root")
	}
	return path, nil
}

func mediaTypeFromFile(mimeType string, filename string) (string, string) {
	ext := strings.TrimPrefix(strings.ToLower(filepath.Ext(filename)), ".")
	switch {
	case strings.HasPrefix(mimeType, "image/"):
		return iapiserver.AssetMediaTypeImage, ext
	case strings.HasPrefix(mimeType, "video/"):
		return iapiserver.AssetMediaTypeVideo, ext
	case strings.HasPrefix(mimeType, "audio/"):
		return iapiserver.AssetMediaTypeAudio, ext
	case mimeType == "application/pdf" || ext == "pdf":
		return iapiserver.AssetMediaTypePDF, ext
	case ext == "json":
		return iapiserver.AssetMediaTypeJSON, ext
	case ext == "md" || ext == "markdown":
		return iapiserver.AssetMediaTypeMarkdown, ext
	case strings.HasPrefix(mimeType, "text/"):
		return iapiserver.AssetMediaTypeText, ext
	default:
		return iapiserver.AssetMediaTypeOther, ext
	}
}

func imageDimensions(path string) (int, int) {
	file, err := os.Open(path)
	if err != nil {
		return 0, 0
	}
	defer file.Close()
	cfg, _, err := image.DecodeConfig(file)
	if err != nil {
		return 0, 0
	}
	return cfg.Width, cfg.Height
}

func thumbnailInitialStatus(mediaType string) string {
	switch mediaType {
	case iapiserver.AssetMediaTypeImage, iapiserver.AssetMediaTypeVideo, iapiserver.AssetMediaTypePDF:
		return iapiserver.ThumbnailStatusPending
	default:
		return iapiserver.ThumbnailStatusUnsupported
	}
}

func parseNaturalAssetQuery(text string) iapiserver.AssetListRequest {
	lower := strings.ToLower(text)
	query := iapiserver.AssetListRequest{}
	switch {
	case strings.Contains(text, "图片") || strings.Contains(lower, "image"):
		query.MediaType = iapiserver.AssetMediaTypeImage
	case strings.Contains(text, "视频") || strings.Contains(lower, "video"):
		query.MediaType = iapiserver.AssetMediaTypeVideo
	case strings.Contains(text, "音频") || strings.Contains(lower, "audio"):
		query.MediaType = iapiserver.AssetMediaTypeAudio
	case strings.Contains(lower, "pdf"):
		query.MediaType = iapiserver.AssetMediaTypePDF
	case strings.Contains(lower, "json"):
		query.MediaType = iapiserver.AssetMediaTypeJSON
	case strings.Contains(lower, "markdown") || strings.Contains(lower, ".md"):
		query.MediaType = iapiserver.AssetMediaTypeMarkdown
	}
	if strings.Contains(lower, "prompt") || strings.Contains(text, "提示词") {
		query.MediaType = iapiserver.AssetMediaTypePrompt
	}
	if strings.Contains(lower, "template") || strings.Contains(text, "模板") || strings.Contains(lower, "ideogram4") {
		query.MediaType = iapiserver.AssetMediaTypePromptTemplate
	}
	re := regexp.MustCompile(`(\d{2,5})\s*[x×*]\s*(\d{2,5})`)
	if match := re.FindStringSubmatch(text); len(match) == 3 {
		_, _ = fmt.Sscanf(match[1], "%d", &query.Width)
		_, _ = fmt.Sscanf(match[2], "%d", &query.Height)
	}
	resolutionRe := regexp.MustCompile(`(?i)(480|720|1080|1440|2160)p`)
	if match := resolutionRe.FindStringSubmatch(text); len(match) == 2 && query.MediaType == iapiserver.AssetMediaTypeVideo {
		_, _ = fmt.Sscanf(match[1], "%d", &query.Height)
	}
	query.Keyword = strings.TrimSpace(text)
	return query
}

func safeObjectName(name, fallback string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		name = fallback
	}
	name = strings.ReplaceAll(name, "\x00", "")
	if len([]rune(name)) <= 60 {
		return name
	}
	runes := []rune(name)
	return string(runes[:60])
}
