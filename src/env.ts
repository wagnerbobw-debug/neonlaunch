// src/env.ts
export const ENV = {
  READ_RPC_URL: import.meta.env.VITE_READ_RPC_URL as string,
  FACTORY_ADDRESS: import.meta.env.VITE_FACTORY_ADDRESS as `0x${string}`,
  NATIVE_SYMBOL: (import.meta.env.VITE_NATIVE_SYMBOL as string) || "BNB",
};