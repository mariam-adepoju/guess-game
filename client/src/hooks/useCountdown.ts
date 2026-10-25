import { useEffect, useState } from "react";

function remainingSeconds(endsAt: number, clockOffset: number): number {
  return Math.max(0, Math.ceil((endsAt - (Date.now() + clockOffset)) / 1000));
}

/**
 * Seconds left until `endsAt` (server time). Remount with a new `key` per round
 * so the initial value is always fresh.
 */
export function useCountdown(endsAt: number, clockOffset = 0): number {
  const [seconds, setSeconds] = useState(() =>
    remainingSeconds(endsAt, clockOffset),
  );

  useEffect(() => {
    const id = window.setInterval(
      () => setSeconds(remainingSeconds(endsAt, clockOffset)),
      250,
    );
    return () => window.clearInterval(id);
  }, [endsAt, clockOffset]);

  return seconds;
}
