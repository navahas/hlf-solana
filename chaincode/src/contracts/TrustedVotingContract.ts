import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import * as crypto from 'crypto';

interface DHUser {
    id: string;
    publicKey: string;
    // Remove privateKey - not stored for users
}

interface EncryptedMessage {
    encryptedData: string;
    // iv and authTag are handled internally by chaincode
}

interface ChaincodeTrustedParty {
    publicKey: string;
    privateKey: string;
}

interface Vote {
    pollId: string;
    voterAddress: string;
    encryptedVote: string;
    timestamp: number;
}

interface Poll {
    id: string;
    options: string[];
    creator: string;
    isActive: boolean;
    votes: Vote[];
}

@Info({ title: 'TrustedVotingContract', description: 'Trusted third party for encrypted voting' })
export class TrustedVotingContract extends Contract {
    private readonly DH_PRIME = 'FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AACAA68FFFFFFFFFFFFFFFF';
    private readonly DH_GENERATOR = 2;

    private generateDHKeyPair(): { publicKey: string; privateKey: string } {
        const dh = crypto.createDiffieHellman(this.DH_PRIME, 'hex', this.DH_GENERATOR);
        dh.generateKeys();
        return {
            publicKey: dh.getPublicKey('hex'),
            privateKey: dh.getPrivateKey('hex')
        };
    }

    private computeSharedSecret(privateKey: string, publicKey: string): Buffer {
        const dh = crypto.createDiffieHellman(this.DH_PRIME, 'hex', this.DH_GENERATOR);
        dh.setPrivateKey(Buffer.from(privateKey, 'hex'));
        return dh.computeSecret(Buffer.from(publicKey, 'hex'));
    }

    private encrypt(data: string, sharedSecret: Buffer): EncryptedMessage {
        const key = crypto.createHash('sha256').update(sharedSecret).digest();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();

        // Store iv and authTag internally, only return encrypted data
        const fullEncryptedData = Buffer.concat([iv, authTag, encrypted]);
        return {
            encryptedData: fullEncryptedData.toString('hex')
        };
    }

    private decrypt(encryptedMessage: EncryptedMessage, sharedSecret: Buffer): string {
        const key = crypto.createHash('sha256').update(sharedSecret).digest();
        const fullData = Buffer.from(encryptedMessage.encryptedData, 'hex');

        // Extract iv, authTag, and encrypted data
        const iv = fullData.subarray(0, 16);
        const authTag = fullData.subarray(16, 32);
        const encryptedData = fullData.subarray(32);

        const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
        decipher.setAuthTag(authTag);
        const decrypted = Buffer.concat([
            decipher.update(encryptedData),
            decipher.final()
        ]);
        return decrypted.toString('utf8');
    }

    // Initialize the trusted party (chaincode's own key pair)
    @Transaction()
    @Returns('string')
    public async initializeTrustedParty(ctx: Context): Promise<string> {
        const existingParty = await ctx.stub.getState('trustedParty');
        if (existingParty && existingParty.length > 0) {
            const party = JSON.parse(existingParty.toString());
            return JSON.stringify({ publicKey: party.publicKey });
        }

        const { publicKey, privateKey } = this.generateDHKeyPair();
        const trustedParty: ChaincodeTrustedParty = { publicKey, privateKey };
        await ctx.stub.putState('trustedParty', Buffer.from(JSON.stringify(trustedParty)));
        return JSON.stringify({ publicKey });
    }

    // Register a user (Solana address)
    @Transaction()
    @Returns('string')
    public async registerUser(ctx: Context, solanaAddress: string): Promise<string> {
        const { publicKey } = this.generateDHKeyPair();
        const user: DHUser = { id: solanaAddress, publicKey };
        await ctx.stub.putState(`user:${solanaAddress}`, Buffer.from(JSON.stringify(user)));
        return JSON.stringify({ id: solanaAddress, publicKey });
    }

