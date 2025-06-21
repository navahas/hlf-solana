# Project: Development Guide PFM-TRAZA-HLF-2025
This guide provides step-by-step instructions for setting up and running the
Hyperledger Fabric development environment for the PFM-TRAZA-HLF-2025 project.

- Initial version kept as legacy guide: [LEGACY_GUIDE.md](./LEGACY_GUIDE.md)

## Setting Up the Development Environment - Hyperledger Fabric

### Handy Hyperledger Fabric Resources
For a deeper understanding of Hyperledger Fabric, refer to the official documentation:
1. [Hyperledger Fabric Prerequisites](https://hyperledger-fabric.readthedocs.io/en/latest/prereqs.html)
2. [Getting Started - Run Fabric](https://hyperledger-fabric.readthedocs.io/en/latest/getting_started_run_fabric.html)

### Prerequisites
Before you begin, ensure you have the following installed and configured on your system:

1. **Docker & Docker Compose:**
- Docker Desktop (which includes Docker Engine and Docker Compose) from the [official Docker website](https://docs.docker.com/get-docker/).
Verify your installation by running:
```bash
docker --version
docker compose version
```

2. **Fabric Samples, Binaries, and Docker Images:**
These components are essential for running and interacting with Hyperledger Fabric.
Execute the following commands in your terminal:

```bash
# Download the Fabric install script
# From: https://hyperledger-fabric.readthedocs.io/en/release-2.5/install.html
curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh

# Run the script to download Docker images, binaries, and samples
./install-fabric.sh docker samples binary
```
This will create a `fabric-samples` directory in your current location.

3. **Host Machine Resolution for Docker:**
When running Hyperledger Fabric chaincode as an external service
(Chaincode-as-a-Service - CaaS), Docker containers often need to communicate
back to services running on your host machine.

To enable this, you need to ensure your system can resolve `host.docker.internal` to your loopback IP address (`127.0.0.1`).
**Verify your `/etc/hosts` file:**
Open `/etc/hosts` (on Linux/macOS) or `C:\Windows\System32\drivers\etc\hosts`
(on Windows) with administrator/root privileges.
```bash
sudo nano /etc/hosts # For Linux/macOS
```
Look for an entry like `127.0.0.1 host.docker.internal`. If it's not present,
or if you see `kubernetes.docker.internal` but not `host.docker.internal` and
your setup specifically requires `host.docker.internal`, add the following
line:
```
127.0.0.1       host.docker.internal
```
*Note:* Docker Desktop usually adds `kubernetes.docker.internal` automatically,
which often serves a similar purpose. However, if your chaincode or other
components are explicitly configured to use `host.docker.internal`, this step
is crucial.

## Fabric Test Network

### Terminal #1 - Starting the Fabric Test Network With Channel
Inside `./fabric-samples/test-network` directory, bring the network up:
```bash
cd fabric-samples/test-network
./network.sh down
./network.sh up createChannel -ca -c mychannel
```

### Terminal #1 - Modify Connection Address & Deploy Chaincode
1. Inside `./fabric-samples/test-network/scripts/deployCCAAS.sh` change the address in the line `89`:
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
