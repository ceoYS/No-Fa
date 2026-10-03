/*
 * roomNav — a tiny in-SPA intent channel so Home entry points (the kitten hero, the league
 * preview) can open a SPECIFIC 내 방 sub-view (hub / room / growth / league) without touching
 * App.jsx's screen router. Set the pending view, then navigate to the 'reward' screen; the
 * 내 방 screen consumes it once on mount and falls back to the hub. Module singleton, no
 * storage, no network — it exists only for the duration of one navigation.
 */
let pending = null;

export function requestRoomView(view) {
  pending = view;
}

export function consumeRoomView() {
  const v = pending;
  pending = null;
  return v;
}
