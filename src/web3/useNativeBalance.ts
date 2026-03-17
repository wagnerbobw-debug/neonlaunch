import { useEffect, useState } from 'react';
import { web3 } from './index';

export function useNativeBalance(address: `0x${string}` | null, pollMs = 8000) {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    let t: any;

    async function tick() {
      if (!address) { if (alive) setBalance(null); return; }
      try {
        const b = await web3.getBalance(address);
        if (alive) setBalance(b);
      } catch {
        if (alive) setBalance(null);
      }
    }

    tick();
    t = setInterval(tick, pollMs);
    return () => { alive = false; if (t) clearInterval(t); };
  }, [address, pollMs]);

  return balance;
}