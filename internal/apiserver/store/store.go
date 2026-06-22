package store

import (
	"context"

	"github.com/wangweihong/omnimam/apis/iapiserver"
)

type IdentityProviderStore interface {
	List(ctx context.Context, req *iapiserver.IdentityProviderListRequest) ([]*iapiserver.IdentityProvider, int64, error)
	Get(ctx context.Context, id string) (*iapiserver.IdentityProvider, error)
	GetByName(ctx context.Context, name string) (*iapiserver.IdentityProvider, error)
	Delete(ctx context.Context, id string) error
	Update(ctx context.Context, data *iapiserver.IdentityProvider) (*iapiserver.IdentityProvider, error)
	Sync(ctx context.Context, datas []*iapiserver.IdentityProvider) error
	Add(ctx context.Context, data *iapiserver.IdentityProvider) (*iapiserver.IdentityProvider, error)
}

type ServiceProviderStore interface {
	List(ctx context.Context, req *iapiserver.ServiceProviderListRequest) ([]*iapiserver.ServiceProvider, int64, error)
	Add(ctx context.Context, data *iapiserver.ServiceProvider) (*iapiserver.ServiceProvider, error)
	Delete(ctx context.Context, id string) error
	Get(ctx context.Context, id string) (*iapiserver.ServiceProvider, error)
	GetByKey(ctx context.Context, protocol, key string) (*iapiserver.ServiceProvider, error)
	GetByName(ctx context.Context, name string) (*iapiserver.ServiceProvider, error)
	Update(ctx context.Context, data *iapiserver.ServiceProvider) (*iapiserver.ServiceProvider, error)
	Sync(ctx context.Context, datas []*iapiserver.ServiceProvider) error
}

type SettingStore interface {
	List(ctx context.Context) ([]*iapiserver.Setting, error)
	Delete(ctx context.Context, id string) error
	Get(ctx context.Context, id string) (*iapiserver.Setting, error)
	GetByName(ctx context.Context, name string) (*iapiserver.Setting, error)
	GetMultiByNames(ctx context.Context, names ...string) ([]*iapiserver.Setting, error)
	Upsert(ctx context.Context, data *iapiserver.Setting) (*iapiserver.Setting, error)
	FirstOrCreate(ctx context.Context, data *iapiserver.Setting) (*iapiserver.Setting, error)
}

type UserStore interface {
	List(ctx context.Context, req *iapiserver.UserListRequest) ([]*iapiserver.User, int64, error)
	Get(ctx context.Context, id string) (*iapiserver.User, error)
	GetByName(ctx context.Context, name string) (*iapiserver.User, error)
	Delete(ctx context.Context, id string) error
	Update(ctx context.Context, data *iapiserver.User) (*iapiserver.User, error)
	Sync(ctx context.Context, datas []*iapiserver.User) error
	Add(ctx context.Context, data *iapiserver.User) (*iapiserver.User, error)
}

type OneTimeTokenStore interface {
	GetByHash(ctx context.Context, hash string) (*iapiserver.OneTimeToken, error)
	Delete(ctx context.Context, id string) error
	Add(ctx context.Context, data *iapiserver.OneTimeToken) (*iapiserver.OneTimeToken, error)
	CleanupExpiredTokens(ctx context.Context) error
}

type UserOTPStore interface {
	List(ctx context.Context) ([]*iapiserver.UserOTP, error)
	Delete(ctx context.Context, id string) error
	GetByUser(ctx context.Context, uid string) (*iapiserver.UserOTP, error)
	Upsert(ctx context.Context, data *iapiserver.UserOTP) (*iapiserver.UserOTP, error)
	FirstOrCreate(ctx context.Context, data *iapiserver.UserOTP) (*iapiserver.UserOTP, error)
	Add(ctx context.Context, data *iapiserver.UserOTP) (*iapiserver.UserOTP, error)
}
