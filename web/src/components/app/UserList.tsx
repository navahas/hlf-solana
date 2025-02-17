"use client";
import { Button } from "@/components/ui/button";
import { getDeployedTo } from "@/lib/clientLib";
import { Participant, User } from "@/lib/types";
import { ethers, Interface } from "ethers";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";

const {ADDRESS, ABI} = getDeployedTo("userContract");


export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [metaMaskUser, setMetaMaskUser] = useState<string[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!window.ethereum) return;

      try {

        const provider = new ethers.BrowserProvider(window.ethereum);
        
        const contractAddress = ADDRESS;
        const contractABI = ABI;
        const contract = new ethers.Contract(
          contractAddress,
          contractABI as Interface,
          provider
        );

        const participants = await contract.getParticipants();

        const formattedUsers: User[] = participants.map(
          (participant: Participant) => ({
            address: participant.userAddress,
            name: participant.name,
            role: participant.role,
          })
        );
        console.log(formattedUsers);
        setUsers(formattedUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    fetchUsers();
  }, []);

  
  useEffect(() => {
    const checkConnectedAccounts = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_accounts"
          });
          setMetaMaskUser(accounts);
          // Update users with connection status
          

        } catch (error) {
          console.error("Error checking connected accounts:", error);
        }
      }
    };

    checkConnectedAccounts();

    // Listen for account changes
    
  }, []);


  

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Participantes</h1>
        <Link href="/dashboard/admin/users/add">
          <Button>Add New User</Button>
        </Link>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Address</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user: User, index) => (
              <TableRow key={index}>
                <TableCell className="font-mono">{user.address}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-sm ${
                      user.role === "admin"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {user.role}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="border rounded-lg mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Connected MetaMask Accounts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metaMaskUser.map((account, index) => (
              <TableRow key={index}>
                <TableCell className="font-mono">{account}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
