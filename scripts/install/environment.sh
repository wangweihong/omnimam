#!/usr/bin/env bash

# 可以通过make INSTALL_DIR=xxx的方式设置INSTALL_DIR的值, 其他变量同理。

# 项目源码根目录
SOURCE_ROOT=$(dirname "${BASH_SOURCE[0]}")/../..
# 生成文件存放目录
# 如果未指定变量OUT_DIR, 则采用默认值_output
LOCAL_OUTPUT_ROOT="${SOURCE_ROOT}/${OUT_DIR:-_output}"


# 设置安装目录
# 如果未指定变量INSTALL_DIR, 则采用默认值/tmp/installation
readonly INSTALL_DIR=${INSTALL_DIR:-/tmp/installation}
mkdir -p ${INSTALL_DIR}
readonly ENV_FILE=${SOURCE_ROOT}/scripts/install/environment.sh

# omnimam 配置
readonly omnimam_ROOT_DIR=${omnimam_ROOT_DIR:-/var/lib/omnimam}
readonly omnimam_DATA_DIR=${omnimam_DATA_DIR:-${omnimam_ROOT_DIR}/data} # omnimam 各组件数据目录
readonly omnimam_INSTALL_DIR=${omnimam_INSTALL_DIR:-${omnimam_ROOT_DIR}/bin} # omnimam 安装文件存放目录
readonly omnimam_CONFIG_DIR=${omnimam_CONFIG_DIR:-${omnimam_ROOT_DIR}/conf} # omnimam 配置文件存放目录
readonly omnimam_LOG_DIR=${omnimam_LOG_DIR:-/var/log/omnimam} # omnimam 日志文件存放目录
readonly omnimam_DEBUG_DIR=${omnimam_DEBUG_DIR:-${omnimam_ROOT_DIR}/debug} # omnimam 调试信息文件存放目录
readonly CA_FILE=${CA_FILE:-${omnimam_CONFIG_DIR}/cert/ca.pem} # ca

# example-server 配置
readonly EXAMPLE_SERVER_RUNTIME_DEBUG_OUTPUT_DIR=${EXAMPLE_SERVER_RUNTIME_DEBUG_OUTPUT_DIR:-${omnimam_DEBUG_DIR}/example-server}
readonly EXAMPLE_SERVER_HOST=${EXAMPLE_SERVER_HOST:-0.0.0.0} # omnimam-apiserver 部署机器 IP 地址
readonly EXAMPLE_SERVER_GRPC_BIND_ADDRESS=${EXAMPLE_SERVER_GRPC_BIND_ADDRESS:-0.0.0.0}
readonly EXAMPLE_SERVER_GRPC_BIND_PORT=${EXAMPLE_SERVER_GRPC_BIND_PORT:-8081}
readonly EXAMPLE_SERVER_INSECURE_BIND_ADDRESS=${EXAMPLE_SERVER_INSECURE_BIND_ADDRESS:-0.0.0.0}
readonly EXAMPLE_SERVER_INSECURE_BIND_PORT=${EXAMPLE_SERVER_INSECURE_BIND_PORT:-8080}
readonly EXAMPLE_SERVER_SECURE_BIND_ADDRESS=${EXAMPLE_SERVER_SECURE_BIND_ADDRESS:-0.0.0.0}
readonly EXAMPLE_SERVER_SECURE_BIND_PORT=${EXAMPLE_SERVER_SECURE_BIND_PORT:-8443}
readonly EXAMPLE_SERVER_SECURE_TLS_CERT_FILE=${EXAMPLE_SERVER_SECURE_TLS_CERT_FILE:-${omnimam_CONFIG_DIR}/cert/example-server.crt}
readonly EXAMPLE_SERVER_SECURE_TLS_CERT_KEY=${EXAMPLE_SERVER_SECURE_TLS_CERT_KEY:-${omnimam_CONFIG_DIR}/cert/example-server.key}

# example-grpc配置
readonly EXAMPLE_GRPC_RUNTIME_DEBUG_OUTPUT_DIR=${EXAMPLE_GRPC_RUNTIME_DEBUG_OUTPUT_DIR:-${omnimam_DEBUG_DIR}/example-grpc}
## TCP
readonly EXAMPLE_GRPC_BIND_ADDRESS=${EXAMPLE_GRPC_BIND_ADDRESS:-0.0.0.0}
readonly EXAMPLE_GRPC_BIND_PORT=${EXAMPLE_GRPC_BIND_PORT:-8081}
readonly EXAMPLE_GRPC_TLS_CERT_FILE=${EXAMPLE_GRPC_TLS_CERT_FILE:-${omnimam_CONFIG_DIR}/cert/example-grpc.crt}
readonly EXAMPLE_GRPC_TLS_CERT_KEY=${EXAMPLE_GRPC_TLS_CERT_KEY:-${omnimam_CONFIG_DIR}/cert/example-grpc.key}
## UnixSocket
readonly EXAMPLE_GRPC_UNIX_SOCKET=${EXAMPLE_GRPC_UNIX_SOCKET:-/var/run/example-grpc.socket}

