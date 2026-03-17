// src/chains.ts
export const BSC_MAINNET = {
  chainId: "0x38", // 56 dezimal
  chainName: "BNB Smart Chain",
  nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  rpcUrls: ["https://bsc-dataseed.binance.org/"],
  blockExplorerUrls: ["https://bscscan.com/"],
};

export const TARGET_CHAIN_ID_DEC = 56;
export const TARGET_CHAIN_ID_HEX = BSC_MAINNET.chainId;