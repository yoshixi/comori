import { useEffect, useState } from 'react';

/** Wall-clock seconds, ticked every `intervalMs` (Electron Today log status uses 30s). */
export function usePeriodicNowSec(intervalMs = 30_000): number {
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return nowSec;
}
