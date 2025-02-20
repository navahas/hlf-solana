import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';

@Info({ title: 'PingContract', description: 'Contrato para verificar conectividad' })
export class PingContract extends Contract {
    
    @Transaction()
    @Returns('string')
    public async ping(ctx: Context): Promise<string> {
        return 'Pong';
    }
    @Transaction()
    @Returns('string')
    public async ping2(ctx: Context, name: string): Promise<string> {
        return `Pong ${name}`;
    }
} 