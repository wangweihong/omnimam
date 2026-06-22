package v1

import (
	"github.com/wangweihong/omnimam/internal/apiserver/service/v1/identity"
	"github.com/wangweihong/omnimam/internal/apiserver/service/v1/setting"
	"github.com/wangweihong/omnimam/internal/apiserver/store"
)

// Service defines functions used to return resource interface.
type Service interface {
	Settings() setting.SettingSrv
	Identities() identity.IdentitySrv
}

type service struct {
	store store.Factory
}

// NewService returns Service interface.
func NewService(store store.Factory) Service {
	return &service{
		store: store,
	}
}



func (s *service) Settings() setting.SettingSrv {
	return setting.NewService(s.store)
}

func (s *service) Identities() identity.IdentitySrv {
	return identity.NewService(s.store)
}
