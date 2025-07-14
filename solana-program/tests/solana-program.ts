import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaProgram } from "../target/types/solana_program";
import { connectFabric } from "./hlf";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

export async function airdropSol(provider: anchor.AnchorProvider, pubkey: anchor.web3.PublicKey, sol = 2) {
    try {
        const connection = provider.connection;
        const signature = await connection.requestAirdrop(pubkey, sol * LAMPORTS_PER_SOL);

        const latestBlockhash = await connection.getLatestBlockhash();

        await connection.confirmTransaction(
            {
                signature,
                blockhash: latestBlockhash.blockhash,
                lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            },
            "confirmed"
        );
    } catch (error) {
        console.error("Airdrop failed:", error);
        throw error;
    }
}

describe("Hyperledger Fabric Connection", () => {
    function hlfToJson(result: Uint8Array<ArrayBufferLike>) {
        return Buffer.from(result).toString('utf-8');
    }

    it("HLF PingContract", async () => {
        const pingContract = await connectFabric('PingContract');
        const result = await pingContract.submitTransaction('ping');
        const pong = hlfToJson(result);
        console.log(pong);
    });
});

describe("Integrated Voting System", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.solanaProgram as Program<SolanaProgram>;

    let votingContract: any;
    let trustedPartyPublicKey: string;

    function hlfToJson(result: Uint8Array<ArrayBufferLike>) {
        return JSON.parse(Buffer.from(result).toString('utf-8'));
    }

    before(async () => {
        // Connect to HLF chaincode
        votingContract = await connectFabric('TrustedVotingContract');

        // Initialize trusted party
        const initResult = await votingContract.submitTransaction('initializeTrustedParty');
        const initData = hlfToJson(initResult);
        trustedPartyPublicKey = initData.publicKey;
        console.log("Trusted party initialized:", trustedPartyPublicKey);
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

        // Register users in HLF
        const user1Result = await votingContract.submitTransaction('registerUser', voter1.publicKey.toString());
        const user2Result = await votingContract.submitTransaction('registerUser', voter2.publicKey.toString());

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

        // Vote 1: Submit encrypted vote to HLF
        const vote1Result = await votingContract.submitTransaction(
            'submitVote',
            hlfPollId,
            voter1.publicKey.toString(),
            vote1Option
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

        // Vote 2: Submit encrypted vote to HLF
        const vote2Result = await votingContract.submitTransaction(
            'submitVote',
            hlfPollId,
            voter2.publicKey.toString(),
            vote2Option
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
