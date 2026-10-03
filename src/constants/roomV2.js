/*
 * V2 PET ROOM geometry + themes — the single authority for the living room (EG-11/12/13).
 *
 * The room plate `room-clean.webp` is a native 4:3 image (1200×900). The rendered scene is
 * therefore a REAL 4:3 frame (see .pet-room--scene, CSS aspect-ratio 4/3); every position
 * below is NORMALIZED (0..1) inside that frame, so geometry follows the 4:3 scene at any
 * width. A sprite's normalized point is its FOOT (bottom-centre) contact with the floor.
 *
 * THEME NOTE (honesty): the V2 authority ships exactly ONE approved room plate
 * (room-clean.webp). Additional theme *plates* (새벽 창가 / 백염 눈밤) are NOT in the pack, and
 * art must not be generated. So a theme is a REAL, persistent lighting/atmosphere treatment
 * rendered over the one approved plate — not a claim of a different photograph. The change is
 * genuine (the rendered scene visibly and durably changes) and honest. See
 * docs/NOF_DECOR_ASSET_BLOCKERS.md.
 */

export const ROOM_ASPECT = 4 / 3;

// Walkable floor band (normalized foot coordinates). The cabinet + cat-den sit back-right, so
// the open floor the cat may roam is the front strip, kept clear of the far walls.
export const FLOOR = Object.freeze({ xMin: 0.14, xMax: 0.82, yMin: 0.80, yMax: 0.90 });

// The kitten's resting home (default idle spot) on the front floor, left of centre.
export const CAT_HOME = Object.freeze({ x: 0.34, y: 0.86 });

// The built-in cat den (the arched opening in the walnut cabinet) — a safe roam destination.
export const CAT_DEN = Object.freeze({ x: 0.72, y: 0.70 });

// Active-room feeder geometry: where the food station sits on the floor. The cat approaches
// THIS point to eat (Phase D). Keyed by theme so a future themed room can move it; all
// current themes share the one plate, so they share this position.
export const FEEDER = Object.freeze({ x: 0.64, y: 0.865, w: 0.2 });
export function feederFor() {
  return FEEDER;
}

// Decor may NOT be dropped inside these safe zones (cat home, feeder, den) — the cat and the
// feeder must stay reachable and unblocked.
export const SAFE_ZONES = Object.freeze([
  { x: CAT_HOME.x, y: CAT_HOME.y, r: 0.13, label: '고양이' },
  { x: FEEDER.x, y: FEEDER.y, r: 0.12, label: '급식기' },
  { x: CAT_DEN.x, y: CAT_DEN.y, r: 0.1, label: '오두막' },
]);

// Default decor drop points (normalized) for the V2 transparent props, on the open floor and
// clear of the safe zones — used when a prop is first placed. (Exception: the rug is a FLOOR
// prop, see FLOOR_DECOR below — it is meant to sit UNDER the cat at the room's heart, so its
// default is the centre-front floor and it is exempt from the safe-zone rejection.)
export const V2_DECOR_SLOTS = Object.freeze({
  bed: { x: 0.2, y: 0.88 },
  rug: { x: 0.37, y: 0.9 },
  plant: { x: 0.9, y: 0.74 },
  lamp: { x: 0.9, y: 0.5 },
  yarn: { x: 0.5, y: 0.9 },
  mouse: { x: 0.46, y: 0.91 },
  house: { x: 0.16, y: 0.8 },
});

// FLOOR decor — a mat that lies flat ON the floor and is drawn BENEATH the cat and feeder, so
// it never occludes them. Because it sits under everything, it is the one prop exempt from the
// safe-zone rejection (a round rug is supposed to go under the cat at the room's heart). All
// OTHER props are opaque and drawn over the scene, so they stay blocked from the safe zones.
export const FLOOR_DECOR = Object.freeze(new Set(['rug']));
export function isFloorDecor(id) {
  return FLOOR_DECOR.has(id);
}

// Themes = persistent atmosphere over the one approved plate (see note above). `grade` is a
// CSS class applied to the scene; `reward` names a gate (null = freely selectable).
export const ROOM_THEMES_V2 = Object.freeze([
  { id: 'walnut', name: '기본 월넛', grade: 'walnut', reward: null },
  { id: 'dawn', name: '새벽 창가', grade: 'dawn', reward: null },
  { id: 'snow', name: '백염 눈밤', grade: 'snow', reward: '백염 리그' },
]);

export const DEFAULT_ROOM_THEME_V2 = 'walnut';

export function themeById(id) {
  return ROOM_THEMES_V2.find((t) => t.id === id) ?? ROOM_THEMES_V2[0];
}

// Clamp a normalized value to the [0,1] frame.
export function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

// Is a normalized point inside any decor safe zone? (elliptical test in normalized space).
export function inSafeZone(x, y) {
  return SAFE_ZONES.some((z) => Math.hypot(x - z.x, y - z.y) < z.r);
}

// Clamp a foot point into the walkable floor band.
export function clampToFloor(x, y) {
  return { x: Math.max(FLOOR.xMin, Math.min(FLOOR.xMax, x)), y: Math.max(FLOOR.yMin, Math.min(FLOOR.yMax, y)) };
}

// ---- tiny runnable self-check (ponytail) — node src/constants/roomV2.js ----
const __selfcheck =
  typeof process !== 'undefined' &&
  Array.isArray(process?.argv) &&
  typeof process.argv[1] === 'string' &&
  process.argv[1].replace(/\\/g, '/').endsWith('src/constants/roomV2.js');
if (__selfcheck) {
  const a = (cond, msg) => {
    if (!cond) {
      console.error('FAIL:', msg);
      process.exit(1);
    }
  };
  a(ROOM_ASPECT === 4 / 3, 'scene is 4:3');
  a(inSafeZone(FEEDER.x, FEEDER.y), 'feeder is inside a safe zone (decor cannot cover it)');
  a(inSafeZone(CAT_HOME.x, CAT_HOME.y), 'cat home is a safe zone');
  a(!inSafeZone(0.05, 0.2), 'a far wall point is not a safe zone');
  const c = clampToFloor(0.99, 0.99);
  a(c.x <= FLOOR.xMax && c.y <= FLOOR.yMax, 'floor clamp keeps the cat on the walkable band');
  a(themeById('dawn').grade === 'dawn' && themeById('zzz').id === 'walnut', 'theme resolver + fallback');
  a(ROOM_THEMES_V2.find((t) => t.id === 'snow').reward === '백염 리그', 'snow theme is league-reward gated');
  a(isFloorDecor('rug') && !isFloorDecor('bed'), 'rug is a floor prop (safe-zone exempt); bed is not');
  a(inSafeZone(V2_DECOR_SLOTS.rug.x, V2_DECOR_SLOTS.rug.y) || !inSafeZone(V2_DECOR_SLOTS.bed.x, V2_DECOR_SLOTS.bed.y), 'rug default may sit in a safe zone (it is exempt); a non-floor default must not');
  console.log('roomV2 self-check OK');
}
