import { Router } from "express";
import fs from "fs";
import path from "path";
import solc from "solc";
import { ethers } from "ethers";
import { submitVerification, pollVerification } from "../lib/bscscan";
import { uploadToGitHub } from "../lib/github-upload";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.BSC_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

    const { name, symbol, supply, logoTempPath, description = "" } = req.body;

    // FIX 1: logoTempPath validieren
    if (!logoTempPath || typeof logoTempPath !== "string") {
      return res.status(400).json({ error: "Missing or invalid logoTempPath" });
    }

    // 1. Contract laden
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "contracts/NeonToken.sol"),
      "utf8"
    );

    const input = {
      language: "Solidity",
      sources: {
        "contracts/NeonToken.sol": { content: source },
      },
      settings: {
        optimizer: { enabled: true, runs: 200 },
        outputSelection: {
          "*": {
            "*": ["abi", "evm.bytecode", "evm.deployedBytecode"],
          },
        },
      },
    };

    // 2. Kompilieren
    const output = JSON.parse(solc.compile(JSON.stringify(input)));
    const contract = output.contracts["contracts/NeonToken.sol"]["NeonToken"];

    const abi = contract.abi;
    const bytecode = contract.evm.bytecode.object;

    // 3. Deployen
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const instance = await factory.deploy(name, symbol, supply);

    await instance.waitForDeployment();
    const address = (await instance.getAddress()).toLowerCase();

    // FIX 2: deployTx sicherstellen
    const tx = instance.deploymentTransaction();
    if (!tx || !tx.hash) {
      return res.status(500).json({ error: "Deployment transaction missing" });
    }
    const deployTx: string = tx.hash;

    console.log("[deploy] Contract deployed:", address);

    // 4. Logo zu GitHub hochladen
    const absoluteLogoPath = path.resolve(
      process.cwd(),
      "server",
      logoTempPath
    );

    if (!fs.existsSync(absoluteLogoPath)) {
      return res.status(400).json({
        error: "Logo file not found on server",
        path: absoluteLogoPath
      });
    }

    const logoUrl = await uploadToGitHub(address, absoluteLogoPath, "logo.png");

    console.log("[deploy] Logo hochgeladen:", logoUrl);

    // 5. Metadata erzeugen
    const metadata = {
      name,
      symbol,
      description,
      image: logoUrl
    };

    const tempMetadataPath = path.join(
      process.cwd(),
      "server/routes/temp",
      `${address}-metadata.json`
    );

    fs.writeFileSync(tempMetadataPath, JSON.stringify(metadata, null, 2), "utf8");

    // 6. Metadata zu GitHub hochladen
    const metadataUrl = await uploadToGitHub(
      address,
      tempMetadataPath,
      "metadata.json"
    );

    console.log("[deploy] Metadata hochgeladen:", metadataUrl);

    // 7. verification.json erzeugen
    const verificationData = {
      bytecode: bytecode,
      sources: input.sources,
      settings: input.settings,
      compilerVersion: "v0.8.20+commit.a1b79de6",
    };

    const outPath = path.resolve(
      process.cwd(),
      "static/verification/neon-token-verification.json"
    );

    fs.writeFileSync(outPath, JSON.stringify(verificationData, null, 2), "utf8");

    console.log("[deploy] verification.json gespeichert:", outPath);

    // 8. AUTOMATISCHE VERIFIKATION
    console.log("[deploy] Starte automatische Verifikation…");

    const submitRes = await submitVerification({
      address,
      deployTx,
      network: "bsc",
    });

    console.log("[deploy] BscScan GUID:", submitRes.guid);

    const pollRes = await pollVerification({
      guid: submitRes.guid,
      network: "bsc",
      attempts: 20,
      intervalMs: 4000,
    });

    console.log("[deploy] Verifikation abgeschlossen:", pollRes);

    return res.json({
      status: "ok",
      address,
      deployTx,
      logoUrl,
      metadataUrl,
      verification: pollRes,
    });

  } catch (err: any) {
    console.error("[deploy-token] error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
