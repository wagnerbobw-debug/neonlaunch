// src/components/LpAnalysisPanel.tsx
import React from "react";
import { NATIVE_SYMBOL } from "../config";

// ⬅️ WICHTIG: der richtige Hook!!
import { useLpContext } from "../context/LpContext";

export default function LpAnalysisPanel() {

  // ⬅️ useLp() → useLpContext()
  // und: liquidity + supply müssen aus deinem Context kommen!
  const {
    liquidity = 0,
    supply = 0,
  } = useLpContext();

  // --- Berechnung Logik ---
  const lpTokens = supply * 0.1;

  const pricePerToken =
    liquidity > 0 && lpTokens > 0 ? liquidity / lpTokens : null;

  const tokensPerNative =
    pricePerToken && pricePerToken > 0 ? 1 / pricePerToken : null;

  const initialMarketcap =
    pricePerToken && supply ? supply * pricePerToken : null;

  const slippage = (buy: number) => {
    if (!liquidity || liquidity <= 0) return null;
    return Math.min(100, (buy / liquidity) * 100);
  };

  const liquidityColor = (v: number) => {
    if (v < 0.05) return "#e74c3c";
    if (v < 0.5) return "#e67e22";
    return "#2ecc71";
  };

  return (
    <div className="callout" style={{ marginTop: 24 }}>
      <div className="callout__title">Liquidity Analyse</div>
      <div className="callout__body">

        <div className="kv" style={{ color: liquidityColor(liquidity) }}>
          <span>Bewertung:</span>
          <strong>
            {liquidity < 0.05
              ? "❌ Extrem niedrig"
              : liquidity < 0.5
              ? "⚠️ Sehr wenig Liquidity"
              : "✅ Gesundes Liquidity-Level"}
          </strong>
        </div>

        <div className="hint" style={{ marginTop: 6 }}>
          Empfohlen: <strong>1–2 {NATIVE_SYMBOL}</strong> für stabilen Launch,
          geringeren Preisimpact und weniger Bot‑Anreiz.
        </div>

        <div className="kv" style={{ marginTop: 10 }}>
          <span>Startpreis je Token:</span>
          <strong>
            {pricePerToken
              ? `${pricePerToken.toFixed(12)} ${NATIVE_SYMBOL}`
              : "—"}
          </strong>
        </div>

        <div className="kv">
          <span>Tokens pro {NATIVE_SYMBOL}:</span>
          <strong>{tokensPerNative ? tokensPerNative.toFixed(2) : "—"}</strong>
        </div>

        <div className="kv">
          <span>Initial Marketcap (≈):</span>
          <strong>
            {initialMarketcap
              ? `${initialMarketcap.toFixed(2)} ${NATIVE_SYMBOL}`
              : "—"}
          </strong>
        </div>

        <div className="callout" style={{ marginTop: 12, background: "#111" }}>
          <div className="callout__title" style={{ fontSize: "0.9rem" }}>
            Slippage Simulation
          </div>
          <div className="callout__body">
            <div className="kv">
              <span>Kauf 0.1 {NATIVE_SYMBOL}:</span>
              <strong>{slippage(0.1)?.toFixed(1) ?? "—"}%</strong>
            </div>
            <div className="kv">
              <span>Kauf 0.5 {NATIVE_SYMBOL}:</span>
              <strong>{slippage(0.5)?.toFixed(1) ?? "—"}%</strong>
            </div>
            <div className="kv">
              <span>Kauf 1 {NATIVE_SYMBOL}:</span>
              <strong>{slippage(1)?.toFixed(1) ?? "—"}%</strong>
            </div>

            <div className="hint" style={{ marginTop: 6 }}>
              Ziel: <strong>&lt; 30% Slippage</strong> bei 1&nbsp;{NATIVE_SYMBOL}.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}