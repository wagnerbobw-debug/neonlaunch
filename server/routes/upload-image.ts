// server/routes/upload-image.ts
import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadToGitHub } from "../lib/github-upload";  // <-- NEU

const router = Router();

// Temporärer Speicherort
const tempDir = path.join(__dirname, "temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, tempDir);
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || ".png";
    cb(null, unique + ext);
  }
});

const upload = multer({ storage });

// ---------------------------------------------
// POST /upload-image
// Erwartet: image + contractAddress
// ---------------------------------------------
router.post("/", upload.single("image"), async (req: Request, res: Response) => {
  try {
    console.log("upload req.file:", req.file);

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!req.body.contractAddress) {
      return res.status(400).json({ error: "Missing contractAddress" });
    }

    const contractAddress = req.body.contractAddress.toLowerCase();
    const localPath = req.file.path;

    // 1. Datei zu GitHub hochladen
    const githubUrl = await uploadToGitHub(
      contractAddress,
      localPath,
      "logo.png"
    );

    console.log("GitHub Upload erfolgreich:", githubUrl);

    // 2. Lokale Datei löschen (optional)
    try {
      fs.unlinkSync(localPath);
    } catch (err) {
      console.warn("Konnte temp-Datei nicht löschen:", err);
    }

    // 3. Öffentliche URL zurückgeben
    return res.json({
      status: "ok",
      logoUrl: githubUrl
    });

  } catch (err: any) {
    console.error("upload-image error:", err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
