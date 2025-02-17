import { Context, Contract, Info, Returns, Transaction } from 'fabric-contract-api';

@Info({ title: 'CalculadoraContract', description: 'Contrato para operaciones matemáticas básicas' })
export class CalculadoraContract extends Contract {
    
    @Transaction()
    @Returns('number')
    public async sumar(ctx: Context, a: number, b: number): Promise<number> {
        return a + b;
    }

    @Transaction()
    @Returns('number')
    public async restar(ctx: Context, a: number, b: number): Promise<number> {
        return a - b;
    }

    @Transaction()
    @Returns('number')
    public async multiplicar(ctx: Context, a: number, b: number): Promise<number> {
        return a * b;
    }

    @Transaction()
    @Returns('number')
    public async dividir(ctx: Context, a: number, b: number): Promise<number> {
        if (b === 0) {
            throw new Error('No se puede dividir por cero');
        }
        return a / b;
    }
} 