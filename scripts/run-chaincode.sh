#!/usr/bin/env bash

set -e

source "$(dirname "$0")/log.sh"

CHAINCODE_ENV_FILE="./chaincode/.env"
if [[ ! -f "$CHAINCODE_ENV_FILE" ]]; then
  log_error "No chaincode environment found. Run deploy first."
  exit 1
fi

# Patch ip based on the host, WSL and macOS work with host.docker.internal in 127.0.0.1
if grep -qi 'host.docker.internal' "$CHAINCODE_ENV_FILE"; then
  if [[ "$(uname -s)" == "Linux" ]]; then
    # log_warn "Linux detected: patching CHAINCODE_SERVER_ADDRESS to 0.0.0.0"
    sed -i 's|^CHAINCODE_SERVER_ADDRESS=.*|CHAINCODE_SERVER_ADDRESS="0.0.0.0:9998"|' "$CHAINCODE_ENV_FILE"
  fi
fi

cd chaincode
npm run build
npm run start-env
