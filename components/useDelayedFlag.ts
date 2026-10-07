import { useEffect, useState } from 'react';

/**
 * `active`, but only once it has held for `delayMs` — and false again the moment it lets go. For a
 * hint that comes up over a screen: one that is already there when the screen opens reads as the
 * screen's own dim rather than as a hint, so the screen is left alone for a beat first (08.11).
 */
export function useDelayedFlag(active: boolean, delayMs: number): boolean {
  const [due, setDue] = useState(false);

  useEffect(() => {
    if (!active) {
      return;
    }
    const timer = setTimeout(() => setDue(true), delayMs);
    return () => {
      clearTimeout(timer);
      setDue(false);
    };
  }, [active, delayMs]);

  return active && due;
}
