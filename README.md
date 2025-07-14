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

Run from the root of the project:

```bash
mkdir -p ./bin
ln -s "$PWD/hlf.sh" ./bin/hlf
export PATH="$PWD/bin:$PATH"
```

You can now use `hlf` instead of `./hlf.sh`.

To persist the path, add `export PATH="$PWD/bin:$PATH"` to your `.bashrc` or `.zshrc`.

### 2. Start Hyperledger Fabric network

```bash
hlf start
```

This will:
  * Start the test network
  * Deploy the chaincode (as-a-service)
  * Output `CHAINCODE_ID` and `CHAINCODE_SERVER_ADDRESS` for development use

### 3. Run the Solana program

```bash
cd solana-program
npm install
anchor build
anchor test
```
