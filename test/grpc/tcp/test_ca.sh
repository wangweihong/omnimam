#!/usr/bin/env bash

# 只适用于服务端未开启TLS
grpcurl -plaintext  127.0.0.1:8081 version.VersionService/Version

# 证书验证, 只适用于服务端开启TLS
#grpcurl --cacert=./_output/cert/ca.crt  127.0.0.1:8081 version.VersionService/Version
# 跳过证书验证, 只适用于服务端开启TLS
#grpcurl -insecure  127.0.0.1:8081 version.VersionService/Version

#  服务客户端双向认证,只使用于服务端开启mTLS
# grpcurl --cacert=./_output/cert/ca.crt --cert=./_output/cert/example-grpc-client.crt --key=./_output/cert/example-grpc-client.key 127.0.0.1:8081 version.VersionService/Version