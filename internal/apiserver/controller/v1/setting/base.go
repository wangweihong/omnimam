package setting

import (
	srvv1 "github.com/wangweihong/omnimam/internal/apiserver/service/v1"
	"github.com/wangweihong/omnimam/internal/apiserver/store"
)

type SettingController struct {
	srv srvv1.Service
}

func NewController(store store.Factory) *SettingController {
	return &SettingController{
		srv: srvv1.NewService(store),
	}
}
