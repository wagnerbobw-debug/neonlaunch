import React from "react";

export const Hero: React.FC = () => {
  return (
    <>
      <div className="kicker">Fair Launch • Low Liquidity • Soft Limits</div>

      <h1 className="h1">
        Token‑Launches mit <span className="neon">NeonLaunch</span> —{" "}
        <span className="neon2">hart</span> gegen Spam.
      </h1>

      <p className="lead">
        Erstelle in Minuten einen Token, füge Liquidität hinzu und starte mit
        transparenter Anti‑Bot‑Phase. Keine Accounts, keine versteckten Tricks — nur klare Regeln.
      </p>

      <div className="hero__cta">
        
        <a className="btn btn--ghost" href="#how">
          Ablauf ansehen
        </a>
      </div>

      <div className="badges">
        <div className="badge">
          <span className="badge__icon">🛡️</span> Anti‑Bot (erste Blöcke)
        </div>
        
        <div className="badge">
          <span className="badge__icon">🧾</span> On‑chain transparent
        </div>
      </div>
    </>
  );
};