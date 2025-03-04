import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import { ethers } from 'ethers';
interface Token {
    id: string;
    owner: string;
    name: string;
    amount: number;
    attributes: Record<string, any>;
}

@Info({ title: 'TokenizarContract', description: 'Contrato para tokenizar y transferir tokens entre usuarios' })
export class TokenizarContract extends Contract {

    // Clave para almacenar tokens
    private getTokenKey(tokenId: string, ownerAddress: string): string {
        return `token:${tokenId}:owner:${ownerAddress}`;

    }
    private getTokenKeyByOwner(ownerAddress: string, tokenId: string): string {
        return `owner:${ownerAddress}:token:${tokenId}`;
    }

    @Transaction()
    public async createToken(ctx: Context, tokenId: string, 
                                    ownerAddress: string, 
                                    name: string, 
                                    amount: number, 
                                    attributesJSON: string,
                                    signature: string,
                                    message: string
                                
                                ): Promise<void> {

        const key = this.getTokenKey(tokenId, ownerAddress);
        
        // Validar la firma utilizando ethe
        
        try {
            // Recuperar la dirección que firmó el mensaje
            // El mensaje firmado debería contener al menos el tokenId y el ownerAddress
            
            const messageHash = ethers.hashMessage(message);
            const signerAddress = ethers.recoverAddress(messageHash, signature);
            
            // Verificar que la dirección recuperada coincide con la dirección del propietario
            if (signerAddress.toLowerCase() !== ownerAddress.toLowerCase()) {
                throw new Error(`La firma no corresponde al propietario ${ownerAddress}`);
            }
            
            // Si llegamos aquí, la firma es válida
            console.log(`Firma validada correctamente para el propietario ${ownerAddress}`);
        } catch (error) {
            throw new Error(`Error al validar la firma: ${error.message}`);
        }
        // Verificar si el token ya existe
        const exists = await this.tokenExists(ctx, tokenId, ownerAddress);
        if (exists) {
            throw new Error(`El token con ID ${tokenId} para el propietario ${ownerAddress} ya existe`);
        }

        const attributes = JSON.parse(attributesJSON);
        
        const token: Token = {
            id: tokenId,
            owner: ownerAddress,
            name,
            amount,
            attributes
        };

        await ctx.stub.putState(key, Buffer.from(JSON.stringify(token)));
    }

    @Transaction(false)
    @Returns('boolean')
    public async tokenExists(ctx: Context, tokenId: string, ownerAddress: string): Promise<boolean> {
        const key = this.getTokenKey(tokenId, ownerAddress);
        const tokenBuffer = await ctx.stub.getState(key);
        return tokenBuffer && tokenBuffer.length > 0;
    }

    @Transaction(false)
    @Returns('string')
    public async readToken(ctx: Context, tokenId: string, ownerAddress: string): Promise<string> {
        const key = this.getTokenKey(tokenId, ownerAddress);
        const tokenBuffer = await ctx.stub.getState(key);
        
        if (!tokenBuffer || tokenBuffer.length === 0) {
            throw new Error(`El token con ID ${tokenId} para el propietario ${ownerAddress} no existe`);
        }
        
        return tokenBuffer.toString();
    }

