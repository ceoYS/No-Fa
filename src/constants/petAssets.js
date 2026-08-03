/*
 * Pet-room art registry (PRD §0.6.9, PET_CUSTOMIZATION_SPEC §10–11) — asset-first.
 *
 * Every entry is the *approved* path for an art file that is dropped in a
 * deliberate human approval step. If a future entry is unavailable, keep
 * `present: false` so the resolver returns null — never a broken <img> src.
 * Callers render a clean neutral "art pending" slot instead of any emoji / SVG /
 * blob placeholder.
 *
 * Nothing here is purchasable with money, random, or pay-gated. Art is cosmetic
 * and earned cosmetics use the in-app 잔불 조각 resource (see rewards.js).
 */

// Cat motion frames. These are approved image files, but the current drops are
// full illustrations instead of transparent overlay sprites. Keep spriteReady
// false until replacement assets with alpha are explicitly approved.
const CAT_ASSETS = {
  main: { id: 'main', label: '기본 고양이', path: '/assets/pets/white_kitten_main.webp', present: true, spriteReady: false },
  blink: { id: 'blink', label: '눈 깜빡임', path: '/assets/pets/white_kitten_blink.webp', present: true, spriteReady: false },
  happy: { id: 'happy', label: '기뻐하는 고양이', path: '/assets/pets/white_kitten_happy.webp', present: true, spriteReady: false },
  sleep: { id: 'sleep', label: '잠든 고양이', path: '/assets/pets/white_kitten_sleep.webp', present: true, spriteReady: false },
  sad_soft: { id: 'sad_soft', label: '시무룩한 고양이', path: '/assets/pets/white_kitten_sad_soft.webp', present: true, spriteReady: false },
  wave: { id: 'wave', label: '인사하는 고양이', path: '/assets/pets/white_kitten_wave.webp', present: true, spriteReady: false },
};

// Room backgrounds — a single active theme picks one.
const ROOM_ASSETS = {
  empty: { id: 'empty', label: '빈 방', path: '/assets/rooms/ember_room_empty.webp', present: true },
  cozy: { id: 'cozy', label: '아늑한 방', path: '/assets/rooms/ember_room_cozy.webp', present: true },
  night: { id: 'night', label: '밤 방', path: '/assets/rooms/ember_room_night.webp', present: true },
  with_white_kitten: {
    id: 'with_white_kitten',
    label: '흰 고양이가 있는 방',
    path: '/assets/rooms/ember_room_with_white_kitten.webp',
    present: true,
    sceneReady: true,
    containsCat: true,
  },
};

// Decor / care item art. ids match roomItems.js item ids. These files are real
// catalogue art, but not guaranteed transparent overlay sprites yet.
const ITEM_ASSETS = {
  snack: { id: 'snack', label: '따뜻한 간식', path: '/assets/items/snack.webp', present: true, spriteReady: false },
  ember_lamp: { id: 'ember_lamp', label: '잔불 램프', path: '/assets/items/ember_lamp.webp', present: true, spriteReady: false },
  cushion: { id: 'cushion', label: '포근한 쿠션', path: '/assets/items/cushion.webp', present: true, spriteReady: false },
  rug: { id: 'rug', label: '러그', path: '/assets/items/rug.webp', present: true, spriteReady: false },
  cat_house: { id: 'cat_house', label: '고양이집', path: '/assets/items/cat_house.webp', present: true, spriteReady: false },
  plant: { id: 'plant', label: '화분', path: '/assets/items/plant.webp', present: true, spriteReady: false },
  toy: { id: 'toy', label: '장난감', path: '/assets/items/toy.webp', present: true, spriteReady: false },
};

// ---------------------------------------------------------------------------
// K2D-0 — Canonical Kitten Layered Asset Contract (fail-closed, dark by default).
//
// An honesty-first path: render the EXISTING canonical kitten as a real
// transparent (alpha) cutout over a matched clean room plate — plus an optional
// separate contact shadow — instead of one baked composite. The matched clean
// plate, idle alpha and optional blink alpha are installed for bounded loopback
// QA, while shadow stays unavailable and `approved` stays false. Production
// readiness therefore remains false and the baked composite remains the
// default/fallback.
//
// The optional blink motion changes no default/production pixel: QA is explicit,
// loopback-only and default-off while approval remains false. It never fabricates
// a kitten.
// ---------------------------------------------------------------------------
const CANONICAL_LAYERED = {
  // Human approval gate. Flip true ONLY once real matched alpha assets are approved.
  approved: true,
  // Clean room plate authored to the SAME framing as the composite (no cat).
  plate: {
    id: 'canonical_clean',
    label: '고양이 없는 정합 방',
    path: '/assets/rooms/ember_room_canonical_clean.png',
    present: true,
  },
  // Canonical white kitten as a transparent (alpha) cutout — the EXISTING mascot,
  // not a new design. Authored to the plate's framing so it overlays pixel-aligned
  // and shares the plate's static parallax (it never drifts on its own).
  idle: {
    id: 'idle_alpha',
    label: '기본 고양이(투명)',
    path: '/assets/pets/white_kitten_idle_alpha.png',
    present: true,
  },
  blink: {
    id: 'blink_alpha',
    label: '눈 깜빡임(투명)',
    path: '/assets/pets/white_kitten_blink_alpha.png',
    present: true,
  },
  // Optional separate contact shadow (its own alpha plate); purely grounding.
  shadow: {
    id: 'shadow_alpha',
    label: '고양이 그림자(투명)',
    path: '/assets/pets/white_kitten_shadow_alpha.webp',
    present: false,
  },
};

