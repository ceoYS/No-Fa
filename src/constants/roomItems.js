/*
 * Pet-room catalogue (PRD §0.6.9) — cosmetic items + room themes unlocked with
 * the earned 잔불 조각 resource (rewards.js). No real-money, no random/gacha,
 * no pay-to-win, no streak-recovery.
 *
 * Visuals are ASSET-first: every item carries an `assetId` resolved against
 * petAssets.js. There is no emoji render source — a missing asset shows a clean
 * neutral pending slot, never an emoji or blob.
 *
 * Placement is COORDINATE-based (drag editor): a placement is
 * { itemId, x, y, scale, z } where x/y are normalized 0..1 stage fractions and z
 * is the stacking order. `defaultPlacement` seeds where an item first lands.
 *
 * Item lifecycle (derived in the screen, not stored):
 *   locked — not owned (needs 잔불 조각으로 데려오기)
 *   owned  — unlocked, in the 보관함 (inventory)
 *   placed — owned and dropped into the room (has a placement)
 *   used   — consumables only (snack), spent by 간식 주기
 */

// Pet-room items. `snack` is a consumable care action; decor becomes draggable
// only when its transparent sprite asset is explicitly marked ready.
export const ROOM_ITEMS = [
  { id: 'snack', name: '따뜻한 간식', kind: 'consumable', category: 'snack', cost: 2, assetId: 'snack', blurb: '고양이에게 줄 수 있어요.' },
  { id: 'ember_lamp', name: '잔불 램프', kind: 'decor', category: 'light', cost: 8, assetId: 'ember_lamp', seedOwned: true, defaultPlacement: { x: 0.74, y: 0.52, scale: 1 }, blurb: '방을 한 단계 밝혀요.' },
  { id: 'cushion', name: '포근한 쿠션', kind: 'decor', category: 'comfort', cost: 6, assetId: 'cushion', seedOwned: true, defaultPlacement: { x: 0.5, y: 0.66, scale: 1 }, blurb: '부드러운 분위기를 더해요.' },
  { id: 'rug', name: '러그', kind: 'decor', category: 'comfort', cost: 7, assetId: 'rug', defaultPlacement: { x: 0.5, y: 0.78, scale: 1.1 }, blurb: '바닥을 따뜻하게 덮어요.' },
  { id: 'cat_house', name: '고양이집', kind: 'decor', category: 'furniture', cost: 14, assetId: 'cat_house', defaultPlacement: { x: 0.22, y: 0.66, scale: 1.2 }, blurb: '방 한쪽을 아늑하게 채워요.' },
  { id: 'plant', name: '화분', kind: 'decor', category: 'furniture', cost: 9, assetId: 'plant', defaultPlacement: { x: 0.8, y: 0.7, scale: 1 }, blurb: '초록 식물이 공기를 바꿔요.' },
  { id: 'toy', name: '장난감', kind: 'decor', category: 'furniture', cost: 5, assetId: 'toy', defaultPlacement: { x: 0.34, y: 0.74, scale: 0.9 }, blurb: '작은 포인트를 더해요.' },
];

// Decor items are the future direct-placement set; scene mode keeps them as
// collection cards until their transparent sprites are approved.
export const DECOR_ITEMS = ROOM_ITEMS.filter((i) => i.kind === 'decor');

// Room themes pick a single active room background (resolveRoomAsset). `swatch`
// previews the mood on the shop card (a colour, not an emoji).
export const ROOM_THEMES = [
  { id: 'empty', name: '기본 잔불 방', cost: 0, seedOwned: true, roomAsset: 'empty', swatch: '#b96b2a', blurb: '잔불이 은은한 기본 방.' },
  { id: 'cozy', name: '아늑한 방', cost: 16, roomAsset: 'cozy', swatch: '#a9785a', blurb: '포근하고 따뜻한 방.' },
  { id: 'night', name: '조용한 밤 방', cost: 12, roomAsset: 'night', swatch: '#5b7bb0', blurb: '깊고 차분한 밤 톤.' },
];

// The cat house is a normal placeable decor item (`cat_house`); the old
// single-select house object (floating label + blob) is retired.

// Shop drawer categories (PRD §0.6.9). Themes are their own category.
export const SHOP_CATEGORIES = [
  { id: 'snack', label: '간식' },
  { id: 'light', label: '조명' },
  { id: 'comfort', label: '방석·러그' },
  { id: 'furniture', label: '가구' },
  { id: 'theme', label: '방 테마' },
];

// Warm, fixed responses cycled when feeding (간식 주기) — never random rolls.
export const PET_FEED_REACTIONS = [
  '고양이가 기분 좋아 보여요.',
  '간식을 주자 고양이가 가까이 온 것 같아요.',
  '방이 조금 더 따뜻해졌어요.',
  '오늘의 절제를 조용히 기억했어요.',
];

export function feedReaction(fedCount = 0) {
  return PET_FEED_REACTIONS[fedCount % PET_FEED_REACTIONS.length];
}

// Lookups.
export const ITEM_BY_ID = Object.fromEntries(ROOM_ITEMS.map((i) => [i.id, i]));
export const THEME_BY_ID = Object.fromEntries(ROOM_THEMES.map((t) => [t.id, t]));

// Unified cost/def lookup across every catalogue (decor + theme).
export function catalogDef(id) {
  return ITEM_BY_ID[id] ?? THEME_BY_ID[id] ?? null;
}

// Normalized entries for a shop category tab.
export function catalogForCategory(catId) {
  if (catId === 'theme') return ROOM_THEMES;
  return ROOM_ITEMS.filter((i) => i.category === catId);
}

// Seed ownership / placements / actives.
export const DEFAULT_OWNED = [
  ...ROOM_ITEMS.filter((i) => i.seedOwned).map((i) => i.id),
  ...ROOM_THEMES.filter((t) => t.seedOwned).map((t) => t.id),
];

// One seeded placement so the room reads as inhabited on first paint.
export const DEFAULT_PLACEMENTS = [
  { itemId: 'cushion', x: 0.5, y: 0.66, scale: 1, z: 1 },
];

export const DEFAULT_THEME = 'empty';
