#!/usr/bin/env bash

set -e

source "$(dirname "$0")/log.sh"

log_info "Shutting Down Hyperledger Fabric network..."

./scripts/clear-cc-containers.sh

cd ./fabric-samples/test-network
./network.sh down &> /dev/null
sleep 2

cd ../..

log_success "Hyperledger Fabric network is down"
