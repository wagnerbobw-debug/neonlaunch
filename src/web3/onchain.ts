// src/web3/onchain.ts
import {
  BrowserProvider,
  JsonRpcProvider,
  Contract,
  formatEther,
  parseEther,
  parseUnits,
} from "ethers";

import {
  FACTORY_ADDRESS,
  DEFAULT_CHAIN_ID,
  NATIVE_SYMBOL,
  RPC_URL_MAINNET,
  RPC_URL_TESTNET,
  RPC_URL_SEPOLIA,
} from "../config";

import factoryJson from "../abi/NeonLaunchFactory.json";

// ---------------------------------------------
// ABI
// ---------------------------------------------
const FACTORY_ABI = factoryJson.abi;

// ---------------------------------------------
// RPC URL Resolver
// ---------------------------------------------
function rpcUrlByChainId(chainId: number): string {
  switch (chainId) {
    case 56:
      return RPC_URL_MAINNET || "https://bsc-dataseed.binance.org/";
    case 97:
      return RPC_URL_TESTNET || "https://data-seed-prebsc-1-s1.binance.org:8545/";
    case 11155111:
      return RPC_URL_SEPOLIA || "https://rpc.sepolia.org";
    default:
      return RPC_URL_MAINNET || "https://bsc-dataseed.binance.org/";
  }
}

// ---------------------------------------------
// Explorer URLs
// ---------------------------------------------
export function explorerBase(chainId: number) {
  switch (chainId) {
    case 56:
      return "https://bscscan.com";
    case 97:
      return "https://testnet.bscscan.com";
    case 11155111:
      return "https://sepolia.etherscan.io";
    default:
      return "https://bscscan.com";
  }
}

// ---------------------------------------------
// Browser Provider (MetaMask, Brave, OKX Wallet …)
// ---------------------------------------------
async function getBrowserProvider() {
  if (typeof window === "undefined" || !("ethereum" in window)) {
    throw new Error("Wallet Provider nicht gefunden.");
  }
  // @ts-expect-error ethereum injection
  return new BrowserProvider(window.ethereum);
}

// ---------------------------------------------
// Read Provider — niemals Prompten!
// ---------------------------------------------
export async function getReadProvider(
  preferredChainId = DEFAULT_CHAIN_ID
): Promise<BrowserProvider | JsonRpcProvider> {
  // 1) Versuch via BrowserProvider (funktioniert ohne Prompt)
  if (typeof window !== "undefined" && "ethereum" in window) {
    try {
      const bp = await getBrowserProvider();
      await bp.getNetwork(); // validiert Erreichbarkeit
      return bp;
    } catch {
      // Silent fallback
    }
  }

  // 2) Public JSON-RPC Fallback
  const url = rpcUrlByChainId(preferredChainId);
  return new JsonRpcProvider(url, preferredChainId);
}

// ---------------------------------------------
// Signer + Network (mit Prompt)
// ---------------------------------------------
export async function getSignerAndNetwork() {
  const provider = await getBrowserProvider();

  // aktiviert MetaMask
  await provider.send("eth_requestAccounts", []);

  const signer = await provider.getSigner();
  const network = await provider.getNetwork();
  const address = await signer.getAddress();

  return { provider, signer, network, address };
}

// ---------------------------------------------
// Factory Contract Wrapper
// ---------------------------------------------
function getFactory(signerOrProvider: any) {
  if (!FACTORY_ADDRESS) {
    throw new Error("VITE_FACTORY_ADDRESS fehlt!");
  }
  return new Contract(FACTORY_ADDRESS, FACTORY_ABI, signerOrProvider);
}

// ============================================================================
//                              PUBLIC API
// ============================================================================

// ---------------------------------------------
// Connect Wallet (mit Prompt)
// ---------------------------------------------
export async function connectWallet() {
  const { network, address } = await getSignerAndNetwork();
  return {
    address: address as `0x${string}`,
    chainId: Number(network.chainId),
  };
}

// ---------------------------------------------
// Chain ID (ohne Prompt)
// ---------------------------------------------
export async function getChainId() {
  const rp = await getReadProvider(DEFAULT_CHAIN_ID);
  const net = await (rp as any).getNetwork();
  return Number(net.chainId);
}

