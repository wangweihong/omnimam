package integration_test

import (
	"context"
	"io/ioutil"
	"os"

	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	. "github.com/smartystreets/goconvey/convey"
	"github.com/wangweihong/gotoolbox/pkg/httpcli"
	"github.com/wangweihong/gotoolbox/pkg/httpcli/def"
	"github.com/wangweihong/gotoolbox/pkg/json"

	"github.com/wangweihong/omnimam/apis/iapiserver"
	"github.com/wangweihong/omnimam/internal/apiserver"
	"github.com/wangweihong/omnimam/internal/apiserver/store"
	"github.com/wangweihong/omnimam/pkg/httpform"
)

func TestSSOIdentityProviderMetadataGenerate_Integration(t *testing.T) {
	Convey("TestSSOIdentityProviderMetadataGenerate_Integration", t, func() {
		var storeIns store.Factory
		storeIns = startTestDB(t)

		router := gin.Default()
		rg := router.Group("/v1/omnimam")
		apiserver.InstallMiddleware(router)
		apiserver.InstallSettingApis(rg, storeIns)

		d := &iapiserver.IdentityProviderMetadataUpsetRequest{}
		d.Endpoint = "http://10.30.100.190"
		d.RedirectSSOFrontendURL = "/v1/auth/sso/acs"
		kf, err := ioutil.ReadFile("./testdata/key.pem")
		So(err, ShouldBeNil)

		cf, err := ioutil.ReadFile("./testdata/cert.pem")
		So(err, ShouldBeNil)

		keyForm := def.NewFilePartitionPart("key-file", kf)
		certForm := def.NewFilePartitionPart("cert-file", cf)

		req, err := httpcli.NewHttpRequestBuilder().
			POST().
			WithEndpoint("127.0.0.1:8080").
			WithPath("/v1/omnimam/setting/sso/saml/idp/metadata/upsert").
			AddFormParam(httpform.KeyFileFormKey, keyForm).
			AddFormParam(httpform.CertFileFormKey, certForm).
			WithBody("multipart", d).Build().ConvertRequestWithContext(context.Background())
		So(err, ShouldBeNil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		fmt.Println(string(w.Body.Bytes()))

		So(w.Code, ShouldEqual, http.StatusOK)

		resp := iapiserver.Setting{}
		err = json.Unmarshal(w.Body.Bytes(), &resp)
		So(err, ShouldBeNil)
		So(resp.ID, ShouldNotBeEmpty)
		existing, _ := storeIns.Settings().GetByName(context.Background(), iapiserver.SettingKindSSOSamlIdpMetadata)

		if existing != nil {
			So(existing.ID, ShouldEqual, resp.ID)
			So(resp.ResourceVersion, ShouldNotEqual, 1)
		} else {
			So(resp.ResourceVersion, ShouldEqual, 1)
		}

	})
}

func TestSSOIdentityProviderMetadataGet_Integration(t *testing.T) {
	Convey("TestSSOIdentityProviderMetadataGet_Integration", t, func() {
		storeIns := startTestDB(t)

		router := gin.Default()
		rg := router.Group("/v1/omnimam")
		apiserver.InstallMiddleware(router)
		apiserver.InstallSettingApis(rg, storeIns)

		req, err := httpcli.NewHttpRequestBuilder().
			GET().
			WithEndpoint("127.0.0.1:8080").
			WithPath("/v1/omnimam/setting/sso/saml/idp/metadata/get").
			Build().ConvertRequestWithContext(context.Background())
		So(err, ShouldBeNil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		fmt.Println(string(w.Body.Bytes()))

		So(w.Code, ShouldEqual, http.StatusOK)

		resp := iapiserver.IdentityProviderMetadataGetResponse{}
		err = json.Unmarshal(w.Body.Bytes(), &resp)
		So(err, ShouldBeNil)
		So(resp.Setting.ID, ShouldNotBeEmpty)
	})
}

func TestSSOIdentityProviderMetadataDownload_Integration(t *testing.T) {
	Convey("TestSSOIdentityProviderMetadataGet_Integration", t, func() {
		storeIns := startTestDB(t)

		router := gin.Default()
		rg := router.Group("/v1/omnimam")
		apiserver.InstallMiddleware(router)
		apiserver.InstallSettingApis(rg, storeIns)

		req, err := httpcli.NewHttpRequestBuilder().
			GET().
			WithEndpoint("127.0.0.1:8080").
			WithPath("/v1/omnimam/setting/sso/saml/idp/metadata/download").
			Build().ConvertRequestWithContext(context.Background())
		So(err, ShouldBeNil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		So(w.Code, ShouldEqual, http.StatusOK)
		So(w.Header().Get("Content-Type"), ShouldEqual, "application/octet-stream")
		So(w.Header().Get("Content-Disposition"), ShouldNotBeEmpty)

		So(httpcli.DownloadFile(w.Header(), w.Body.Bytes(), "./testdata"), ShouldBeNil)
		_, err = os.Stat("./testdata/metadata.xml")
		So(err, ShouldBeNil)
	})
}

func TestSSOServiceProviderMetadataGenerate_Integration(t *testing.T) {
	Convey("TestSSOServiceProviderMetadataGenerate_Integration", t, func() {
		storeIns := startTestDB(t)

		router := gin.Default()
		rg := router.Group("/v1/omnimam")
		apiserver.InstallMiddleware(router)
		apiserver.InstallSettingApis(rg, storeIns)

		d := &iapiserver.IdentityProviderMetadataUpsetRequest{}
		d.Endpoint = "https://10.30.100.190"
		d.RedirectSSOFrontendURL = "/v1/auth/sso/acs"
		kf, err := ioutil.ReadFile("./testdata/key.pem")
		So(err, ShouldBeNil)

		cf, err := ioutil.ReadFile("./testdata/cert.pem")
		So(err, ShouldBeNil)

		keyForm := def.NewFilePartitionPart("key-file", kf)
		certForm := def.NewFilePartitionPart("cert-file", cf)
		existing, _ := storeIns.Settings().GetByName(context.Background(), iapiserver.SettingKindSSOSamlSpMetadata)

		req, err := httpcli.NewHttpRequestBuilder().
			POST().
			WithEndpoint("127.0.0.1:8080").
			WithPath("/v1/omnimam/setting/sso/saml/sp/metadata/upsert").
			AddFormParam(httpform.KeyFileFormKey, keyForm).
			AddFormParam(httpform.CertFileFormKey, certForm).
			WithBody("multipart", d).Build().ConvertRequestWithContext(context.Background())
		So(err, ShouldBeNil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		fmt.Println(string(w.Body.Bytes()))

		So(w.Code, ShouldEqual, http.StatusOK)

		resp := iapiserver.Setting{}
		err = json.Unmarshal(w.Body.Bytes(), &resp)
		So(err, ShouldBeNil)
		So(resp.ID, ShouldNotBeEmpty)

		if existing != nil {
			So(existing.ID, ShouldEqual, resp.ID)
			So(resp.ResourceVersion, ShouldNotEqual, 1)
		} else {
			So(resp.ResourceVersion, ShouldEqual, 1)
		}
	})
}

func TestSSOServiceProviderMetadataGet_Integration(t *testing.T) {
	Convey("TestSSOServiceProviderMetadataGet_Integration", t, func() {
		storeIns := startTestDB(t)

		router := gin.Default()
		rg := router.Group("/v1/omnimam")
		apiserver.InstallMiddleware(router)
		apiserver.InstallSettingApis(rg, storeIns)

		req, err := httpcli.NewHttpRequestBuilder().
			GET().
			WithEndpoint("127.0.0.1:8080").
			WithPath("/v1/omnimam/setting/sso/saml/sp/metadata/get").
			Build().ConvertRequestWithContext(context.Background())
		So(err, ShouldBeNil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)
		fmt.Println(string(w.Body.Bytes()))

		So(w.Code, ShouldEqual, http.StatusOK)

		resp := iapiserver.ServiceProviderMetadataGetResponse{}
		err = json.Unmarshal(w.Body.Bytes(), &resp)
		So(err, ShouldBeNil)
		So(resp.Setting.ID, ShouldNotBeEmpty)
	})
}

func TestSSOServiceProviderMetadataDownload_Integration(t *testing.T) {
	Convey(
		"TestSSOIdentityProvideTestSSOServiceProviderMetadataDownload_IntegrationrMetadataGet_Integration",
		t,
		func() {
			storeIns := startTestDB(t)

			router := gin.Default()
			rg := router.Group("/v1/omnimam")
			apiserver.InstallMiddleware(router)
			apiserver.InstallSettingApis(rg, storeIns)

			req, err := httpcli.NewHttpRequestBuilder().
				GET().
				WithEndpoint("127.0.0.1:8080").
				WithPath("/v1/omnimam/setting/sso/saml/sp/metadata/download").
				Build().ConvertRequestWithContext(context.Background())
			So(err, ShouldBeNil)
			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)
			So(w.Code, ShouldEqual, http.StatusOK)
			So(w.Header().Get("Content-Type"), ShouldEqual, "application/octet-stream")
			So(w.Header().Get("Content-Disposition"), ShouldNotBeEmpty)

			So(httpcli.DownloadFile(w.Header(), w.Body.Bytes(), "./testdata"), ShouldBeNil)
			_, err = os.Stat("./testdata/metadata.xml")
			So(err, ShouldBeNil)
		},
	)
}
