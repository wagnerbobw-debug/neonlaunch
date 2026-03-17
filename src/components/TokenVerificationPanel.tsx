// src/components/TokenVerificationPanel.tsx
import React from "react";

export interface TokenVerificationPanelProps {
  tokenAddress?: string | null;
  chainId?: number; // 56=BSC Mainnet, 97=BSC Testnet
  title?: string;
  verified?: boolean; // optional: Deploy-Route kann "verified: true" zurückgeben
}

const TokenVerificationPanel: React.FC<TokenVerificationPanelProps> = ({
  tokenAddress,
  chainId = 56,
  title = "BscScan Verifizierung",
  verified = false,
}) => {
  if (!tokenAddress) return null;

  const explorer =
    chainId === 97
      ? "https://testnet.bscscan.com"
      : "https://bscscan.com";

  const url = `${explorer}/address/${tokenAddress}#code`;

  return (
    <section className="card card--glow" style={{ marginTop: 16 }}>
      <div className="card__head">
        <div>
          <div className="card__title">{title}</div>
          <div className="card__sub">
            Der Token‑Quellcode wird automatisch während des Deployments
            verifiziert. Du kannst ihn hier auf BscScan ansehen.
          </div>
        </div>
      </div>

      <div className="mini" style={{ marginTop: 8 }}>
        <div className="mini__row">
          <div className="mini__label">Contract</div>
          <div className="mini__value">
            <code>{tokenAddress}</code>
            {" · "}
            <a href={url} target="_blank" rel="noreferrer">
              Auf BscScan ansehen →
            </a>
          </div>
        </div>
      </div>

      <div className="hero__cta" style={{ gap: 8, marginTop: 12 }}>
        <button
          className="btn btn--primary"
          type="button"
          disabled={true}
          title="Die automatische Verifikation erfolgt bereits beim Deploy."
        >
          Automatische Verifikation aktiv
        </button>

        <a
          href={`${explorer}/verifyContract`}
          target="_blank"
          rel="noreferrer"
          className="btn btn--ghost"
        >
          Manuell verifizieren
        </a>
      </div>
    </section>
  );
};

export default TokenVerificationPanel;
