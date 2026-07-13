/*
 * Room-space domain model for the 3D pet-room vertical slice (?room3d=1).
 *
 * This module is pure data/math — no three.js import — so the placement domain
 * stays separable from the renderer. The 2.5D editor persists placements as
 * normalized stage fractions ({ x, y } in 0..1, see roomItems.js); this adapter
 * projects those SAME persisted coordinates onto the 3D floor so both stages
 * read from one source of truth and a future drag-in-3D can write back through
 * the existing onPlaceItemAt/onMoveItem handlers without a schema change.
 *
 * World units are meter-like. Axes: +x right, +y up, +z toward the viewer.
 * The floor is centered at the origin; the back wall sits at z = -depth / 2.
 */

export const ROOM3D = Object.freeze({
  width: 3.6, // x span of the floor
  depth: 3.0, // z span of the floor
  height: 2.6, // wall height
});

// Keep projected slots away from the walls so a placeholder never clips into
// the shell geometry. Mirrors the 2.5D PAD (0.08) idea in world units.
const EDGE_X = 0.6;
const BACK_MARGIN = 0.45;
const FRONT_MARGIN = 0.55;

// The 2.5D decorator clamps normalized coordinates to [PAD, 1 - PAD] with
// PAD = 0.1; the 3D write path clamps to the same band so a placement made in
// either editor round-trips through the other without shifting.
const PLACE_PAD = 0.1;

const lerp = (a, b, t) => a + (b - a) * Math.min(1, Math.max(0, t));
const clampPad = (v) => Math.min(1 - PLACE_PAD, Math.max(PLACE_PAD, v));

// 2.5D stage fraction → 3D floor position. The 2.5D y axis (top → bottom of
// the flat stage) reads as scene depth: a small y sits deep in the room, a
// large y sits near the open front edge. Height (world y) is always 0 — every
// slot rests on the floor in this slice.
export function placementToWorld({ x = 0.5, y = 0.6 } = {}) {
  return {
    x: lerp(-(ROOM3D.width / 2 - EDGE_X), ROOM3D.width / 2 - EDGE_X, x),
    y: 0,
    z: lerp(-(ROOM3D.depth / 2 - BACK_MARGIN), ROOM3D.depth / 2 - FRONT_MARGIN, y),
  };
}

// 3D floor position → normalized stage fraction (the exact inverse of
// placementToWorld, then clamped to the 2.5D editor's PAD band). This is the
// write path for placing/moving items by tapping the 3D floor: the persisted
// schema stays the SAME normalized { x, y } the 2.5D editor stores.
export function worldToPlacement({ x = 0, z = 0 } = {}) {
  const xMin = -(ROOM3D.width / 2 - EDGE_X);
  const xMax = ROOM3D.width / 2 - EDGE_X;
  const zMin = -(ROOM3D.depth / 2 - BACK_MARGIN);
  const zMax = ROOM3D.depth / 2 - FRONT_MARGIN;
  return {
    x: clampPad((x - xMin) / (xMax - xMin)),
    y: clampPad((z - zMin) / (zMax - zMin)),
  };
}

// Fixed scenery layout — positions of the built room furniture (not player
// items). Everything except the cat bed sits OUTSIDE the placeable band above
// so scenery and placed items never fight for the same floor space. The shell
// and the lighting rig both read from here so the lamp glow stays attached to
// the lamp mesh.
export const SCENERY = Object.freeze({
  lamp: Object.freeze({ x: 1.34, z: -1.02, shadeY: 1.24 }),
  table: Object.freeze({ x: -1.0, z: -1.12 }),
  window: Object.freeze({ x: 0.58, y: 1.56, w: 0.92, h: 1.04 }), // centered on the back wall face
  shelf: Object.freeze({ z: -0.22, y: 1.42 }), // mounted on the west wall
  cushion: Object.freeze({ x: 1.42, z: 0.52 }), // floor cushion by the east wall
});

// Placeholder slot footprints per item (w × h × d, world units), approximated
// from the catalogue art proportions. These size the neutral slot proxies —
// they are NOT the items themselves (no transparent item sprites exist yet).
export const ITEM_FOOTPRINTS = Object.freeze({
  snack: { w: 0.34, h: 0.1, d: 0.24 },
  ember_lamp: { w: 0.26, h: 0.52, d: 0.26 },
  cushion: { w: 0.74, h: 0.16, d: 0.52 },
  rug: { w: 1.15, h: 0.03, d: 0.7 },
  cat_house: { w: 0.62, h: 0.72, d: 0.55 },
  plant: { w: 0.34, h: 0.5, d: 0.34 },
  toy: { w: 0.3, h: 0.14, d: 0.24 },
});

export const DEFAULT_FOOTPRINT = Object.freeze({ w: 0.4, h: 0.3, d: 0.4 });

export function footprintFor(itemId) {
  return ITEM_FOOTPRINTS[itemId] ?? DEFAULT_FOOTPRINT;
}

// Cat anchor — where the future transparent cat will stand, plus the radius of
// its contact-shadow disc. The slice renders ONLY the shadow anchor (a soft
// floor disc) and an empty mount point; it never fabricates a cat visual out
// of the baked room art.
export const CAT_ANCHOR = Object.freeze({
  position: Object.freeze({ x: -0.38, y: 0, z: 0.5 }),
  shadowRadius: 0.42,
});

// Cat animation state interface — the contract a future frame-based idle
// animation plugs into. `frameSetReady` stays false until approved transparent
// frame assets land (see ASSET_CONTRACT.md next to this file); nothing may
// play, and no UI may claim motion, while it is false.
export const CAT_ANIM_STATES = Object.freeze(['idle', 'blink', 'breathe', 'ear', 'tail']);

export function createCatAnimationState(initial = 'idle') {
  return {
    current: CAT_ANIM_STATES.includes(initial) ? initial : 'idle',
    startedAtMs: 0,
    frameSetReady: false,
  };
}

export function canPlayCatAnimation(state) {
  return Boolean(state?.frameSetReady);
}
