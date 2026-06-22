#!/usr/bin/env bash

#grpcurl --cacert=./_output/cert/ca.crt localhost:8081  debug.DebugService/Panic
# 服务未开启TLS时
grpcurl -plaintext localhost:8081  version.VersionService/Version