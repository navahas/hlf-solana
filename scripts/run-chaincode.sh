#!/usr/bin/env bash

set -e

CHAINCODE_ENV_FILE="./scripts/chaincode.txt"
if [[ ! -f "$CHAINCODE_ENV_FILE" ]]; then
  echo "[!] No chaincode environment found. Run deploy first."
  exit 1
fi

source "$CHAINCODE_ENV_FILE"
cd chaincode
npm run build
npm run start
