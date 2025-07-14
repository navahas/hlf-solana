import { PingContract } from './contracts/PingContract';
import { DiffieHellman } from './contracts/DiffieHellman';
import { TrustedVotingContract } from './contracts/TrustedVotingContract';
export { PingContract } from './contracts/PingContract';
export { DiffieHellman } from './contracts/DiffieHellman';
export { TrustedVotingContract } from './contracts/TrustedVotingContract';

export const contracts: any[] = [
    PingContract,
    DiffieHellman,
    TrustedVotingContract
]; 
