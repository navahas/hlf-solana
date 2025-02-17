"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  userAddress: string;
  name: string;
  role: string;
  isActive: boolean;
}

interface GlobalContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  
}

const GlobalContext = createContext<GlobalContextType>({
  user: null,
  setUser: () => {},
});

export const useGlobalContext = () => useContext(GlobalContext);

export function GlobalContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check localStorage on mount
    const storedUser = localStorage.getItem("walletAddress");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    // Update localStorage when user changes
    if (user) {
      localStorage.setItem("walletAddress", JSON.stringify(user));
    } else {
      localStorage.removeItem("walletAddress");
    }
  }, [user]);

  const value = {
    user,
    setUser,
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
}
