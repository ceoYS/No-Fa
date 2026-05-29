/*
 * Records / Calendar model (PRD §0.6.5) — a functional day-ledger, not a
 * decorative strip. Each day resolves to a DayRecord; tapping a date opens the
 * full record (§0.6.5), not just a coloured dot.
 *
 * DayRecord:
 *   { dateMs, label, dateLabel, isToday,
 *     abstinenceState: 'clean' | 'relapse' | 'unknown',   // core timer state that day
 *     streakDay,                                          // streak count on that day
 *     keptCount / missedCount / heldCount,                // discipline tallies
 *     failureReason?, triggers[], reflection?, nextAction?,
 *     badges: { reflected, routineDone, nextActionWritten },
 *     state }                                             // dot tone (below)
 *
 * Dot `state` keeps the §0.5.3.2 4-tone spectrum (warmth, never red / binary
 * green / failure marker). A relapse restart day is dimmed + "다시 시작한 날",
 * never a red X (§0.6.5).
 */

import { summarizeRules } from './discipline.js';

const DAY_MS = 86400000;
const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'];

// Range selector (§0.6.5). Home keeps the 7-day strip; 최근 기록 offers the rest.
export const RANGE_OPTIONS = [
  { id: '7d', label: '최근 7일', days: 7 },
  { id: '14d', label: '최근 14일', days: 14 },
  { id: '30d', label: '최근 30일', days: 30 },
  { id: 'month', label: '이번 달', days: 'month' },
];

// Calendar dot tone → legend label (§0.5.3.2 / §0.6.5). No 확인 필요 / 실패 wording.
export const CALENDAR_LABEL = {
  kept: '지킨 날',
  recovered: '복기한 날',
  needs_check: '돌아볼 날',
  untracked: '기록 전',
};

export const CALENDAR_LEGEND = ['kept', 'recovered', 'needs_check', 'untracked'];

