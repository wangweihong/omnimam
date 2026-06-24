package platform

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/wangweihong/gotoolbox/pkg/errors"
	"k8s.io/gengo/examples/set-gen/sets"

	"github.com/wangweihong/omnimam/apis/iapiserver"
	"github.com/wangweihong/omnimam/apis/imachinery"
	"github.com/wangweihong/omnimam/internal/pkg/code"
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

func TestFetchOpenAICompatibleModels(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1/models" {
			t.Fatalf("path = %s", r.URL.Path)
		}
		if got := r.Header.Get("Authorization"); got != "Bearer secret" {
			t.Fatalf("authorization = %q", got)
		}
		_, _ = w.Write([]byte(`{"data":[{"id":"z-model"},{"id":"a-model"}]}`))
	}))
	defer server.Close()

	models, err := fetchOpenAICompatibleModels(context.Background(), &iapiserver.Provider{
		Type:          iapiserver.ProviderTypeOpenAICompatible,
		BaseURL:       server.URL,
		CredentialRef: "secret,backup",
	})
	if err != nil {
		t.Fatalf("fetch models: %v", err)
	}
	if len(models) != 2 || models[0] != "a-model" || models[1] != "z-model" {
		t.Fatalf("models = %#v", models)
	}
}

func TestFetchOpenAICompatibleModelsUnauthorized(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
	}))
	defer server.Close()

	_, err := fetchOpenAICompatibleModels(context.Background(), &iapiserver.Provider{
		Type:    iapiserver.ProviderTypeOpenAICompatible,
		BaseURL: server.URL,
	})
	if err == nil {
		t.Fatal("expected unauthorized error")
	}
	if status := errors.ToStatus(err); status.Code != code.ErrProviderUnauthorized ||
		status.HTTPStatus != http.StatusUnauthorized {
		t.Fatalf("status = %#v", status)
	}
}

func TestProviderPresetsIncludeAPISettings(t *testing.T) {
	presets := providerPresets()
	if len(presets) < 4 {
		t.Fatalf("preset count = %d", len(presets))
	}
	seen := map[string]bool{}
	for _, preset := range presets {
		seen[preset.Key] = true
		if preset.Name == "" || preset.Type == "" || preset.BaseURL == "" || preset.AuthType == "" {
			t.Fatalf("incomplete preset = %#v", preset)
		}
		if len(preset.APISettingsSchema) == 0 {
			t.Fatalf("missing api setting schema for %s", preset.Key)
		}
	}
	for _, key := range []string{"deepseek", "qwen", "openrouter", "siliconflow"} {
		if !seen[key] {
			t.Fatalf("missing preset %s", key)
		}
	}
}

func TestApplyPresetModelDefaults(t *testing.T) {
	provider := &iapiserver.Provider{PresetKey: "qwen"}
	provider.Name = "通义千问"

	tests := []struct {
		name         string
		model        string
		modelType    string
		endpointType string
	}{
		{name: "vision model", model: "qwen-vl-max", modelType: "vision", endpointType: "chat"},
		{name: "reasoning model", model: "qwq-plus", modelType: "reasoning", endpointType: "chat"},
		{name: "embedding model", model: "text-embedding-v3", modelType: "embedding", endpointType: "embeddings"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			model := &iapiserver.ProviderModel{Model: tt.model}
			if !applyPresetModelDefaults(provider, model) {
				t.Fatal("expected defaults to change model")
			}
			if model.GroupName != "qwen" {
				t.Fatalf("group name = %q", model.GroupName)
			}
			if model.EndpointType != tt.endpointType {
				t.Fatalf("endpoint type = %q", model.EndpointType)
			}
			if !sets.NewString(model.ModelTypes...).Has(tt.modelType) {
				t.Fatalf("model types = %#v", model.ModelTypes)
			}
		})
	}
}
