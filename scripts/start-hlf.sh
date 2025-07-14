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
if ! ping -c 1 host.docker.internal &> /dev/null; then
    log_error "'host.docker.internal' is not resolvable on your system."
    log_error " → See docs/HOST_RESOLUTION.md for fix instructions."
    exit 1
fi

log_warn "Deploying chaincode..."
./network.sh deployCCAAS \
    -ccn basicts \
    -ccp ../asset-transfer-basic/chaincode-typescript \
    -ccl typescript &> /dev/null
    sleep 2

    cd ../..

    CHAINCODE_ID=$(docker logs peer0.org1.example.com 2>&1 | grep "Successfully installed chaincode with package ID" | awk -F"'" '{print $2}')
    CHAINCODE_SERVER_ADDRESS="host.docker.internal:9998"

    log_misc "CHAINCODE_ID: $CHAINCODE_ID"
    log_misc "CHAINCODE_SERVER_ADDRESS: $CHAINCODE_SERVER_ADDRESS"

# Export for current shell
export CHAINCODE_ID
export CHAINCODE_SERVER_ADDRESS

./clear-cc-containers.sh
sleep 1

log_success "[✓] Hyperledger Fabric network is ready."
