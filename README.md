# Hyperledger Fabric + Solana

## Prerequisites

* Docker & Docker Compose
* Node.js and npm
* Rust toolchain
* Solana CLI – [Install Guide](https://docs.solana.com/cli/install-solana)
* Anchor CLI

## Architecture Overview

<details>
<summary><strong>Mermaid Diagram</strong></summary>

```mermaid
sequenceDiagram
  participant User
  participant API
  participant Solana
  participant Fabric

  User->>Fabric: registerUser(solanaAddress)
  Fabric-->>User: DH Public Key

  User->>API: submitVote(pollId, voteOption)

  API->>Fabric: submitVote()
  Note right of Fabric: Encrypt vote using DH\nshared secret (user, trusted party)
  Fabric-->>API: Encrypted vote ID

  API->>Solana: vote(pollId, option, hlfVoteId)
  Solana-->>API: Confirm transaction

  User->>API: countVotes(pollId)
  API->>Fabric: countVotes()
  Note right of Fabric: Decrypt and tally votes
  Fabric-->>API: {OptionA: 1, OptionB: 1}

  API-->>User: Results
````
</details>

## Setup Instructions

### 1. Set up `hlf` CLI (dev-friendly)

The main script for interacing with the project is `./hlf.sh`. To use it like a CLI tool(`hlf`), you can symlink for convenience.

Run the following from the root of the project:
```bash
mkdir -p ./bin
ln -s "$PWD/hlf.sh" ./bin/hlf
```
Then, add the bin directory to your shell’s PATH:
```bash
export PATH="$PWD/bin:$PATH"
```
> [!NOTE]
> This export is only valid for your current shell session. If you start a new terminal, you’ll need to re-export or add it to your shell profile (`~/.bashrc`, `~/.zshrc`).

To see all the options run `hlf help`

### 2. Start Hyperledger Fabric Network
```bash
hlf install
hlf start
```
This will:
- Install fabric `docker images`, `binaries` and clone `fabric-samples` repo.
- Start the test network

### 3. Deploy & Run the Fabric chaincode

```bash
hlf deploy
hlf run
```
This will:
- Deploy the chaincode (as-a-service)
- Install dependencies and build the chaincode (typescript)
- Run the chaincode

### 4. Run the Solana program

```bash
cd solana-program
npm install
anchor build
anchor test
```

### 5. Clean Environment
To gracefully shut down the network and clean up any leftover chaincode containers:
```bash
hlf stop
```
This will:
- Stop the Fabric test network
- Remove any chaincode containers left from previous runs
