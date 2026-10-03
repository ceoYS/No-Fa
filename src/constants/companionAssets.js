/*
 * V2 companion sprite registry — NoF_Cat_Production_Asset_Pack_v1 (the single visual
 * source, registry §). These are TRANSPARENT (alpha) white-kitten cutouts + transparent
 * props, optimized to webp derivatives under public/assets/v2/ (originals preserved
 * outside the repo). kitten_idle = the identity anchor.
 *
 * Honesty: a resolver returns a path only for a registered sprite; an unknown id
 * returns null so a caller renders nothing rather than a broken <img>. Showing a pose
 * is a REAL asset swap (an honest still image), never a fabricated live-motion claim.
 */

const BASE = '/assets/v2';

// Cat sprite ids that exist on disk (public/assets/v2/cat/<id>.webp).
export const CAT_SPRITES = Object.freeze([
  'idle', 'happy', 'pet', 'celebrate', 'greeting',
  'blink-half', 'blink-closed',
  'walk-1', 'walk-2', 'walk-3', 'walk-4', 'walk-5', 'walk-6',
  'feed-down', 'feed-chew', 'feed-finish', 'drink-down', 'drink-lap',
  'sleep', 'stretch', 'groom', 'lie-down', 'curious', 'look-left',
  'begging', 'surprise', 'new-item', 'jump', 'pounce',
  'play-yarn', 'play-mouse', 'house-peek',
  'evo-1', 'evo-2', 'evo-3', 'evo-4', 'evo-5',
]);

export const PROP_SPRITES = Object.freeze([
  'bed', 'rug', 'lamp', 'plant', 'mouse', 'yarn', 'house', 'feeder-empty', 'feeder-full',
]);

const CAT_SET = new Set(CAT_SPRITES);
const PROP_SET = new Set(PROP_SPRITES);

// Resolve a cat sprite path (null for an unregistered id — never a broken src).
export function catSprite(id) {
  return CAT_SET.has(id) ? `${BASE}/cat/${id}.webp` : null;
}

export function propSprite(id) {
  return PROP_SET.has(id) ? `${BASE}/props/${id}.webp` : null;
}

// The clean, cat-free room plate (warm walnut) used by the V2 pet room.
export const ROOM_CLEAN = `${BASE}/room-clean.webp`;

// Ordered walk key-poses — a PRODUCTION-CANDIDATE set, not a sealed loop (D-5). The
// final subset/order/duration is a QA-tunable decision. Left-facing is scaleX mirroring,
// never a static-PNG slide.
export const WALK_FRAMES = Object.freeze(['walk-1', 'walk-2', 'walk-3', 'walk-4', 'walk-5', 'walk-6']);

// GAIT — the DELIBERATE walk cycle order, chosen by inspecting the six key poses (D-5), not
// numeric file order. walk-2/4/5/3 are the consistent ¾-side poses that alternate legs-spread
// → gathered for a readable step; the more frontal walk-1 is reserved as the step-off / greet
// pose and walk-6 as a held reserve. ~160ms/frame (design demo). Verified in browser QA.
export const WALK_GAIT = Object.freeze(['walk-2', 'walk-4', 'walk-5', 'walk-3']);
export const WALK_MS_PER_FRAME = 160;
// Step-off pose (more frontal) used at the first/last beat of a travel so starting/stopping
// does not pop straight into a mid-stride profile frame.
export const WALK_STEP_OFF = 'walk-1';

// Ambient idle poses (real still images, honest pose swaps — never a fake-motion claim). Kept
// here so callers reference the ids from the exempt asset registry, not as literals.
export const AMBIENT_POSES = Object.freeze(['groom', 'lie-down', 'stretch', 'curious']);

// The wake pose played when a sleeping kitten is gently roused (a real approved sprite). Exported
// as a named id so the companion hook references the registry, not a bare pose literal.
export const WAKE_POSE = 'stretch';

export function has(id) {
  return CAT_SET.has(id) || PROP_SET.has(id);
}
