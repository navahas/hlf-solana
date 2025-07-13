# Project: Development Guide PFM-TRAZA-HLF-2025
This guide provides step-by-step instructions for setting up and running the
Hyperledger Fabric development environment for the PFM-TRAZA-HLF-2025 project.

- Initial version kept as legacy guide: [LEGACY_GUIDE.md](./docs/LEGACY_GUIDE.md)

### Handy Hyperledger Fabric Resources
For a deeper understanding of Hyperledger Fabric, refer to the official documentation:
1. [Hyperledger Fabric Prerequisites](https://hyperledger-fabric.readthedocs.io/en/latest/prereqs.html)
2. [Getting Started - Run Fabric](https://hyperledger-fabric.readthedocs.io/en/latest/getting_started_run_fabric.html)

## Setting Up the Development Environment - Hyperledger Fabric
### Prerequisites
- Docker & Docker Compose
Verify by running: 
```
docker --version
docker compose version
```
- Docker Host Resolution
Verify by running:
```
ping host.docker.internal
```
If you see `ping: cannot resolve host.docker.internal: Unknown host` go to the [HOST_RESOLUTION.md](./docs/HOST_RESOLUTION.md) section for more information.
- Install Fabric Samples, Binaries and Docker Images:
```bash
# To get the install script 
# From: https://hyperledger-fabric.readthedocs.io/en/release-2.5/install.html
curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh

# Run the script
./install-fabric.sh docker samples binary
```

## Fabric Test Network

### Terminal #1 - Starting the Fabric Test Network With Channel
Inside `./fabric-samples/test-network` directory, bring the network up:
```bash
cd fabric-samples/test-network
./network.sh down
```
To start the network 
```bash
./network.sh up createChannel -c mychannel
```
To start the network with CA
```bash
./network.sh up createChannel -ca -c mychannel
```

### Terminal #1 - Modify Connection Address & Deploy Chaincode
1. Inside `./fabric-samples/test-network/scripts/deployCCAAS.sh` change the following:
- Endorsment policy in line `18`:
```bash
CC_END_POLICY="OR('Org1MSP.member')"
```
- Address in the line `89`:
```bash
cat > "$tempdir/src/connection.json" <<CONN_EOF
{
  "address": "host.docker.internal:9998",
  "dial_timeout": "10s",
  "tls_required": false
}
CONN_EOF
```
2. Deploy and extract `CHAINCODE_ID`
```bash
./network.sh deployCCAAS \
  -ccn basicts \
  -ccp ../asset-transfer-basic/chaincode-typescript \
  -ccl typescript
```
---
### Terminal #2 - Deploying Chaincode (Smart-Contrac)
Inside `./chaincode`
1. Set environment variables (adjust `CHAINCODE_ID` based on previous deployment logs)
```bash
export CHAINCODE_SERVER_ADDRESS=host.docker.internal:9998
export CHAINCODE_ID=basicts_1.0:$CHAINCODE_ID_HERE
# E.G: export CHAINCODE_ID=basicts_1.0:c16a3518b8c6969ac9896e621bb42f74f9b31624ca8ea0508bdfda1daa8d090d
```
2. Manually Running the Chaincode Server
Once deployed, you can run the chaincode as an external service:
```bash
# Install dependencies and build
npm install
npm run build

# Start the chaincode server
npm run start
```
---
### Terminal #3 - Connect API to the Chaincode
Inside `./api`:
```
npm i && npm run start
```
---
### Terminal #4 - Verify Ping
```
curl http://localhost:5551/ping
```
