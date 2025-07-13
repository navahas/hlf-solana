import { PingContract } from './contracts/PingContract';
import { CalculadoraContract } from './contracts/CalculadoraContract';
import { UserContract } from './contracts/UserContract';
import { TokenizarContract } from './contracts/TokenizarContract';
import { WalletContract } from './contracts/WalletContract';
export { PingContract } from './contracts/PingContract';
export { CalculadoraContract } from './contracts/CalculadoraContract';
export { WalletContract } from './contracts/WalletContract';

export const contracts: any[] = [
    PingContract,
    CalculadoraContract,
    UserContract,
    TokenizarContract,
    WalletContract
]; 
