import { useState, useEffect } from 'react';
import HomeScreen from './screens/HomeScreen.jsx';
import CheckinScreen from './screens/CheckinScreen.jsx';
import UrgeScreen from './screens/UrgeScreen.jsx';
import CalendarScreen from './screens/CalendarScreen.jsx';
import RecoveryScreen from './screens/RecoveryScreen.jsx';
import PetRewardScreen from './screens/PetRewardScreen.jsx';
import DisciplineScreen from './screens/DisciplineScreen.jsx';
import ShieldScreen from './screens/ShieldScreen.jsx';
import ProtectionScreen from './screens/ProtectionScreen.jsx';
import SafeBrowserScreen from './screens/SafeBrowserScreen.jsx';
import ShieldExtensionScreen from './screens/ShieldExtensionScreen.jsx';
import BottomNav from './components/BottomNav.jsx';
import ScreenSwitcher from './components/ScreenSwitcher.jsx';
import { EMPTY_BADGES, summarizeRules } from './constants/discipline.js';
import { EARN, MILESTONE_BY_ID, SEED_SHARDS, isMilestoneClaimable } from './constants/rewards.js';
import {
  DEFAULT_OWNED,
  DEFAULT_PLACEMENTS,
  DEFAULT_THEME,
  catalogDef,
  feedReaction,
} from './constants/roomItems.js';
import { DEFAULT_BLOCKLIST, makeBlockEntry } from './constants/shield.js';
import { loadState, saveState } from './utils/storage.js';

const SCREENS = [
  { id: 'home', label: '홈', Component: HomeScreen },
  { id: 'checkin', label: '오늘 기록', Component: CheckinScreen },
  { id: 'urge', label: '잠깐 멈춤', Component: UrgeScreen },
  { id: 'discipline', label: '나의 규율', Component: DisciplineScreen },
  { id: 'calendar', label: '최근 기록', Component: CalendarScreen },
  { id: 'recovery', label: '복기 다이어리', Component: RecoveryScreen },
  { id: 'reward', label: '고양이 방', Component: PetRewardScreen },
  { id: 'shield', label: '차단 설정', Component: ShieldScreen },
  { id: 'protection', label: '보호 설정', Component: ProtectionScreen },
  { id: 'shieldBrowser', label: '안전 브라우저', Component: SafeBrowserScreen },
  { id: 'shieldExtension', label: '실제 차단 테스트', Component: ShieldExtensionScreen },
];

const DAY_MS = 86400000;

// Local calendar-day key (midnight ms). Used to grant the daily check-in reward
// at most once per day: re-opening/re-submitting the check-in later the same day
// updates the saved fields but must not re-grant 잔불 조각 (no farming the shards).
function dayKey(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// Seed the abstinence run ~12 days in so the timer hero reads a real elapsed
// value on first paint. relapse() resets this to now (§0.6.3).
const SEED_OFFSET_MS = 12 * DAY_MS + 3 * 3600 * 1000 + 24 * 60 * 1000 + 18 * 1000;
const HOUR_MS = 3600 * 1000;
const MIN_MS = 60 * 1000;

// Multi abstinence-counter seed (counter-management benchmark). Each counter is an
// independent abstinence run with its own start, target and longest record. Offsets
// are relative to load time so every hero/card reads a real elapsed value on first
// paint. relapse() restarts ONLY the selected counter — never all of them.
function makeDefaultCounters() {
  const now = Date.now();
  return [
    { id: 'c_nofap', name: '콘텐츠 절제', startMs: now - SEED_OFFSET_MS, targetDays: 30, longestDays: 27, status: 'active', history: [] },
    { id: 'c_sns', name: 'SNS 줄이기', startMs: now - (4 * DAY_MS + 6 * HOUR_MS + 12 * MIN_MS), targetDays: 14, longestDays: 9, status: 'active', history: [] },
    { id: 'c_latenight', name: '야식 끊기', startMs: now - (2 * DAY_MS + 18 * HOUR_MS + 5 * MIN_MS), targetDays: 21, longestDays: 6, status: 'active', history: [] },
    { id: 'c_alcohol', name: '음주 줄이기', startMs: now - (6 * DAY_MS + 1 * HOUR_MS + 40 * MIN_MS), targetDays: 30, longestDays: 12, status: 'active', history: [] },
  ];
}

// Editable category tags (§0.6.7). The seed list is a suggestion, not fixed;
// a custom tag typed in the add sheet joins this list for the session.
const SEED_CATEGORIES = ['밤 시간', '충동', '검색', 'SNS·숏폼', '수면', '외로움', '스트레스'];

// Debug-only screen switcher (prototype tooling, not product UI). Visible while
// developing (`npm run dev` → import.meta.env.DEV) and, on a built/review deploy,
// only when a reviewer explicitly opts in via `?dev=1` (persisted to localStorage
// so it survives in-app navigation). A plain production load never shows it.
// BottomNav is the real navigation and is always present regardless.
function debugNavEnabled() {
  if (import.meta.env?.DEV) return true;
  if (typeof window === 'undefined') return false;
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('dev') === '1') {
      window.localStorage.setItem('nof_debug_nav', '1');
      return true;
    }
    return window.localStorage.getItem('nof_debug_nav') === '1';
  } catch {
    return false;
  }
}

