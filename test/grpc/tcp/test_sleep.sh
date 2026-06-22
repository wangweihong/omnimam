#!/usr/bin/env bash

grpcurl -plaintext -d '{"duration":"20s"}' localhost:8081   debug.DebugService/Sleep