    @Transaction()
    public async updateToken(ctx: Context, tokenId: string, ownerAddress: string, name: string, amount: number, attributesJSON: string): Promise<void> {
        const key = this.getTokenKey(tokenId, ownerAddress);
        
        // Verificar si el token existe
        const exists = await this.tokenExists(ctx, tokenId, ownerAddress);
        if (!exists) {
            throw new Error(`El token con ID ${tokenId} para el propietario ${ownerAddress} no existe`);
        }

        const attributes = JSON.parse(attributesJSON);
        
        const token: Token = {
            id: tokenId,
            owner: ownerAddress,
            name,
            amount,
            attributes
        };
        
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(token)));
    }

    @Transaction()
    public async transferToken(ctx: Context, tokenId: string, fromAddress: string, toAddress: string, amount: number, signature: string): Promise<void> {
        // Verificar la firma (en una implementación real, se verificaría la firma criptográfica)
        // Esta es una simplificación, en un entorno real se debería verificar que la firma corresponde a fromAddress
        
        try {
            // Recuperar la dirección que firmó el mensaje
            // El mensaje firmado debería contener al menos el tokenId y el ownerAddress
            const message = `tokenId:${tokenId},fromAddress:${fromAddress},toAddress:${toAddress},amount:${amount}`;
            const messageHash = ethers.hashMessage(message);
            const signerAddress = ethers.recoverAddress(messageHash, signature);
            
            // Verificar que la dirección recuperada coincide con la dirección del propietario
            if (signerAddress.toLowerCase() !== fromAddress.toLowerCase()) {
                throw new Error(`La firma no corresponde al propietario ${fromAddress}`);
            }
            
        } catch (error) {
            throw new Error(`Error al validar la firma: ${error.message}`);
        }
            
        if (!signature) {
            throw new Error('Se requiere una firma válida para transferir tokens');
        }

        const fromKey = this.getTokenKey(tokenId, fromAddress);
        const toKey = this.getTokenKey(tokenId, toAddress);
        
        // Verificar si el token del remitente existe
        const fromTokenBuffer = await ctx.stub.getState(fromKey);
        if (!fromTokenBuffer || fromTokenBuffer.length === 0) {
            throw new Error(`El token con ID ${tokenId} para el propietario ${fromAddress} no existe`);
        }
        
        const fromToken: Token = JSON.parse(fromTokenBuffer.toString());
        
        // Verificar si el remitente tiene suficientes tokens
        if (fromToken.amount < amount) {
            throw new Error(`El propietario ${fromAddress} no tiene suficientes tokens para transferir`);
        }
        
        // Actualizar el balance del remitente
        fromToken.amount -= amount;
        
        // Si el balance llega a cero, eliminar el token
        if (fromToken.amount === 0) {
            await ctx.stub.deleteState(fromKey);
        } else {
            await ctx.stub.putState(fromKey, Buffer.from(JSON.stringify(fromToken)));
        }
        
        // Verificar si el destinatario ya tiene tokens del mismo tipo
        const toTokenBuffer = await ctx.stub.getState(toKey);
        if (!toTokenBuffer || toTokenBuffer.length === 0) {
            // Crear un nuevo token para el destinatario
            const toToken: Token = {
                id: tokenId,
                owner: toAddress,
                name: fromToken.name,
                amount: amount,
                attributes: fromToken.attributes
            };
            
            await ctx.stub.putState(toKey, Buffer.from(JSON.stringify(toToken)));
        } else {
            // Actualizar el token existente del destinatario
            const toToken: Token = JSON.parse(toTokenBuffer.toString());
            toToken.amount += amount;
            
            await ctx.stub.putState(toKey, Buffer.from(JSON.stringify(toToken)));
        }
    }

   
    @Transaction(false)
    @Returns('string')
    public async getAllTokens(ctx: Context): Promise<string> {
        const startKey = 'token:';
        const endKey = 'token:~';
        
        const iterator = await ctx.stub.getStateByRange(startKey, endKey);
        
        const tokens = [];
        let result = await iterator.next();
        
        while (!result.done) {
            const tokenString = Buffer.from(result.value.value.toString()).toString('utf8');
            let token;
            try {
                token = JSON.parse(tokenString);
                tokens.push(token);
            } catch (err) {
                console.log(err);
            }
            result = await iterator.next();
        }
        
        await iterator.close();
        
        return JSON.stringify(tokens);
    }

    @Transaction(false)
    @Returns('string')
    public async getTokensByOwner(ctx: Context, ownerAddress: string): Promise<string> {
        const startKey = `token:`;
        const endKey = `token:~`;
        
        const iterator = await ctx.stub.getStateByRange(startKey, endKey);
        
        const tokens = [];
        let result = await iterator.next();
        
        while (!result.done) {
            const tokenString = Buffer.from(result.value.value.toString()).toString('utf8');
            let token;
            try {
                token = JSON.parse(tokenString);
                if (token.owner === ownerAddress) {
                    tokens.push(token);
                }
            } catch (err) {
                console.log(err);
            }
            result = await iterator.next();
        }
        
        await iterator.close();
        
        return JSON.stringify(tokens);
    }
}