const DEBUG_NAV = debugNavEnabled();

// Demo shell flag (R-13): the iPhone status-bar mockup (9:41 · notch · dots) is
// presentation chrome for demoing the prototype in a desktop browser — not
// product UI. It stays ON by default while this repo is the demo, but sits
// behind this one flag so a product cut ships the real shell without a double
// frame: load once with ?frame=0 to drop it (persisted, like the debug nav, so
// it survives in-app navigation); ?frame=1 restores it. The .device-frame
// container itself always renders — it is the sheet anchoring plane (R-5) and
// the layout shell, not mockup chrome.
function demoFrameEnabled() {
  if (typeof window === 'undefined') return true;
  try {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('frame');
    if (q === '0' || q === '1') {
      window.localStorage.setItem('nof_demo_frame', q);
      return q === '1';
    }
    return window.localStorage.getItem('nof_demo_frame') !== '0';
  } catch {
    return true;
  }
}

const DEMO_FRAME = demoFrameEnabled();

// Discipline rules — P0.1 in-memory state lifted to App so Home / 최근 기록 /
// 체크인 stay in sync. `status` holds the v2 internal enum (§0.6.2:
// kept/missed/held/unrecorded); the UI renders the selectable label only, never
// the enum, and `unrecorded` renders no label at all. `badges` are post-action
// (§0.6.2). Persistence / full editor / reminders are a later phase (§0.5.9).
//
// `counterId` links each rule to an abstinence counter (rule↔counter link). A
// rule is a *secondary commitment* that lowers a counter's relapse risk — never
// the timer itself (a rule slip never resets a counter). The default rules are
// seeded to sensible counters: the 충동/검색 rules support 콘텐츠 절제 (c_nofap); the
// late-night phone / 숏폼 rules support SNS 줄이기 (c_sns). A null counterId means
// the rule is unlinked. This is the only thing that ties the two systems.
const INITIAL_RULES = [
  { id: 'night_phone', label: '밤 11시 이후 침대에서 휴대폰 보지 않기', category: '밤 시간', counterId: 'c_sns', status: 'kept', badges: { ...EMPTY_BADGES } },
  { id: 'pause_first', label: '충동이 오면 5분 멈춤 먼저 누르기', category: '충동', counterId: 'c_nofap', status: 'held', badges: { ...EMPTY_BADGES, routineDone: true } },
  { id: 'no_stim_search', label: '자극 검색하지 않기', category: '검색', counterId: 'c_nofap', status: 'kept', badges: { ...EMPTY_BADGES } },
  { id: 'short_form', label: 'SNS/숏폼은 하루 15분까지만', category: 'SNS·숏폼', counterId: 'c_sns', status: 'missed', badges: { ...EMPTY_BADGES } },
  { id: 'phone_off_desk', label: '잠들기 전 휴대폰은 책상 위에 두기', category: '수면', counterId: 'c_sns', status: 'unrecorded', badges: { ...EMPTY_BADGES } },
  { id: 'lonely_swap', label: '외로울 때 바로 검색하지 않고 대체 행동 1개 하기', category: '외로움', counterId: 'c_nofap', status: 'missed', badges: { ...EMPTY_BADGES, reflected: true, nextActionWritten: true } },
];

