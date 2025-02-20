'use client';

import { ethers } from "ethers";
import { useWeb3 } from '@/context/Web3Context';
import { useState } from "react";

interface Data {
  payload: string;
  signedTx: string;
  status: string;
  account: string;
}

export default function Send() {

  const { account, provider } = useWeb3();
  const [data, setData] = useState<Data | null>(null);

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const nombre = formData.get('nombre') as string;

    if (!nombre ) {
      alert('Please fill in all fields');
      return;
    }

    if (!provider) {
      alert('Provider not connected');
      return;
    }

    const signer = await provider.getSigner();
    
    // Create transaction object
    const payload = JSON.stringify({
      to: nombre,

    });
    
    // Sign the transaction
    const signedTx = await signer.signMessage(payload);

    
    console.log("Signed transaction:", signedTx);

    // Verify the signature
    const verifiedAddress = ethers.verifyMessage(payload, signedTx);
    
    // Check if the signer address matches the connected account
    if (verifiedAddress.toLowerCase() !== account?.toLowerCase()) {
      alert('Signature verification failed - signer does not match connected account');
      return;
    }

    setData({ payload, signedTx, status: 'verified', account: verifiedAddress });
    console.log("Signature verified from address:", verifiedAddress);

    // For this example, we'll use the provider to send it
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold">Firmar un payload</h1>
      <form className="mt-8 space-y-4 max-w-md" onSubmit={handleSend}>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Nombre
          </label>
          <input
            type="text"
            id="nombre"
            
            name="nombre"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            
          />
        </div>
       
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          FIRMAR
        </button>
      </form>
      {data && (
        <div>
          <h2>Payload:</h2>
          <pre>{JSON.stringify(data.payload, null, 2)}</pre>
          <h2>Signed Transaction:</h2>
          <pre>{data.signedTx}</pre>
          <h2>Status:</h2>
          <pre>{data.status}</pre>
          <h2>Account:</h2>
          <pre>{data.account}</pre>
        </div>
      )}
      
    </div>
  );
} 