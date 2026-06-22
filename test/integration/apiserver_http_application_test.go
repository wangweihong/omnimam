package integration_test

// import (
// 	"context"

// 	"fmt"
// 	"io/ioutil"
// 	"net/http"
// 	"net/http/httptest"
// 	"testing"

// 	"github.com/gin-gonic/gin"
// 	. "github.com/smartystreets/goconvey/convey"
// 	"github.com/wangweihong/omnimam/apis/iapiserver"
// 	"github.com/wangweihong/omnimam/internal/apiserver"
// 	"github.com/wangweihong/omnimam/pkg/httpsvr/genericmiddleware"
// 	"github.com/wangweihong/gotoolbox/pkg/httpcli"
// 	"github.com/wangweihong/gotoolbox/pkg/httpcli/def"
// 	"github.com/wangweihong/gotoolbox/pkg/json"
// )

// func TestAppStoreCreate_Integration(t *testing.T) {
// 	Convey("TestAppStoreCreate_Integration", t, func() {
// 		storeIns := startTestDB(t)

// 		router := gin.Default()
// 		rg := router.Group("/v1/omnimam")
// 		apiserver.InstallApplicationApis(rg, storeIns)

// 		d := map[string]any{
// 			"name":       "test",
// 			"app_source": 0,
// 		}

// 		req, err := httpcli.NewHttpRequestBuilder().
// 			POST().
// 			WithEndpoint("127.0.0.1:8080").
// 			WithPath("/v1/omnimam/application/store/add").
// 			WithBody("", d).Build().ConvertRequestWithContext(context.Background())
// 		So(err, ShouldBeNil)
// 		w := httptest.NewRecorder()
// 		router.ServeHTTP(w, req)
// 		fmt.Println(string(w.Body.Bytes()))

// 		So(w.Code, ShouldEqual, http.StatusOK)

// 		resp := iapiserver.AppStoreAddResponse{}
// 		err = json.Unmarshal(w.Body.Bytes(), &resp)
// 		So(err, ShouldBeNil)
// 		So(resp.ID, ShouldNotBeEmpty)
// 		So(resp.Name, ShouldEqual, "test")

// 		apiserver, err := storeIns.AppStores().Get(context.Background(), resp.ID)
// 		So(err, ShouldBeNil)
// 		So(apiserver.Name, ShouldEqual, "test")

// 	})
// }

// func TestAppStoreCreateWithExistName_Integration(t *testing.T) {
// 	Convey("TestAppStoreCreateWithExistName_Integration", t, func() {
// 		storeIns := startTestDB(t)
// 		as, err := storeIns.AppStores().List(context.Background())
// 		So(err, ShouldBeNil)
// 		So(len(as), ShouldNotEqual, 0)

// 		router := gin.Default()
// 		rg := router.Group("/v1/omnimam")
// 		apiserver.InstallApplicationApis(rg, storeIns)

// 		d := map[string]any{
// 			"name":       as[0].Name,
// 			"app_source": as[0].AppSource,
// 		}

// 		req, err := httpcli.NewHttpRequestBuilder().
// 			POST().
// 			WithEndpoint("127.0.0.1:8080").
// 			WithPath("/v1/omnimam/application/store/add").
// 			WithBody("", d).Build().ConvertRequestWithContext(context.Background())
// 		So(err, ShouldBeNil)
// 		w := httptest.NewRecorder()
// 		router.ServeHTTP(w, req)
// 		fmt.Println(string(w.Body.Bytes()))

// 		So(w.Code, ShouldNotEqual, http.StatusOK)

// 	})
// }

// func TestAppStoreList_Integration(t *testing.T) {
// 	Convey("TestAppStoreList_Integration", t, func() {
// 		storeIns := startTestDB(t)

// 		router := gin.Default()
// 		rg := router.Group("/v1/omnimam")
// 		apiserver.InstallApplicationApis(rg, storeIns)

// 		req, err := httpcli.NewHttpRequestBuilder().
// 			GET().
// 			WithEndpoint("127.0.0.1:8080").
// 			AddQueryParam("app_source", 0).
// 			WithPath("/v1/omnimam/application/store/list").
// 			Build().ConvertRequestWithContext(context.Background())
// 		So(err, ShouldBeNil)
// 		w := httptest.NewRecorder()
// 		router.ServeHTTP(w, req)

