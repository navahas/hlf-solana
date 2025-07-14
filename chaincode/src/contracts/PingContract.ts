import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';

@Info({ title: 'PingContract', description: 'Contrato para verificar conectividad' })
export class PingContract extends Contract {
    
    @Transaction()
    @Returns('string')
    public async ping(_ctx: Context): Promise<string> {
        return 'Pong!';
    }

    @Transaction()
    @Returns('string')
    public async pingParam(_ctx: Context, name: string): Promise<string> {
        return `Pong ${name}`;
    }

    @Transaction()
    @Returns('number')
    public async ping2(_ctx: Context): Promise<number> {
        return 111;
    }

    @Transaction()
    @Returns('boolean')
    public async pingBool(_ctx: Context): Promise<boolean> {
        return true;
    }
} 
