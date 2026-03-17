import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

/**
 * Wir versuchen, die lokal erzeugten Zertifikate (mkcert) zu laden.
 * Liegen – wie beim Backend – im Projektroot:
 *  - localhost.pem
 *  - localhost-key.pem
 *
 * Falls nicht vorhanden: HTTPS wird automatisch deaktiviert (Fallback auf HTTP),
 * damit der Dev-Server trotzdem startet.
 */
function loadHttpsConfig() {
  const certPath = path.resolve(__dirname, "localhost.pem");
  const keyPath = path.resolve(__dirname, "localhost-key.pem");

  const hasCert = fs.existsSync(certPath);
  const hasKey = fs.existsSync(keyPath);

  if (hasCert && hasKey) {
    console.log("🔐 Vite HTTPS aktiv (Zertifikate gefunden).");
    return {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
  }

  console.warn(
    "⚠️  Vite startet ohne HTTPS (Zertifikate nicht gefunden).",
    "\n    Erwartete Pfade:",
    `\n    - ${certPath}`,
    `\n    - ${keyPath}`,
    "\n    Tipp: 'mkcert localhost' im Projektroot ausführen."
  );
  return undefined;
}

const httpsConfig = loadHttpsConfig();

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,         // wichtig für Zugriff aus dem LAN / mobile Geräte
    strictPort: true,   // bei belegtem Port nicht automatisch wechseln
    https: httpsConfig, // aktiviert HTTPS, wenn Zertifikate vorhanden sind
    // HMR: mit HTTPS funktioniert HMR in Chrome/Edge automatisch.
    // Falls du einen Proxy/Container o. ä. nutzt, kann man folgende Option setzen:
    // hmr: { protocol: "wss", host: "localhost", port: 5173 },

    proxy: {
      /**
       * WICHTIG:
       * - Ziel ist jetzt HTTPS-Backend (https://localhost:8787)
       * - secure: false erlaubt selbst-signierte Zertifikate in der Dev (trotz mkcert meist nicht nötig,
       *   aber in Dev sicherer; falls du die mkcert-Root installiert hast, kannst du secure:true setzen).
       * - changeOrigin sorgt dafür, dass 'Host' korrekt gesetzt wird.
       */

      // Statische Dateien (unverändert weiterleiten, kein rewrite)
      "/static": {
        target: "https://localhost:8787",
        changeOrigin: true,
        secure: false,
      },

      // API Endpoints an Express weiterleiten
      "/upload-image": {
        target: "https://localhost:8787",
        changeOrigin: true,
        secure: false,
      },
      "/generate-metadata": {
        target: "https://localhost:8787",
        changeOrigin: true,
        secure: false,
      },
      "/verify-token": {
        target: "https://localhost:8787",
        changeOrigin: true,
        secure: false,
      },
      // Optional: Healthcheck als Schnelltest
      "/api/health": {
        target: "https://localhost:8787",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});