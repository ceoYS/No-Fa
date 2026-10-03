/*
 * V2 LEAGUE SCORE — weekly, bounded, resettable competitive contribution (registry §5).
 *
 * DELIBERATELY separate from PERSONAL XP (src/constants/progression.js):
 *   - League Score is a WEEKLY value with a configurable daily contribution cap and a
 *     configurable week boundary; it resets each week.
 *   - Personal XP is PERMANENT and drives level/evolution; a league reset never touches it.
 * The user-facing label stays a single "XP" (이번 주 XP) — the separation is a data
 * contract, not extra UI complexity.
 *
 * HONESTY: there is no backend. The competitor field is a LOCAL, DETERMINISTIC,
 * ANONYMOUS field seeded from the week id — never a live-network claim, never real
 * identifiable people. It is structured to be swapped for a real adapter later.
 * Copy stays neutral/non-shaming: 현재 N위 · 승급권까지 N XP · 이번 주 +N — never
 * "뒤처졌다 / 하위권 / 약하다 / 실패해서 강등".
 */

// Tiers ascending. A new user starts at the lowest (불씨) and earns their way up.
export const LEAGUE_TIERS = Object.freeze([
  { id: 'ember', name: '불씨' },
  { id: 'coal', name: '잔불' },
  { id: 'silver', name: '은빛' },
  { id: 'gold', name: '황금' },
  { id: 'white', name: '백염' },
]);

export const DEFAULT_TIER_ID = 'ember';

// Top N of the weekly field promote (design: "상위 5명이 … 리그로").
export const PROMOTION_RANK = 5;

// Daily contribution cap — a TUNABLE parameter (registry §5: "일일 상한 = 튜닝 가능").
// League Score gained from a single day's eligible activity is capped at this.
export const DAILY_LEAGUE_CAP = 60;

// League contribution is its OWN policy, DELIBERATELY independent of Personal XP
// (computeXpBreakdown in progression.js). It derives from eligible actions with its own
// point table (independently tunable), is bounded by the daily cap at award time, and is
// weekly/resettable — it must NEVER be the Personal XP value and never mutates it. The
// current M1 values may coincide with some XP values; the point is STRUCTURAL separation,
// so the two economies can diverge later without touching each other.
export const LEAGUE_ELIGIBLE = Object.freeze({
  goalSuccess: 25,
  record: 20,
  crisisOvercome: 20,
  recoveryReturn: 15,
  futureDiary: 10,
});

// The eligible weekly contribution for a set of completed actions — the league's OWN
// calculator (never `computeXpBreakdown`). The hook still applies the daily cap on top.
export function computeLeagueContribution(actions = {}) {
  const rows = [];
  for (const key of Object.keys(LEAGUE_ELIGIBLE)) {
    const on = Array.isArray(actions) ? actions.includes(key) : Boolean(actions[key]);
    if (on) rows.push({ id: key, points: LEAGUE_ELIGIBLE[key] });
  }
  const total = rows.reduce((sum, r) => sum + r.points, 0);
  return { rows, total };
}

// Week-boundary policy — a NAMED, CONFIGURABLE constant (not a hard-coded Sunday).
// Registry/design copy displays "일요일 밤 리셋"; the week runs startDay..startDay+6 and
// the id changes at the start-of-week boundary. Tune startDay to move the boundary.
export const LEAGUE_WEEK = Object.freeze({
  startDay: 1, // 0=Sun … 1=Mon; week starts Monday 00:00 local, so it resets Sunday night
  resetLabel: '일요일 밤',
  tunable: true,
});

