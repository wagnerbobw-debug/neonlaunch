console.log(">>> RUNNING INDEX FROM:", __filename);

import path from "path";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({ path: path.join(__dirname, "..", ".env") });

import express from "express";
import cors from "cors";
import https from "https";
import http from "http";

// ROUTES
import verifyTokenRouter from "./routes/verify-token";
import uploadImageRouter from "./routes/upload-image";
import generateMetadataRouter from "./routes/generate-metadata";
import deployTokenRouter from "./routes/deploy-token";   // <-- NEU

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

// -------------------------------------------------------------
// 🔥 Sicherstellen, dass static/verification existiert
// -------------------------------------------------------------
const verificationDir = path.join(__dirname, "..", "static", "verification");
if (!fs.existsSync(verificationDir)) {
  fs.mkdirSync(verificationDir, { recursive: true });
  console.log("📁 Ordner erstellt:", verificationDir);
}

// Debug: prüfe static-Pfad
const staticPath = path.join(__dirname, "..", "static");
console.log("DEBUG staticPath:", staticPath, "exists:", fs.existsSync(staticPath));

// Bilder öffentlich (server/temp)
app.use("/temp", express.static(path.join(__dirname, "routes", "temp")));

// Metadata + verification öffentlich
app.use("/static", express.static(staticPath));

// Request-Logger
app.use((req, _res, next) => {
  console.log("REQ", req.method, req.url);
  next();
});

// Healthcheck
app.get("/api/health", (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// -------------------------------
// API ROUTES
// -------------------------------
app.use("/upload-image", uploadImageRouter);
app.use("/generate-metadata", generateMetadataRouter);
app.use("/verify-token", verifyTokenRouter);
app.use("/deploy-token", deployTokenRouter);   // <-- NEU

// -------------------------------
// HTTPS Setup
// -------------------------------
const port = parseInt(process.env.PORT || "8787", 10);

const CERT_PATH = path.resolve(__dirname, "..", "localhost.pem");
const KEY_PATH = path.resolve(__dirname, "..", "localhost-key.pem");

const REDIRECT_HTTP = String(process.env.REDIRECT_HTTP || "").toLowerCase() === "true";
const HTTP_PORT = parseInt(process.env.HTTP_PORT || "8080", 10);

function startHttps() {
  const ssl = {
    key: fs.readFileSync(KEY_PATH),
    cert: fs.readFileSync(CERT_PATH),
  };

  const httpsServer = https.createServer(ssl, app);
  httpsServer.listen(port, () => {
    console.log(`🔐 HTTPS aktiv: https://localhost:${port}`);
    console.log(`📁 Static Files: https://localhost:${port}/static/verification/...`);
  });

  if (REDIRECT_HTTP) {
    const httpApp = express();
    httpApp.use((req, res) => {
      const host = req.headers.host ? req.headers.host.split(":")[0] : "localhost";
      res.redirect(301, `https://${host}:${port}${req.url}`);
    });
    http.createServer(httpApp).listen(HTTP_PORT, () => {
      console.log(`↪️  HTTP→HTTPS Redirect aktiv: http://localhost:${HTTP_PORT} → https://localhost:${port}`);
    });
  }
}

function startHttpFallback(errMsg?: string) {
  console.warn("⚠️  Starte Fallback: HTTP (ohne Verschlüsselung).");
  if (errMsg) console.warn("Grund:", errMsg);
  app.listen(port, () => {
    console.log(`🚀 NeonLaunch Backend läuft auf http://localhost:${port}`);
    console.log(`📁 Static Files: http://localhost:${port}/static/verification/...`);
  });
}

try {
  const certExists = fs.existsSync(CERT_PATH);
  const keyExists = fs.existsSync(KEY_PATH);

  console.log("DEBUG cert path:", CERT_PATH, "exists:", certExists);
  console.log("DEBUG key  path:", KEY_PATH, "exists:", keyExists);

  if (!certExists || !keyExists) {
    startHttpFallback("Zertifikate nicht gefunden. Bitte mkcert localhost ausführen.");
  } else {
    startHttps();
  }
} catch (e: any) {
  startHttpFallback(e?.message || String(e));
}
