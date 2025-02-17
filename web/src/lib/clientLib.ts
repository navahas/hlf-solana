

import tokenizar from "@/lib/tokenizar.txt";
import user from "@/lib/user.txt";
import TOKENIZAR_ABI from "@/lib/contracts/Tokenizar.json";
import USER_ABI from "@/lib/contracts/UserContract.json";
import { ethers, Interface } from "ethers";
import { User, Participant } from "@/lib/types";
 
export function getDeployedTo(contract: string): {ADDRESS: string , ABI: object}  {
    if (contract === "tokenizarContract") {
        const deployedToMatch = tokenizar.match(/Deployed to: (0x[a-fA-F0-9]{40})/);
        return {ADDRESS: deployedToMatch ? deployedToMatch[1] : null, ABI: TOKENIZAR_ABI};
    }
    if (contract === "userContract") {
        const deployedToMatch = user.match(/Deployed to: (0x[a-fA-F0-9]{40})/);
        return {ADDRESS: deployedToMatch ? deployedToMatch[1] : null, ABI: USER_ABI};
    }
    return {ADDRESS: "contract not found", ABI: {}};
}


export const fetchUsers = async (): Promise<User[]> =>  {
    if (!window.ethereum)
         return [];
    const {ADDRESS, ABI} = getDeployedTo("userContract");
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
      return formattedUsers;
    } catch (error) {
      throw error;
    }
  };
