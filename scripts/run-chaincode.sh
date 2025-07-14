#!/usr/bin/env bash

set -e

source "$(dirname "$0")/log.sh"

CHAINCODE_ENV_FILE="./chaincode/.env"
if [[ ! -f "$CHAINCODE_ENV_FILE" ]]; then
  log_error "No chaincode environment found. Run deploy first."
  exit 1
fi

# source "$CHAINCODE_ENV_FILE"
cd chaincode
npm run build
npm run start-env
