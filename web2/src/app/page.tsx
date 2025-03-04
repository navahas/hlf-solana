"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";


interface EthereumWindow extends Window {
  ethereum?: any;
}

export default function Home() {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const ethereumWindow = window as EthereumWindow;

      if (!ethereumWindow.ethereum) {
        throw new Error("MetaMask no está instalado");
      }

      const ethersProvider = new ethers.BrowserProvider(
        ethereumWindow.ethereum
      );
      setProvider(ethersProvider);

      const accounts = await ethereumWindow.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
    } catch (err) {
      console.error("Error al conectar con MetaMask:", err);
      setError(
        err instanceof Error ? err.message : "Error desconocido al conectar"
      );
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      const ethereumWindow = window as EthereumWindow;

      if (ethereumWindow.ethereum) {
        try {
          const ethersProvider = new ethers.BrowserProvider(
            ethereumWindow.ethereum
          );
          const accounts = await ethersProvider.listAccounts();

          if (accounts.length > 0) {
            setAccount(accounts[0].address);
            setProvider(ethersProvider);
          }
        } catch (err) {
          console.error("Error al verificar la conexión:", err);
        }
      }
    };

    checkConnection();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const tokenId = formData.get("tokenId");
    const name = formData.get("name");
    const amount = formData.get("amount");
    const attributes = formData.get("attributes");

    if (!account || !provider) {
      setError("Por favor conecta tu wallet primero");
      return;
    }

    if (!tokenId || !name || !amount) {
      setError("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      // Crear el objeto de atributos desde el string JSON
      let attributesObj = {};
      if (attributes) {
        try {
          attributesObj = JSON.parse(attributes.toString());
        } catch (err) {
          setError("El formato de los atributos no es un JSON válido");
          return;
        }
      }

      // Crear el mensaje para firmar
      const message = `tokenId:${tokenId},ownerAddress:${account},name:${name},amount:${amount},attributes:${JSON.stringify(attributesObj)}`;
      
      // Solicitar la firma al usuario
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);
      
      // Crear el objeto de datos para enviar al backend
      const tokenData = {
        tokenId: tokenId.toString(),
        ownerAddress: account,
        name: name.toString(),
        amount: Number(amount),
        attributes: attributesObj,
        signature,
        message
      };

      console.log("Datos del token a crear:", JSON.stringify(tokenData));
      
      // Aquí puedes agregar el código para enviar los datos al backend
      // const response = await fetch('/api/createToken', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(tokenData)
      // });
      
      // Limpiar el formulario o mostrar mensaje de éxito
    } catch (err) {
      console.error("Error al crear el token:", err);
      setError(err instanceof Error ? err.message : "Error desconocido al crear el token");
    }
  };
  
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Tokenizar Activo

          </h1>
          <button 
            onClick={connectWallet}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            {isConnecting ? 'Conectando...' : account ? `Conectado: ${account.substring(0, 6)}...${account.substring(38)}` : 'Conectar Wallet'}
          </button>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="tokenId"
                className="block text-sm font-medium text-black mb-1"
              >
                ID del Token
              </label>
              <input
                type="text"
                id="tokenId"
                name="tokenId"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ingrese ID único del token"
              />
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Nombre
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre del activo"
              />
            </div>

            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Cantidad
              </label>
              <input
                type="number"
                id="amount"
                name="amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Cantidad a tokenizar"
              />
            </div>

            <div>
              <label
                htmlFor="attributes"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Atributos
              </label>
              <textarea
                id="attributes"
                name="attributes"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder='{"color": "rojo", "tipo": "inmueble", ...}'
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Crear Token
            </button>
          </form>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        Footer
      </footer>
    </div>
  );
}
