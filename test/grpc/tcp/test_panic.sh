#!/usr/bin/env bash
# gRPC  server must enable reflect and debug service
grpcurl -plaintext debug.DebugService/Panic

