package integration_test

import (
	"io/ioutil"
	"strings"
	"testing"

	"github.com/spf13/viper"
	"github.com/wangweihong/gotoolbox/pkg/errors"

	"github.com/wangweihong/omnimam/internal/apiserver"
	"github.com/wangweihong/omnimam/internal/apiserver/config"
	"github.com/wangweihong/omnimam/internal/apiserver/options"
	"github.com/wangweihong/omnimam/internal/apiserver/store"
)

func startTestDB(t *testing.T) store.Factory {
	errors.UpdateModuleInfo(errors.NewModuleGetter("github.com/wangweihong/omnimam", "127.0.01", 12345))

	yamlConfig, err := ioutil.ReadFile("./testdata/config.yaml")
	if err != nil {
		panic(err)
	}

	v := viper.New()
	v.SetConfigType("yaml")
	// 读取 YAML 配置
	if err := v.ReadConfig(strings.NewReader(string(yamlConfig))); err != nil {
		panic(err)
	}

	var opt options.Options
	if err := v.Unmarshal(&opt); err != nil {
		panic(err)
	}
	cfg, err := config.CreateConfigFromOptions(&opt)
	if err != nil {
		panic(err)
	}
	eg, err := apiserver.BuildExtraConfig(cfg)
	if err != nil {
		panic(err)
	}
	if err := eg.Complete().New(); err != nil {
		panic(err)
	}
	storeIns := store.Client()
	// storeIns, err := database.GetDatabaseFactoryOr(opt.DatabaseOptions)
	// if err != nil {
	// 	panic(err)
	// }
	// if err := storeIns.EnsureScheme(
	// 	&iapiserver.AppStore{},
	// 	&iapiserver.ApplicationTemplate{},
	// 	&iapiserver.ApplicationTemplateVersion{},
	// 	&iapiserver.ApplicationInstance{},
	// 	&iapiserver.ApplicationInstanceRevision{},
	// ); err != nil {
	// 	panic(err)
	// }

	t.Cleanup(func() {
		storeIns.Close()
	})
	return storeIns
}
