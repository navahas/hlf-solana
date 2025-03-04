import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';

interface User {
    ethereumAddress: string;
    role: string;
}

@Info({ title: 'UserContract', description: 'Contrato para gestionar usuarios con direcciones Ethereum como identificador único y roles' })
export class UserContract extends Contract {

    // Clave para almacenar usuarios
    private getUserKey(ethereumAddress: string): string {
        return `user:${ethereumAddress}`;
    }

    @Transaction()
    public async createUser(ctx: Context, ethereumAddress: string, role: string): Promise<void> {
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
