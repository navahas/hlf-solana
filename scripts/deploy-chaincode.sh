#!/usr/bin/env bash

set -e

source "$(dirname "$0")/log.sh"

log_info "Deploying chaincode..."

cd ./fabric-samples/test-network
./network.sh deployCCAAS \
    -ccn basicts \
    -ccp ../asset-transfer-basic/chaincode-typescript \
    -ccl typescript &> /dev/null
sleep 2

cd ../..

CHAINCODE_ID=$(docker logs peer0.org1.example.com 2>&1 | grep "Successfully installed chaincode with package ID" | awk -F"'" '{print $2}')
CHAINCODE_SERVER_ADDRESS="host.docker.internal:9998"

if [ -z "$CHAINCODE_ID" ]; then
    log_error "Failed to extract CHAINCODE_ID from docker logs."
    exit 1
fi

log_misc "CHAINCODE_ID: $CHAINCODE_ID"
log_misc "CHAINCODE_SERVER_ADDRESS: $CHAINCODE_SERVER_ADDRESS"

# Export for current shell
export CHAINCODE_ID
export CHAINCODE_SERVER_ADDRESS

CHAINCODE_ENV_FILE="./scripts/chaincode.txt"
echo "export CHAINCODE_ID=\"$CHAINCODE_ID\"" > "$CHAINCODE_ENV_FILE"
echo "export CHAINCODE_SERVER_ADDRESS=\"$CHAINCODE_SERVER_ADDRESS\"" >> "$CHAINCODE_ENV_FILE"
log_info "Chaincode environment written to $CHAINCODE_ENV_FILE"

cd ./chaincode
npm install &> /dev/null
npm build &> /dev/null

log_success "Chaincode deployed and built."

echo ""
log_msg "Start the chaincode"
log_msg "cd chaincode && npm run start"
echo ""
