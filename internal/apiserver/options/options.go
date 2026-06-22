package options

import (
	"github.com/wangweihong/gotoolbox/pkg/json"
	"github.com/wangweihong/gotoolbox/pkg/log"

	"github.com/wangweihong/omnimam/pkg/app"
	cliflag "github.com/wangweihong/omnimam/pkg/cli/flag"
	"github.com/wangweihong/omnimam/pkg/httpsvr/genericoptions"
)

var (
	_ app.PrintableOptions    = &Options{}
	_ app.CompleteableOptions = &Options{}
)

// Options runs a http server.
type Options struct {
	Name string `json:"name"`

	GenericServerRunOptions *genericoptions.ServerRunOptions       `json:"server"   mapstructure:"server"`
	Log                     *log.Options                           `json:"log"      mapstructure:"log"`
	FeatureOptions          *genericoptions.FeatureOptions         `json:"feature"  mapstructure:"feature"`
	InsecureServing         *genericoptions.InsecureServingOptions `json:"insecure" mapstructure:"insecure"`
	SecureServing           *genericoptions.SecureServingOptions   `json:"secure"   mapstructure:"secure"`
	//PostgresSQLOptions      *genericoptions.PostgresSQLOptions     `json:"postgres" mapstructure:"postgres"`
	DatabaseOptions *genericoptions.DatabaseOptions `json:"database" mapstructure:"database"`
}

// NewOptions creates a new Options object with default parameters.
func NewOptions() *Options {
	s := Options{
		Name: "api-server",

		Log:                     log.NewOptions(),
		InsecureServing:         genericoptions.NewInsecureServingOptions(),
		SecureServing:           genericoptions.NewSecureServingOptions(),
		FeatureOptions:          genericoptions.NewFeatureOptions(),
		GenericServerRunOptions: genericoptions.NewServerRunOptions(),
		//PostgresSQLOptions:      genericoptions.NewPostgresSQLOptions(),
		DatabaseOptions: genericoptions.NewDatabaseOptions(),
	}

	return &s
}

// Flags returns flags for a specific server by section name.
func (o *Options) Flags() (fss cliflag.NamedFlagSets) {
	o.Log.AddFlags(fss.FlagSet("logs"))
	// 这里会将以下标志集归类到generic server集合中
	o.GenericServerRunOptions.AddFlags(fss.FlagSet("generic server"))
	o.InsecureServing.AddFlags(fss.FlagSet("server"))
	o.SecureServing.AddFlags(fss.FlagSet("server"))
	o.FeatureOptions.AddFlags(fss.FlagSet("feature"))
	//o.PostgresSQLOptions.AddFlags(fss.FlagSet("database"))
	o.DatabaseOptions.AddFlags(fss.FlagSet("database"))

	fs := fss.FlagSet("misc")
	fs.StringVar(&o.Name, "misc.name", o.Name, "name of server")
	return fss
}

func (o *Options) String() string {
	// hide annoying cert data in log
	cert := o.SecureServing.ServerCert.CopyAndHide()
	data, _ := json.Marshal(o)
	o.SecureServing.ServerCert = *cert

	return string(data)
}

// Complete fills in any fields not set that are required to have valid data.
// 补全指定的选项.
func (o *Options) Complete() error {
	if err := o.SecureServing.Complete(); err != nil {
		return err
	}

	return nil
}
