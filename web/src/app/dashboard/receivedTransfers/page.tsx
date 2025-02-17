"use client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ethers, Interface } from "ethers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDeployedTo } from "@/lib/clientLib";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Transfer, TransferData } from "@/lib/types";

const { ADDRESS, ABI } = getDeployedTo("tokenizarContract");

export default function ReceivedTransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const { toast } = useToast();


  useEffect(() => {
    const loadTransfers = async () => {
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
        const contract = new ethers.Contract(
          ADDRESS,
          ABI as Interface,
          signer
        );
        const address = await signer.getAddress();

        const transferData = await contract.getReceivedTransfers(address);

        const formattedTransfers = transferData.map(
          (transfer: TransferData) => ({
            id: transfer.id.toString(),
            tokenId: transfer.tokenId.toString(),
            from: transfer.from,
            to: transfer.to,
            amount: ethers.formatEther(transfer.amount),
            timestamp: new Date(
              Number(transfer.timestamp) * 1000
            ).toLocaleString(),
            status: transfer.status,
          })
        );

        setTransfers(formattedTransfers);
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load received transfers",
        });
      }
    };

    loadTransfers();
  }, [toast]);

  const handleAcceptTransfer = async (transferId: string) => {
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
      const contract = new ethers.Contract(ADDRESS, ABI as Interface , signer);
      console.log("transferId", transferId);
      const tx = await contract.acceptTransfer(parseInt(transferId));
      await tx.wait();

      toast({
        title: "Success",
        description: "Transfer accepted successfully",
      });

      // Reload transfers after accepting
      // setChange(!change);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to accept transfer",
      });
    }
  };

  const handleRejectTransfer = async (transferId: string) => {
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
      const contract = new ethers.Contract(
        ADDRESS,
        ABI as Interface,
        signer
      );

      const tx = await contract.rejectTransfer(transferId);
      await tx.wait();

      toast({
        title: "Success",
        description: "Transfer rejected successfully",
      });

      // Reload transfers after rejecting
      //setChange(!change);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject transfer",
      });
    }
  };

  return (
    <Card className="w-3/4">
      <CardHeader>
        <CardTitle>Received Transfers</CardTitle>
      </CardHeader>
      <CardContent>
        {transfers.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No received transfers found
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transfer ID</TableHead>
                <TableHead>Token ID</TableHead>
                <TableHead>From</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell>{transfer.id}</TableCell>
                  <TableCell>{transfer.tokenId}</TableCell>
                  <TableCell className="font-mono">{transfer.from}</TableCell>
                  <TableCell>{transfer.amount}</TableCell>
                  <TableCell>{transfer.timestamp}</TableCell>
                  <TableCell>
                    {transfer.status == 0
                      ? "Pending"
                      : transfer.status == 1
                      ? "Accepted"
                      : "Rejected"}
                  </TableCell>
                  <TableCell>
                    {transfer.status == 0 && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAcceptTransfer(transfer.id)}
                          variant="outline"
                        >
                          Confirmar
                        </Button>
                        <Button
                          onClick={() => handleRejectTransfer(transfer.id)}
                          variant="outline"
                        >
                          Rechazar
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
