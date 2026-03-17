import React from 'react';
import { useWallet } from '../web3/useWallet';
import { useNativeBalance } from '../web3/useNativeBalance';
import { web3 } from '../web3';
import { NATIVE_SYMBOL } from '../config';

export const WalletPanel: React.FC = () => {
  const { address, chainId, connected, connect } = useWallet();
  const balance = useNativeBalance(address);

  const short = (a?: string | null) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '—');
  const fmt = (n: number | null) => (n == null || Number.isNaN(n) ? '—' : `${n.toFixed(4)} ${NATIVE_SYMBOL}`);

  const switchTo = async (id: number) => {
    try { await web3.ensureChain(id); } catch (e) { console.error(e); }
  };

  return (
    <div className="card card--glow">
      <div className="card__head">
        <div>
          <div className="card__title">Quick Stats</div>
          <div className="card__sub">Live‑Preview (Wallet/Chain)</div>
        </div>
        <div className="pill"><span className="dot dot--cyan" /> {connected ? 'Connected' : 'Not connected'}</div>
      </div>

      <div className="statgrid">
        <div className="stat">
          <div className="stat__k">Wallet</div>
          <div className="stat__v" id="statWallet">{short(address)}</div>
        </div>
        <div className="stat">
          <div className="stat__k">Balance</div>
          <div className="stat__v" id="statBalance">{fmt(balance)}</div>
        </div>
       
      </div>

      <div className="divider" />

      <div className="mini">
        <div className="mini__row">
          <div className="mini__label">Soft‑Limits (24h)</div>
          <div className="mini__value">#1 0.02 • #2 0.05 • #3 0.10 • #4+ 0.20 BNB</div>
        </div>
        <div className="mini__row">
          <div className="mini__label">Reset in</div>
          <div className="mini__value">—</div>
        </div>
      </div>

      <div className="divider" />

      <div className="hero__cta" style={{ gap: 8 }}>
        <button className="btn btn--primary" onClick={connect}>
          {connected && address ? `Verbunden: ${short(address)}` : 'Wallet verbinden'}
        </button>
        <div className="dropdown-group">
          <button className="btn btn--ghost" onClick={() => switchTo(56)}>BSC Mainnet</button>
          <button className="btn btn--ghost" onClick={() => switchTo(97)}>BSC Testnet</button>
          <button className="btn btn--ghost" onClick={() => switchTo(11155111)}>Sepolia</button>
        </div>
      </div>
    </div>
  );
};