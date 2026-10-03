import { useCallback, useState } from 'react';
import { FREE_IMAGE_TRIALS, PRO_MONTHLY_IMAGE_LIMIT } from '../constants/imagePolicy.js';

/*
 * useImageUsage — the REAL usage ledger for Future-Image generation (founder §4A). Local-only, it
 * prevents accidental unlimited generation: FREE gets FREE_IMAGE_TRIALS lifetime trials; PRO gets
 * PRO_MONTHLY_IMAGE_LIMIT per calendar month (reset by month key). canGenerate() must be checked
 * BEFORE calling the provider, and recordGeneration() called only on a real success, so a paid API
 * can never be hit beyond the allowance.
 *
 * This is a metering ledger, not a paywall UI — it holds no prices and makes no network call.
 */

const KEY = 'nof.image.usage.v1';

function monthKey(now = Date.now()) {
  const d = new Date(now);
  return `${d.getFullYear()}-${d.getMonth() + 1}`;
}

function read() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      freeTrialsUsed: Number(raw.freeTrialsUsed) || 0,
      monthlyUsed: Number(raw.monthlyUsed) || 0,
      month: typeof raw.month === 'string' ? raw.month : monthKey(),
    };
  } catch {
    return { freeTrialsUsed: 0, monthlyUsed: 0, month: monthKey() };
  }
}

function write(v) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* storage unavailable — ledger still enforced in-memory this session */
  }
}

// Roll the monthly counter over when the calendar month changes.
function rolled(ledger, now = Date.now()) {
  const mk = monthKey(now);
  if (ledger.month !== mk) return { ...ledger, month: mk, monthlyUsed: 0 };
  return ledger;
}

export function useImageUsage() {
  const [ledger, setLedger] = useState(() => rolled(read()));

  // Remaining generations for the given tier. Never negative.
  const remaining = useCallback(
    (isPro = false) => {
      const l = rolled(ledger);
      return isPro
        ? Math.max(0, PRO_MONTHLY_IMAGE_LIMIT - l.monthlyUsed)
        : Math.max(0, FREE_IMAGE_TRIALS - l.freeTrialsUsed);
    },
    [ledger],
  );

  const canGenerate = useCallback((isPro = false) => remaining(isPro) > 0, [remaining]);

  // Record ONE successful generation. Call only after the provider actually returned ready.
  const recordGeneration = useCallback((isPro = false) => {
    setLedger((prev) => {
      const l = rolled(prev);
      const next = isPro
        ? { ...l, monthlyUsed: l.monthlyUsed + 1 }
        : { ...l, freeTrialsUsed: l.freeTrialsUsed + 1 };
      write(next);
      return next;
    });
  }, []);

  return {
    freeTrialsUsed: ledger.freeTrialsUsed,
    monthlyUsed: ledger.monthlyUsed,
    freeLimit: FREE_IMAGE_TRIALS,
    proLimit: PRO_MONTHLY_IMAGE_LIMIT,
    remaining,
    canGenerate,
    recordGeneration,
  };
}
