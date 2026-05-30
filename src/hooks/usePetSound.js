import { useCallback, useEffect, useRef, useState } from 'react';

/*
 * usePetSound — soft, gesture-gated cat audio for the pet room (PRD §0.6.9).
 *
 * Honesty + safety rules this hook keeps:
 *   - No autoplay. play(name) is only ever called from a real user gesture
 *     (scene tap / 간식 주기) in the screen — never on mount or in an effect.
 *   - Local assets only, no external URLs. Paths resolve under /assets/sounds.
 *   - Silent fallback. If a file is missing (404) or the browser blocks
 *     playback, play() resolves quietly — the UI must never error or block.
 *   - The files are NOT committed yet; until they land, every play() is a no-op
 *     and `missing` lists what the contract still needs.
 *
 * Asset contract (drop real files here, then they just start playing):
 *   public/assets/sounds/cat_meow_soft.mp3
 *   public/assets/sounds/cat_purr_soft.mp3
 */

export const PET_SOUNDS = {
  meow: '/assets/sounds/cat_meow_soft.mp3',
  purr: '/assets/sounds/cat_purr_soft.mp3',
};

const STORAGE_KEY = 'nof.petSound.muted';

function readMutedPref() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage?.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export default function usePetSound() {
  const [muted, setMuted] = useState(readMutedPref);
  // Lazily-created <audio> elements, one per sound key, reused across taps.
  const elements = useRef({});
  // Per-key availability cache: undefined = unknown, true/false = probed.
  const availability = useRef({});
  const [missing, setMissing] = useState([]);

  // One-time, non-blocking probe so a developer sees which contract files are
  // still absent. HEAD avoids downloading audio; failures are treated as missing.
  useEffect(() => {
    if (typeof window === 'undefined' || typeof fetch !== 'function') return;
    let cancelled = false;
    Promise.all(
      Object.entries(PET_SOUNDS).map(async ([key, src]) => {
        try {
          const res = await fetch(src, { method: 'HEAD' });
          availability.current[key] = res.ok;
          return res.ok ? null : src;
        } catch {
          availability.current[key] = false;
          return src;
        }
      }),
    ).then((results) => {
      if (cancelled) return;
      const absent = results.filter(Boolean);
      setMissing(absent);
      if (absent.length && import.meta.env?.DEV) {
        // eslint-disable-next-line no-console
        console.info('[usePetSound] silent fallback — missing audio:', absent.join(', '));
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleMuted = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      try {
        window.localStorage?.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* storage unavailable — keep in-memory only */
      }
      return next;
    });
  }, []);

  // Play a named sound if it's available. Always resolves; never throws. Safe to
  // call on every tap — known-missing files short-circuit before touching Audio.
  const play = useCallback(
    (name) => {
      const src = PET_SOUNDS[name];
      if (!src || muted) return;
      if (availability.current[name] === false) return; // known missing → stay silent
      if (typeof Audio === 'undefined') return;
      try {
        let el = elements.current[name];
        if (!el) {
          el = new Audio(src);
          el.preload = 'none';
          el.volume = 0.5;
          elements.current[name] = el;
        }
        el.currentTime = 0;
        const p = el.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch {
        /* playback blocked or asset missing — silent fallback */
      }
    },
    [muted],
  );

  return { play, muted, toggleMuted, missing };
}
