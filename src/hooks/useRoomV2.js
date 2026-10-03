/*
 * useRoomV2 — the V2 pet room's own persisted state: the selected THEME and the placed V2
 * decor. localStorage ONLY, its OWN key (separate from App's bundle and from progression /
 * league). No network. This is what makes "selected room survives a hard reload" and "decor
 * stays after 배치 마치기" true — both round-trip through this store.
 */
import { useEffect, useState } from 'react';
import { DEFAULT_ROOM_THEME_V2, themeById, clamp01, inSafeZone, isFloorDecor, V2_DECOR_SLOTS } from '../constants/roomV2.js';

const KEY = 'nof.roomv2.v1';

function load() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p && typeof p === 'object' ? p : null;
  } catch {
    return null;
  }
}
function save(state) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* full / private mode — skip, never throw */
  }
}

const SEED = { theme: DEFAULT_ROOM_THEME_V2, decor: [] };

export function useRoomV2({ allowSnow = false } = {}) {
  const [state, setState] = useState(() => {
    const p = load();
    return p ? { ...SEED, ...p } : { ...SEED };
  });

  useEffect(() => {
    save(state);
  }, [state]);

  // Choose a room theme. The 백염 눈밤 theme is a league reward — it is only selectable when
  // `allowSnow` (reaching the 백염 league) is true; otherwise the choice is ignored.
  const setTheme = (id) => {
    const t = themeById(id);
    if (t.reward && !allowSnow) return;
    setState((prev) => ({ ...prev, theme: t.id }));
  };

  // Place / move a decor prop at a normalized foot point, clamped to the frame and NEVER
  // inside a safe zone (cat / feeder / den stay clear). Upsert by id.
  // A FLOOR prop (the rug) is the exception: it is drawn beneath the cat/feeder and cannot
  // occlude them, so it may lie under them at the room's heart — otherwise a round rug had no
  // valid spot and silently failed to place (its default slot fell inside the cat's safe zone).
  const placeDecor = (id, x, y) => {
    const nx = clamp01(x);
    const ny = clamp01(y);
    if (!isFloorDecor(id) && inSafeZone(nx, ny)) return false; // opaque decor cannot cover the cat or the feeder
    setState((prev) => {
      const rest = prev.decor.filter((d) => d.id !== id);
      return { ...prev, decor: [...rest, { id, x: nx, y: ny }] };
    });
    return true;
  };

  // Add a prop at its default slot (used by a tap-to-add tray). Falls back to a floor centre.
  const addDecor = (id) => {
    const slot = V2_DECOR_SLOTS[id] ?? { x: 0.5, y: 0.9 };
    return placeDecor(id, slot.x, slot.y);
  };

  const removeDecor = (id) => setState((prev) => ({ ...prev, decor: prev.decor.filter((d) => d.id !== id) }));

  const activeTheme = themeById(state.theme);
  // If a reward theme was persisted and the gate later closed, fall back to walnut for display.
  const effectiveTheme = activeTheme.reward && !allowSnow ? themeById(DEFAULT_ROOM_THEME_V2) : activeTheme;

  return { theme: effectiveTheme, themeId: effectiveTheme.id, decor: state.decor, setTheme, placeDecor, addDecor, removeDecor };
}