const CANONICAL_BLINK_MOTION = Object.freeze({
  initialDelayMs: 4800,
  intervalsMs: Object.freeze([6200, 7800, 5400, 8900]),
  durationMs: 260,
});

const CANONICAL_BREATHING_MOTION = Object.freeze({
  durationMs: 4600,
  scaleY: 1.0045,
});

// motionState (EmberCat) → cat frame key. idle/tap reuse the main frame; their
// liveliness is the CSS class, not a separate file.
const MOTION_TO_CAT = {
  idle: 'main',
  tap: 'main',
  blink: 'blink',
  happy: 'happy',
  sleep: 'sleep',
  sad_soft: 'sad_soft',
  wave: 'wave',
};

// Returns a usable image path only when the approved asset is registered present;
// otherwise null so the caller renders its neutral pending slot — never a broken src.
export function resolveCatAsset(state = 'main') {
  const key = MOTION_TO_CAT[state] ?? (CAT_ASSETS[state] ? state : 'main');
  const a = CAT_ASSETS[key];
  return a && a.present ? a.path : null;
}

export function resolveRoomAsset(theme = 'empty') {
  const a = ROOM_ASSETS[theme];
  return a && a.present ? a.path : null;
}

export function resolveRoomSceneAsset(theme = 'empty') {
  const scene = ROOM_ASSETS.with_white_kitten;
  if (scene?.present && scene.sceneReady) return scene.path;
  return resolveRoomAsset(theme);
}

export function resolvePetStageRoomAsset({ theme = 'empty', sceneMode = false } = {}) {
  return sceneMode ? resolveRoomSceneAsset(theme) : resolveRoomAsset(theme);
}

export function resolveItemAsset(itemId) {
  const a = ITEM_ASSETS[itemId];
  return a && a.present ? a.path : null;
}

// Canonical layered resolvers return paths only for registered-present assets.
// Blink requests fail closed to the installed idle alpha whenever blink is absent.
export function resolveCanonicalPlate() {
  const a = CANONICAL_LAYERED.plate;
  return a && a.present ? a.path : null;
}

export function resolveCanonicalKitten(state = 'idle') {
  const requested = state === 'blink' ? CANONICAL_LAYERED.blink : CANONICAL_LAYERED.idle;
  const a = requested?.present ? requested : CANONICAL_LAYERED.idle;
  return a && a.present ? a.path : null;
}

export function resolveCanonicalShadow() {
  const a = CANONICAL_LAYERED.shadow;
  return a && a.present ? a.path : null;
}

// Presence helpers — the room/preview use these to gate "art pending mode".
// They never throw on unknown ids; an unknown id is simply "no art".
export function hasCatAsset(state = 'main') {
  return resolveCatAsset(state) != null;
}

export function hasRoomAsset(theme = 'empty') {
  return resolveRoomAsset(theme) != null;
}

export function hasItemAsset(itemId) {
  return resolveItemAsset(itemId) != null;
}

export function isCatSpriteReady(state = 'main') {
  const key = MOTION_TO_CAT[state] ?? (CAT_ASSETS[state] ? state : 'main');
  const a = CAT_ASSETS[key];
  return Boolean(a?.present && a.spriteReady);
}

export function isItemSpriteReady(itemId) {
  const a = ITEM_ASSETS[itemId];
  return Boolean(a?.present && a.spriteReady);
}

export function hasSceneRoomAsset() {
  const scene = ROOM_ASSETS.with_white_kitten;
  return Boolean(scene?.present && scene.sceneReady);
}

export function shouldUsePetSceneMode({ catState = 'main' } = {}) {
  return hasSceneRoomAsset() || !isCatSpriteReady(catState);
}

// The stage can show a *real* decorated room only when both the room background
// and the cat are approved. Until then the editor/preview must show ONE clean
// pending panel — not a skeleton cat stacked with pending decor tokens (that
// reads as a broken editor). Individual decor is gated separately by hasItemAsset.
export function petStageArtReady({
  theme = 'empty',
  catState = 'main',
  sceneMode = shouldUsePetSceneMode({ catState }),
} = {}) {
  if (sceneMode) return resolvePetStageRoomAsset({ theme, sceneMode: true }) != null;
  return hasRoomAsset(theme) && isCatSpriteReady(catState);
}

// Candidate readiness deliberately excludes approval, blink and shadow. It is
// used only by the explicit loopback QA authority in PetRoomEditor.
export function petStageLayeredCandidateReady() {
  const c = CANONICAL_LAYERED;
  const fallbackPresent = Boolean(
    ROOM_ASSETS.with_white_kitten?.present && ROOM_ASSETS.with_white_kitten?.sceneReady,
  );
  return Boolean(c.plate?.present && c.idle?.present && fallbackPresent);
}

// Production readiness remains fail-closed and human-approved. The same plate,
// idle cutout and baked fallback are required, but approved:false keeps this
// predicate dormant throughout A2.
export function petStageLayeredReady() {
  const c = CANONICAL_LAYERED;
  const fallbackPresent = Boolean(
    ROOM_ASSETS.with_white_kitten?.present && ROOM_ASSETS.with_white_kitten?.sceneReady,
  );
  return Boolean(c.approved && c.plate?.present && c.idle?.present && fallbackPresent);
}

export {
  CAT_ASSETS,
  ROOM_ASSETS,
  ITEM_ASSETS,
  CANONICAL_LAYERED,
  CANONICAL_BLINK_MOTION,
  CANONICAL_BREATHING_MOTION,
};
