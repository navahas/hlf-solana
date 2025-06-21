# Host Machine Resolution for Docker

This guide explains how to configure your host machine so Docker
containers—especially those using Chaincode-as-a-Service (CaaS)—can access
services running locally using `host.docker.internal`.

## What is `host.docker.internal`?

`host.docker.internal` is a special DNS name supported by Docker Desktop
(macOS/Windows) and some Linux setups. It resolves to the host’s IP from within
a container, enabling communication from containers to services on your
machine.

## Configuration Steps

Follow these steps to map `host.docker.internal` to `127.0.0.1` on your host:

### 1. Open the Hosts File

You'll need admin/root access to edit your system’s hosts file:

- **Linux/macOS:**

```bash
sudo nano /etc/hosts
# or
sudo vim /etc/hosts
```
- Windows:
Navigate to `C:\Windows\System32\drivers\etc\hosts`, right-click the file, and open it with Notepad as Administrator.

### 2. Add Host Entry

At the end of the file, add:
```
127.0.0.1       host.docker.internal
```
> [!NOTE]
> Note: Docker may auto-configure this inside containers, but adding it to your host file ensures consistency, especially for services relying on this hostname directly.

### 3. Save Changes
```
nano: Ctrl + O, Enter, then Ctrl + X
vim: Press Esc, type :wq, then press Enter
Notepad: Use File > Save
```

### Verify
Run this to confirm the mapping:
```
ping host.docker.internal
```
You should see responses from 127.0.0.1, confirming successful resolution.
