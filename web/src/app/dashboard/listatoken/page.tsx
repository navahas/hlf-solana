"use client";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ethers, Interface } from "ethers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDeployedTo } from "@/lib/clientLib";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useGlobalContext } from "@/context/GlobalContext";
const { ADDRESS, ABI } = getDeployedTo("tokenizarContract");
import { Token, TokenSalida } from "@/lib/types";

export default function ListaTokenPage() {
  const { user } = useGlobalContext();
  const [tokens, setTokens] = useState<Token[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadTokens = async () => {
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

        const tokenSalidas = await contract.getAddressTokens(
          await signer.getAddress()
        );

        const formattedTokens = tokenSalidas.map((token: TokenSalida) => ({
          id: token.id.toString(),
          balance: token.balance.toString(),
          name: token.name,
          features: token.features,
          creator: token.creator,
          timestamp: new Date(Number(token.timestamp) * 1000).toLocaleString(),
          parentTokenId: token.parentTokenId.toString(),
          amount: token.amount.toString(),
        }));

        console.log(formattedTokens);
        setTokens(formattedTokens);
      } catch (error) {
        console.error(error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load tokens",
        });
      }
    };

    loadTokens();
  }, [toast]);
  if (!user) return null;
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Your Tokens</CardTitle>
      </CardHeader>
      <CardContent>
        {tokens.length === 0 ? (
          <p className="text-center text-muted-foreground">No tokens found</p>
        ) : (
          <div className="space-y-4">
            {tokens.map((token) => (
              <Card key={token.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-2">
                      <p className="font-medium">Token ID: {token.id}</p>
                      <p className="font-medium">Nombre: {token.name}</p>
                      <ul className="font-medium">
                        Features:{" "}
                        {token.features.split("|").map((linea, index) => (
                          <li className="ml-20" key={index}>
                            {index + 1}. {linea}
                          </li>
                        ))}
                      </ul>
                      <p className="font-medium">Creador: {token.creator}</p>
                      <p className="font-medium">
                        Timestamp: {token.timestamp}
                      </p>
                      {token.parentTokenId != "0" && (
                        <p className="font-medium">
                          Parent Token ID: {token.parentTokenId}
                        </p>
                      )}
                      <p className="font-medium">
                        Amount Tokenizado: {Number(token.amount) / 10 ** 18}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Balance: {Number(token.balance) / 10 ** 18}
                      </p>

                      <div className="flex gap-2">
                        {user && user.role !== "consumer" && (
                          <Button variant="outline">
                            <Link
                              href={`/dashboard/transfer?tokenId=${token.id}&amount=${token.amount}`}
                            >
                              Transferir
                            </Link>
                          </Button>
                        )}

                        <Button variant="outline">
                          <Link
                            href={`/dashboard/traceToken?tokenId=${token.id}`}
                          >
                            Trace {user.role}
                          </Link>
                        </Button>
                        {user &&
                          ["factory", "producer"].includes(user.role) && (
                            <Button variant="outline">
                              <Link
                                href={`/dashboard/tokenizar?tokenId=${token.id}`}
                              >
                                Crear Tokens
                              </Link>
                            </Button>
                          )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
