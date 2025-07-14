import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaProgram } from "../target/types/solana_program";
import { connectFabric } from "./hlf";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import * as bs58 from "bs58";
import nacl from 'tweetnacl';

async function airdropSol(provider: anchor.AnchorProvider, pubkey: anchor.web3.PublicKey, sol = 2) {
    try {
        const connection = provider.connection;
        const signature = await connection.requestAirdrop(pubkey, sol * LAMPORTS_PER_SOL);
        const latestBlockhash = await connection.getLatestBlockhash();
        await connection.confirmTransaction({
            signature,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        }, "confirmed");
    } catch (error) {
        console.error("Airdrop failed:", error);
        throw error;
    }
}

function signMessage(keypair: Keypair, message: string): string {
    const messageBytes = new TextEncoder().encode(message);
    const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
    return bs58.encode(signature);
}

function hlfToJson(result: Uint8Array<ArrayBufferLike>) {
    const data = Buffer.from(result).toString('utf-8');
    try {
        return JSON.parse(data);
    } catch(e) {
        return data;
    }
}

describe("Hyperledger Fabric Connection", () => {
    it("HLF PingContract", async () => {
        const pingContract = await connectFabric('PingContract');
        const result = await pingContract.submitTransaction('ping');
        console.log(hlfToJson(result));
    });
});

