package apiserver

import (
	"github.com/gin-gonic/gin"
	"github.com/wangweihong/gotoolbox/pkg/errors"

	"github.com/wangweihong/omnimam/internal/apiserver/controller/v1/authentication"
	"github.com/wangweihong/omnimam/internal/apiserver/controller/v1/setting"
	"github.com/wangweihong/omnimam/internal/apiserver/store"
	"github.com/wangweihong/omnimam/internal/pkg/code"
	"github.com/wangweihong/omnimam/pkg/core"
	"github.com/wangweihong/omnimam/pkg/httpsvr/genericmiddleware"
)

func initRouter(g *gin.Engine) {
	InstallMiddleware(g)
	InstallApis(g)
}

func InstallMiddleware(g *gin.Engine) {
	g.Use(genericmiddleware.RequestID())
	g.Use(genericmiddleware.Context())
	g.Use(genericmiddleware.LoggerMiddleware())
}

func InstallApis(g *gin.Engine) *gin.Engine {
	g.NoRoute(func(c *gin.Context) {
		core.WriteResponse(c, errors.NewStatusF(code.ErrPageNotFound, "Page not found."), nil)
	})
	// storeIns, _ := postgresql.GetPostgresSQLFactoryOr(nil)
	// v1 := g.Group("/v1/omnimam")
	// {
	// 	// installRegistryApis(v1, storeIns)
	// 	// InstallApplicationApis(v1, storeIns)
	// }

	return g
}

func installAuthApis(rg *gin.RouterGroup, storeIns store.Factory) {
	authv1 := rg.Group("/auth")
	{
		authController := authentication.NewController(storeIns)
		otp := authv1.Group("/otp")
		{
			otp.GET("qrcode", authController.OTPGenerateOrGet)
			otp.POST("validate", authController.OTPValidate)
		}
		// 修改以下路由需要同步修改iapiserver.SsoURL相关的常量
		sso := authv1.Group("/sso")
		{
			sp := sso.Group("/sp")
			{
				sp.GET("/saml/metadata", authController.SpSsoSamlInitiator)
				sp.POST("/saml/initiator", authController.SpSsoSamlInitiator)
				sp.POST("/saml/acs", authController.SpSsoSamlAcs)
				sp.POST("/saml/slo", authController.SpSsoSamlSLO)
				//oauth2
				// sp.POST("/oauth2/initiator", authController.SpSsoInitiator)
				// sp.POST("/oauth2/acs", authController.SpSsoInitiator)

			}

			idp := sso.Group("/idp")
			{
				// //saml
				idp.POST("/saml/answer", authController.IdpServeSAMLProtocolSSO)
				// sp.GET("/saml/metadata", authController.SpSsoInitiator)
				// //oauth2
				// idp.POST("/oauth2/answer", authController.SpSsoInitiator)
			}
		}
	}
}

func InstallSettingApis(rg *gin.RouterGroup, storeIns store.Factory) {
	settingv1 := rg.Group("/setting")
	{
		settingController := setting.NewController(storeIns)
		sso := settingv1.Group("/sso")
		{
			saml := sso.Group("/saml")
			{
				saml.POST("/idp/metadata/upsert", settingController.IdentityProviderSAMLMetadataUpsert)
				saml.GET("/idp/metadata/get", settingController.IdentityProviderSAMLMetadataGet)
				saml.GET("/idp/metadata/download", settingController.IdentityProviderSAMLMetadataDownload)

				saml.POST("/sp/metadata/upsert", settingController.ServiceProviderSAMLMetadataUpsert)
				saml.GET("/sp/metadata/get", settingController.ServiceProviderSAMLMetadataGet)
				saml.GET("/sp/metadata/download", settingController.ServiceProviderSAMLMetadataDownload)

			}

			ssoapp := sso.Group("/app")
			{
				ssoapp.POST("/idp/add", settingController.IdentityProviderAdd)
				ssoapp.POST("/idp/delete", settingController.IdentityProviderDelete)
				ssoapp.POST("/idp/update", settingController.IdentityProviderUpdate)
				ssoapp.GET("/idp/get", settingController.IdentityProviderGet)
				ssoapp.GET("/idp/list", settingController.IdentityProviderList)

				ssoapp.POST("/sp/add", settingController.ServiceProviderAdd)
				ssoapp.POST("/sp/delete", settingController.ServiceProviderDelete)
				ssoapp.POST("/sp/update", settingController.ServiceProviderUpdate)
				ssoapp.GET("/sp/get", settingController.ServiceProviderGet)
				ssoapp.GET("/sp/redirect_url", settingController.ServiceProviderRedirectURL)
				ssoapp.GET("/sp/list", settingController.ServiceProviderList)
			}
		}
	}
}
