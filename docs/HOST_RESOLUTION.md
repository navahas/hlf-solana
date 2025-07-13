# Host Machine Resolution for Docker

This guide explains how to configure your host machine so Docker
containers—especially those using Chaincode-as-a-Service (CaaS)—can access
services running locally using `host.docker.internal`.

## What is `host.docker.internal`?

`host.docker.internal` is a special DNS name that resolves to the host’s IP from within
a container, enabling communication from containers to services on your machine.

> [!NOTE]
> While Docker Desktop (macOS/Windows) provides this automatically, plain Docker Engine on Linux **does not** provide this automatic resolution by default. Linux requires explicit container configuration for `host.docker.internal` to resolve correctly from within containers.

## Configuration Steps

### 1. For Host Machine Resolution (macOS/Windows & Host Services on Linux)

This step maps `host.docker.internal` to `127.0.0.1` in your **host machine's** `/etc/hosts` file. This is primarily for Docker Desktop users or if services on your host machine need to resolve this name.

* **Add Host Entry to `/etc/hosts`:**
```bash
# Open /etc/hosts (Linux/macOS) or C:\Windows\System32\drivers\etc\hosts (Windows)
# Add the following line:
127.0.0.1        host.docker.internal
```

* **Verify Host Resolution:**
```bash
ping host.docker.internal
```
You should see responses from `127.0.0.1`.

### 2. For Docker Containers on Linux (Crucial for CaaS)

For containers running on Linux (e.g., your Fabric peers) to resolve `host.docker.internal` to your host's actual IP, you must configure this when launching the container.

* **Find Your Host's Docker Bridge IP:**
On your **host machine**, run this to find the IP reachable by containers:
```bash
HOST_IP=$(ip route get 1.1.1.1 | grep -oP 'src \K\S+' | head -1)
echo "Your host's reachable IP for containers is: $HOST_IP"
```
(e.g., `172.18.0.1` or `192.168.1.58`). This IP is used for container mapping and should be the one added to `/etc/hosts`.

* **Configure Container Host Mapping:**
The specific deployment script used in `GUIDE.md` ensure this configuration in the connection section, where the address is updated to apply the mapping. Otherwise, for containers (e.g., Fabric peers) to connect to `host.docker.internal` must have this mapping provided during their creation. This is typically done via `extra_hosts` in `docker-compose.yaml` or `--add-host` in `docker run`.

**Example for a container's configuration:**
```yaml
# In a docker-compose.yaml for a peer service:
services:
  peer0.org1.example.com:
    # ...
    extra_hosts:
      - "host.docker.internal:${HOST_IP}" # Use the IP found above
    # ...
```
