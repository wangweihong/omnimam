package store

var client Factory

// Factory defines the iam platform storage interface.
type Factory interface {
	// settings
	IdentityProviders() IdentityProviderStore
	ServiceProviders() ServiceProviderStore
	Settings() SettingStore

	// identitys
	Users() UserStore
	OneTimeTokens() OneTimeTokenStore
	UserOTPs() UserOTPStore

	EnsureScheme(metaTypes ...any) error
	Close() error
}

// Client return the store client instance.
func Client() Factory {
	return client
}

// SetClient set the iam store client.
func SetClient(factory Factory) {
	client = factory
}
