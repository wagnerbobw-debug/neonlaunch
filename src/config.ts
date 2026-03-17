export const RPC_URL_MAINNET = import.meta.env.VITE_RPC_URL_MAINNET ?? '';
export const RPC_URL_TESTNET = import.meta.env.VITE_RPC_URL_TESTNET ?? '';
export const RPC_URL_SEPOLIA = import.meta.env.VITE_RPC_URL_SEPOLIA ?? '';
export const FACTORY_ADDRESS = import.meta.env.VITE_FACTORY_ADDRESS as `0x${string}`;
export const DEFAULT_CHAIN_ID = Number(import.meta.env.VITE_DEFAULT_CHAIN_ID ?? 56);
export const NATIVE_SYMBOL = import.meta.env.VITE_NATIVE_SYMBOL ?? 'BNB';