# Hyperledger Fabric + Solana

## Prerequisites

* Docker & Docker Compose
* Node.js and npm
* Rust toolchain
* Solana CLI
* Anchor CLI

## Architecture Overview
The key insight is that **Fabric handles encryption/decryption and signature verification**, while Solana provides transparent vote recording and state management.
```
┌─────────────────┐      ┌─────────────────┐     ┌─────────────────┐
│     User        │      │   Fabric HLF    │     │     Solana      │
│  (Solana Key)   │      │   (Chaincode)   │     │    (Program)    │
└─────────────────┘      └─────────────────┘     └─────────────────┘
         │                         │                        │
         │─── register(sig) —─────▶│                        │
         │◄── DH pubkey ─—─────────│                        │
         │                         │                        │
         │─── vote(option,sig) ───▶│                        │
         │                         │─── encrypted vote ────▶│
         │                         │                        │
         │─── count() ────────────▶│                        │
         │◄── results ─────────────│                        │

Flow: Register → Vote (encrypted in HLF) → Record (in Solana) → Count (decrypt in HLF)
```

<details>
<summary><strong>Mermaid Diagram</strong></summary>

```mermaid
sequenceDiagram
  participant User
  participant API
  participant Solana
  participant Fabric
  
  Note over Fabric: initializeTrustedParty() creates DH keypair
  
  User->>Fabric: registerUser(solanaAddress, message, signature)
  Note right of Fabric: Verify signature<br/>Generate user DH keypair
  Fabric-->>User: User DH Public Key
  
  User->>API: createPoll(pollId, options)
  API->>Fabric: createPoll(hlfPollId, creator, options)
  API->>Solana: createPoll(pollId, options, hlfPollId)
  
  User->>API: submitVote(pollId, voteOption)
  API->>Fabric: submitVote(hlfPollId, voterAddress, voteOption, message, signature)
  Note right of Fabric: Verify signature<br/>Check duplicates<br/>Encrypt vote with shared secret<br/>(user pubkey + trusted party privkey)
  Fabric-->>API: voteId
  API->>Solana: vote(pollId, option, hlfVoteId)
  Solana-->>API: Confirm transaction
  
  User->>API: countVotes(pollId)
  API->>Fabric: countVotes(hlfPollId)
  Note right of Fabric: Decrypt votes using shared secrets<br/>Tally results
  Fabric-->>API: {OptionA: count, OptionB: count}
  API-->>User: Results
````
</details>

## QuickStart
To get the project up and running quickly, follow these steps in two separate terminal windows.
- Terminal 1 (Hyperledger Fabric & Chaincode)
```bash
mkdir -p ./bin
ln -s "$PWD/hlf.sh" ./bin/hlf
export PATH="$PWD/bin:$PATH"
hlf install && hlf start && hlf deploy && hlf run
```
- Terminal 2 (Solana Program)
```bash
cd solana-program
npm install
anchor build
anchor test
```

- Extra: Cleanup & HLF help (Terminal 1)
```bash
hlf help
hlf stop
```
--- 
## Setup Instructions
1. Set up `hlf` CLI (dev-friendly)

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

2. Start Hyperledger Fabric Network
```bash
hlf install
hlf start
```
_Installs Fabric Docker images/binaries, clones `fabric-samples` repo and start test network._

3. Deploy & Run the Fabric chaincode
```bash
hlf deploy
hlf run
```
_Deploys chaincode (as-a-service), installs dependencies, builds, and runs it._

4. Run the Solana program
```bash
cd solana-program
npm install
anchor build
anchor test
```
