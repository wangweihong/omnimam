package integration_test

import (
	"context"

	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"os"

	"github.com/gin-gonic/gin"
	. "github.com/smartystreets/goconvey/convey"
	"github.com/wangweihong/gotoolbox/pkg/errors"
	"github.com/wangweihong/gotoolbox/pkg/httpcli"
	"github.com/wangweihong/gotoolbox/pkg/json"

	"github.com/wangweihong/omnimam/apis/iapiserver"
	"github.com/wangweihong/omnimam/internal/apiserver"
	"github.com/wangweihong/omnimam/internal/apiserver/store"
)

func TestServiceProviderAdd_InvalidEndpoint_Integration(t *testing.T) {
	Convey("TestServiceProviderAdd_InvalidEndpoint_Integration", t, func() {
		errors.UpdateModuleInfo(errors.NewModuleGetter("github.com/wangweihong/omnimam", "127.0.01", 12345))

		var storeIns store.Factory
		//	storeIns = startTestDB(t)
		router := gin.Default()
		rg := router.Group("/v1/omnimam")
		apiserver.InstallSettingApis(rg, storeIns)

		b, err := os.ReadFile("./testdata/sp_metadata.xml")
		So(err, ShouldBeNil)
		d := map[string]any{
			"name":     "sp1",
			"protocol": "saml",
			"enable":   false,
			"endpoint": "10.30.100.190",
			"saml": map[string]any{
				"metadata": string(b),
			},
		}

		req, err := httpcli.NewHttpRequestBuilder().
			POST().
			WithEndpoint("127.0.0.1:8080").
			WithPath("/v1/omnimam/setting/sso/app/sp/add").
			WithBody("", d).Build().ConvertRequestWithContext(context.Background())
		So(err, ShouldBeNil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		fmt.Println(string(w.Body.Bytes()))

		So(w.Code, ShouldNotEqual, http.StatusOK)
	})
}

func TestServiceProviderAdd_Integration(t *testing.T) {
	Convey("TestServiceProviderAdd_Integration", t, func() {

		var storeIns store.Factory
		storeIns = startTestDB(t)
		router := gin.Default()
		rg := router.Group("/v1/omnimam")
		apiserver.InstallSettingApis(rg, storeIns)

		b, err := os.ReadFile("./testdata/sp_metadata.xml")
		So(err, ShouldBeNil)
		d := map[string]any{
			"name":     "sp1",
			"protocol": "saml",
			"enable":   false,
			"endpoint": "https://10.30.100.190",
			"saml": map[string]any{
				"metadata": string(b),
			},
		}

		req, err := httpcli.NewHttpRequestBuilder().
			POST().
			WithEndpoint("127.0.0.1:8080").
			WithPath("/v1/omnimam/setting/sso/app/sp/add").
			WithBody("", d).Build().ConvertRequestWithContext(context.Background())
		So(err, ShouldBeNil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		fmt.Println(string(w.Body.Bytes()))

		So(w.Code, ShouldEqual, http.StatusOK)

		resp := iapiserver.ServiceProviderAddResponse{}
		err = json.Unmarshal(w.Body.Bytes(), &resp)
		So(err, ShouldBeNil)
		So(resp.ID, ShouldNotBeEmpty)
		So(resp.Name, ShouldEqual, "sp1")

		apiserver, err := storeIns.ServiceProviders().Get(context.Background(), resp.ID)
		So(err, ShouldBeNil)
		So(apiserver.Name, ShouldEqual, "sp1")

	})
}