// Local calendar-day key (midnight ms) — for the daily cap.
export function dayKeyOf(now = Date.now()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// Week id = ms of the current week's start (local), per the configurable policy.
// Two timestamps in the same week share a key; crossing the boundary changes it → reset.
export function weekKey(now = Date.now(), policy = LEAGUE_WEEK) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const diff = (d.getDay() - policy.startDay + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d.getTime();
}

export function tierById(id) {
  return LEAGUE_TIERS.find((t) => t.id === id) ?? LEAGUE_TIERS[0];
}
export function nextTier(id) {
  const i = LEAGUE_TIERS.findIndex((t) => t.id === id);
  return i >= 0 && i < LEAGUE_TIERS.length - 1 ? LEAGUE_TIERS[i + 1] : null;
}

// Deterministic seeded RNG (mulberry32) — same (seed) → same field, so the anonymous
// neighbourhood is stable within a week and never a live/network value.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Neutral, non-identifying anonymous handles (a league is anonymous by design).
const HANDLES = [
  '잔잔한 오후', '고요한 새벽', '작은 다짐', '느린 산책', '맑은 하루', '조용한 불빛',
  '깊은 숨', '오늘의 나', '차분한 마음', '새 아침', '천천히', '한 걸음', '별빛 아래',
  '따뜻한 방', '멀리 보기', '단단한 하루', '푸른 저녁', '가벼운 마음', '고른 호흡', '작은 승리',
];

/*
 * Build the weekly field around the user. Returns anonymous rows sorted by score with
 * the user ("나") inserted at `myScore`, plus rank + promotion distance. Deterministic
 * from `week` (the weekKey), so it is stable all week and obviously local (not live).
 */
export function buildLeagueField({ myScore = 0, week = weekKey(), count = 20 } = {}) {
  const rand = mulberry32((week / 60000) >>> 0);
  // Neighbours sit in a plausible weekly band seeded from the WEEK (not scaled to the
  // user), so rank honestly reflects the user's OWN effort — a higher score ranks higher,
  // and a quiet week ranks lower without any shaming. The field is stable all week.
  const others = [];
  const pool = [...HANDLES];
  for (let i = 0; i < count; i += 1) {
    const score = Math.round(rand() * 190) + Math.round(rand() * 55);
    const hi = Math.floor(rand() * pool.length);
    const name = pool.splice(hi, 1)[0] ?? `이웃 ${i + 1}`;
    others.push({ name, score, isMe: false });
  }
  const all = [...others, { name: '나', score: Math.max(0, Math.round(myScore)), isMe: true }];
  all.sort((x, y) => y.score - x.score || (x.isMe ? 1 : -1));
  const rows = all.map((r, i) => ({ ...r, rank: i + 1 }));
  const myRank = rows.find((r) => r.isMe).rank;
  const promoteRow = rows[PROMOTION_RANK - 1];
  // XP to reach the promotion line (0 when already in it). Neutral, never shaming.
  const toPromote = myRank <= PROMOTION_RANK ? 0 : Math.max(0, promoteRow.score - myScore + 1);
  return { rows, myRank, promoteRank: PROMOTION_RANK, toPromote };
}

// Six nearby rows centred on the user (for the Home preview + league list window).
export function nearbyRows(field, span = 3) {
  const i = field.rows.findIndex((r) => r.isMe);
  const start = Math.max(0, i - span);
  return field.rows.slice(start, start + span * 2 + 1);
}

// ---- runnable self-check (ponytail) — node src/constants/league.js ----
const __selfcheck =
  typeof process !== 'undefined' &&
  Array.isArray(process?.argv) &&
  typeof process.argv[1] === 'string' &&
  process.argv[1].replace(/\\/g, '/').endsWith('src/constants/league.js');
if (__selfcheck) {
  const a = (cond, msg) => {
    if (!cond) {
      console.error('FAIL:', msg);
      process.exit(1);
    }
  };
  // week boundary: two mid-week days share a key; crossing Sunday->Monday differs.
  const mon = new Date('2026-08-24T10:00:00').getTime(); // Monday
  const sun = new Date('2026-08-30T22:00:00').getTime(); // Sunday same week
  const nextMon = new Date('2026-08-31T00:30:00').getTime(); // next Monday
  a(weekKey(mon) === weekKey(sun), 'Mon..Sun share one week key');
  a(weekKey(mon) !== weekKey(nextMon), 'week resets at Monday boundary (Sunday-night reset)');
  // deterministic: same seed -> identical field.
  const f1 = buildLeagueField({ myScore: 120, week: weekKey(mon) });
  const f2 = buildLeagueField({ myScore: 120, week: weekKey(mon) });
  a(JSON.stringify(f1.rows) === JSON.stringify(f2.rows), 'field is deterministic per week');
  a(f1.rows.some((r) => r.isMe && r.name === '나'), 'the user row is present and marked 나');
  a(f1.rows[0].rank === 1 && f1.rows[f1.rows.length - 1].rank === f1.rows.length, 'rows are ranked 1..N');
  const top = buildLeagueField({ myScore: 100000, week: weekKey(mon) });
  a(top.myRank === 1 && top.toPromote === 0, 'a very high score ranks 1 with 0 to promote');
  a(nearbyRows(f1).some((r) => r.isMe), 'nearby window always contains the user');
  a(DAILY_LEAGUE_CAP > 0 && LEAGUE_WEEK.tunable === true, 'daily cap + week policy are tunable constants');
  // league contribution is its own calculator (independent of Personal XP)
  const lc = computeLeagueContribution({ goalSuccess: true, record: true, futureDiary: true });
  a(lc.total === 55 && lc.rows.length === 3, 'league contribution = its own sum of eligible actions');
  a(computeLeagueContribution({}).total === 0, 'no eligible actions = 0 league contribution');
  console.log('league self-check OK');
}