describe("Signature Verification Tests", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    let votingContract: any;

    before(async () => {
        votingContract = await connectFabric('TrustedVotingContract');
        await votingContract.submitTransaction('initializeTrustedParty');
    });

    it("Should reject invalid signature on user registration", async () => {
        const user = Keypair.generate();
        const message = "register-user";
        const wrongSignature = "invalid-signature";

        try {
            await votingContract.submitTransaction(
                'registerUser',
                user.publicKey.toString(),
                message,
                wrongSignature
            );
            throw new Error("Should have failed");
        } catch (error) {
            console.log("✓ Correctly rejected invalid signature:", error.message);
        }
    });

    it("Should reject registration with wrong signer", async () => {
        const user1 = Keypair.generate();
        const user2 = Keypair.generate();
        const message = "register-user";
        const signature = signMessage(user2, message); // Wrong signer

        try {
            await votingContract.submitTransaction(
                'registerUser',
                user1.publicKey.toString(),
                message,
                signature
            );
            throw new Error("Should have failed");
        } catch (error) {
            console.log("✓ Correctly rejected wrong signer:", error.message);
        }
    });

    it("Should reject duplicate user registration", async () => {
        const user = Keypair.generate();
        const message = "register-user";
        const signature = signMessage(user, message);

        // First registration should succeed
        const result1 = await votingContract.submitTransaction(
            'registerUser',
            user.publicKey.toString(),
            message,
            signature
        );
        console.log("First registration:", hlfToJson(result1));

        // Second registration should fail
        try {
            await votingContract.submitTransaction(
                'registerUser',
                user.publicKey.toString(),
                message,
                signature
            );
            throw new Error("Should have failed");
        } catch (error) {
            console.log("✓ Correctly rejected duplicate registration:", error.message);
        }
    });

    it("Should reject invalid vote signature", async () => {
        const voter = Keypair.generate();
        const creator = Keypair.generate();

        // Register user
        const regMessage = "register-user";
        const regSignature = signMessage(voter, regMessage);
        await votingContract.submitTransaction(
            'registerUser',
            voter.publicKey.toString(),
            regMessage,
            regSignature
        );

        // Create poll
        const pollId = "test-poll-signature";
        const options = ["Option A", "Option B"];
        await votingContract.submitTransaction(
            'createPoll',
            pollId,
            creator.publicKey.toString(),
            JSON.stringify(options)
        );

        // Try to vote with invalid signature
        const voteMessage = "vote-option-a";
        const invalidSignature = "invalid-signature";

        try {
            await votingContract.submitTransaction(
                'submitVote',
                pollId,
                voter.publicKey.toString(),
                "Option A",
                voteMessage,
                invalidSignature
            );
            throw new Error("Should have failed");
        } catch (error) {
            console.log("✓ Correctly rejected invalid vote signature:", error.message);
        }
    });

    it("Should reject vote from wrong signer", async () => {
        const voter1 = Keypair.generate();
        const voter2 = Keypair.generate();
        const creator = Keypair.generate();

        // Register users
        const regMessage = "register-user";
        await votingContract.submitTransaction(
            'registerUser',
            voter1.publicKey.toString(),
            regMessage,
            signMessage(voter1, regMessage)
        );
        await votingContract.submitTransaction(
            'registerUser',
            voter2.publicKey.toString(),
            regMessage,
            signMessage(voter2, regMessage)
        );

        // Create poll
        const pollId = "test-poll-wrong-signer";
        const options = ["Option A", "Option B"];
        await votingContract.submitTransaction(
            'createPoll',
            pollId,
            creator.publicKey.toString(),
            JSON.stringify(options)
        );

        // Try to vote as voter1 but with voter2's signature
        const voteMessage = "vote-option-a";
        const wrongSignature = signMessage(voter2, voteMessage);

        try {
            await votingContract.submitTransaction(
                'submitVote',
                pollId,
                voter1.publicKey.toString(),
                "Option A",
                voteMessage,
                wrongSignature
            );
            throw new Error("Should have failed");
        } catch (error) {
            console.log("✓ Correctly rejected wrong signer for vote:", error.message);
        }
    });

    it("Should reject duplicate votes", async () => {
        const voter = Keypair.generate();
        const creator = Keypair.generate();

        // Register user
        const regMessage = "register-user";
        await votingContract.submitTransaction(
            'registerUser',
            voter.publicKey.toString(),
            regMessage,
            signMessage(voter, regMessage)
        );

        // Create poll
        const pollId = "test-poll-duplicate";
        const options = ["Option A", "Option B"];
        await votingContract.submitTransaction(
            'createPoll',
            pollId,
            creator.publicKey.toString(),
            JSON.stringify(options)
        );

        // First vote should succeed
        const voteMessage = "vote-option-a";
        const signature = signMessage(voter, voteMessage);
        const result1 = await votingContract.submitTransaction(
            'submitVote',
            pollId,
            voter.publicKey.toString(),
            "Option A",
            voteMessage,
            signature
        );
        console.log("First vote:", hlfToJson(result1));

        // Second vote should fail
        try {
            await votingContract.submitTransaction(
                'submitVote',
                pollId,
                voter.publicKey.toString(),
                "Option B",
                voteMessage,
                signature
            );
            throw new Error("Should have failed");
        } catch (error) {
            console.log("✓ Correctly rejected duplicate vote:", error.message);
        }
    });

    it("Should reject vote for invalid option", async () => {
        const voter = Keypair.generate();
        const creator = Keypair.generate();

        // Register user
        const regMessage = "register-user";
        await votingContract.submitTransaction(
            'registerUser',
            voter.publicKey.toString(),
            regMessage,
            signMessage(voter, regMessage)
        );

        // Create poll
        const pollId = "test-poll-invalid-option";
        const options = ["Option A", "Option B"];
        await votingContract.submitTransaction(
            'createPoll',
            pollId,
            creator.publicKey.toString(),
            JSON.stringify(options)
        );

        // Try to vote for invalid option
        const voteMessage = "vote-option-c";
        const signature = signMessage(voter, voteMessage);

        try {
            await votingContract.submitTransaction(
                'submitVote',
                pollId,
                voter.publicKey.toString(),
                "Option C",
                voteMessage,
                signature
            );
            throw new Error("Should have failed");
        } catch (error) {
            console.log("✓ Correctly rejected invalid vote option:", error.message);
        }
    });
});

