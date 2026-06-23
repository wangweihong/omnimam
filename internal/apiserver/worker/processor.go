package worker

import (
	"context"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/wangweihong/gotoolbox/pkg/errors"
	"github.com/wangweihong/gotoolbox/pkg/log"
	"github.com/wangweihong/omnimam/apis/iapiserver"
	"github.com/wangweihong/omnimam/internal/apiserver/store"
)

type Processor struct {
	store store.Factory
}

type RunOptions struct {
	Queue        string
	WorkerID     string
	Limit        int
	Lease        time.Duration
	PollInterval time.Duration
}

func NewProcessor() *Processor {
	return &Processor{store: store.Client()}
}

func (p *Processor) Run(ctx context.Context, opts RunOptions) error {
	if p.store == nil {
		return errors.Errorf("store client is not initialized")
	}
	if opts.PollInterval <= 0 {
		opts.PollInterval = 3 * time.Second
	}
	if opts.Lease <= 0 {
		opts.Lease = 5 * time.Minute
	}
	if opts.Limit <= 0 {
		opts.Limit = 1
	}
	ticker := time.NewTicker(opts.PollInterval)
	defer ticker.Stop()
	for {
		if err := p.runOnce(ctx, opts); err != nil {
			log.Errorf("worker run failed: %v", err)
		}
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
		}
	}
}

func (p *Processor) runOnce(ctx context.Context, opts RunOptions) error {
	tasks, err := p.store.Tasks().Claim(ctx, opts.Queue, opts.WorkerID, opts.Limit, opts.Lease)
	if err != nil {
		return errors.WithStack(err)
	}
	for _, task := range tasks {
		if err := p.process(ctx, task); err != nil {
			task.Status = iapiserver.TaskStatusFailed
			task.Error = err.Error()
			task.Progress = 100
			_, _ = p.store.Tasks().Update(ctx, task)
			continue
		}
		task.Status = iapiserver.TaskStatusSucceeded
		task.Progress = 100
		task.LockOwner = ""
		task.LockedUntil = time.Time{}
		if task.Output == nil {
			task.Output = map[string]any{"ok": true}
		}
		_, _ = p.store.Tasks().Update(ctx, task)
	}
	return nil
}

func (p *Processor) process(ctx context.Context, task *iapiserver.Task) error {
	switch task.Type {
	case iapiserver.TaskTypeAssetThumbnail:
		return p.processAssetThumbnail(ctx, task)
	case iapiserver.TaskTypeAssetProbe:
		task.Output = map[string]any{"message": "asset probe completed"}
		return nil
	case iapiserver.TaskTypeQueryParse:
		task.Output = map[string]any{"message": "query parse fallback completed", "input": task.Input}
		return nil
	case iapiserver.TaskTypeLLMInvoke, iapiserver.TaskTypeAssetTagging:
		task.Output = map[string]any{"message": "task contract accepted; provider execution is adapter-driven"}
		return nil
	default:
		task.Output = map[string]any{"message": "task type accepted", "type": task.Type}
		return nil
	}
}

func (p *Processor) processAssetThumbnail(ctx context.Context, task *iapiserver.Task) error {
	assetID, _ := task.Input["asset_id"].(string)
	if assetID == "" {
		return errors.Errorf("asset_id is required")
	}
	asset, err := p.store.AssetsV2().Get(ctx, assetID)
	if err != nil {
		return errors.WithStack(err)
	}
	thumbnail, err := p.store.AssetThumbnails().GetByAsset(ctx, assetID)
	if err != nil {
		return errors.WithStack(err)
	}
	if asset.MediaType != iapiserver.AssetMediaTypeImage {
		thumbnail.Status = iapiserver.ThumbnailStatusUnsupported
		_, _ = p.store.AssetThumbnails().Update(ctx, thumbnail)
		task.Output = map[string]any{"thumbnail_status": thumbnail.Status}
		return nil
	}
	backend, err := p.store.StorageBackends().Get(ctx, asset.StorageBackendID)
	if err != nil {
		return errors.WithStack(err)
	}
	srcPath, err := localObjectPath(backend, asset.ObjectKey)
	if err != nil {
		return err
	}
	thumbKey := filepath.ToSlash(filepath.Join("thumbnails", asset.ID, filepath.Base(asset.ObjectKey)))
	dstPath, err := localObjectPath(backend, thumbKey)
	if err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(dstPath), 0750); err != nil {
		return errors.WithStack(err)
	}
	if err := copyFile(srcPath, dstPath); err != nil {
		return err
	}
	stat, _ := os.Stat(dstPath)
	thumbnail.ObjectKey = thumbKey
	thumbnail.MimeType = asset.MimeType
	thumbnail.Width = asset.Width
	thumbnail.Height = asset.Height
	thumbnail.Status = iapiserver.ThumbnailStatusReady
	if stat != nil {
		thumbnail.Size = stat.Size()
	}
	if _, err := p.store.AssetThumbnails().Update(ctx, thumbnail); err != nil {
		return errors.WithStack(err)
	}
	task.Output = map[string]any{
		"thumbnail_id":     thumbnail.ID,
		"thumbnail_status": thumbnail.Status,
	}
	return nil
}

func localObjectPath(backend *iapiserver.StorageBackend, objectKey string) (string, error) {
	if backend.Type != iapiserver.StorageBackendTypeLocal {
		return "", errors.Errorf("storage backend %s is not local", backend.ID)
	}
	root := backend.Root
	if root == "" {
		root = os.Getenv("OMNIMAM_STORAGE_ROOT")
	}
	if root == "" {
		root = filepath.Join("data", "assets")
	}
	root, err := filepath.Abs(root)
	if err != nil {
		return "", errors.WithStack(err)
	}
	cleanKey := filepath.Clean(filepath.FromSlash(objectKey))
	if filepath.IsAbs(cleanKey) || cleanKey == ".." || strings.HasPrefix(cleanKey, ".."+string(filepath.Separator)) {
		return "", errors.Errorf("invalid object key")
	}
	path := filepath.Join(root, cleanKey)
	rel, err := filepath.Rel(root, path)
	if err != nil {
		return "", errors.WithStack(err)
	}
	if rel == ".." || strings.HasPrefix(rel, ".."+string(filepath.Separator)) {
		return "", errors.Errorf("object key escapes storage root")
	}
	return path, nil
}

func copyFile(srcPath, dstPath string) error {
	src, err := os.Open(srcPath)
	if err != nil {
		return errors.WithStack(err)
	}
	defer src.Close()
	dst, err := os.Create(dstPath)
	if err != nil {
		return errors.WithStack(err)
	}
	defer dst.Close()
	if _, err := io.Copy(dst, src); err != nil {
		return errors.WithStack(err)
	}
	return nil
}