function startOfDay(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// How many days the range covers, given "today" (month = elapsed days this month).
export function rangeDays(rangeId, now = Date.now()) {
  const opt = RANGE_OPTIONS.find((o) => o.id === rangeId) ?? RANGE_OPTIONS[0];
  if (opt.days === 'month') return new Date(now).getDate();
  return opt.days;
}

// Seeded sample for recent past days, keyed by day-offset (1 = yesterday). Today
// (offset 0) is always derived live; offsets past this map are clean-but-unlogged
// within the current run, or untracked before it.
const SEED = {
  1: { kept: 3, held: 1, missed: 0, triggers: ['밤 시간'] },
  2: {
    kept: 2,
    held: 1,
    missed: 1,
    failureReason: '밤 늦게 짧게 무너질 뻔했어요',
    triggers: ['밤 시간', '외로움'],
    reflection: '피곤하면 방심하게 돼요.',
    nextAction: '밤 11시 멈춤 알림 켜기',
  },
  3: { kept: 4, held: 0, missed: 0 },
  4: { kept: 3, held: 1, missed: 0, triggers: ['스트레스'] },
  5: {
    kept: 2,
    held: 0,
    missed: 2,
    failureReason: '주말 루틴이 무너졌어요',
    triggers: ['루틴 무너짐'],
  },
  6: { kept: 3, held: 0, missed: 0 },
};

function emptyBadges() {
  return { reflected: false, routineDone: false, nextActionWritten: false };
}

// Today's dot tone, derived live from discipline state + today's record.
function todayDotState(rules, todayRecord) {
  if (todayRecord?.abstinenceState === 'relapse') return 'needs_check';
  const { total, missed, keeping } = summarizeRules(rules);
  if (total === 0) return 'untracked';
  if (missed > 0) return todayRecord?.badges?.reflected ? 'recovered' : 'needs_check';
  if (keeping > 0) return 'kept';
  return 'untracked';
}

function buildOneDay(offset, ctx) {
  const { rules, todayRecord, now, todayStreak } = ctx;
  const dateMs = startOfDay(now - offset * DAY_MS);
  const date = new Date(dateMs);
  const wd = WEEKDAY[date.getDay()];
  const isToday = offset === 0;
  const base = {
    dateMs,
    label: wd,
    dateLabel: `${date.getMonth() + 1}월 ${date.getDate()}일 (${wd})${isToday ? ' · 오늘' : ''}`,
    isToday,
    keptCount: 0,
    missedCount: 0,
    heldCount: 0,
    failureReason: null,
    triggers: [],
    reflection: null,
    nextAction: null,
    badges: emptyBadges(),
  };
  const streakForDay = todayStreak - offset;

  if (isToday) {
    const s = summarizeRules(rules);
    const abstinenceState =
      todayRecord?.abstinenceState ??
      (streakForDay > 0 ? 'clean' : streakForDay === 0 ? 'relapse' : 'unknown');
    return {
      ...base,
      abstinenceState,
      streakDay: Math.max(0, streakForDay),
      keptCount: s.kept,
      missedCount: s.missed,
      heldCount: s.held,
      failureReason: todayRecord?.failureReason ?? null,
      triggers: todayRecord?.triggers ?? [],
      reflection: todayRecord?.reflection ?? null,
      nextAction: todayRecord?.nextAction ?? null,
      badges: { ...emptyBadges(), ...(todayRecord?.badges ?? {}) },
      state: todayDotState(rules, todayRecord),
    };
  }

  // The day the current run started — a calm restart, never a red failure mark.
  if (streakForDay === 0) {
    return {
      ...base,
      abstinenceState: 'relapse',
      streakDay: 0,
      failureReason: '다시 시작한 날',
      state: 'needs_check',
    };
  }

  // Before the current run — older history we don't fabricate.
  if (streakForDay < 0) {
    return { ...base, abstinenceState: 'unknown', streakDay: 0, state: 'untracked' };
  }

  // Within the current run. Overlay a seeded sample if we have one.
  const seed = SEED[offset];
  if (!seed) {
    return { ...base, abstinenceState: 'clean', streakDay: streakForDay, state: 'kept' };
  }
  const reflected = !!seed.reflection;
  return {
    ...base,
    abstinenceState: 'clean',
    streakDay: streakForDay,
    keptCount: seed.kept ?? 0,
    missedCount: seed.missed ?? 0,
    heldCount: seed.held ?? 0,
    failureReason: seed.failureReason ?? null,
    triggers: seed.triggers ?? [],
    reflection: seed.reflection ?? null,
    nextAction: seed.nextAction ?? null,
    badges: { ...emptyBadges(), reflected, nextActionWritten: !!seed.nextAction },
    state: seed.missed > 0 ? (reflected ? 'recovered' : 'needs_check') : 'kept',
  };
}

// Build the day-ledger oldest → today (today is the last element).
export function buildDayRecords({ rules = [], todayRecord = null, abstinence } = {}, count = 7) {
  const now = abstinence?.now ?? Date.now();
  const startMs = abstinence?.startMs ?? now;
  const todayStreak = Math.max(0, Math.floor((startOfDay(now) - startOfDay(startMs)) / DAY_MS));
  const ctx = { rules, todayRecord, now, todayStreak };
  const out = [];
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    out.push(buildOneDay(offset, ctx));
  }
  return out;
}

// One-line summary shown when a strip dot is tapped (Home / 최근 기록).
export function daySummary(day) {
  if (!day) return '';
  const head = `${day.dateLabel} — ${CALENDAR_LABEL[day.state]}`;
  if (day.abstinenceState === 'relapse') return `${head} · 다시 시작한 날`;
  const bits = [];
  if (day.streakDay > 0) bits.push(`절제 ${day.streakDay}일째`);
  if (day.keptCount + day.heldCount + day.missedCount > 0) {
    bits.push(`지킴 ${day.keptCount} · 버팀 ${day.heldCount} · 못 지킴 ${day.missedCount}`);
  }
  return bits.length ? `${head} · ${bits.join(' · ')}` : head;
}
