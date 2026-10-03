/*
 * V2 PERSONAL XP + GROWTH FORM + LEVEL — permanent progression contract (registry §5,
 * dc.html evoStages). PORTED from the frozen design, not reinterpreted.
 *
 * PERSONAL XP is the long-term accumulated growth value. It is the SINGLE source of the
 * growth form, the level label, and unlocks. It never decreases and never resets (a hard
 * day does not remove XP; the kitten is never punished).
 *
 * It is DELIBERATELY separate from two other economies:
 *   - LEAGUE SCORE (src/constants/league.js) — a bounded, weekly, resettable competitive
 *     contribution. Personal XP must NEVER be the league ranking value.
 *   - 잔불 조각 (src/constants/rewards.js) — the spendable cosmetic-room currency.
 *
 * XP is earned ONLY by actions the user actually completed that day. There is NO
 * universal/hard-coded reward: the awarded total is always the sum of the real actions
 * taken. The design's +75 is a DEMO scenario (25+20+20+10), never a fixed payout. Copy
 * rule (registry §5): the only remaining-XP phrasing is "다음 성장까지 N XP" — never an
 * action-count conversion ("N회면 …").
 */

// Default companion name (design uses 루미). Nameable later (OB-06 onboarding, deferred).
export const DEFAULT_KITTEN_NAME = '루미';

// XP earned per real, completed action (dc.html earnRows). Only actions the user actually
// did contribute. recoveryReturn (어려운 하루 후 복귀, +15) is a next-day one-time bonus,
// applied by the store when today's record follows a hard day (see useProgression).
export const XP_SOURCES = Object.freeze({
  goalSuccess: { id: 'goalSuccess', xp: 25, label: '오늘 목표 성공' },
  record: { id: 'record', xp: 20, label: '오늘 기록' },
  crisisOvercome: { id: 'crisisOvercome', xp: 20, label: '위기 극복' },
  recoveryReturn: { id: 'recoveryReturn', xp: 15, label: '어려운 하루 후 복귀' },
  futureDiary: { id: 'futureDiary', xp: 10, label: '미래일기 한 줄' },
});

// Compute the itemized XP for a set of completed actions. `actions` is a map/set of source
// ids that are TRUE (actually done). Returns only the rows that were earned, plus the real
// total — never a fixed number. This is the EG-03 result breakdown. Ordered by XP_SOURCES.
export function computeXpBreakdown(actions = {}) {
  const rows = [];
  for (const key of Object.keys(XP_SOURCES)) {
    const on = Array.isArray(actions) ? actions.includes(key) : Boolean(actions[key]);
    if (on) {
      const s = XP_SOURCES[key];
      rows.push({ id: s.id, label: s.label, xp: s.xp });
    }
  }
  const total = rows.reduce((sum, r) => sum + r.xp, 0);
  return { rows, total };
}

/*
 * GROWTH FORMS — five stages of the SAME kitten (no species/body change). Gated by
 * CUMULATIVE PERSONAL XP at the exact thresholds the design pins (dc.html evoStages):
 * 0 / 150 / 300 / 450 / 900. Each stage carries the design's Korean name, the level
 * LABEL the design shows for that stage (Lv.1/3/4/6/9), its evolution asset, and its
 * unlocks. Assets = 05_evolution pack (evo-1..5), registered in companionAssets.js.
 *
 * Numeric level != growth form: the level scale (1..9) is FINER than the five forms —
 * the labels are non-consecutive (1,3,4,6,9), so levels 2,5,7,8 lie *inside* forms.
 * The form updates only at its XP threshold and never reverts.
 */
export const EVOLUTION_STAGES = Object.freeze([
  { n: 1, id: 'sprout', name: '새싹 고양이', level: 1, minXp: 0, asset: 'evo-1', unlock: 'idle · 블링크 · 낮잠' },
  { n: 2, id: 'curious', name: '호기심 고양이', level: 3, minXp: 150, asset: 'evo-2', unlock: '쓰다듬 반응 · 그루밍' },
  { n: 3, id: 'explorer', name: '작은 탐험가', level: 4, minXp: 300, asset: 'evo-3', unlock: '자율 산책 · 실뭉치 놀이' },
  { n: 4, id: 'brave', name: '씩씩한 탐험가', level: 6, minXp: 450, asset: 'evo-4', unlock: '창가 구경 · 장난감 쥐' },
  { n: 5, id: 'guardian', name: '잔불 수호자', level: 9, minXp: 900, asset: 'evo-5', unlock: '밤 산책 · 특별 조명' },
]);

// Optional unlocked accessories (registry §5 / dc.html): a toggleable expression layer
// unlocked with its growth form — later forms NEVER destroy an earlier accessory.
// 4단계(씩씩한 탐험가, 450 XP) 리본 · 5단계(잔불 수호자, 900 XP) 하트 참.
export const EVOLUTION_ACCESSORIES = Object.freeze([
  { id: 'ribbon', name: '리본', minXp: 450 },
  { id: 'heart_charm', name: '하트 참', minXp: 900 },
]);

