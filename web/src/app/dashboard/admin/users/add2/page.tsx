"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ethers, Interface } from "ethers";
import { getDeployedTo } from "@/lib/clientLib";

const { ADDRESS, ABI } = getDeployedTo("userContract");

export default function AddUserForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [age, setAge] = useState("");
  const [balance, setBalance] = useState("");
  const [error, setError] = useState("");

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const validateAge = (age: number) => {
    return age > 20 && age < 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateEmail(email)) {
      setError("Invalid email address");
      return;
    }

    const ageNumber = parseInt(age);
    if (!validateAge(ageNumber)) {
      setError("Age must be between 21 and 99");
      return;
    }

    if (!window.ethereum) {
      setError("MetaMask is not installed");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(ADDRESS, ABI as Interface, signer);

      await contract.writeProfile(name, email, ageNumber, ethers.parseEther(balance));
      alert("Profile created successfully");
    } catch (error) {
      console.error("Failed to create profile:", error);
      setError("Failed to create profile");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-item">
        <label htmlFor="name">Name</label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="form-item">
        <label htmlFor="email">Email</label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="form-item">
        <label htmlFor="age">Age</label>
        <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} required />
      </div>
      <div className="form-item">
        <label htmlFor="balance">Balance</label>
        <Input id="balance" value={balance} onChange={(e) => setBalance(e.target.value)} required />
      </div>
      {error && <p className="text-red-500">{error}</p>}
      <Button type="submit">Submit</Button>
    </form>
  );
}
