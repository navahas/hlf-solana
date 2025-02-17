"use client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ethers, Interface } from "ethers";

import { getDeployedTo } from "@/lib/clientLib";
import { useSearchParams } from "next/navigation";

const { ADDRESS, ABI } = getDeployedTo("tokenizarContract");
if (!ADDRESS || !ABI) {
  throw new Error("Tokenizar contract not found");
}

export default function TokenizarPage() {
  const searchParams = useSearchParams();
  const tokenId = searchParams.get("tokenId");
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    features: "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
      if (!ADDRESS || !ABI) {
        throw new Error("Tokenizar contract not found");
      }
      const contract = new ethers.Contract(
        ADDRESS,
        ABI as Interface,
        signer
      );

      const tx = await contract.createToken(
        formData.name,
        ethers.parseUnits(formData.amount, "ether"),
        formData.features.replace(/\n/g, "|"),
        tokenId ? BigInt(tokenId) : BigInt(0) // parentTokenId - assuming 0 as default, modify as needed
      );

      await tx.wait();

      toast({
        title: "Success",
        description: "Token created successfully",
      });

      // Reset form
      setFormData({
        name: "",
        amount: "",
        features: "",
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create token",
      });
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Token</CardTitle>
        {tokenId && <CardDescription>Token PADRE ID: {tokenId}</CardDescription>}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="features">Features</Label>
            <Textarea
              rows={10}
              id="features"
              value={formData.features}
              onChange={(e) =>
                setFormData({ ...formData, features: e.target.value })
              }
              required
            />
          </div>

          <Button type="submit" className="w-full">
            Create Token
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
