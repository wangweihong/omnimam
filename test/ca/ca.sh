#!/usr/bin/env bash


# 测试服务端证书是否有效
# 当证书主体非当前运行域名或IP时,curl: (60) SSL: no alternative certificate subject name matches target host name '127.0.0.1'
curl  https://127.0.0.1:8443/version --cacert _output/cert/ca.crt

