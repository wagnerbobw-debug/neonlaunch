import { useEffect, useMemo, useState } from "react";
import { getCreateFee, createToken } from "../web3/onchain";
import { ENV } from "../env";

type Props = {
  account: string | null;
  isOnTargetChain: boolean;
  onRequireConnect: () => void;
  onRequireSwitchChain: () => void;
};

function formatBnb(wei: bigint): string {
  const s = wei.toString().padStart(19, "0");
  const whole = s.slice(0, -18) || "0";
  const frac = s.slice(-18).replace(/0+$/, "") || "0";
  return `${whole}.${frac}`;
}

export function CreateTokenPanel(props: Props) {
  const { account, isOnTargetChain, onRequireConnect, onRequireSwitchChain } = props;

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [supply, setSupply] = useState("");
  const [decimals, setDecimals] = useState(18);

  const [feeWei, setFeeWei] = useState<bigint | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = !!account && isOnTargetChain && !!name && !!symbol && !!supply;

  useEffect(() => {
    (async () => {
      setError(null);
      setFeeWei(null);
      if (!account || !isOnTargetChain) return;
      try {
        const fee = await getCreateFee(account);
        setFeeWei(fee);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      }
    })();
  }, [account, isOnTargetChain]);

  const feeDisplay = useMemo(() => {
    if (feeWei == null) return "–";
    return `${formatBnb(feeWei)} ${ENV.NATIVE_SYMBOL}`;
  }, [feeWei]);

  async function onCreate() {
    setError(null);

    if (!account) { onRequireConnect(); return; }
    if (!isOnTargetChain) { await onRequireSwitchChain(); return; }
    if (!name || !symbol || !supply) { setError("Bitte alle Felder ausfüllen."); return; }

    setPending(true);
    try {
      const receipt = await createToken({
        account,
        name,
        symbol,
        supply,
        decimals,
        metadataUrl: null // Logo/Metadata entfernt
      });

      console.log("Create OK", receipt);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <div style={{ border: "1px solid #333", borderRadius: 8, padding: 16 }}>
      <h3>Token erstellen</h3>

      {!account && (
        <div style={{ marginBottom: 12 }}>
          <button onClick={onRequireConnect}>Wallet verbinden</button>
        </div>
      )}

      {account && !isOnTargetChain && (
        <div style={{ marginBottom: 12 }}>
          <span>Falsches Netzwerk – bitte zu BSC Mainnet wechseln.</span>{" "}
          <button onClick={onRequireSwitchChain}>Zu BSC wechseln</button>
        </div>
      )}

      <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
        <input placeholder="Name (z. B. Neon Token)" value={name} onChange={e => setName(e.target.value)} />
        <input placeholder="Symbol (z. B. NEON)" value={symbol} onChange={e => setSymbol(e.target.value)} />
        <input placeholder="Supply (z. B. 1000000)" value={supply} onChange={e => setSupply(e.target.value)} />
        <input
          placeholder="Decimals (Standard: 18)"
          type="number"
          value={decimals}
          onChange={e => setDecimals(Number(e.target.value || 18))}
        />
      </div>

      {/* --- INFO SEKTION: Token Sichtbarkeit & Verifizierung --- */}
      <div
        style={{
          marginTop: 20,
          padding: 16,
          border: "1px solid #444",
          borderRadius: 8,
          background: "#111",
          color: "#ddd",
          lineHeight: 1.5
        }}
      >
        <h4 style={{ marginTop: 0 }}>🔍 Token‑Sichtbarkeit & Verifizierung</h4>

        <p>
          Token‑Logos und vollständige Token‑Informationen erscheinen <strong>nicht sofort</strong> 
          auf DEX‑UIs wie PancakeSwap, GeckoTerminal oder CoinMarketCap. 
          Die Sichtbarkeit hängt von mehreren externen Verifizierungs‑Schritten ab.
        </p>

        <ul style={{ paddingLeft: 18 }}>
          <li>✔ <strong>Contract verifizieren</strong> auf BscScan</li>
          <li>✔ <strong>Ownership verifizieren</strong> (BscScan → Verify Address Ownership)</li>
          <li>✔ <strong>Audit einreichen</strong> (z. B. CFG Ninja)</li>
          <li>✔ <strong>BscScan Token Update</strong> (Logo + Socials)</li>
          <li>✔ <strong>CoinGecko Listing</strong> (wichtig für Logo‑Anzeige)</li>
          <li>✔ <strong>CMC Listing</strong> (für CMC‑DEX Logo & Preisfeed)</li>
        </ul>

        <h4>📘 Wichtige Links</h4>
        <ul style={{ paddingLeft: 18 }}>
          <li>
            🔗 <a href="https://bscscan.com/tokenupdate" target="_blank" rel="noreferrer">
              BscScan Token Update
            </a>
          </li>
          <li>
            🔗 <a href="https://www.coingecko.com/en/coins/new" target="_blank" rel="noreferrer">
              CoinGecko Listing beantragen
            </a>
          </li>
          <li>
            🔗 <a href="https://coinmarketcap.com/request/" target="_blank" rel="noreferrer">
              CoinMarketCap Listing beantragen
            </a>
          </li>
          <li>
            🔗 <a href="https://www.geckoterminal.com" target="_blank" rel="noreferrer">
              GeckoTerminal Token‑Ansicht
            </a>
          </li>
        </ul>

        <h4>📌 Hinweise für neue Token</h4>
        <p>
          • Logos erscheinen erst nach <strong>CoinGecko‑Freigabe</strong> oder 
          <strong> BscScan‑Logo‑Approval</strong>.  
          <br />
          • GitHub‑Tokenlisten werden von DEX‑UIs <strong>nicht akzeptiert</strong>.  
          <br />
          • Ein Token benötigt <strong>aktive Liquidität</strong>, um auf Aggregatoren sichtbar zu werden.  
          <br />
          • Ein Audit erhöht die Chance auf schnellere Freigaben.
        </p>

        <h4>🧭 Status‑Checkliste</h4>
        <ul style={{ paddingLeft: 18 }}>
          <li>🔸 Contract verified: <strong>manuell prüfen</strong></li>
          <li>🔸 Ownership verified: <strong>empfohlen</strong></li>
          <li>🔸 Audit eingereicht: <strong>ja/nein</strong></li>
          <li>🔸 Liquidity aktiv: <strong>ja</strong></li>
          <li>🔸 CoinGecko gelistet: <strong>wartet</strong></li>
          <li>🔸 CMC gelistet: <strong>wartet</strong></li>
        </ul>

        <p style={{ marginTop: 12, fontStyle: "italic", opacity: 0.8 }}>
          Diese Schritte sind optional für die Token‑Erstellung, aber notwendig, 
          um das Token‑Logo und vollständige Informationen auf allen Plattformen sichtbar zu machen.
        </p>
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>Erwartete Gebühr:</strong> {feeDisplay}
      </div>

      {!!error && (
        <div style={{ marginTop: 8, color: "#e33" }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <button disabled={!ready || pending} onClick={onCreate}>
          {pending ? "Erzeuge..." : "Token erstellen"}
        </button>
      </div>
    </div>
  );
}
