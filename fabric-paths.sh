#!/usr/bin/env bash
ROOT="$(realpath ./fabric-samples/test-network)"
BASE="${ROOT}/organizations/peerOrganizations/org1.example.com"

CERT="${BASE}/users/User1@org1.example.com/msp/signcerts/cert.pem"
KEY_DIR="${BASE}/users/User1@org1.example.com/msp/keystore"
TLS_CERT="${BASE}/peers/peer0.org1.example.com/tls/ca.crt"

KEY="$(find "$KEY_DIR" -type f | head -n 1)"

echo -e "- Resolved certificate path"
echo -e "- Resolved private key path"
echo -e "- Resolved TLS cert path\n\r"

chmod 600 "$CERT" "$KEY" "$TLS_CERT"
chmod -R u+rx "$(dirname "$CERT")"
chmod -R u+rx "$(dirname "$KEY")"
chmod -R u+rx "$(dirname "$TLS_CERT")"

echo "> File persmissions are ready"
