/*
 * Discipline state model v2 (PRD §0.6.2) — single source for vocab-sensitive
 * labels. The internal enum is the only thing stored in state; the user only
 * ever sees a selectable Korean label. Never surface the enum, or score /
 * violation / failure wording, in any user-facing string (§0.5.8.1).
 *
 *   kept        지켰어요              그 날 규율 지킴 (조용한 성공)
 *   missed      못 지켰어요            그 규율 실패 → 가벼운 복기 유도, 타이머 리셋 안 함
 *   held        위기였지만 버텼어요     충동/위기 있었으나 버텨낸 성취
 *   unrecorded  (라벨 없음, 기본값)     아직 안 고름 — 미선택 3버튼으로만 표시, 칩 렌더 금지
 *
 * Removed vs v1 (§0.6.2): 해당 없음 · 상황 없음 · 확인 필요(visible) · 흔들렸어요 ·
 * directly-selectable 회복 완료. `recovered`/`not_applicable` enums are gone;
 * recovery now surfaces as the `reflected` / `routineDone` badges below.
 */

// Three user-selectable states only. `unrecorded` is the default and has NO label.
export const STATUS_LABEL = {
  kept: '지켰어요',
  missed: '못 지켰어요',
  held: '위기였지만 버텼어요',
};

// Pill tone — warm/calm only, never red or binary green (§0.5.3.2 spectrum).
// `missed` uses the warm ember accent for gentle attention, not alarm.
export const STATUS_PILL = {
  kept: 'pill-moss',
  held: 'pill-moss',
  missed: 'pill-ember',
};

// Per-row helper line — status-form, never imperative or blaming (COPY_POLICY §10.5).
export const STATUS_HELP = {
  kept: '내가 정한 기준을 오늘도 지켰어요.',
  missed: '못 지킨 날도 기록이에요. 가볍게 복기해 볼까요?',
  held: '위기였지만 버텼어요. 그 자체로 오늘의 성취예요.',
};

// Order shown in the per-row state sheet and the check-in 3-tap row.
export const SELECTABLE_ORDER = ['kept', 'held', 'missed'];

// Post-action badges (§0.6.2) — awarded by behaviour, never directly selectable.
export const BADGE_LABEL = {
  reflected: '복기 완료',
  routineDone: '회복 루틴 완료',
  nextActionWritten: '다음 행동 작성 완료',
};

export const BADGE_ORDER = ['reflected', 'routineDone', 'nextActionWritten'];

export const EMPTY_BADGES = Object.freeze({
  reflected: false,
  routineDone: false,
  nextActionWritten: false,
});

export function listBadges(badges) {
  if (!badges) return [];
  return BADGE_ORDER.filter((key) => badges[key]);
}

// Check-in last-step 3-tap (§0.6.2). Unselected rows stay `unrecorded` (no label).
export const CHECKIN_TAP = SELECTABLE_ORDER.map((status) => ({
  status,
  label: STATUS_LABEL[status],
}));

// Consistency weights v2 (§0.6.2: kept 1.0 / held 0.7 / unrecorded 0.6 / missed
// 0.3, missed+reflected → 0.6) and the Room-Warmth derivation that consumes them
// (§0.5.10 C) land with the domains/ refactor (DOMAIN_ARCHITECTURE flag B). The
// PRD is the single source until then; no consumer exists yet, so no constant here.

// Counts shared across Home / Discipline / records summaries. "지키는 중" counts
// both kept and held — holding the line under pressure is a win, not a miss.
export function summarizeRules(rules = []) {
  const kept = rules.filter((r) => r.status === 'kept').length;
  const held = rules.filter((r) => r.status === 'held').length;
  const missed = rules.filter((r) => r.status === 'missed').length;
  const unrecorded = rules.filter((r) => r.status === 'unrecorded').length;
  return { total: rules.length, kept, held, missed, unrecorded, keeping: kept + held };
}
