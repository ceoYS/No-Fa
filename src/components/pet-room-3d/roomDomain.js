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

// Placeholder slot footprints per item (w × h × d, world units), matched to
// the catalogue art proportions (ember_lamp is a round paper mood lamp, the
// cushion is a round plush pouf, the plant is a slim vase with branches…).
// These size the neutral slot proxies — they are NOT the items themselves
// (no transparent item sprites exist yet).
export const ITEM_FOOTPRINTS = Object.freeze({
  snack: { w: 0.34, h: 0.1, d: 0.24 },
  ember_lamp: { w: 0.3, h: 0.34, d: 0.3 },
  cushion: { w: 0.5, h: 0.17, d: 0.5 },
  rug: { w: 1.0, h: 0.02, d: 0.64 },
  cat_house: { w: 0.56, h: 0.6, d: 0.5 },
  plant: { w: 0.26, h: 0.6, d: 0.26 },
  toy: { w: 0.32, h: 0.12, d: 0.26 },
});

export const DEFAULT_FOOTPRINT = Object.freeze({ w: 0.4, h: 0.3, d: 0.4 });

export function footprintFor(itemId) {
  return ITEM_FOOTPRINTS[itemId] ?? DEFAULT_FOOTPRINT;
}

// Cat anchor — where the cat rests, plus the radius of its contact-shadow
// disc. Phase C mounts the honest procedural 3D cat (catRig.js) on this
// anchor; it is real primitive geometry in the room's own lighting, never a
// pasted image or a claim of finished character art. Declared above the
// placement rules because the cat's resting spot doubles as a keep-out area
// for user items.
export const CAT_ANCHOR = Object.freeze({
  position: Object.freeze({ x: -0.38, y: 0, z: 0.5 }),
  shadowRadius: 0.42,
});

// ── placement rules (Phase B-3) ─────────────────────────────────────────────
//
// The goal is previewed, VALID placement — not "spawn a proxy wherever the
// floor was tapped". Three layers of rules, all pure math so the QA harness
// can import and cross-check them in node:
//   1. the placeable band (the same clamped band placementToWorld projects),
//   2. per-item zone (floor anywhere in the band, wall-near = the band's
//      outer ring so lamps/plants hug a wall instead of the walk space),
//   3. occupancy (fixed scenery keep-out areas + already-placed items).

// The world-space band every persisted placement projects into. Derived from
// the same constants as placementToWorld so the two can never drift apart.
export const PLACE_BAND = Object.freeze({
  xMin: -(ROOM3D.width / 2 - EDGE_X) + (ROOM3D.width - EDGE_X * 2) * PLACE_PAD,
  xMax: ROOM3D.width / 2 - EDGE_X - (ROOM3D.width - EDGE_X * 2) * PLACE_PAD,
  zMin: -(ROOM3D.depth / 2 - BACK_MARGIN) + (ROOM3D.depth - BACK_MARGIN - FRONT_MARGIN) * PLACE_PAD,
  zMax: ROOM3D.depth / 2 - FRONT_MARGIN - (ROOM3D.depth - BACK_MARGIN - FRONT_MARGIN) * PLACE_PAD,
});

// Depth of the wall-near ring measured inward from the band edge.
const WALL_NEAR_DEPTH = 0.3;

// Minimum clear gap between two placed items' occupancy circles.
const ITEM_GAP = 0.05;

// Per-item placement metadata (Phase B-3 contract):
//   realWorldScale — proxy scale multiplier (geometry is built at world size,
//                    so 1 unless an item needs a global nudge),
//   defaultRotation / rotationStep — degrees; rotation is user-stepped only,
//   allowedZone — 'floor' (anywhere in the band) | 'wall-near' (outer ring),
//   radius — occupancy half-extent for collision, in world units.
export const ITEM_PLACEMENT_META = Object.freeze({
  ember_lamp: { realWorldScale: 1, defaultRotation: 0, rotationStep: 15, allowedZone: 'wall-near', radius: 0.16 },
  cushion: { realWorldScale: 1, defaultRotation: 0, rotationStep: 15, allowedZone: 'floor', radius: 0.26 },
  rug: { realWorldScale: 1, defaultRotation: 0, rotationStep: 15, allowedZone: 'floor', radius: 0.45 },
  cat_house: { realWorldScale: 1, defaultRotation: 0, rotationStep: 15, allowedZone: 'floor', radius: 0.3 },
  plant: { realWorldScale: 1, defaultRotation: 0, rotationStep: 15, allowedZone: 'wall-near', radius: 0.15 },
  toy: { realWorldScale: 1, defaultRotation: 0, rotationStep: 15, allowedZone: 'floor', radius: 0.16 },
});

const DEFAULT_PLACEMENT_META = Object.freeze({
  realWorldScale: 1,
  defaultRotation: 0,
  rotationStep: 15,
  allowedZone: 'floor',
  radius: 0.2,
});

export function placementMetaFor(itemId) {
  return ITEM_PLACEMENT_META[itemId] ?? DEFAULT_PLACEMENT_META;
}

