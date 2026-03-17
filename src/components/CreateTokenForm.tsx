import React, { useEffect, useMemo, useState } from "react";
import { web3 } from "../web3";
import { NATIVE_SYMBOL } from "../config";
import { useWallet } from "../web3/useWallet";
import { useLpContext } from "../context/LpContext";

export default function CreateTokenForm() {
  const { address, connected } = useWallet();

  const [name, setName] = useState("z.B. NeonLaunch");
  const [symbol, setSymbol] = useState("z.B. NEON");

  const {
    supply,
    setSupply,
    liquidity,
    setLiquidity,
    setCreatedTokenAddress,
  } = useLpContext();

  const [minLiq, setMinLiq] = useState<number | null>(null);
  const [fee, setFee] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [showInfo, setShowInfo] = useState(false);

  const total = useMemo(() => (fee ?? 0) + (Number(liquidity) || 0), [fee, liquidity]);

  const enoughLiquidity = useMemo(
    () => (minLiq == null ? false : Number(liquidity) >= minLiq),
    [liquidity, minLiq]
  );

  const validInputs = useMemo(
    () => Boolean(name.trim()) && Boolean(symbol.trim()) && Number(supply) > 0,
    [name, symbol, supply]
  );

  const fmt = (n: number | null) =>
    n == null || Number.isNaN(n) ? "—" : `${n.toFixed(2)} ${NATIVE_SYMBOL}`;

  // --- Reads ---
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const m = await web3.getMinLiquidity();
        if (alive) setMinLiq(Number(m));
      } catch (e) {
        if (alive) setMinLiq(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!address) return;
        const f = await web3.getCreateFee(address);
        if (alive) setFee(Number(f));
      } catch (e) {
        if (alive) setFee(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [address]);

  // --- Submit ---
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!connected) {
      setMsg("Bitte zuerst Wallet verbinden.");
      return;
    }
    if (!validInputs) {
      setMsg("Bitte Name, Symbol und Supply prüfen.");
      return;
    }
    if (!enoughLiquidity) {
      setMsg(`Min. Liquidity: ${minLiq != null ? fmt(minLiq) : "unbekannt"}`);
      return;
    }

    try {
      setBusy(true);
      setMsg("⏳ Token wird erstellt…");

      const res = await web3.createToken({
        name: name.trim(),
        symbol: symbol.trim().toUpperCase(),
        supply: String(supply),
        liquidityEth: Number(liquidity),
      });

      if (!res?.tokenAddress || !res?.txHash) {
        setMsg("Fehler: Keine Token‑Adresse oder TX‑Hash erhalten.");
        return;
      }

      if (typeof setCreatedTokenAddress === "function") {
        setCreatedTokenAddress(res.tokenAddress);
      }

      setMsg(
        `✅ Token erstellt: ${res.tokenAddress}
         \n🔍 Contract wird automatisch verifiziert…`
      );

      window.dispatchEvent(new CustomEvent("neon:tx", { detail: res }));
    } catch (err: any) {
      setMsg(err?.message ?? "Create fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form" onSubmit={onSubmit}>
      <div className="row">
        <div className="field">
          <label htmlFor="name">Token Name</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z. B. Neon Cat"
            required
            maxLength={32}
          />
        </div>

        <div className="field">
          <label htmlFor="symbol">Symbol</label>
          <input
            id="symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="NEON"
            required
            maxLength={8}
          />
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="supply">Total Supply</label>
          <input
            id="supply"
            type="number"
            min={1000}
            step={1000}
            value={supply}
            onChange={(e) => setSupply(Number(e.target.value))}
            required
          />
          <div className="hint">
            Tipp: Geringe Start‑Liquidity + riesiger Supply = oft extreme Slippage.
          </div>
        </div>

        <div className="field">
          <label htmlFor="liquidity">Initial Liquidity ({NATIVE_SYMBOL})</label>
          <input
            id="liquidity"
            type="number"
            min={0.01}
            step={0.01}
            value={liquidity}
            onChange={(e) => setLiquidity(Number(e.target.value))}
            required
          />
          <div className="hint">
            Minimum 0.01 {NATIVE_SYMBOL}. Empfohlen: 1–2 {NATIVE_SYMBOL}.
          </div>
        </div>
      </div>

      {/* --- EINKLAPPBARE INFO-SEKTION (optimiert) --- */}
      <div
        style={{
          marginTop: 20,
          padding: 16,
          border: "1px solid #444",
          borderRadius: 8,
          background: "#1a1a1a",
          color: "#eee",
        }}
      >
        <button
          type="button"
          onClick={() => setShowInfo((v) => !v)}
          style={{
            width: "100%",
            padding: "10px 12px",
            background: "#222",
            border: "1px solid #555",
            borderRadius: 6,
            color: "#fff",
            cursor: "pointer",
            textAlign: "left",
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {showInfo ? "▼" : "►"} Schritte zur Logo‑Freigabe & Sichtbarkeit
        </button>

        {showInfo && (
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 20,
              }}
            >

              {/* --- SPALTE 1: Contract & Ownership --- */}
              <div>
                <h4>1️⃣ Contract & Ownership</h4>
                <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
                  <li>✔ Contract verifizieren</li>
                  <li>✔ Ownership verifizieren</li>
                </ul>

                <h5 style={{ marginTop: 10 }}>Links</h5>
                <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
                  <li>
                    <a href="https://bscscan.com/tokenupdate" target="_blank">
                      BscScan Token Update
                    </a>
                  </li>
                </ul>
              </div>

              {/* --- SPALTE 2: Audit & Socials --- */}
              <div>
                <h4>2️⃣ Audit & Socials</h4>
                <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
                  <li>✔ Audit einreichen (erhöht Trust)</li>
                  <li>✔ Socials im BscScan‑Update angeben</li>
                </ul>

                <h5 style={{ marginTop: 10 }}>Links</h5>
                <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
                  <li>
                    <a href="https://www.coingecko.com/en/coins/new" target="_blank">
                      CoinGecko Listing
                    </a>
                  </li>
                  <li>
                    <a href="https://coinmarketcap.com/request/" target="_blank">
                      CMC Listing
                    </a>
                  </li>
                </ul>
              </div>

              {/* --- SPALTE 3: Sichtbarkeit auf DEX & Aggregatoren --- */}
              <div>
                <h4>3️⃣ Sichtbarkeit auf DEX‑UIs</h4>
                <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
                  <li>🔸 Liquidity aktiv</li>
                  <li>🔸 CoinGecko gelistet → Logo sichtbar</li>
                  <li>🔸 CMC gelistet → Preisfeed sichtbar</li>
                </ul>

                <h5 style={{ marginTop: 10 }}>Links</h5>
                <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
                  <li>
                    <a href="https://www.geckoterminal.com" target="_blank">
                      GeckoTerminal
                    </a>
                  </li>
                  <li>
                    <a href="https://pancakeswap.finance" target="_blank">
                      PancakeSwap
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <p style={{ opacity: 0.7, marginTop: 12 }}>
              Diese Schritte sind notwendig, damit dein Token‑Logo global sichtbar wird.
              GitHub oder Metadaten im Contract reichen dafür nicht aus.
            </p>
          </div>
        )}
      </div>

      <div className="divider" />

      <div className="row row--two">
        <div className="callout">
          <div className="callout__title">Gebühren‑Preview</div>
          <div className="callout__body">
            <div className="kv">
              <span>Create Fee</span>
              <strong id="feeValue">{fmt(fee)}</strong>
            </div>
            <div className="kv">
              <span>Liquidity</span>
              <strong id="liqValue">{fmt(Number(liquidity))}</strong>
            </div>
            <div className="kv">
              <span>Gesamt (≈)</span>
              <strong id="totalValue">{fmt(total)}</strong>
            </div>
            <div className="hint">
              On‑chain Reads via Factory. Werte variieren je nach Adresse/Chain.
            </div>
          </div>
        </div>

        <div className="callout callout--accent">
          <div className="callout__title">Anti‑Bot (immer aktiv)</div>
          <div className="callout__body">
            <div className="kv">
              <span>Trading Delay</span>
              <strong>2 Blöcke</strong>
            </div>
            <div className="kv">
              <span>Schutzphase</span>
              <strong>5 Blöcke</strong>
            </div>
            <div className="kv">
              <span>Max Tx</span>
              <strong>0.5% Supply</strong>
            </div>
            <div className="kv">
              <span>Cooldown</span>
              <strong>1 Transfer / Block</strong>
            </div>
            <div className="hint">
              Diese Schutzmechanismen sind beim Launch standardmäßig aktiv und werden on‑chain erzwungen.
            </div>
          </div>
        </div>
      </div>

      <div className="actions">
        <button
          className="btn btn--primary"
          type="submit"
          disabled={busy || !connected || !validInputs || !enoughLiquidity}
        >
          <span className="ico" aria-hidden="true">🚀</span>
          {busy ? "Sende TX…" : "Token erstellen"}
        </button>
      </div>

    

      {msg && (
        <div className="callout" style={{ marginTop: 12 }}>
          <div className="callout__body">{msg}</div>
        </div>
      )}
    </form>
  );
}
