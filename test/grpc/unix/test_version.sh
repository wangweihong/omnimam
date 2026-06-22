#!/usr/bin/env bash

grpcurl -plaintext -unix /var/run/example-grpc.socket   version.VersionService/Version