// 		So(w.Code, ShouldEqual, http.StatusOK)
// 		json.PrettyPrint(w.Body.Bytes())
// 		resp := iapiserver.AppStoreListResponse{}
// 		err = json.Unmarshal(w.Body.Bytes(), &resp)
// 		So(err, ShouldBeNil)
// 		source := 0
// 		stores, _, err := storeIns.AppStores().Query(context.Background(), &iapiserver.AppStoreListRequest{AppSource: &source})
// 		So(err, ShouldBeNil)
// 		So(len(stores), ShouldEqual, len(resp.List))

// 	})
// }

// func TestAppStoreDelete_Integration(t *testing.T) {
// 	Convey("TestAppStoreDelete_Integration", t, func() {
// 		storeIns := startTestDB(t)
// 		as, err := storeIns.AppStores().List(context.Background())
// 		So(err, ShouldBeNil)
// 		So(len(as), ShouldNotEqual, 0)

// 		router := gin.Default()
// 		rg := router.Group("/v1/omnimam")
// 		apiserver.InstallApplicationApis(rg, storeIns)

// 		for _, store := range as {
// 			req, err := httpcli.NewHttpRequestBuilder().
// 				POST().
// 				WithEndpoint("127.0.0.1:8080").
// 				WithPath("/v1/omnimam/application/store/delete").
// 				WithBody("", store).
// 				Build().ConvertRequestWithContext(context.Background())
// 			So(err, ShouldBeNil)
// 			w := httptest.NewRecorder()
// 			router.ServeHTTP(w, req)
// 			fmt.Println(string(w.Body.Bytes()))

// 			So(w.Code, ShouldEqual, http.StatusOK)
// 		}
// 		//TODO: 检测所有该商店下的模板，分类等都已经删除
// 		stores, err := storeIns.AppStores().List(context.Background())
// 		So(err, ShouldBeNil)
// 		So(len(stores), ShouldEqual, 0)
// 	})
// }

// func TestApplicationTemplateValidate_Integration(t *testing.T) {
// 	Convey("TestApplicationTemplateValidate_Integration", t, func() {
// 		storeIns := startTestDB(t)

// 		router := gin.Default()
// 		rg := router.Group("/v1/omnimam")
// 		apiserver.InstallMiddleware(router)
// 		apiserver.InstallApplicationApis(rg, storeIns)

// 		f, err := ioutil.ReadFile("./testdata/myapp.tgz")
// 		So(err, ShouldBeNil)

// 		formdata := def.NewFilePartitionPart("myapp.tgz", f)

// 		req, err := httpcli.NewHttpRequestBuilder().
// 			POST().
// 			WithEndpoint("127.0.0.1:8080").
// 			WithPath("/v1/omnimam/application/template/validate").
// 			AddFormParam("file", formdata).
// 			Build().ConvertRequestWithContext(context.Background())
// 		So(err, ShouldBeNil)
// 		w := httptest.NewRecorder()
// 		router.ServeHTTP(w, req)
// 		fmt.Println(string(w.Body.Bytes()))

// 		So(w.Code, ShouldEqual, http.StatusOK)
// 	})
// }

// func TestApplicationTemplateAdd_Integration(t *testing.T) {
// 	Convey("TestApplicationTemplateAdd_Integration", t, func() {
// 		storeIns := startTestDB(t)
// 		as, err := storeIns.AppStores().List(context.Background())
// 		So(err, ShouldBeNil)
// 		So(len(as), ShouldNotEqual, 0)

// 		template := &iapiserver.ApplicationTemplateAddRequest{}
// 		template.Name = "fake"
// 		template.AppStoreID = as[0].ID

// 		router := gin.Default()
// 		//router.Use(genericmiddleware.CopyBodyMiddleware())
// 		router.Use(genericmiddleware.LoggerMiddleware())

// 		rg := router.Group("/v1/omnimam")
// 		apiserver.InstallApplicationApis(rg, storeIns)

// 		f, err := ioutil.ReadFile("./testdata/myapp.tgz")
// 		So(err, ShouldBeNil)

// 		builder := httpcli.NewHttpRequestBuilder().
// 			POST().
// 			WithEndpoint("127.0.0.1:8080").
// 			AddHeaderParam("Content-Type", "multipart/form-data").
// 			WithPath("/v1/omnimam/application/template/add").
// 			AddFormParam("file", def.NewFilePartitionPart("myapp.tgz", f)).
// 			WithBody("multipart", template)
// 		//builder.Debug()
// 		req, err := builder.Build().ConvertRequestWithContext(context.Background())
// 		So(err, ShouldBeNil)
// 		w := httptest.NewRecorder()
// 		router.ServeHTTP(w, req)
// 		fmt.Println(string(w.Body.Bytes()))

// 		So(w.Code, ShouldEqual, http.StatusOK)
// 	})
// }
