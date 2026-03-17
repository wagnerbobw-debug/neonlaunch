// src/views/LpAnalysisView.tsx
import React, { useState } from "react";
import LpAnalysisPanel from "../components/LpAnalysisPanel";
import { NATIVE_SYMBOL } from "../config";

export default function LpAnalysisView() {
  const [supply, setSupply] = useState<number>(100_000_000);
  const [liquidity, setLiquidity] = useState<number>(1.0);

  return (
    <div className="container" style={{ maxWidth: 700, margin: "40px auto" }}>
      <h1>Liquidity Analyse</h1>

      <p className="hint">
        Dieses Tool berechnet Preis, Slippage und Marktabschätzung basierend auf
        deiner Liquidity und deinem Token‑Supply.
      </p>

      <div className="divider" />

      {/* Eingabe: Supply */}
      <div className="field" style={{ marginTop: 20 }}>
        <label>Total Supply</label>
        <input
          type="number"
          min={1000}
          step={1000}
          value={supply}
          onChange={(e) => setSupply(Number(e.target.value))}
        />
      </div>

      {/* Eingabe: Liquidity */}
      <div className="field">
        <label>Liquidity ({NATIVE_SYMBOL})</label>
        <input
          type="number"
          min={0.01}
          step={0.01}
          value={liquidity}
          onChange={(e) => setLiquidity(Number(e.target.value))}
        />
      </div>

      {/* Das LP Analyse Panel */}
      <LpAnalysisPanel liquidity={liquidity} supply={supply} />
    </div>
  );
}