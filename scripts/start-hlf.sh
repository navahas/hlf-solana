#!/usr/bin/env bash

set -e

source "$(dirname "$0")/log.sh"

./scripts/clear-cc-containers.sh

cd ./fabric-samples/test-network

log_info "Shutting down existing network..."
./network.sh down &> /dev/null
sleep 2

log_warn "Starting network..."
./network.sh up createChannel -c mychannel &> /dev/null
sleep 3

log_warn "Verifying host resolution..."

if ! (ping -c 1 host.docker.internal &> /dev/null || getent hosts host.docker.internal &> /dev/null); then
    log_error "'host.docker.internal' is not resolvable on your system."
    log_error " → See docs/HOST_RESOLUTION.md for fix instructions."
    exit 1
fi

cd ../..

log_success "Hyperledger Fabric network is ready."
