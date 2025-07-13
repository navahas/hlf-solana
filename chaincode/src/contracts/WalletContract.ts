import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import * as crypto from 'crypto';

interface DHUser {
    id: string;
    publicKey: string;
    privateKey: string;
}

interface EncryptedMessage {
    encryptedData: string;
    iv: string;
    authTag: string;
}

@Info({ title: 'WalletContract', description: 'PoC for Diffie-Hellman encryption/decryption between users' })
export class WalletContract extends Contract {
    // Fixed prime and generator values for consistent DH parameters
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
        return {
            encryptedData: encrypted.toString('hex'),
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }

    private decrypt(encryptedMessage: EncryptedMessage, sharedSecret: Buffer): string {
        const key = crypto.createHash('sha256').update(sharedSecret).digest();
        const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(encryptedMessage.iv, 'hex'));
        decipher.setAuthTag(Buffer.from(encryptedMessage.authTag, 'hex'));
        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(encryptedMessage.encryptedData, 'hex')),
            decipher.final()
        ]);
        return decrypted.toString('utf8');
    }

    @Transaction()
    public async createUser(ctx: Context, id: string): Promise<string> {
        const { publicKey, privateKey } = this.generateDHKeyPair();
        const user: DHUser = { id, publicKey, privateKey };
        await ctx.stub.putState(`user:${id}`, Buffer.from(JSON.stringify(user)));
        return JSON.stringify({ id, publicKey });
    }

    @Transaction()
    public async encryptMessage(ctx: Context, senderId: string, recipientId: string, message: string): Promise<string> {
        const sender = await this.getUser(ctx, senderId);
        const recipient = await this.getUser(ctx, recipientId);
        const sharedSecret = this.computeSharedSecret(sender.privateKey, recipient.publicKey);
        const encrypted = this.encrypt(message, sharedSecret);
        return JSON.stringify(encrypted);
    }

    @Transaction()
    public async decryptMessage(ctx: Context, recipientId: string, senderId: string, encryptedData: string, iv: string, authTag: string): Promise<string> {
        const recipient = await this.getUser(ctx, recipientId);
        const sender = await this.getUser(ctx, senderId);
        const sharedSecret = this.computeSharedSecret(recipient.privateKey, sender.publicKey);
        const encrypted: EncryptedMessage = { encryptedData, iv, authTag };
        const decrypted = this.decrypt(encrypted, sharedSecret);
        return JSON.stringify({ decrypted });
    }

    private async getUser(ctx: Context, id: string): Promise<DHUser> {
        const userBuffer = await ctx.stub.getState(`user:${id}`);
        if (!userBuffer || userBuffer.length === 0) {
            throw new Error(`User ${id} not found`);
        }
        return JSON.parse(userBuffer.toString());
    }
}
