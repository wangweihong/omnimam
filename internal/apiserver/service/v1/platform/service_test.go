package platform

import (
	"testing"

	"github.com/wangweihong/omnimam/apis/iapiserver"
	"github.com/wangweihong/omnimam/apis/imachinery"
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

func TestParseNaturalAssetQueryDeletedStatus(t *testing.T) {
	query := parseNaturalAssetQuery("搜索回收站里已删除的图片")
	if query.MediaType != iapiserver.AssetMediaTypeImage {
		t.Fatalf("media type = %s", query.MediaType)
	}
	if query.Status != "deleted" {
		t.Fatalf("status = %q", query.Status)
	}
}

func TestAssetListRequestPostBindSplitsTags(t *testing.T) {
	query := &iapiserver.AssetListRequest{
		BasicQueryParam: imachinery.BasicQueryParam{SearchFields: []string{"name,description"}},
		Tags:            []string{"portrait, training；lora"},
		Status:          " Deleted ",
	}
	if err := query.PostBind(); err != nil {
		t.Fatalf("post bind: %v", err)
	}
	if len(query.Tags) != 3 || query.Tags[0] != "portrait" || query.Tags[2] != "lora" {
		t.Fatalf("tags = %#v", query.Tags)
	}
	if len(query.SearchFields) != 2 || query.SearchFields[1] != "description" {
		t.Fatalf("search fields = %#v", query.SearchFields)
	}
	if query.Status != "deleted" {
		t.Fatalf("status = %q", query.Status)
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
