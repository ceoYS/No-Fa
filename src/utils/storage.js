/*
 * Local persistence for NoF core app state (P0 "feel less like a mock" round).
 *
 * PRIVACY / HONESTY NOTE: this util writes to browser localStorage ONLY. It makes
 * NO network call — no fetch / XMLHttpRequest / WebSocket, no server, no external
 * API, no telemetry, no analytics, no cloud sync. Nothing ever leaves the device.
 * It is a dumb key/value box: App decides WHAT to persist (counters, rules,
 * reflections, planner signals, room state) and, just as importantly, what NOT to
 * persist (no real URLs, no explicit terms, no browsing history, no visited
 * targets, no Chrome-extension blocked-target — none of that lives in app state to
 * begin with). load/save never throw: a missing/disabled localStorage or corrupt
 * JSON falls back to seed/default state so the app still boots. Guard #38 pins this.
 */
const STORAGE_KEY = 'nof.mvp.state.v1';

function storage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

// Read the persisted bundle. Returns a plain object on success, or null when
// storage is unavailable, the key is empty, or the stored JSON is corrupt — the
// caller then keeps its seed/default state. Never throws.
export function loadState() {
  const ls = storage();
  if (!ls) return null;
  try {
    const raw = ls.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

// Persist the bundle. Best-effort: a serialization error or a full/disabled
// localStorage is swallowed so a save can never crash the app. Never throws.
export function saveState(state) {
  const ls = storage();
  if (!ls) return;
  try {
    ls.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* localStorage full / disabled / private-mode — silently skip the save. */
  }
}

// Drop the persisted bundle (manual local-data reset). Never throws.
export function clearState() {
  const ls = storage();
  if (!ls) return;
  try {
    ls.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to do — best effort. */
  }
}