export default function App() {
  const [screenId, setScreenId] = useState('home');

  // Local persistence (P0). The saved bundle is read ONCE on first paint; every
  // slice below falls back to its seed/default when there is no bundle yet (first
  // ever load) or it is corrupt. localStorage only, no network — see
  // src/utils/storage.js for the honesty note. Guard #38 pins this.
  const [persisted] = useState(() => loadState());

  const [rules, setRules] = useState(() => persisted?.rules ?? INITIAL_RULES);
  const [categories, setCategories] = useState(() => persisted?.categories ?? SEED_CATEGORIES);
  // Multi-counter state (counter-management). Persisted with ABSOLUTE startMs, so a
  // reload reads the real elapsed time; only a first-ever load uses the relative seed.
  const [counters, setCounters] = useState(() => persisted?.counters ?? makeDefaultCounters());
  const [selectedCounterId, setSelectedCounterId] = useState(() => persisted?.selectedCounterId ?? 'c_nofap');
  // Drives the reflection diary: { scope: 'relapse' | 'slip', ruleId? } | null.
  // Transient navigation state — intentionally NOT persisted.
  const [reflectionCtx, setReflectionCtx] = useState(null);
  // Today's DayRecord fields written by the reflection diary (§0.6.5/§0.6.6).
  // Day-rollover: a saved record is restored ONLY if it belongs to the current
  // calendar day; yesterday's "today" is dropped so a new day starts fresh.
  const [todayRecord, setTodayRecord] = useState(() =>
    persisted && persisted.todayRecordDay === dayKey(Date.now())
      ? persisted.todayRecord ?? null
      : null,
  );

  // Rolling check-in ledger (Records history): a localStorage-only map keyed by the
  // check-in's calendar day (dayKey) → its saved fields, so 최근 기록 can read REAL
  // past-day check-ins, not only today's. Starts EMPTY — no fabricated history; every
  // entry is written by an actual completeCheckin below. Persisted through the same
  // no-network storage box as the rest of the bundle (src/utils/storage.js, guard #38).
  const [checkinLedger, setCheckinLedger] = useState(() => persisted?.checkinLedger ?? {});

  // Shield blocklist planner (P0.5). Persisted, but it still does NOT block
  // anything — it is the abstract plan (no URLs) a future P1 engine will consume.
  const [blocklist, setBlocklist] = useState(() => persisted?.blocklist ?? DEFAULT_BLOCKLIST);

  // Honest local protection plan (C19/C20): the user's OWN coping plan in their own words
  // ({ triggerTime, situation, altAction }) — NOT a blocker. It is surfaced in 잠깐 멈춤 (C21)
  // when it is actually needed. C19 keeps it in-session; C20 wires it into the persisted,
  // localStorage-only bundle so it survives a reload. null = no plan written yet.
  const [protectionPlan, setProtectionPlan] = useState(() => persisted?.protectionPlan ?? null);

  // Reward / pet-room layer (§0.6.9). Cosmetic only; earned 잔불 조각 is the single
  // currency — no payment, no random rewards. Persisted so the room survives reload.
  const [emberShards, setEmberShards] = useState(() => persisted?.emberShards ?? SEED_SHARDS);
  const [inventory, setInventory] = useState(() => persisted?.inventory ?? { snack: 1 });
  const [ownedItems, setOwnedItems] = useState(() => persisted?.ownedItems ?? DEFAULT_OWNED);
  // Coordinate placements: [{ itemId, x, y, scale, z }] with x/y normalized 0..1.
  const [placements, setPlacements] = useState(() =>
    persisted?.placements ?? DEFAULT_PLACEMENTS.map((p) => ({ ...p })),
  );
  const [activeRoomTheme, setActiveRoomTheme] = useState(() => persisted?.activeRoomTheme ?? DEFAULT_THEME);
  // fedCount stays the cumulative lifetime count; fedDay stamps the calendar day of
  // the last snack hand-off so the room can honestly show a DAY-SCOPED "오늘 놓아줌"
  // signal (not just a lifetime tally). null until the first ever feed.
  const [petCareState, setPetCareState] = useState(() => persisted?.petCareState ?? { fedCount: 0, fedDay: null, pettedCount: 0, pettedDay: null, reaction: null });
  const [claimedRewardIds, setClaimedRewardIds] = useState(() => persisted?.claimedRewardIds ?? []);
  // Calendar-day key of the last check-in shard grant, so the daily check-in
  // reward is given once per day even if the user re-opens/re-submits the check-in.
  // Persisted dayKeys self-correct across a reload: a stale (yesterday) value never
  // equals today's key, so today's grant becomes available again exactly once.
  const [checkinRewardDay, setCheckinRewardDay] = useState(() => persisted?.checkinRewardDay ?? null);
  // Same once-per-calendar-day guard for the other repeatable shard grants: the
  // 잠깐 멈춤 "버텼어요" finish and the general 오늘 복기하기. Without these, both
  // could be re-pressed in a loop to farm 잔불 조각. Relapse reflection needs no
  // day-guard — it follows a timer reset (relapse() zeroes the streak), so it is
  // self-limiting and can't be farmed.
  const [crisisRewardDay, setCrisisRewardDay] = useState(() => persisted?.crisisRewardDay ?? null);
  const [slipReflectionDay, setSlipReflectionDay] = useState(() => persisted?.slipReflectionDay ?? null);
  // Last grant, for a calm "방금 받았어요" note: { kind:'shards'|'snack', amount, reason }.
  // Transient — intentionally NOT persisted (a reload should not re-announce a grant).
  const [lastEarn, setLastEarn] = useState(null);
  // C3 recovery reflection hand-off: a one-line note typed on the crisis read-back,
  // buffered here so the next 체크인 can prefill it. Transient like reflectionCtx/lastEarn —
  // intentionally NOT persisted as its own slice; it becomes durable only when the user
  // finishes that check-in, which writes it through the existing note → ledger path.
  const [checkinNoteDraft, setCheckinNoteDraft] = useState(null);
  // C7 day-context hand-off: set when the user continues to 체크인 FROM a record detail.
  // A one-shot flag that lets the check-in entry show a neutral, clearly-today prompt —
  // it carries NO past note (copying it would blur 오늘 vs 그날). Transient like
  // checkinNoteDraft: never persisted, consumed once on the check-in mount so re-opening
  // 체크인 later from the nav shows no stale prompt.
  const [checkinContext, setCheckinContext] = useState(null);

  // Save-on-change: persist exactly the domain slices above to localStorage on any
  // change. Transient nav state (screenId / reflectionCtx / lastEarn) is excluded.
  // todayRecordDay stamps the record's calendar day so the loader can drop a stale
  // yesterday. saveState never throws and never touches the network (storage.js).
  useEffect(() => {
    saveState({
      counters,
      selectedCounterId,
      rules,
      categories,
      todayRecord,
      todayRecordDay: todayRecord ? dayKey(Date.now()) : null,
      checkinLedger,
      blocklist,
      protectionPlan,
      emberShards,
      inventory,
      ownedItems,
      placements,
      activeRoomTheme,
      petCareState,
      claimedRewardIds,
      checkinRewardDay,
      crisisRewardDay,
      slipReflectionDay,
    });
  }, [
    counters,
    selectedCounterId,
    rules,
    categories,
    todayRecord,
    checkinLedger,
    blocklist,
    protectionPlan,
    emberShards,
    inventory,
    ownedItems,
    placements,
    activeRoomTheme,
    petCareState,
    claimedRewardIds,
    checkinRewardDay,
    crisisRewardDay,
    slipReflectionDay,
  ]);

  const current = SCREENS.find((s) => s.id === screenId) ?? SCREENS[0];
  const Screen = current.Component;
  // The selected counter drives the Home hero, the Urge target and every legacy
  // abstinence prop (streakDays / abstinenceStartMs / longestDays), so dependent
  // screens keep working unchanged. Falls back to the first counter defensively.
  const selectedCounter =
    counters.find((c) => c.id === selectedCounterId) ?? counters[0] ?? null;
  const abstinenceStartMs = selectedCounter?.startMs ?? Date.now();
  const longestDays = selectedCounter?.longestDays ?? 0;
  const streakDays = Math.max(0, Math.floor((Date.now() - abstinenceStartMs) / DAY_MS));

  // Build a counter row (counter-management). Pure factory: computes the id +
  // clamps a future start to now, but does NOT touch state — so add-counter and
  // add-rule-with-new-counter can both reuse it without duplicating the shape.
  const makeCounter = ({ name, startMs, targetDays } = {}) => {
    const id = `c_${Date.now()}`;
    const start = Number.isFinite(startMs) ? Math.min(startMs, Date.now()) : Date.now();
    return {
      id,
      name: (name ?? '').trim(),
      startMs: start,
      targetDays: Number.isFinite(targetDays) && targetDays > 0 ? targetDays : 30,
      longestDays: 0,
      status: 'active',
      history: [],
    };
  };

  // Add a discipline rule (§0.6.2) optionally linked to a counter (rule↔counter
  // link). Two link paths: `counterId` attaches the rule to an existing counter;
  // `newCounter` creates a counter AND links the new rule to it in one action
  // (the "새 카운터도 함께 만들기" flow). A rule with neither stays unlinked.
  const addRule = ({ label, category = null, counterId = null, newCounter = null } = {}) => {
    if (!label.trim()) return;
    let linkedCounterId = counterId;
    if (newCounter && (newCounter.name ?? '').trim()) {
      const counter = makeCounter(newCounter);
      setCounters((prev) => [...prev, counter]);
      setSelectedCounterId(counter.id);
      linkedCounterId = counter.id;
    }
    const id = `rule_${Date.now()}`;
    setRules((prev) => [
      ...prev,
      {
        id,
        label: label.trim(),
        category: category ?? null,
        counterId: linkedCounterId ?? null,
        status: 'unrecorded',
        badges: { ...EMPTY_BADGES },
      },
    ]);
  };

  // Discipline rules are self-contracts (§0.6.2): deletion is intentionally NOT
  // wired in this prototype. No destructive delete action is passed to the screen;
  // editing/archiving is a later, non-destructive phase (§0.5.9).
  const setRuleStatus = (id, status) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const addCategory = (name) => {
    const tag = name.trim();
    if (!tag) return tag;
    setCategories((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
    return tag;
  };

  // Multi-counter management (counter-management benchmark). Add / edit / select
  // are non-destructive. This round intentionally ships NO counter delete; a future
  // archive would flip `status` only (the row stays in state, recoverable).
  const addCounter = (payload = {}) => {
    if (!(payload.name ?? '').trim()) return;
    const counter = makeCounter(payload);
    setCounters((prev) => [...prev, counter]);
    setSelectedCounterId(counter.id);
  };

  const editCounter = (id, { name, startMs, targetDays } = {}) => {
    setCounters((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const next = { ...c };
        if (typeof name === 'string' && name.trim()) next.name = name.trim();
        if (Number.isFinite(startMs)) next.startMs = Math.min(startMs, Date.now());
        if (Number.isFinite(targetDays) && targetDays > 0) next.targetDays = targetDays;
        return next;
      }),
    );
  };

  const selectCounter = (id) => {
    if (counters.some((c) => c.id === id)) setSelectedCounterId(id);
  };

  // Shield planner handlers (P0.5). Non-enforcing: add appends a planned entry,
  // remove drops it. Nothing here blocks traffic — it only edits the plan list
  // that a later P1 engine will read.
  const addBlockEntry = ({ kind, label, counterId = null } = {}) => {
    const entry = makeBlockEntry({ kind, label, counterId });
    if (!entry) return;
    setBlocklist((prev) => [...prev, entry]);
  };

  const removeBlockEntry = (id) => {
    setBlocklist((prev) => prev.filter((e) => e.id !== id));
  };

  // Save the user's protection plan (C19). Normalizes the three free-text fields and
  // stores null when the whole plan is blank, so an all-empty save honestly clears it
  // rather than persisting an empty husk. It never enforces or blocks anything — it is
  // the user's own written plan, surfaced later in 잠깐 멈춤 (C21).
  const saveProtectionPlan = (plan = {}) => {
    const next = {
      triggerTime: (plan.triggerTime ?? '').trim(),
      situation: (plan.situation ?? '').trim(),
      altAction: (plan.altAction ?? '').trim(),
    };
    const empty = !next.triggerTime && !next.situation && !next.altAction;
    setProtectionPlan(empty ? null : next);
  };

  // Reset the user's locally-stored activity (C25). Clears the logged data the app keeps
  // on THIS device — today's record, the check-in history ledger, the protection plan, and
  // the once-per-day reward-day guards — then routes home. The save-on-change effect then
  // persists this cleared state, so the new protectionPlan is cleaned alongside the rest
  // (the same data clearState() would drop wholesale). There is no account and no cloud, so
  // nothing leaves or is deleted off-device; this only empties local storage on this device.
  const resetLocalData = () => {
    setTodayRecord(null);
    setCheckinLedger({});
    setProtectionPlan(null);
    setCheckinRewardDay(null);
    setCrisisRewardDay(null);
    setSlipReflectionDay(null);
    setReflectionCtx(null);
    setCheckinNoteDraft(null);
    setCheckinContext(null);
    setScreenId('home');
  };

  // Grant the earned resource (잔불 조각). Fixed amounts only — never random.
  const earn = (amount, reason) => {
    if (!amount) return;
    setEmberShards((s) => s + amount);
    setLastEarn({ kind: 'shards', amount, reason });
  };

  // 재발 (금욕 실패, §0.6.3): reset the timer to 0, archive the run length as the
  // longest record if it beat the prior best, and route into a *required*
  // reflection. The pet dims briefly but is never harmed (§0.6.9).
  const relapse = () => {
    const now = Date.now();
    // Scoped reset (counter-management): ONLY the selected counter restarts. Its
    // run length is archived into longestDays if it beat the prior best, and pushed
    // to history. Other counters are never touched — Home cannot reset all at once.
    setCounters((prev) =>
      prev.map((c) => {
        if (c.id !== selectedCounterId) return c;
        const runDays = Math.floor((now - c.startMs) / DAY_MS);
        return {
          ...c,
          startMs: now,
          longestDays: Math.max(c.longestDays ?? 0, runDays),
          history: [...(c.history ?? []), { endedMs: now, runDays }],
        };
      }),
    );
    // A relapse resets the day's narrative but keeps any check-in already logged
    // today — that 1-min check-in is a factual event, not erased by the restart.
    setTodayRecord((prev) => ({
      abstinenceState: 'relapse',
      reflection: null,
      nextAction: null,
      triggers: [],
      failureReason: null,
      badges: { ...EMPTY_BADGES },
      checkin: prev?.checkin ?? null,
    }));
    setReflectionCtx({ scope: 'relapse' });
    setScreenId('recovery');
  };

  // 규율 슬립 (못 지켰어요, §0.6.3): timer is NOT reset. Offers a light, optional
  // reflection for the specific rule.
  const startSlipReflection = (ruleId) => {
    setReflectionCtx({ scope: 'slip', ruleId: ruleId ?? null });
    setScreenId('recovery');
  };

  // Completing the reflection diary (§0.6.6): write the day's record, award the
  // earned badges, and grant a small amount of 잔불 조각 (§0.6.9). For a rule slip
  // the badges also land on that rule.
  const completeReflection = ({ why = '', triggers = [], nextAction = '' } = {}) => {
    const scope = reflectionCtx?.scope;
    const ruleId = reflectionCtx?.ruleId ?? null;
    const nextWritten = nextAction.trim().length > 0;
    setTodayRecord((prev) => ({
      abstinenceState: prev?.abstinenceState ?? (scope === 'relapse' ? 'relapse' : 'clean'),
      reflection: why.trim() || prev?.reflection || null,
      nextAction: nextAction.trim() || prev?.nextAction || null,
      triggers: triggers.length ? triggers : prev?.triggers ?? [],
      failureReason: prev?.failureReason ?? null,
      badges: {
        ...EMPTY_BADGES,
        ...(prev?.badges ?? {}),
        reflected: true,
        nextActionWritten: nextWritten || (prev?.badges?.nextActionWritten ?? false),
      },
      checkin: prev?.checkin ?? null,
    }));
    if (ruleId) {
      setRules((prev) =>
        prev.map((r) =>
          r.id === ruleId
            ? { ...r, badges: { ...r.badges, reflected: true, nextActionWritten: nextWritten || r.badges?.nextActionWritten } }
            : r,
        ),
      );
    }
    const todayKey = dayKey(Date.now());
    if (scope === 'relapse') {
      // Relapse reflection follows a timer reset (relapse() set the streak to 0),
      // so it is naturally once-per-relapse and needs no day-guard.
      earn(EARN.relapseReflection, '복기 완료');
    } else if (slipReflectionDay !== todayKey) {
      // Slip reflection — including the always-available 오늘 복기하기 (ruleId null)
      // — is gated to once per calendar day so re-pressing 복기 마치기 can't farm
      // 잔불 조각. The badges above still record every reflection; only the shard
      // grant is rate-limited.
      earn(EARN.slipReflection, '복기 완료');
      setSlipReflectionDay(todayKey);
    }
    setReflectionCtx(null);
    setScreenId('reward');
  };

  // Stash the one-line reflection from the crisis read-back so the next 체크인 prefills
  // it (C3). The line is saved only when that check-in is completed (note → ledger);
  // here it is just a transient hand-off buffer. Empty/whitespace clears it.
  const stashCheckinNote = (text) => {
    const line = (text ?? '').trim();
    setCheckinNoteDraft(line || null);
  };

  // Continue to today's 체크인 from a record detail. Carries only a neutral day-context
  // flag (NOT the past note) so the entry can invite a fresh today line. consumeCheckinContext
  // clears it once the check-in entry has read it, so a later nav-tap into 체크인 is clean.
  const startCheckinFromRecord = () => {
    setCheckinContext('record');
    setScreenId('checkin');
  };
  const consumeCheckinContext = () => setCheckinContext(null);

  // 오늘의 체크인 완료 (§0.6.9): the check-in includes the discipline check, so the
  // grant folds in a small bonus per 위기였지만 버텼어요 rule. The step-1 inputs
  // (기분/충동/트리거/메모) are persisted into today's record so 최근 기록 and the
  // check-in saved-summary can show what was logged (§0.6.5). Persisting these fields does NOT affect reward eligibility
  // — milestones unlock on streak day only (isMilestoneClaimable). The shard grant
  // is the existing 체크인 reward, gated to ONCE PER CALENDAR DAY (checkinRewardDay):
  // a later re-check-in the same day re-saves the fields but never re-grants — so
  // re-tapping 체크인 완료 can't farm 잔불 조각.
  const completeCheckin = (checkin = {}) => {
    const s = summarizeRules(rules);
    const now = Date.now();
    const todayKey = dayKey(now);
    const rewardAlreadyGivenToday = checkinRewardDay === todayKey;
    // Normalize the saved fields once so today's record AND the rolling ledger store
    // the exact same entry (no drift between the live read-back and the history read).
    const savedCheckin = {
      moodLabel: checkin.moodLabel ?? null,
      urge: typeof checkin.urge === 'number' ? checkin.urge : null,
      triggers: Array.isArray(checkin.triggers) ? checkin.triggers : [],
      // RC-1 writing-first fields. 오늘 회고 keeps the `note` field name (records / home
      // read-back + the 잠깐 멈춤 한마디 hand-off all flow through it); 나와의 약속 / 오늘의
      // 다짐 are the new user-written lines. All three trim whitespace-only input to null
      // so the saved-summary read-back stays clean (no empty quote block).
      note: typeof checkin.note === 'string' && checkin.note.trim() ? checkin.note.trim() : null,
      promise: typeof checkin.promise === 'string' && checkin.promise.trim() ? checkin.promise.trim() : null,
      resolve: typeof checkin.resolve === 'string' && checkin.resolve.trim() ? checkin.resolve.trim() : null,
      completedAt: now,
    };
    setTodayRecord((prev) => ({
      abstinenceState: prev?.abstinenceState ?? 'clean',
      reflection: prev?.reflection ?? null,
      nextAction: prev?.nextAction ?? null,
      triggers: prev?.triggers ?? [],
      failureReason: prev?.failureReason ?? null,
      badges: { ...EMPTY_BADGES, ...(prev?.badges ?? {}) },
      checkin: savedCheckin,
    }));
    // Append to the rolling check-in ledger keyed by this calendar day (Records
    // history). A re-check-in the same day OVERWRITES today's entry — never appends a
    // duplicate, and never invents a day the user didn't check in on.
    setCheckinLedger((prev) => ({ ...prev, [todayKey]: savedCheckin }));
    if (!rewardAlreadyGivenToday) {
      earn(EARN.checkin + s.held * EARN.disciplineHeld, '오늘의 기록');
      setCheckinRewardDay(todayKey);
    }
    // The reflection hand-off (if any) has now landed in savedCheckin.note → clear the
    // transient buffer so it can't bleed into a later, unrelated check-in this session.
    setCheckinNoteDraft(null);
    setScreenId('reward');
  };

  // 잠깐 멈춤을 끝까지 버팀 (crisis resisted, §0.6.9). The shard grant is gated to
  // once per calendar day so starting the timer and immediately pressing 마치기
  // over and over can't farm 잔불 조각 (mirrors checkinRewardDay). A genuine second
  // crisis the same day still shows the calm flow and message, just no re-grant.
  const crisisHeld = () => {
    const todayKey = dayKey(Date.now());
    if (crisisRewardDay !== todayKey) {
      earn(EARN.crisisHeld, '위기였지만 버텼어요');
      setCrisisRewardDay(todayKey);
    }
    setScreenId('reward');
  };

  // 보상 받기 (§0.6.9): claim a reached milestone exactly once. Shards bump the
  // balance; a snack milestone fills the inventory so 받기 visibly stocks snacks.
  const claimReward = (rewardId) => {
    const m = MILESTONE_BY_ID[rewardId];
    // Honest eligibility (§0.6.9): a reward changes the balance ONLY when real
    // abstinence progress has reached its milestone day and it hasn't been claimed
    // before. Opening the room or re-pressing 받기 must never grant a free snack.
    if (!isMilestoneClaimable(m, streakDays, claimedRewardIds)) return;
    if (m.kind === 'snack') {
      setInventory((inv) => ({ ...inv, snack: (inv.snack ?? 0) + m.amount }));
      setLastEarn({ kind: 'snack', amount: m.amount, reason: m.label });
    } else {
      setEmberShards((s) => s + m.amount);
      setLastEarn({ kind: 'shards', amount: m.amount, reason: m.label });
    }
    setClaimedRewardIds((prev) => [...prev, rewardId]);
  };

  // 잔불 조각으로 데려오기 (§0.6.9): spend shards to unlock a cosmetic. Snacks are a
  // consumable, so buying one fills the inventory instead of the owned set.
  const buyItem = (id) => {
    const def = catalogDef(id);
    if (!def) return;
    if (id === 'snack') {
      if (emberShards < def.cost) return;
      setEmberShards((s) => s - def.cost);
      setInventory((inv) => ({ ...inv, snack: (inv.snack ?? 0) + 1 }));
      setLastEarn({ kind: 'snack', amount: 1, reason: def.name });
      return;
    }
    if (ownedItems.includes(id) || emberShards < def.cost) return;
    setEmberShards((s) => s - def.cost);
    setOwnedItems((prev) => [...prev, id]);
  };

  // 방에 두기 / 옮기기 (§0.6.9): drag editor. Upsert a placement at the dropped
  // normalized coords; a moved/placed item is brought to the front (max z + 1).
  const placeItemAt = (itemId, x, y) => {
    if (!ownedItems.includes(itemId)) return;
    setPlacements((prev) => {
      const z = prev.reduce((m, p) => Math.max(m, p.z ?? 0), 0) + 1;
      if (prev.some((p) => p.itemId === itemId)) {
        return prev.map((p) => (p.itemId === itemId ? { ...p, x, y, z } : p));
      }
      return [...prev, { itemId, x, y, scale: 1, z }];
    });
  };

  // 보관함으로 치우기 (§0.6.9): drop the placement; the item stays owned.
  const removePlacement = (itemId) => {
    setPlacements((prev) => prev.filter((p) => p.itemId !== itemId));
  };

  // 방 테마 바꾸기 (§0.6.9).
  const chooseRoomTheme = (id) => {
    if (!ownedItems.includes(id) && id !== DEFAULT_THEME) return;
    setActiveRoomTheme(id);
  };

  // 고양이에게 간식 주기 (§0.6.9): consume one snack, show a warm fixed response, and
  // stamp the calendar day of the hand-off (fedDay) so the room can honestly reflect
  // a snack placed TODAY — a delivery cue, never a consume or live-reaction claim.
  const feedSnack = () => {
    if ((inventory.snack ?? 0) <= 0) return;
    setInventory((inv) => ({ ...inv, snack: inv.snack - 1 }));
    setPetCareState((p) => {
      const fedCount = (p.fedCount ?? 0) + 1;
      return { ...p, fedCount, fedDay: dayKey(Date.now()), reaction: feedReaction(fedCount - 1) };
    });
  };

  // 고양이 쓰다듬기 (놀아주기, RC-1): an honest affection interaction. The cat art is a
  // static composite, so this NEVER claims the cat moved / purred / ate — it records a
  // calm warm moment with the room today (day-scoped pettedCount/pettedDay, persisted),
  // and the screen answers with a visible affection cue + a calm, R-8-safe message.
  const petPet = () => {
    setPetCareState((p) => {
      const pettedCount = (p.pettedCount ?? 0) + 1;
      return { ...p, pettedCount, pettedDay: dayKey(Date.now()) };
    });
  };

  // Day-scoped "fed today" signal for the pet room (Character Growth). True only when
  // the last hand-off was stamped for the current calendar day — a stale yesterday
  // fedDay reads false, so the room never claims a snack was placed today when it wasn't.
  const petFedToday = petCareState?.fedDay != null && petCareState.fedDay === dayKey(Date.now());

  // Day-scoped "spent a warm moment with the cat today" signal (RC-1 쓰다듬기). True only
  // when the last 쓰다듬기 was stamped for the current calendar day — a stale yesterday reads
  // false. An honest reflection of a real action the user took today, never fabricated.
  const petPettedToday = petCareState?.pettedDay != null && petCareState.pettedDay === dayKey(Date.now());

  // Day-scoped "held a crisis today" signal for the room state shell (Pet/Room loop).
  // True only when the once-per-day crisis grant was recorded for the current calendar
  // day — crisisRewardDay is written solely by a real crisisHeld() 마치기, so a stale
  // yesterday value reads false. This is an HONEST reflection of an action the user
  // actually took today, never a fabricated state.
  const crisisHeldToday = crisisRewardDay != null && crisisRewardDay === dayKey(Date.now());

  return (
    <div className="app-shell">
      {DEBUG_NAV ? (
        <ScreenSwitcher screens={SCREENS} value={screenId} onChange={setScreenId} />
      ) : null}
      <div className="device-frame">
        {DEMO_FRAME ? (
          <div className="device-status-bar">
            <span>9:41</span>
            <span className="device-notch" />
            <span>● ● ●</span>
          </div>
        ) : null}
        <main className="device-viewport" key={screenId}>
          <Screen
            onNavigate={setScreenId}
            rules={rules}
            onAddRule={addRule}
            onSetRuleStatus={setRuleStatus}
            categories={categories}
            onAddCategory={addCategory}
            abstinenceStartMs={abstinenceStartMs}
            longestDays={longestDays}
            streakDays={streakDays}
            counters={counters}
            selectedCounterId={selectedCounterId}
            selectedCounterName={selectedCounter?.name ?? ''}
            onSelectCounter={selectCounter}
            onAddCounter={addCounter}
            onEditCounter={editCounter}
            onRelapse={relapse}
            onStartSlipReflection={startSlipReflection}
            onCompleteReflection={completeReflection}
            onCompleteCheckin={completeCheckin}
            onCrisisHeld={crisisHeld}
            checkinNoteDraft={checkinNoteDraft}
            onStashCheckinNote={stashCheckinNote}
            checkinContext={checkinContext}
            onConsumeCheckinContext={consumeCheckinContext}
            onCheckinFromRecord={startCheckinFromRecord}
            reflectionCtx={reflectionCtx}
            todayRecord={todayRecord}
            checkinLedger={checkinLedger}
            emberShards={emberShards}
            inventory={inventory}
            ownedItems={ownedItems}
            placements={placements}
            activeRoomTheme={activeRoomTheme}
            petCareState={petCareState}
            petFedToday={petFedToday}
            crisisHeldToday={crisisHeldToday}
            claimedRewardIds={claimedRewardIds}
            lastEarn={lastEarn}
            onClaimReward={claimReward}
            onBuyItem={buyItem}
            onPlaceItemAt={placeItemAt}
            onMoveItem={placeItemAt}
            onRemovePlacement={removePlacement}
            onChooseRoomTheme={chooseRoomTheme}
            onFeedSnack={feedSnack}
            onPetPet={petPet}
            petPettedToday={petPettedToday}
            blocklist={blocklist}
            onAddBlockEntry={addBlockEntry}
            onRemoveBlockEntry={removeBlockEntry}
            protectionPlan={protectionPlan}
            onSaveProtectionPlan={saveProtectionPlan}
            onResetLocalData={resetLocalData}
          />
        </main>
        <BottomNav value={screenId} onChange={setScreenId} />
      </div>
    </div>
  );
}
