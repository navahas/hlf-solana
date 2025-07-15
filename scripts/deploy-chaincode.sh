#!/usr/bin/env bash

set -e

source "$(dirname "$0")/log.sh"

./scripts/clear-cc-containers.sh

DEPLOY_SCRIPT="./fabric-samples/test-network/scripts/deployCCAAS.sh"
log_info "Ensuring deployCCAAS.sh patch..."

# Patch endorsement policy (line 18) and chaincode address (line 89)
if sed --version >/dev/null 2>&1; then
    # GNU sed (Linux)
    sed -i 's|^CC_END_POLICY=.*|CC_END_POLICY="OR('\''Org1MSP.member'\'')"|' "$DEPLOY_SCRIPT"
    sed -i 's|"address": ".*"|"address": "host.docker.internal:9998"|' "$DEPLOY_SCRIPT"
else
    # macOS BSD sed
    sed -i '' 's|^CC_END_POLICY=.*|CC_END_POLICY="OR('\''Org1MSP.member'\'')"|' "$DEPLOY_SCRIPT"
    sed -i '' 's|"address": ".*"|"address": "host.docker.internal:9998"|' "$DEPLOY_SCRIPT"
fi

log_info "Deploying chaincode..."

cd ./fabric-samples/test-network

if ./network.sh deployCCAAS \
     -ccn basicts \
     -ccp ../asset-transfer-basic/chaincode-typescript \
     -ccl typescript &> /dev/null; then
    log_success "Chaincode deployed via Fabric script"
else
    log_error "Chaincode deployment failed. Re-run with manual command for full logs:"
    echo "  ./fabric-samples/test-network/network.sh deployCCAAS -ccn basicts -ccp ../asset-transfer-basic/chaincode-typescript -ccl typescript"
    exit 1
fi

sleep 2

cd ../..

CHAINCODE_ID=$(docker logs peer0.org1.example.com 2>&1 \
    | grep "Successfully installed chaincode with package ID" \
    | tail -n1 \
    | awk -F"'" '{print $2}')
CHAINCODE_SERVER_ADDRESS="host.docker.internal:9998"

if [ -z "$CHAINCODE_ID" ]; then
    log_error "Failed to extract CHAINCODE_ID from docker logs."
    exit 1
fi

log_misc "CHAINCODE_ID: $CHAINCODE_ID"
log_misc "CHAINCODE_SERVER_ADDRESS: $CHAINCODE_SERVER_ADDRESS"

CHAINCODE_ENV_FILE="./chaincode/.env"
echo "CHAINCODE_ID=\"$CHAINCODE_ID\"" > "$CHAINCODE_ENV_FILE"
echo "CHAINCODE_SERVER_ADDRESS=\"$CHAINCODE_SERVER_ADDRESS\"" >> "$CHAINCODE_ENV_FILE"
log_info "Chaincode environment written to $CHAINCODE_ENV_FILE"

cd ./chaincode

# load nvm as local fix, todo a dependency verification/inyection script
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use default &> /dev/null
npm install &> /dev/null
npm run build &> /dev/null

log_success "Chaincode deployed and built."

log_msg "Start the chaincode"
log_msg "hlf run"
