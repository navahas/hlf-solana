"use client";
import { Button } from "@/components/ui/button";
import { useGlobalContext } from "@/context/GlobalContext";
import { getDeployedTo } from "@/lib/clientLib";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";
const { ADDRESS, ABI } = getDeployedTo("userContract");
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string }) => Promise<string[]>;
      isMetaMask?: boolean;
      removeAllListeners: () => void;
      on: (event: string, callback: (accounts: string[]) => void) => void;
    };
  }
}

interface User {
  userAddress: string;
  name: string;
  role: string;
  isActive: boolean;
}
export function Header() {
  const { user, setUser } = useGlobalContext();
  

  const router = useRouter();


  async function getUser(address: string): Promise<User | false | undefined> {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not found");
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contract = new ethers.Contract(ADDRESS, ABI as any, signer);
      const participantes: User[] = await contract.getParticipants();
      console.log("particinpantes", participantes);
      const user = participantes.find(
        (participant: User) =>
          participant.userAddress.toLowerCase() == address.toLowerCase()
      );
      console.log("user", user);
      console.log("address", address);
      if (!user) {
        return false;
      }
      const userData: User = {
        userAddress: user.userAddress,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      };
      return userData;
    } catch (error) {
      console.error("Error checking registration:", error);
      return false;
    }
  }

  async function checkUser(address: string): Promise<User | false | undefined> {
    const user: User | false | undefined = await getUser(address);
    if (user) {
      setUser(user);
      router.push("/dashboard");
      return user;
    }
  }

  const connectWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      if (!user) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        console.log("accounts", accounts);
        if (accounts.length > 0) {
          await checkUser(accounts[0]);
        }
      }

      // Listen for account changes

      window.ethereum.on("accountsChanged", async (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected wallet
          setUser(null);
          router.push("/");
        } else {
          // User switched accounts
          await checkUser(accounts[0]);
        }
      });
    }
  };

  const disconnectWallet = () => {
    setUser(null);

    router.push("/");
  };

  return (
    <header className="w-full">
      <div className="container flex h-16 items-center justify-between">
        <div className="text-2xl font-bold">Trazabilidad Octubre 2024</div>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground">
                {user.name} ({user.role}) {user.userAddress}
              </span>
              <Button onClick={disconnectWallet} variant="outline">
                Disconnect
              </Button>
            </>
          ) : (
            <Button onClick={connectWallet}>Connect Wallet</Button>
          )}
        </div>
      </div>
    </header>
  );
}
