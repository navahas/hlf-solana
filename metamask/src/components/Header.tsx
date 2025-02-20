import { useWeb3 } from '@/context/Web3Context';

export default function Header() {
  const { account, connect, disconnect, isConnected } = useWeb3();

  return (
    <header className="p-4 bg-gray-800 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-xl font-bold">MetaMask Demo</h1>
        <div>
          {isConnected ? (
            <div className="flex items-center gap-4">
              <span className="text-sm">
                {account?.slice(0, 6)}...{account?.slice(-4)}
              </span>
              <button
                onClick={disconnect}
                className="bg-red-500 px-4 py-2 rounded hover:bg-red-600"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connect}
              className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
} 