// ---------------------------------------------
// Chain wechseln (Wallet UI)
// ---------------------------------------------
export async function ensureChain(targetChainId = DEFAULT_CHAIN_ID) {
  if (typeof window === "undefined" || !("ethereum" in window)) {
    throw new Error("Wallet Provider nicht gefunden.");
  }

  const chainHex = "0x" + Number(targetChainId).toString(16);

  try {
    // @ts-expect-error injected ethereum
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainHex }],
    });
  } catch (err) {
    console.warn("[ensureChain] switch failed:", err);
  }

  const rp = await getReadProvider(targetChainId);
  const after = await (rp as any).getNetwork();
  return Number(after.chainId);
}

// ============================================================================
//                               READS (ohne Prompt)
// ============================================================================
export async function getMinLiquidity(): Promise<number> {
  const rp = await getReadProvider(DEFAULT_CHAIN_ID);
  const factory = getFactory(rp);
  const wei: bigint = await (factory as any).minLiquidityWei();
  return Number(formatEther(wei));
}

export async function getCreateFee(address: `0x${string}`): Promise<number> {
  if (!address) {
    throw new Error("getCreateFee: address ist erforderlich.");
  }
  const rp = await getReadProvider(DEFAULT_CHAIN_ID);
  const factory = getFactory(rp);

  const fee: bigint = await (factory as any).getCreateFee(address);
  return Number(formatEther(fee));
}

export async function getBalance(address: `0x${string}`): Promise<number> {
  const rp = await getReadProvider(DEFAULT_CHAIN_ID);
  const wei: bigint = await (rp as any).getBalance(address);
  return Number(formatEther(wei));
}

// ============================================================================
//                               WRITE (mit Prompt)
// ============================================================================

/**
 * createToken – Anti-Bot wird dauerhaft erzwungen.
 * Standard-Defaults:
 *   - renounceOwnership: false
 *   - enableAntiBot: true  (fix)
 *   - lpLockRequested: true
 *
 * supply:      String/Number in Token-Units (18 Decimals werden mit parseUnits ergänzt)
 * liquidityEth: ETH (UI), wird in Wei konvertiert.
 */
export async function createToken(p: {
  name: string;
  symbol: string;
  supply?: string | number;
  liquidityEth: number;
  renounceOwnership?: boolean;
  lpLockRequested?: boolean;
}) {
  const { signer, network, address } = await getSignerAndNetwork();
  const factory = getFactory(signer);

  // Fees und Mindest-Liquidity
  const feeWei: bigint = await (factory as any).getCreateFee(address);
  const minLiqWei: bigint = await (factory as any).minLiquidityWei();

  const name = p.name.trim();
  const symbol = p.symbol.trim().toUpperCase();

  if (!name || !symbol) {
    throw new Error("Name und Symbol sind erforderlich.");
  }

  const liqWei: bigint = parseEther(String(p.liquidityEth));
  if (liqWei < minLiqWei) {
    throw new Error(
      `Liquidity unter Mindestwert: ${formatEther(minLiqWei)} ${NATIVE_SYMBOL}`
    );
  }

  const supplyStr = String(p.supply ?? "0");
  const supplyBN: bigint = parseUnits(supplyStr, 18);

  // ✅ Benanntes Struct: sicher gegen Feldreihenfolge
  const options = {
    renounceOwnership: Boolean(p.renounceOwnership ?? false),
    enableAntiBot: true, // dauerhaft AN
    lpLockRequested: Boolean(p.lpLockRequested ?? true),
  };

  const value: bigint = liqWei + feeWei;

  const tx = await (factory as any).createToken(
    name,
    symbol,
    supplyBN,
    liqWei,
    options,
    { value }
  );

  const receipt = await tx.wait();

  // Event Parsing
  let tokenAddress: string | undefined;
  let pair: string | undefined;

  try {
    const iface = (factory as any).interface;
    for (const log of receipt.logs ?? []) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed?.name === "TokenCreated") {
          tokenAddress = parsed.args?.token as string;
          pair = parsed.args?.pair as string;
          break;
        }
      } catch {
        // ignore non-matching logs
      }
    }
  } catch {
    // ignore
  }

  return {
    txHash: tx.hash,
    tokenAddress,
    pair,
    explorer: explorerBase(Number(network.chainId)),
  };
}