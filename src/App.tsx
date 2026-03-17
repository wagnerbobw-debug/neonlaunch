import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { WalletPanel } from './components/WalletPanel';
import CreateTokenForm from './components/CreateTokenForm';
import { HowItWorks } from './components/HowItWorks';
import { Explore } from './components/Explore';
import { FAQ } from './components/FAQ';
import { DebugPanel } from './components/DebugPanel';
import { Footer } from './components/Footer';
import LpAnalysisPanel from './components/LpAnalysisPanel';
import { LpProvider } from './context/LpContext';

// ⬇️ NEU
import TokenVerificationPanel from "./components/TokenVerificationPanel";
// Wenn ihr die Adresse aus dem Context nehmt:
import { useLpContext } from './context/LpContext';

const PageContent: React.FC = () => {
  // ⬇️ Aus dem Context holen (falls vorhanden)
  const { createdTokenAddress, chainId } = useLpContext?.() ?? { createdTokenAddress: null, chainId: 56 };

  return (
    <main id="top">
      <Navbar />

      <section className="hero">
        <div className="hero__content">
          <Hero />
        </div>
        <aside className="hero__panel">
          <WalletPanel />
        </aside>
      </section>

      <section id="create" className="section">
        <div className="section__head">
          <h2 className="h2">Create Token</h2>
          <p className="muted">
            Wallet/Chain‑Spine + UI‑Gating ist live. Contract Calls laufen über Ethers v6.
          </p>
        </div>

        <div className="layout">
          <div className="card">
            <CreateTokenForm />
          </div>

          <div className="stack">
            {/* ⭐ LP-Panel bleibt unverändert */}
            <div className="card">
              <div className="card__title">Liquidity Analyse</div>
              <LpAnalysisPanel />
            </div>

            {/* ⬇️ NEU: Verifizierungspanel ZWISCHEN LP-Analyse und Debug */}
            <TokenVerificationPanel
              tokenAddress={createdTokenAddress}
              chainId={chainId}
            />

            <DebugPanel />
          </div>
        </div>
      </section>

      <section id="how" className="section">
        <div className="section__head">
          <h2 className="h2">How it works</h2>
          <p className="muted">Delay → Schutzphase → freier Handel.</p>
        </div>
        <div className="card">
          <HowItWorks />
        </div>
      </section>

      <Explore />
      <FAQ />
      <Footer />
    </main>
  );
};

export const App: React.FC = () => {
  return (
    <LpProvider>
      <PageContent />
    </LpProvider>
  );
};