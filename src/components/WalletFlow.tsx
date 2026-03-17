// src/components/WalletFlow.tsx
import { useWallet } from "../web3/useWallet";
import { CreateTokenPanel } from "./CreateTokenPanel";

export default function WalletFlow() {
  const {
    hasProvider,
    account,
    chainId,
    balance,
    connecting,
    connect,
    disconnect,
    switchToTargetChain,
    isOnTargetChain,
  } = useWallet();

  if (!hasProvider) {
    return <div>Bitte MetaMask oder kompatibles Wallet installieren.</div>;
  }

  return (
    <section style={{ display: "grid", gap: 16 }}>
      <header style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {!account ? (
          <button onClick={connect} disabled={connecting}>
            {connecting ? "Verbinde..." : "Wallet verbinden"}
          </button>
        ) : (
          <>
            <span>Verbunden: <code>{account}</code></span>
            <span>Balance: {Number(balance).toFixed(4)} BNB</span>
            <span>Chain ID: {chainId ?? "–"}</span>
            {!isOnTargetChain && (
              <button onClick={switchToTargetChain}>Zu BSC wechseln</button>
            )}
            <button onClick={disconnect}>Disconnect</button>
          </>
        )}
      </header>

      {/* EINZIGER Create-Bereich */}
      <CreateTokenPanel
        account={account}
        isOnTargetChain={!!isOnTargetChain}
        onRequireConnect={connect}
        onRequireSwitchChain={switchToTargetChain}
      />
    </section>
  );
}
``