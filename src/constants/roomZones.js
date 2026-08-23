import { resolveCanonicalPosePlacement } from './petAssets.js';

/*
 * roomZones — where a placed prop may NOT land (Founder video QA, P1 defect 1).
 *
 * THE DEFECT: placement was free coordinates with nothing but an edge pad, so a
 * cushion crop could be dropped across the cat's body and 고양이집 could be dragged
 * squarely onto the cat's face. A decorating surface that lets you bury the pet is
 * not decorating — and because placed decor now stays drawn in the NORMAL room
 * (PlacedDecorLayer), that is not a momentary edit-mode glitch, it is the room the
 * user lives with.
 *
 * THE RULE: a placement's CENTRE may never sit inside a protected zone. A drop (or a
 * live drag, or a tap-to-place default) that lands inside one is pushed to the nearest
 * valid floor position instead of being refused outright — the object slides around
 * the cat rather than snapping back to where it came from, so dragging still feels
 * direct. Nothing here rejects the gesture; it only re-aims it.
 *
 * HOW THE ZONES ARE DERIVED (measured, not eyeballed): the cat's zone comes from the
 * Founder-approved canonical pose rects in petAssets.js — the same measured geometry
 * the in-room pose layer places the cutouts by — mapped from plate space into stage
 * space through the exact CSS that renders the plate. It therefore moves automatically
 * if the approved pose placement is ever re-measured.
 *
 * The feeder/bowl zone is measured off the canonical clean plate itself
 * (public/assets/rooms/ember_room_canonical_clean.png, 1448×1086): the wooden bowl
 * tray occupies roughly x 925–1400, y 810–1055 of that frame. It is baked art, so
 * there is no approved rect to read it from — the numbers below are that measurement,
 * written down honestly rather than inferred.
 *
 * HONESTY: none of this makes the opaque decor crops look like real objects. The crops
 * are still crops (petAssets keeps every spriteReady:false), and the room plate still
 * has its own baked bed/lamp/plant/cat house that a placed crop duplicates. This module
 * only stops a prop from being dropped ON the cat; the decor art problem itself needs
 * the clean-room / alpha-sprite asset batch (see docs/NOF_DECOR_ASSET_BLOCKERS.md).
 */

/*
 * Stage geometry — every number here is pinned to CSS that already exists:
 *   .pet-stage                   aspect-ratio: 5 / 4
 *   .room-img                    object-fit: cover
 *   .pet-room--scene .room-img   transform: scale(1.06); transform-origin: 50% 55%
 * and to the canonical plate frame the poses are measured against (1448 × 1086,
 * CANONICAL_POSE_FRAME in petAssets.js).
 */
const PLATE_ASPECT = 1448 / 1086;
const STAGE_ASPECT = 5 / 4;
const SCENE_OVERSCALE = 1.06;
const SCENE_ORIGIN_X = 0.5;
const SCENE_ORIGIN_Y = 0.55;

/*
 * plate fraction → stage fraction.
 *
 * The plate (4:3-ish) is WIDER than the 5:4 stage, so `object-fit: cover` matches the
 * HEIGHT exactly and overflows the width symmetrically — y passes through untouched
 * and x is scaled by the aspect ratio then re-centred. The scene's static 1.06
 * overscale about (50%, 55%) is then applied on top, exactly as the CSS does.
 */
function plateToStage(px, py) {
  const spanX = PLATE_ASPECT / STAGE_ASPECT; // rendered plate width, in stage widths
  const coverX = px * spanX - (spanX - 1) / 2;
  return {
    x: SCENE_ORIGIN_X + (coverX - SCENE_ORIGIN_X) * SCENE_OVERSCALE,
    y: SCENE_ORIGIN_Y + (py - SCENE_ORIGIN_Y) * SCENE_OVERSCALE,
  };
}

// A little breathing room around each measured box, so a prop's centre stops a hair
// clear of the art rather than exactly on its edge. Deliberately small: the approved
// pose rects are FULL cutout rects and already carry transparent margin.
const ZONE_PAD = 0.02;

function zoneFromPlateRect(left, top, right, bottom) {
  const a = plateToStage(left, top);
  const b = plateToStage(right, bottom);
  return {
    x0: a.x - ZONE_PAD,
    x1: b.x + ZONE_PAD,
    y0: a.y - ZONE_PAD,
    y1: b.y + ZONE_PAD,
  };
}

/*
 * THE CAT. The union of the two approved pose rects (기쁨 / 휴식). The default/idle
 * cutout is authored full-frame rather than by a rect, but the three canonical states
 * share one floor line (≈911) and centre column (≈847) and IDLE renders at the same
 * seated height as HAPPY (551) — so the union covers idle too.
 */
