"use client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ethers, Interface } from "ethers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDeployedTo } from "@/lib/clientLib";
import { useSearchParams } from "next/navigation";
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



export default function TraceTokenPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const tokenId = searchParams.get("tokenId");

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

        const transferData = await contract.getTokenTrace(tokenId);

        const formattedTransfers = transferData.map((transfer: TransferData) => ({
          id: transfer.id.toString(),
          tokenId: transfer.tokenId.toString(),
          from: transfer.from,
          to: transfer.to,
          amount: ethers.formatEther(transfer.amount),
          timestamp: new Date(Number(transfer.timestamp) * 1000).toLocaleString(),
          status: transfer.status,
        }));

        setTransfers(formattedTransfers);
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load transfer history",
        });
      }
    };

    if (tokenId) {
      loadTransfers();
    }
  }, [toast, tokenId]);

  
  return (
    <Card className="w-5/6">
      <CardHeader>
        <CardTitle>Token Transfer History</CardTitle>
      </CardHeader>
      <CardContent>
        {transfers.length === 0 ? (
          <p className="text-center text-muted-foreground">No transfer history found</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transfer ID</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
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
                  <TableCell className="font-mono">{transfer.from}</TableCell>  
                  <TableCell className="font-mono">{transfer.to}</TableCell>
                  <TableCell>{transfer.amount}</TableCell>
                  <TableCell>{transfer.timestamp}</TableCell>
                  <TableCell>
                    {transfer.status == 0
                      ? "Pending"
                      : transfer.status == 1
                      ? "Accepted"
                      : "Rejected"}
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
