import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';
import {ethers} from 'ethers';
interface User {
    ethereumAddress: string;
    role: string;
}

@Info({ title: 'UserContract', description: 'Contrato para gestionar usuarios con direcciones Ethereum como identificador único y roles' })
export class UserContract extends Contract {

    // Inicializar el contrato
    @Transaction()
    public async initLedger(ctx: Context): Promise<void> {
        console.log('Inicializando el contrato de usuarios');
        // Podemos pre-cargar algunos usuarios de ejemplo si es necesario
        const users: User[] = [
            {
                ethereumAddress: '0x1234567890123456789012345678901234567890',
                role: 'admin'
            },
        ];
        for (const user of users) {
            const key = this.getUserKey(user.ethereumAddress);
            await ctx.stub.putState(`admin:key`, Buffer.from(JSON.stringify(user)));
        }
    }

    // Clave para almacenar usuarios
    private getUserKey(ethereumAddress: string): string {
        return `user:${ethereumAddress}`;
    }

    @Transaction()
    public async createUser(ctx: Context, ethereumAddress: string, role: string, signature: string, message: string): 
    Promise<void> {

        // validar que el uusuario de la firma es un admin
        const messageHash = ethers.hashMessage(message);
        const signerAddress = ethers.recoverAddress(messageHash, signature);

        const adminKey = `admin:key`;
        const adminBuffer = await ctx.stub.getState(adminKey);
        const admin = JSON.parse(adminBuffer.toString());


        if (signerAddress.toLowerCase() !== admin.ethereumAddress.toLowerCase()) {
            throw new Error(`La firma no corresponde al usuario ${ethereumAddress}`);
        }

        const key = this.getUserKey(ethereumAddress);
        
        // Verificar si el usuario ya existe
        const exists = await this.userExists(ctx, ethereumAddress);
        if (exists) {
            throw new Error(`El usuario con dirección Ethereum ${ethereumAddress} ya existe`);
        }

        const user: User = {
            ethereumAddress,
            role
        };

        await ctx.stub.putState(key, Buffer.from(JSON.stringify(user)));
    }

    @Transaction(false)
    @Returns('boolean')
    public async userExists(ctx: Context, ethereumAddress: string): Promise<boolean> {
        const key = this.getUserKey(ethereumAddress);
        const userBuffer = await ctx.stub.getState(key);
        return userBuffer && userBuffer.length > 0;
    }

    @Transaction(false)
    @Returns('string')
    public async readUser(ctx: Context, ethereumAddress: string): Promise<string> {
        const key = this.getUserKey(ethereumAddress);
        const userBuffer = await ctx.stub.getState(key);
        
        if (!userBuffer || userBuffer.length === 0) {
            throw new Error(`El usuario con dirección Ethereum ${ethereumAddress} no existe`);
        }
        
        return userBuffer.toString();
    }

    @Transaction()
    public async updateUser(ctx: Context, ethereumAddress: string, role: string): Promise<void> {
        const key = this.getUserKey(ethereumAddress);
        
        // Verificar si el usuario existe
        const exists = await this.userExists(ctx, ethereumAddress);
        if (!exists) {
            throw new Error(`El usuario con dirección Ethereum ${ethereumAddress} no existe`);
        }

        const user: User = {
            ethereumAddress,
            role
        };

        
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(user)));
    }

    @Transaction()
    public async deleteUser(ctx: Context, ethereumAddress: string): Promise<void> {
        const key = this.getUserKey(ethereumAddress);
        
        // Verificar si el usuario existe
        const exists = await this.userExists(ctx, ethereumAddress);
        if (!exists) {
            throw new Error(`El usuario con dirección Ethereum ${ethereumAddress} no existe`);
        }

        await ctx.stub.deleteState(key);
    }

    @Transaction(false)
    @Returns('string')
    public async getAllUsers(ctx: Context): Promise<string> {
        const startKey = 'user:';
        const endKey = 'user:~';
        
        const iterator = await ctx.stub.getStateByRange(startKey, endKey);
        
        const users = [];
        let result = await iterator.next();
        
        while (!result.done) {
            const userString = Buffer.from(result.value.value.toString()).toString('utf8');
            let user;
            try {
                user = JSON.parse(userString);
                users.push(user);
            } catch (err) {
                console.log(err);
            }
            result = await iterator.next();
        }
        
        await iterator.close();
        
        return JSON.stringify(users);
    }

    @Transaction(false)
    @Returns('string')
    public async getUsersByRole(ctx: Context, role: string): Promise<string> {
        const allUsersString = await this.getAllUsers(ctx);
        const allUsers: User[] = JSON.parse(allUsersString);
        
        const filteredUsers = allUsers.filter(user => user.role === role);
        
        return JSON.stringify(filteredUsers);
    }
}
