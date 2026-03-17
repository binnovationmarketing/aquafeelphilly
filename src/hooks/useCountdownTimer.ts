import { useState, useEffect, useRef } from 'react';

interface TimeLeft {
  hours: number;
  minutes: number;
  seconds: number;
}

/**
 * Server-anchored 48-hour countdown timer.
 *
 * `proposalOpenedAt` is the ISO timestamp stored in Supabase (`proposal_opened_at`).
 * Because it originates on the server it cannot be reset by clearing cookies,
 * switching browsers, or sharing the link with another person.
 *
 * Falls back to the current time when `proposalOpenedAt` is null (e.g. legacy
 * flows without a server-side anchor).
 */
export function useCountdownTimer(
  proposalOpenedAt: string | null,
  expirationHours: number = 48
) {
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ hours: 0, minutes: 0, seconds: 0 });

  // Track previous anchor so we only recompute when it actually changes
  const prevAnchorRef = useRef<string | null>(null);

  useEffect(() => {
    // Only re-derive if the anchor changed
    if (proposalOpenedAt === prevAnchorRef.current && expirationDate) return;
    prevAnchorRef.current = proposalOpenedAt;

    const startDate = proposalOpenedAt
      ? new Date(proposalOpenedAt)
      : new Date(); // fallback: start from now

    const expDate = new Date(startDate.getTime() + expirationHours * 60 * 60 * 1000);
    setExpirationDate(expDate);
  }, [proposalOpenedAt, expirationHours]);

  useEffect(() => {
    if (!expirationDate) return;

    const tick = () => {
      const diff = expirationDate.getTime() - Date.now();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      } else {
        setIsExpired(false);
        setTimeLeft({
          hours:   Math.floor(diff / (1000 * 60 * 60)),
          minutes: Math.floor((diff / (1000 * 60)) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expirationDate]);

  return { expirationDate, isExpired, timeLeft };
}
