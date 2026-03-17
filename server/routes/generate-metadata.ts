// server/routes/generate-metadata.ts
import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { uploadToGitHub } from "../lib/github-upload"; // <-- NEU

const router = Router();

// Temporärer Upload-Ordner (für Bilder)
const uploadTempDir = path.join(__dirname, "temp");

router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, symbol, description = "", contractAddress, logoUrl } = req.body || {};

    if (!name || !symbol || !contractAddress || !logoUrl) {
      return res.status(400).json({
        error: "Missing required fields: name, symbol, contractAddress, logoUrl"
      });
    }

    const address = contractAddress.toLowerCase();

    // Metadata generieren
    const metadata = {
      name,
      symbol,
      description,
      image: logoUrl
    };

    // Temporäre Datei erzeugen
    const tempMetadataPath = path.join(uploadTempDir, `${address}-metadata.json`);
    fs.writeFileSync(tempMetadataPath, JSON.stringify(metadata, null, 2), "utf8");

    // Metadata zu GitHub hochladen
    const metadataUrl = await uploadToGitHub(
      address,
      tempMetadataPath,
      "metadata.json"
    );

    console.log("Metadata erfolgreich hochgeladen:", metadataUrl);

    // Lokale Datei löschen
    try {
      fs.unlinkSync(tempMetadataPath);
    } catch (err) {
      console.warn("Konnte temp metadata nicht löschen:", err);
    }

    return res.json({
      status: "ok",
      metadataUrl,
      metadata
    });

  } catch (err) {
    console.error("generate-metadata error:", err);
    return res.status(500).json({ error: "internal server error" });
  }
});

export default router;