function catZone() {
  const rects = ['happy', 'rest']
    .map((state) => resolveCanonicalPosePlacement(state))
    .filter(Boolean);
  if (rects.length === 0) return null;
  let left = 1;
  let top = 1;
  let right = 0;
  let bottom = 0;
  for (const r of rects) {
    left = Math.min(left, r.left / 100);
    top = Math.min(top, r.top / 100);
    right = Math.max(right, (r.left + r.width) / 100);
    bottom = Math.max(bottom, (r.top + r.height) / 100);
  }
  return zoneFromPlateRect(left, top, right, bottom);
}

// Fail-closed: if the approved pose geometry is ever unavailable, fall back to the
// empirically measured cat box rather than to NO protection at all.
const CAT_FALLBACK_ZONE = Object.freeze({ x0: 0.377, x1: 0.817, y0: 0.298, y1: 0.877 });

export const CAT_EXCLUSION_ZONE = Object.freeze(catZone() ?? { ...CAT_FALLBACK_ZONE });

// THE FEEDER. Measured off the canonical clean plate (see the header note): the bowl
// tray sits in the lower-right of the room and is where 간식 놓아주기 reads as landing.
export const FEEDER_EXCLUSION_ZONE = Object.freeze(
  zoneFromPlateRect(925 / 1448, 810 / 1086, 1400 / 1448, 1055 / 1086),
);

export const PROTECTED_ZONES = Object.freeze([CAT_EXCLUSION_ZONE, FEEDER_EXCLUSION_ZONE]);

// Edge pad of the stage itself — a placement centre never leaves this margin, so a
// card can't hang off the room. Shared with PetRoomDecorator so the two cannot drift.
export const STAGE_PAD = 0.1;

export function clampToStage(v) {
  const n = Number.isFinite(v) ? v : 0.5;
  return Math.min(1 - STAGE_PAD, Math.max(STAGE_PAD, n));
}

export function isInZone(x, y, zone) {
  return x > zone.x0 && x < zone.x1 && y > zone.y0 && y < zone.y1;
}

// True when this centre would bury the cat (or block the feeder).
export function isBlockedPlacement(x, y) {
  return PROTECTED_ZONES.some((z) => isInZone(x, y, z));
}

// Last-resort clear floor: the open left-front corner of the rug, outside both zones.
export const SAFE_FLOOR = Object.freeze({ x: 0.22, y: 0.84 });

// How far past a zone edge an escape lands — enough to clear `isInZone`'s strict
// comparison with room to spare, small enough that the object still hugs the cat.
const ESCAPE_STEP = 0.005;

/*
 * The wall/floor junction, measured off the canonical clean plate (it runs at roughly
 * y 680 of the 1086px frame, behind the cat house and under the cabinet) and mapped
 * into stage space. Escaping a zone must never push a prop UP the back wall — pushing
 * a dropped cushion over the cat's head onto the wall is a worse result than the drop
 * the user made. So an escape is never allowed above this line, or above where the
 * user aimed, whichever is higher on the floor. It is a ceiling on the ESCAPE only:
 * the user may still place freely above it (the wall lamp's default lives up there).
 */
const ROOM_FLOOR_Y = plateToStage(0.5, 680 / 1086).y;

/*
 * The nearest valid floor position for a requested centre.
 *
 * Straight through if the spot is already clear. Otherwise every axis-aligned exit
 * from every zone the point violates is generated, clamped to the stage margin, and
 * re-tested against ALL zones (an exit from the cat that lands in the feeder is not an
 * exit); the closest survivor wins. `fallback` — normally the placement's previous
 * position — is used only if no exit survives, and a fixed clear-floor spot backstops
 * even that, so this function always returns a usable coordinate.
 */
export function safePlacement(x, y, fallback = null) {
  const cx = clampToStage(x);
  const cy = clampToStage(y);
  if (!isBlockedPlacement(cx, cy)) return { x: cx, y: cy };

  const candidates = [];
  for (const z of PROTECTED_ZONES) {
    if (!isInZone(cx, cy, z)) continue;
    candidates.push(
      { x: clampToStage(z.x0 - ESCAPE_STEP), y: cy },
      { x: clampToStage(z.x1 + ESCAPE_STEP), y: cy },
      { x: cx, y: clampToStage(z.y0 - ESCAPE_STEP) },
      { x: cx, y: clampToStage(z.y1 + ESCAPE_STEP) },
    );
  }
  // Never escape higher than the floor line, nor higher than the user aimed.
  const escapeCeiling = Math.min(ROOM_FLOOR_Y, cy);
  let best = null;
  let bestDist = Infinity;
  for (const c of candidates) {
    if (c.y < escapeCeiling) continue;
    if (isBlockedPlacement(c.x, c.y)) continue;
    const d = (c.x - cx) ** 2 + (c.y - cy) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  if (best) return best;

  if (fallback && !isBlockedPlacement(clampToStage(fallback.x), clampToStage(fallback.y))) {
    return { x: clampToStage(fallback.x), y: clampToStage(fallback.y) };
  }
  return { x: clampToStage(SAFE_FLOOR.x), y: clampToStage(SAFE_FLOOR.y) };
}
