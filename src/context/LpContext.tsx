// src/context/LpContext.tsx
import React, { createContext, useContext, useState } from "react";

interface LpContextType {
  createdTokenAddress: string | null;
  setCreatedTokenAddress: (addr: string | null) => void;

  supply: number;
  setSupply: (value: number) => void;

  liquidity: number;
  setLiquidity: (value: number) => void;

  chainId: number;
  setChainId: (id: number) => void;
}

const LpContext = createContext<LpContextType | undefined>(undefined);

export const LpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [createdTokenAddress, setCreatedTokenAddress] = useState<string | null>(null);

  const [supply, setSupply] = useState<number>(0);
  const [liquidity, setLiquidity] = useState<number>(0);

  const [chainId, setChainId] = useState<number>(56); // BSC Default

  return (
    <LpContext.Provider
      value={{
        createdTokenAddress,
        setCreatedTokenAddress,

        supply,
        setSupply,

        liquidity,
        setLiquidity,

        chainId,
        setChainId,
      }}
    >
      {children}
    </LpContext.Provider>
  );
};

// ⬅️ Wichtig: Der richtige Hook!
export const useLpContext = () => {
  const ctx = useContext(LpContext);
  if (!ctx) {
    throw new Error("useLpContext must be used inside <LpProvider>");
  }
  return ctx;
};