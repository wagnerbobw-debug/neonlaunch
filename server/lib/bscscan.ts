console.log("[bscscan] V2 LOADED");

import fs from "fs";
import path from "path";
import axios from "axios";
import { ethers } from "ethers";

type Network = "bsc" | "bscTestnet";

const API_BASE: Record<Network, string> = {
  bsc: "https://api.bscscan.com/v2/api",
  bscTestnet: "https://api-testnet.bscscan.com/v2/api",
};

// -------------------------------------------------------------
// 🔥 Lazy Loading der ENV Variablen (Fix für dein Problem)
// -------------------------------------------------------------
function getApiKey() {
  const key = process.env.BSC_SCAN_API_KEY;
  if (!key) console.warn("[verify] Missing BSC_SCAN_API_KEY in .env");
  return key || "";
}

function getRpcUrl() {
  const url = process.env.BSC_RPC_URL;
  if (!url) console.warn("[verify] Missing BSC_RPC_URL in .env");
  return url || "";
}

// Pfad zu deinem Standard-JSON-Input (verification.json)
const STD_JSON_PATH = path.resolve(
  process.cwd(),
  "static/verification/neon-token-verification.json"
);

// Standard-JSON-Input laden
export function loadStandardJsonInput(): any {
  const raw = fs.readFileSync(STD_JSON_PATH, "utf8");
  return JSON.parse(raw);
}

// -----------------------------------------------------------------------------
// Constructor-Args automatisch aus der Deploy-Tx extrahieren
// -----------------------------------------------------------------------------
export async function extractConstructorArgs(
  tokenAddress: string,
  deployTxHash: string
): Promise<string> {
  const provider = new ethers.JsonRpcProvider(getRpcUrl());

  const receipt = await provider.getTransactionReceipt(deployTxHash);
  if (!receipt) throw new Error("Deploy-Tx Receipt nicht gefunden");

  const deployTx = await provider.getTransaction(deployTxHash);
  if (!deployTx) throw new Error("Deploy-Tx konnte nicht geladen werden");

  const input = deployTx.data;

  const verification = loadStandardJsonInput();
  const bytecode =
    verification.bytecode || verification.evm?.bytecode?.object;

  if (!bytecode) throw new Error("Bytecode im verification.json fehlt");

  const cleanBytecode = bytecode.startsWith("0x")
    ? bytecode
    : "0x" + bytecode;

  if (!input.startsWith(cleanBytecode)) {
    console.warn("[verify] Bytecode mismatch – ConstructorArgs evtl. nicht extrahierbar");
  }

  const args = input.slice(cleanBytecode.length);
  return args.replace(/^0x/, "");
}

// -----------------------------------------------------------------------------
// BscScan API V2 – Contract Verification
// -----------------------------------------------------------------------------
export async function submitVerification(opts: {
  address: string;
  deployTx: string;
  network: Network;
  contractName?: string;
}) {
  const { address, deployTx, network } = opts;

  const contractName =
    opts.contractName || "contracts/NeonToken.sol:NeonToken";

  const verification = loadStandardJsonInput();

  const constructorArgs = await extractConstructorArgs(address, deployTx);

  const payload = {
    id: 1,
    jsonrpc: "2.0",
    method: "contract_verification",
    params: {
      apikey: getApiKey(),
      contractaddress: address,
      sourceCode: JSON.stringify({
        language: "Solidity",
        sources: verification.sources,
        settings: verification.settings,
      }),
      codeformat: "solidity-standard-json-input",
      contractname: contractName,
      compilerversion: "v0.8.20+commit.a1b79de6",
      constructorArguments: constructorArgs,
      evmversion: verification.settings.evmVersion || "default",
      optimizationUsed: verification.settings.optimizer.enabled ? "1" : "0",
      runs: verification.settings.optimizer.runs.toString(),
    },
  };

  const url = API_BASE[network];

  const res = await axios.post(url, payload, {
    headers: { "Content-Type": "application/json" },
  });

  if (!res.data?.result) {
    throw new Error("Submit failed: " + JSON.stringify(res.data));
  }

  return { guid: res.data.result };
}

// -----------------------------------------------------------------------------
// BscScan API V2 – Poll Verification Status
// -----------------------------------------------------------------------------
export async function pollVerification(opts: {
  guid: string;
  network: Network;
  attempts?: number;
  intervalMs?: number;
}) {
  const { guid, network } = opts;
  const attempts = opts.attempts ?? 30;
  const interval = opts.intervalMs ?? 4000;

  const url = API_BASE[network];

  for (let i = 0; i < attempts; i++) {
    const payload = {
      id: 1,
      jsonrpc: "2.0",
      method: "contract_verification_status",
      params: {
        apikey: getApiKey(),
        guid,
      },
    };

    const res = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" },
    });

    const result = res.data?.result;

    if (result?.status === "1") {
      return { ok: true, result };
    }

    if (result?.status === "2") {
      throw new Error("Verification failed: " + result.message);
    }

    await new Promise((r) => setTimeout(r, interval));
  }

  throw new Error("Verification timed out");
}
