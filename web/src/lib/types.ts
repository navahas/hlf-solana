export interface User {
  address: string;
  name: string;
  role: string;
  connected: boolean;
}
export interface Participant {
  userAddress: string;
  name: string;
  role: string;
}
export interface Token {
  id: string;
  balance: string;
  name: string;
  features: string;
  creator: string;
  timestamp: string;
  parentTokenId: string;
  amount: string;
}

export interface TokenSalida {
  id: bigint;
  balance: bigint;
  name: string;
  features: string;
  creator: string;
  timestamp: bigint;
  parentTokenId: bigint;
  amount: bigint;
}

export interface Transfer {
  id: string;
  tokenId: string;
  from: string;
  to: string;
  amount: string;
  timestamp: string;
  status: number;
}

export interface TransferData {
  id: bigint;
  tokenId: bigint;
  from: string;
  to: string;
  amount: bigint;
  timestamp: bigint;
  status: number;
}
