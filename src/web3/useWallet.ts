import { useEffect, useState, useCallback } from 'react';
import { web3 } from './index';

export function useWallet() {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(async () => {
    const res = await web3.connectWallet();
    setAddress(res.address);
    setChainId(res.chainId);
    setConnected(true);
    return res;
  }, []);

  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth?.on) return;

    const onAccounts = (accs: string[]) => {
      const a = (accs?.[0] ?? null) as `0x${string}` | null;
      setAddress(a);
      setConnected(!!a);
    };
    const onChain = async () => {
      try { setChainId(await web3.getChainId()); } catch {}
    };

    eth.on('accountsChanged', onAccounts);
    eth.on('chainChanged', onChain);

    // Initial bootstrap
    eth.request?.({ method: 'eth_accounts' })
      .then((accs: string[]) => onAccounts(accs))
      .catch(() => {});
    web3.getChainId().then(setChainId).catch(() => {});

    return () => {
      eth.removeListener?.('accountsChanged', onAccounts);
      eth.removeListener?.('chainChanged', onChain);
    };
  }, []);

  return { address, chainId, connected, connect };
}