    // Create a poll
    @Transaction()
    @Returns('string')
    public async createPoll(ctx: Context, pollId: string, creator: string, options: string): Promise<string> {
        const optionsArray = JSON.parse(options);
        const poll: Poll = {
            id: pollId,
            options: optionsArray,
            creator,
            isActive: true,
            votes: []
        };
        await ctx.stub.putState(`poll:${pollId}`, Buffer.from(JSON.stringify(poll)));
        return JSON.stringify({ pollId, options: optionsArray });
    }

    // Submit encrypted vote
    @Transaction()
    @Returns('string')
    public async submitVote(ctx: Context, pollId: string, voterAddress: string, voteOption: string): Promise<string> {
        // Get user and trusted party
        const user = await this.getUser(ctx, voterAddress);
        const trustedParty = await this.getTrustedParty(ctx);

        // Encrypt the vote using shared secret between user and trusted party
        const sharedSecret = this.computeSharedSecret(trustedParty.privateKey, user.publicKey);
        const encryptedVote = this.encrypt(voteOption, sharedSecret);

        // Store the vote
        const vote: Vote = {
            pollId,
            voterAddress,
            encryptedVote: encryptedVote.encryptedData,
            timestamp: Date.now()
        };

        await ctx.stub.putState(`vote:${pollId}:${voterAddress}`, Buffer.from(JSON.stringify(vote)));
        return JSON.stringify({ success: true, voteId: `${pollId}:${voterAddress}` });
    }

    // Count votes (decrypt and tally)
    @Transaction()
    @Returns('string')
    public async countVotes(ctx: Context, pollId: string): Promise<string> {
        const trustedParty = await this.getTrustedParty(ctx);
        const poll = await this.getPoll(ctx, pollId);

        // Get all votes for this poll
        const iterator = await ctx.stub.getStateByPartialCompositeKey('vote', [pollId]);
        const votes: { [option: string]: number } = {};

        // Initialize vote counts
        poll.options.forEach(option => {
            votes[option] = 0;
        });

        let result = await iterator.next();
        while (!result.done) {
            const vote = JSON.parse(result.value.value.toString()) as Vote;

            // Get user to decrypt vote
            const user = await this.getUser(ctx, vote.voterAddress);
            const sharedSecret = this.computeSharedSecret(trustedParty.privateKey, user.publicKey);

            const decryptedVote = this.decrypt({ encryptedData: vote.encryptedVote }, sharedSecret);

            if (votes.hasOwnProperty(decryptedVote)) {
                votes[decryptedVote]++;
            }

            result = await iterator.next();
        }

        await iterator.close();
        return JSON.stringify({ pollId, results: votes });
    }

    // Get trusted party public key
    @Transaction(false)
    @Returns('string')
    public async getTrustedPartyPublicKey(ctx: Context): Promise<string> {
        const trustedParty = await this.getTrustedParty(ctx);
        return JSON.stringify({ publicKey: trustedParty.publicKey });
    }

    private async getUser(ctx: Context, id: string): Promise<DHUser> {
        const userBuffer = await ctx.stub.getState(`user:${id}`);
        if (!userBuffer || userBuffer.length === 0) {
            throw new Error(`User ${id} not found`);
        }
        return JSON.parse(userBuffer.toString());
    }

    private async getTrustedParty(ctx: Context): Promise<ChaincodeTrustedParty> {
        const partyBuffer = await ctx.stub.getState('trustedParty');
        if (!partyBuffer || partyBuffer.length === 0) {
            throw new Error('Trusted party not initialized');
        }
        return JSON.parse(partyBuffer.toString());
    }

    private async getPoll(ctx: Context, pollId: string): Promise<Poll> {
        const pollBuffer = await ctx.stub.getState(`poll:${pollId}`);
        if (!pollBuffer || pollBuffer.length === 0) {
            throw new Error(`Poll ${pollId} not found`);
        }
        return JSON.parse(pollBuffer.toString());
    }
}