// Fixed keep-out areas (world-space circles). Scenery furniture, the cat's
// resting spots and the shelf strip stay clear of user items; the band clamp
// itself already keeps every center away from the walls and the room edge.
export const BLOCKED_AREAS = Object.freeze([
  { id: 'cat-bed', x: CAT_ANCHOR.position.x, z: CAT_ANCHOR.position.z, r: 0.46, reason: 'cat-area' },
  { id: 'rug-rest', x: -0.12, z: 0.42, r: 0.28, reason: 'cat-area' },
  { id: 'low-table', x: SCENERY.table.x, z: SCENERY.table.z, r: 0.52, reason: 'scenery' },
  { id: 'floor-lamp', x: SCENERY.lamp.x, z: SCENERY.lamp.z, r: 0.34, reason: 'scenery' },
  { id: 'floor-cushion', x: SCENERY.cushion.x, z: SCENERY.cushion.z, r: 0.34, reason: 'scenery' },
  { id: 'shelf-strip', x: -1.7, z: SCENERY.shelf.z, r: 0.55, reason: 'scenery' },
]);

// Short honest notices per rejection reason — shown instead of saving.
export const PLACEMENT_REASON_MESSAGES = Object.freeze({
  'cat-area': '여기는 고양이가 쉬는 자리예요. 조금 옆에 놓아 주세요.',
  scenery: '이미 있는 가구와 겹쳐요. 빈 바닥을 골라 주세요.',
  'overlap-item': '놓아둔 아이템과 겹쳐요. 사이를 조금 띄워 주세요.',
  'zone-wall-near': '이 아이템은 벽 가까운 자리에 어울려요.',
});

export function isWallNear({ x = 0, z = 0 } = {}) {
  return (
    PLACE_BAND.xMax - Math.abs(x) <= WALL_NEAR_DEPTH ||
    z - PLACE_BAND.zMin <= WALL_NEAR_DEPTH ||
    PLACE_BAND.zMax - z <= WALL_NEAR_DEPTH
  );
}

// The single placement judge. Takes a candidate WORLD floor point, snaps it
// into the persistable band (the exact worldToPlacement/placementToWorld
// round trip both editors share) and answers whether dropping `itemId` there
// is allowed. Pure and side-effect free: persistence changes only after a
// caller receives ok:true and commits through onPlace/onMove.
export function evaluatePlacement(itemId, world, placements = [], { skipItemId = itemId } = {}) {
  const norm = worldToPlacement(world);
  const snapped = placementToWorld(norm);
  const meta = placementMetaFor(itemId);

  if (meta.allowedZone === 'wall-near' && !isWallNear(snapped)) {
    return { ok: false, reason: 'zone-wall-near', message: PLACEMENT_REASON_MESSAGES['zone-wall-near'], norm, world: snapped };
  }

  for (const area of BLOCKED_AREAS) {
    const d = Math.hypot(snapped.x - area.x, snapped.z - area.z);
    if (d < area.r + meta.radius * 0.5) {
      return { ok: false, reason: area.reason, message: PLACEMENT_REASON_MESSAGES[area.reason], norm, world: snapped };
    }
  }

  for (const p of placements) {
    if (p.itemId === skipItemId) continue;
    const other = placementToWorld(p);
    const otherMeta = placementMetaFor(p.itemId);
    const d = Math.hypot(snapped.x - other.x, snapped.z - other.z);
    if (d < meta.radius + otherMeta.radius + ITEM_GAP) {
      return { ok: false, reason: 'overlap-item', message: PLACEMENT_REASON_MESSAGES['overlap-item'], norm, world: snapped };
    }
  }

  return { ok: true, norm, world: snapped };
}

// Normalize a stepped rotation into [0, 360). Rotation is quantized to the
// item's rotationStep — free-form spin and resize are out of scope here.
export function stepRotation(itemId, currentDeg, direction) {
  const meta = placementMetaFor(itemId);
  const next = (currentDeg + direction * meta.rotationStep) % 360;
  return next < 0 ? next + 360 : next;
}

// Cat animation state interface — the contract the future frame-based (2D
// sprite) idle animation plugs into. `frameSetReady` stays false until
// approved transparent frame assets land (see ASSET_CONTRACT.md next to this
// file); the 2.5D stage may not play frames, and no UI may claim frame
// motion, while it is false. The 3D stage's procedural rig (catRig.js) is a
// SEPARATE path: its motion is real transform animation it computes itself,
// so it neither reads nor raises this flag.
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

// ── cat mood (Phase C) ──────────────────────────────────────────────────────
//
// A mood is a small idle-parameter preset for the 3D cat rig (breath pace,
// blink gaps, resting lids, tail sway). It is derived from LOCAL, already-
// persisted signals only — today's check-in, the streak, the clock — never
// from a network, an analysis, or any claim of reading the user. It changes
// how the model idles; it is NOT an emotion and no copy may present it as one.
export const CAT_MOODS = Object.freeze(['neutral', 'calm', 'curious', 'sleepy']);

// Minimum gap between cat reactions: one quiet answer per gesture, never a
// rattle. PetRoom3D holds the last-reaction stamp and drops taps inside it.
export const CAT_REACTION_COOLDOWN_MS = 1200;

// Baseline mood from local record state. All four presets remain reachable
// without inventing a remote or inferred signal: night rests sleepy, a saved
// check-in rests calm, an in-progress streak before today's check-in reads as
// curious, and a fresh daytime room stays neutral.
export function deriveCatMood({ checkinDone = false, streakDays = 0, hour = 12 } = {}) {
  if (hour >= 22 || hour < 6) return 'sleepy';
  if (checkinDone) return 'calm';
  return streakDays > 0 ? 'curious' : 'neutral';
}
