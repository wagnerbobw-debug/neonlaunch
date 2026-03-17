// server/routes/verify-token.ts
import { Router } from "express";
import { submitVerification, pollVerification } from "../lib/bscscan";

const router = Router();

/**
 * POST /verify-token
 * Body: { address: string, deployTx: string, network?: "bsc" | "bscTestnet" }
 *
 * Verhalten:
 * - Validiert Input (trim + Regex)
 * - Submit an BscScan, prüft auf GUID
 * - Pollt synchron kurz (konfigurierbar) und liefert Ergebnis zurück
 * - Liefert differenzierte HTTP-Codes: 400 (Bad Request), 502 (Upstream Fehler), 504 (Timeout), 200 (ok), 500 (Server)
 */

const DEFAULT_ATTEMPTS = parseInt(process.env.VERIFY_POLL_ATTEMPTS || "15", 10);
const DEFAULT_INTERVAL_MS = parseInt(process.env.VERIFY_POLL_INTERVAL_MS || "3000", 10);

type PollResultShape = { ok: boolean; result: any } | null | undefined;

router.post("/", async (req, res) => {
  try {
    const raw = req.body || {};
    const address = (raw.address || "").trim();
    const deployTx = (raw.deployTx || "").trim();
    const network = raw.network === "bscTestnet" ? "bscTestnet" : "bsc";

    // Input-Validierung
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: "Invalid contract address" });
    }
    if (!deployTx || !/^0x([A-Fa-f0-9]{64})$/.test(deployTx)) {
      return res.status(400).json({ error: "Invalid deployTx hash" });
    }

    console.log(`[verify-token] submit: address=${address} network=${network}`);

    // Submit an BscScan (erwartet { guid })
    const submitRes = await submitVerification({
      address,
      deployTx,
      network,
    });

    if (!submitRes || !submitRes.guid) {
      console.error("[verify-token] submitVerification failed or returned no guid", submitRes);
      return res.status(502).json({ error: "Verification submission failed" });
    }

    const guid = submitRes.guid;
    console.log(`[verify-token] submitted, guid=${guid}`);

    // Polling konfigurieren
    const attempts = DEFAULT_ATTEMPTS;
    const intervalMs = DEFAULT_INTERVAL_MS;

    // Polling durchführen
    const pollResult = (await pollVerification({
      guid,
      network,
      attempts,
      intervalMs,
    })) as PollResultShape;

    if (!pollResult) {
      console.warn(`[verify-token] poll timed out guid=${guid}`);
      return res.status(504).json({ status: "timeout", guid });
    }

    // pollResult hat Form { ok: boolean, result: any }
    // Prüfe zuerst pollResult.ok (wenn lib das verwendet), sonst untersuche pollResult.result
    const resultPayload = pollResult.result;

    const isSuccess =
      pollResult.ok === true ||
      resultPayload === "Pass" ||
      resultPayload === "Success" ||
      (typeof resultPayload === "string" && /pass|success/i.test(resultPayload)) ||
      (resultPayload && typeof resultPayload === "object" && (resultPayload.status === "1" || /pass|success/i.test(String(resultPayload.result || ""))));

    if (isSuccess) {
      console.log(`[verify-token] verified guid=${guid}`);
      return res.status(200).json({
        status: "ok",
        message: "Contract verified",
        bscscanGuid: guid,
        check: pollResult,
      });
    }

    console.info(`[verify-token] verification failed guid=${guid}`, pollResult);
    return res.status(400).json({
      status: "failed",
      message: "Verification failed or returned non-success status",
      bscscanGuid: guid,
      check: pollResult,
    });
  } catch (err: any) {
    console.error("[verify-token] unexpected error:", err);
    return res.status(500).json({
      status: "error",
      error: err?.message || "Verification failed",
    });
  }
});

export default router;
