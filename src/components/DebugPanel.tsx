import React, { useEffect, useState } from "react";
import { web3 } from "../web3";

export const DebugPanel: React.FC = () => {
  const [chain, setChain] = useState<number | null>(null);
  const [factory, setFactory] = useState<string>("not set");
  const [tx, setTx] = useState<string>("—");
  const [result, setResult] = useState<string>("—");

  useEffect(() => {
    web3.getChainId().then(setChain).catch(() => setChain(null));
    setFactory(import.meta.env.VITE_FACTORY_ADDRESS || "not set");

    const handler = (ev: any) => {
      if (ev?.detail?.txHash) setTx(ev.detail.txHash);
      if (ev?.detail?.tokenAddress) {
        setResult(`Token: ${ev.detail.tokenAddress}`);
      }
    };

    window.addEventListener("neon:tx", handler);
    return () => window.removeEventListener("neon:tx", handler);
  }, []);

  return (
    <div className="card card--glow">
      <div className="card__title">Debug</div>

      <div className="mini">
        <div className="mini__row">
          <div className="mini__label">ChainId</div>
          <div className="mini__value" id="debugChain">{chain ?? "—"}</div>
        </div>

        <div className="mini__row">
          <div className="mini__label">Factory</div>
          <div className="mini__value" id="debugFactory">{factory}</div>
        </div>

        <div className="mini__row">
          <div className="mini__label">TX</div>
          <div className="mini__value" id="debugTx">{tx}</div>
        </div>

        <div className="mini__row">
          <div className="mini__label">Result</div>
          <div className="mini__value" id="debugResult">{result}</div>
        </div>
      </div>
    </div>
  );
};