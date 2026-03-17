import React from 'react';

export const HowItWorks: React.FC = () => {
  return (
    <div className="timeline" aria-label="Launch Ablauf">
      <div className="tstep">
        <div className="tbadge tbadge--cyan">1</div>
        <div className="tcontent">
          <div className="thead">Create</div>
          <div className="tsub">Wallet signiert → Factory deployt Token + LP + Liquidity.</div>
        </div>
      </div>
      <div className="tstep">
        <div className="tbadge tbadge--red">2</div>
        <div className="tcontent">
          <div className="thead">Anti Spam Phase </div>
          <div className="tsub">🔴 Creation Fee steigerung:1Token 0.02BNB-2Token 0.05BNB-3Token 0.1BNB-4Token 0.2BNB.</div>
        </div>
     
      </div>
      <div className="tstep">
        <div className="tbadge tbadge--green">3</div>
        <div className="tcontent">
          <div className="thead">LP angelegt </div>
          <div className="tsub">🟢 Freier Handel:LP wird unter der deploytem Contractadresse und Wrapped BNB WBNB auf Pankace V2 erstellt.</div>
        </div>
      </div>
    </div>
  );
};