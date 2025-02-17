"use client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ethers, Interface } from "ethers";
import { useSearchParams } from "next/navigation";
import { fetchUsers } from "@/lib/clientLib";
import { useGlobalContext } from "@/context/GlobalContext";
import { getDeployedTo } from "@/lib/clientLib";

const { ADDRESS, ABI } = getDeployedTo("tokenizarContract");
if (!ADDRESS || !ABI) {
  throw new Error("Tokenizar contract not found");
}

const rolesTransfer: Record<string, string[]> = {
  producer: ["factory"],
  factory: ["retailer"],
  retailer: ["consumer"],
};
export default function TransferPage() {
  const { user } = useGlobalContext();
  const searchParams = useSearchParams();
  const tokenId = searchParams.get("tokenId");
  const balance = searchParams.get("amount");

  const [formData, setFormData] = useState({
    tokenId: tokenId,
    amount: "",
    toAddress: "",
  });

  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadParticipants = async () => {
      try {
        const users: User[] = await fetchUsers();
        const filteredUsers = users.filter((u) =>
          rolesTransfer[user?.role as string].includes(u.role)
        );
        setUsers(filteredUsers);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load participants",
        });
      }
    };

    loadParticipants();
  }, [toast, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate amount is not greater than balance
    if (Number(formData.amount) > Number(balance)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Transfer amount cannot exceed your balance",
      });
      return;
    }

    if (!window.ethereum) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please install MetaMask to use this feature",
      });
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(ADDRESS, ABI as Interface, signer);

      const tx = await contract.transferToken(
        tokenId,
        formData.toAddress,
        ethers.parseUnits(formData.amount.toString(), "ether")
      );

      await tx.wait();

      toast({
        title: "Success",
        description: "Transfer initiated successfully",
      });

      // Reset form
      setFormData({
        amount: "0",
        toAddress: "",
        tokenId: tokenId,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to initiate transfer",
      });
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Transfer Token</CardTitle>
        <CardDescription>
          <span> idToken: {tokenId}</span>
          <span> balance: {ethers.formatUnits(balance || "0", "ether")}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="toAddress">Select Recipient</Label>
            <select
              id="toAddress"
              value={formData.toAddress}
              onChange={(e) =>
                setFormData({ ...formData, toAddress: e.target.value })
              }
              className="w-full px-3 py-2 border rounded-md"
              required
            >
              <option value="">Select a recipient...</option>
              {users?.map((user) => (
                <option key={user.address} value={user.address}>
                  {user.name} ({user.role}) - {user.address}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (Max: {balance})</Label>
            <Input
              id="amount"
              type="number"
              step="any"
              max={balance || "0"}
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              required
            />
          </div>

          <Button type="submit" className="w-full">
            Transfer Token
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