// The current growth form for a total XP (>= the lowest stage, never below sprout).
export function formForXp(xp) {
  const x = Math.max(0, Math.floor(xp || 0));
  let stage = EVOLUTION_STAGES[0];
  for (const s of EVOLUTION_STAGES) if (x >= s.minXp) stage = s;
  return stage;
}

// The next growth form above the current total XP, or null when fully grown.
export function nextForm(xp) {
  const x = Math.max(0, Math.floor(xp || 0));
  return EVOLUTION_STAGES.find((s) => s.minXp > x) ?? null;
}

// The level LABEL shown for a given total XP = the current form's level (1/3/4/6/9).
// Distinct from the form ordinal (n): e.g. explorer is form 3 but level 4.
export function levelForXp(xp) {
  return formForXp(xp).level;
}

/*
 * XP-bar / "다음 성장까지" progress, measured toward the NEXT FORM threshold (dc.html:
 * the hub shows "385/450" and "다음 성장까지 65 XP" = 450-385). `pct` fills the bar as
 * total/nextThreshold; when fully grown the bar is full and `remaining` is 0.
 */
export function formProgress(xp) {
  const total = Math.max(0, Math.floor(xp || 0));
  const cur = formForXp(total);
  const nxt = nextForm(total);
  if (!nxt) {
    return { total, form: cur, next: null, target: cur.minXp, remaining: 0, pct: 1, maxed: true };
  }
  const remaining = Math.max(0, nxt.minXp - total);
  return { total, form: cur, next: nxt, target: nxt.minXp, remaining, pct: Math.min(1, total / nxt.minXp), maxed: false };
}

// Accessory ids unlocked at or below `xp` (never lost once unlocked).
export function unlockedAccessories(xp) {
  const x = Math.max(0, Math.floor(xp || 0));
  return EVOLUTION_ACCESSORIES.filter((a) => x >= a.minXp).map((a) => a.id);
}

// ---- tiny runnable self-check (ponytail: non-trivial logic leaves one check) ----
// Runs only under `node src/constants/progression.js`; guarded so the browser bundle
// (where `process` is undefined) never evaluates it.
const __selfcheck =
  typeof process !== 'undefined' &&
  Array.isArray(process?.argv) &&
  typeof process.argv[1] === 'string' &&
  process.argv[1].replace(/\\/g, '/').endsWith('src/constants/progression.js');
if (__selfcheck) {
  const a = (cond, msg) => {
    if (!cond) {
      console.error('FAIL:', msg);
      process.exit(1);
    }
  };
  // Form thresholds match the frozen design exactly (0/150/300/450/900).
  a(formForXp(0).id === 'sprout' && formForXp(149).id === 'sprout', 'sprout 0..149');
  a(formForXp(150).id === 'curious' && formForXp(299).id === 'curious', 'curious 150..299');
  a(formForXp(300).id === 'explorer' && formForXp(449).id === 'explorer', 'explorer 300..449');
  a(formForXp(450).id === 'brave' && formForXp(899).id === 'brave', 'brave 450..899');
  a(formForXp(900).id === 'guardian' && formForXp(99999).id === 'guardian', 'guardian 900+');
  // Design pixel: 385 XP → explorer, LV.4, bar 385/450, 다음 성장까지 65.
  a(levelForXp(385) === 4 && formForXp(385).name === '작은 탐험가', '385 XP = LV.4 작은 탐험가');
  const p = formProgress(385);
  a(p.target === 450 && p.remaining === 65 && Math.round(p.pct * 100) === 86, 'progress 385/450 → 65 left, 86%');
  // Level != form ordinal (proves the two are distinct concepts).
  a(EVOLUTION_STAGES.every((s) => s.n === 1 || s.level !== s.n), 'level label != form ordinal (forms 2..5)');
  // Multiple numeric levels can exist inside one form (labels non-consecutive: gap >= 2).
  a(EVOLUTION_STAGES.some((s, i) => i > 0 && s.level - EVOLUTION_STAGES[i - 1].level >= 2), 'a level gap >= 2 exists (levels inside a form)');
  // Fully grown: bar full, nothing remaining, no crash.
  const g = formProgress(1200);
  a(g.maxed === true && g.remaining === 0 && g.pct === 1 && g.next === null, 'guardian maxed progress');
  // Accessories unlock by XP, never before, never lost.
  a(unlockedAccessories(449).length === 0 && unlockedAccessories(450).includes('ribbon'), 'ribbon unlocks at 450');
  a(unlockedAccessories(900).length === 2, 'heart charm at 900, ribbon retained');
  // XP is the real sum of actions, never a fixed number.
  const b = computeXpBreakdown({ goalSuccess: true, record: true, futureDiary: true });
  a(b.total === 55 && b.rows.length === 3, 'breakdown = real sum (25+20+10=55), not a fixed number');
  a(computeXpBreakdown({}).total === 0, 'no actions = 0 XP (never a universal payout)');
  a(XP_SOURCES.recoveryReturn.xp === 15, 'recoveryReturn = +15 (어려운 하루 후 복귀)');
  console.log('progression self-check OK');
}
