import axios from "axios";
import fs from "fs";
import path from "path";

// Dein GitHub Benutzername
const GITHUB_USER = "wagnerbobw-debug";

// Dein Repo
const GITHUB_REPO = "NeonLaunch";

// Dein Token aus .env
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export async function uploadToGitHub(
  contractAddress: string,
  filePath: string,
  fileName: string
) {
  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN fehlt in .env");
  }

  // Datei einlesen und Base64 encodieren
  const content = fs.readFileSync(filePath, { encoding: "base64" });

  // GitHub API URL
  const apiUrl = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${contractAddress}/${fileName}`;

  // Upload durchführen
  const res = await axios.put(
    apiUrl,
    {
      message: `Upload ${fileName} for ${contractAddress}`,
      content,
    },
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  // GitHub liefert die öffentliche URL zurück
  return res.data.content.download_url;
}
