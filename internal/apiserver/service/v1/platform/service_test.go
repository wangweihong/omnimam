package platform

import (
	"testing"

	"github.com/wangweihong/omnimam/apis/iapiserver"
)

func TestParseNaturalAssetQueryImageSize(t *testing.T) {
	query := parseNaturalAssetQuery("搜索 1920x1680 的赛博朋克图片")
	if query.MediaType != iapiserver.AssetMediaTypeImage {
		t.Fatalf("media type = %s", query.MediaType)
	}
	if query.Width != 1920 || query.Height != 1680 {
		t.Fatalf("size = %dx%d", query.Width, query.Height)
	}
}

func TestParseNaturalAssetQueryPromptTemplate(t *testing.T) {
	query := parseNaturalAssetQuery("ideogram4 提示词模板")
	if query.MediaType != iapiserver.AssetMediaTypePromptTemplate {
		t.Fatalf("media type = %s", query.MediaType)
	}
}

func TestLocalObjectPathRejectsEscape(t *testing.T) {
	backend := &iapiserver.StorageBackend{Type: iapiserver.StorageBackendTypeLocal, Root: t.TempDir()}
	if _, err := localObjectPath(backend, "../secret.txt"); err == nil {
		t.Fatal("expected path escape to be rejected")
	}
	if _, err := localObjectPath(backend, "assets/file.txt"); err != nil {
		t.Fatalf("expected safe path: %v", err)
	}
}
