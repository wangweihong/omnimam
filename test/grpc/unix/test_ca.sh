#!/usr/bin/env bash

grpcurl --cacert=./_output/cert/ca.crt  unix:///var/run/example-grpc.socket  version.VersionService/Version