describe("Integrated Voting System", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.solanaProgram as Program<SolanaProgram>;

    let votingContract: any;

    before(async () => {
        votingContract = await connectFabric('TrustedVotingContract');
        await votingContract.submitTransaction('initializeTrustedParty');
    });

    it("Initialize Solana program", async () => {
        const tx = await program.methods.initialize().rpc();
        console.log("Solana program initialized:", tx);
    });

    it("Complete voting flow", async () => {
        // Create test users (Solana addresses)
        const voter1 = Keypair.generate();
        const voter2 = Keypair.generate();
        const creator = Keypair.generate();

        await airdropSol(provider, creator.publicKey, 2);
        await airdropSol(provider, voter1.publicKey, 2);
        await airdropSol(provider, voter2.publicKey, 2);

        // Register users in HLF with signatures
        const regMessage = "register-user";
        const user1Result = await votingContract.submitTransaction(
            'registerUser',
            voter1.publicKey.toString(),
            regMessage,
            signMessage(voter1, regMessage)
        );
        const user2Result = await votingContract.submitTransaction(
            'registerUser',
            voter2.publicKey.toString(),
            regMessage,
            signMessage(voter2, regMessage)
        );

        console.log("User 1 registered:", hlfToJson(user1Result));
        console.log("User 2 registered:", hlfToJson(user2Result));

        // Create poll in HLF
        const pollId = "test-poll-1";
        const hlfPollId = `hlf-${pollId}`;
        const options = ["Option A", "Option B", "Option C", "Option D"];

        const pollResult = await votingContract.submitTransaction(
            'createPoll',
            hlfPollId,
            creator.publicKey.toString(),
            JSON.stringify(options)
        );
        console.log("HLF poll created:", hlfToJson(pollResult));

        // Create corresponding poll in Solana
        const [pollPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("poll"), Buffer.from(pollId)],
            program.programId
        );

        await program.methods
        .createPoll(pollId, options, hlfPollId)
        .accountsStrict({
            poll: pollPda,
            creator: creator.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([creator])
        .rpc();

        console.log("Solana poll created");

        // Submit votes
        const vote1Option = "Option A";
        const vote2Option = "Option B";

        // Vote 1: Submit encrypted vote to HLF with signature
        const vote1Message = "vote-option-a";
        const vote1Signature = signMessage(voter1, vote1Message);
        const vote1Result = await votingContract.submitTransaction(
            'submitVote',
            hlfPollId,
            voter1.publicKey.toString(),
            vote1Option,
            vote1Message,
            vote1Signature
        );
        const vote1Data = hlfToJson(vote1Result);
        console.log("Vote 1 submitted to HLF:", vote1Data);

        // Vote 1: Record vote in Solana
        const [vote1Pda] = PublicKey.findProgramAddressSync(
            [Buffer.from("vote"), Buffer.from(pollId), voter1.publicKey.toBuffer()],
            program.programId
        );

        await program.methods
        .vote(pollId, vote1Option, vote1Data.voteId)
        .accountsStrict({
            poll: pollPda,
            voteRecord: vote1Pda,
            voter: voter1.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([voter1])
        .rpc();

        // Vote 2: Submit encrypted vote to HLF with signature
        const vote2Message = "vote-option-b";
        const vote2Signature = signMessage(voter2, vote2Message);
        const vote2Result = await votingContract.submitTransaction(
            'submitVote',
            hlfPollId,
            voter2.publicKey.toString(),
            vote2Option,
            vote2Message,
            vote2Signature
        );
        const vote2Data = hlfToJson(vote2Result);
        console.log("Vote 2 submitted to HLF:", vote2Data);

        // Vote 2: Record vote in Solana
        const [vote2Pda] = PublicKey.findProgramAddressSync(
            [Buffer.from("vote"), Buffer.from(pollId), voter2.publicKey.toBuffer()],
            program.programId
        );

        await program.methods
        .vote(pollId, vote2Option, vote2Data.voteId)
        .accountsStrict({
            poll: pollPda,
            voteRecord: vote2Pda,
            voter: voter2.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([voter2])
        .rpc();

        console.log("Both votes recorded in Solana");

        // Count votes in HLF (decrypt and tally)
        const countResult = await votingContract.submitTransaction('countVotes', hlfPollId);
        const countData = hlfToJson(countResult);
        console.log("Vote count results:", countData);

        // Verify poll state in Solana
        const pollAccount = await program.account.poll.fetch(pollPda);
        console.log("Solana poll state:", {
            id: pollAccount.id,
            totalVotes: pollAccount.totalVotes.toString(),
            isActive: pollAccount.isActive
        });

        // Close poll in Solana
        await program.methods
        .closePoll(pollId)
        .accountsStrict({
            poll: pollPda,
            creator: creator.publicKey,
        })
        .signers([creator])
        .rpc();

        console.log("Poll closed in Solana");
    });

    it("Get trusted party public key", async () => {
        const result = await votingContract.submitTransaction('getTrustedPartyPublicKey');
        const data = hlfToJson(result);
        console.log("Trusted party public key:", data.publicKey);
    });
});
