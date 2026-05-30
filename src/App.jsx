import { useState } from 'react';
import HomeScreen from './screens/HomeScreen.jsx';
import CheckinScreen from './screens/CheckinScreen.jsx';
import UrgeScreen from './screens/UrgeScreen.jsx';
import CalendarScreen from './screens/CalendarScreen.jsx';
import RecoveryScreen from './screens/RecoveryScreen.jsx';
import PetRewardScreen from './screens/PetRewardScreen.jsx';
import DisciplineScreen from './screens/DisciplineScreen.jsx';
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

const SCREENS = [
  { id: 'home', label: '홈', Component: HomeScreen },
  { id: 'checkin', label: '체크인', Component: CheckinScreen },
  { id: 'urge', label: '잠깐 멈춤', Component: UrgeScreen },
  { id: 'discipline', label: '나의 규율', Component: DisciplineScreen },
  { id: 'calendar', label: '최근 기록', Component: CalendarScreen },
  { id: 'recovery', label: '복기 다이어리', Component: RecoveryScreen },
  { id: 'reward', label: '고양이 방', Component: PetRewardScreen },
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

// Discipline rules — P0.1 in-memory state lifted to App so Home / 최근 기록 /
// 체크인 stay in sync. `status` holds the v2 internal enum (§0.6.2:
// kept/missed/held/unrecorded); the UI renders the selectable label only, never
// the enum, and `unrecorded` renders no label at all. `badges` are post-action
// (§0.6.2). Persistence / full editor / reminders are a later phase (§0.5.9).
const INITIAL_RULES = [
  { id: 'night_phone', label: '밤 11시 이후 침대에서 휴대폰 보지 않기', category: '밤 시간', status: 'kept', badges: { ...EMPTY_BADGES } },
  { id: 'pause_first', label: '충동이 오면 5분 멈춤 먼저 누르기', category: '충동', status: 'held', badges: { ...EMPTY_BADGES, routineDone: true } },
  { id: 'no_stim_search', label: '자극 검색하지 않기', category: '검색', status: 'kept', badges: { ...EMPTY_BADGES } },
  { id: 'short_form', label: 'SNS/숏폼은 하루 15분까지만', category: 'SNS·숏폼', status: 'missed', badges: { ...EMPTY_BADGES } },
  { id: 'phone_off_desk', label: '잠들기 전 휴대폰은 책상 위에 두기', category: '수면', status: 'unrecorded', badges: { ...EMPTY_BADGES } },
  { id: 'lonely_swap', label: '외로울 때 바로 검색하지 않고 대체 행동 1개 하기', category: '외로움', status: 'missed', badges: { ...EMPTY_BADGES, reflected: true, nextActionWritten: true } },
];

export default function App() {
  const [screenId, setScreenId] = useState('home');
  const [rules, setRules] = useState(INITIAL_RULES);
  const [categories, setCategories] = useState(SEED_CATEGORIES);
  const [abstinenceStartMs, setAbstinenceStartMs] = useState(Date.now() - SEED_OFFSET_MS);
  const [longestDays, setLongestDays] = useState(27);
  // Drives the reflection diary: { scope: 'relapse' | 'slip', ruleId? } | null.
  const [reflectionCtx, setReflectionCtx] = useState(null);
  // Today's DayRecord fields written by the reflection diary (§0.6.5/§0.6.6).
  const [todayRecord, setTodayRecord] = useState(null);

  // Reward / pet-room layer (§0.6.9). Cosmetic only; earned 잔불 조각 is the single
  // currency — no payment, no random rewards. All in-memory for the prototype.
  const [emberShards, setEmberShards] = useState(SEED_SHARDS);
  const [inventory, setInventory] = useState({ snack: 1 });
  const [ownedItems, setOwnedItems] = useState(DEFAULT_OWNED);
  // Coordinate placements: [{ itemId, x, y, scale, z }] with x/y normalized 0..1.
  const [placements, setPlacements] = useState(() => DEFAULT_PLACEMENTS.map((p) => ({ ...p })));
  const [activeRoomTheme, setActiveRoomTheme] = useState(DEFAULT_THEME);
  const [petCareState, setPetCareState] = useState({ fedCount: 0, reaction: null });
  const [claimedRewardIds, setClaimedRewardIds] = useState([]);
  // Calendar-day key of the last check-in shard grant, so the daily check-in
  // reward is given once per day even if the user re-opens/re-submits the check-in.
  const [checkinRewardDay, setCheckinRewardDay] = useState(null);
  // Same once-per-calendar-day guard for the other repeatable shard grants: the
  // 잠깐 멈춤 "버텼어요" finish and the general 오늘 복기하기. Without these, both
  // could be re-pressed in a loop to farm 잔불 조각. Relapse reflection needs no
  // day-guard — it follows a timer reset (relapse() zeroes the streak), so it is
  // self-limiting and can't be farmed.
  const [crisisRewardDay, setCrisisRewardDay] = useState(null);
  const [slipReflectionDay, setSlipReflectionDay] = useState(null);
  // Last grant, for a calm "방금 받았어요" note: { kind:'shards'|'snack', amount, reason }.
  const [lastEarn, setLastEarn] = useState(null);

  const current = SCREENS.find((s) => s.id === screenId) ?? SCREENS[0];
  const Screen = current.Component;
  const streakDays = Math.max(0, Math.floor((Date.now() - abstinenceStartMs) / DAY_MS));

  const addRule = ({ label, category }) => {
    if (!label.trim()) return;
    const id = `rule_${Date.now()}`;
    setRules((prev) => [
      ...prev,
      { id, label: label.trim(), category: category ?? null, status: 'unrecorded', badges: { ...EMPTY_BADGES } },
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
    const runDays = Math.floor((now - abstinenceStartMs) / DAY_MS);
    setLongestDays((best) => Math.max(best, runDays));
    setAbstinenceStartMs(now);
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

  // 오늘의 체크인 완료 (§0.6.9): the check-in includes the discipline check, so the
  // grant folds in a small bonus per 위기였지만 버텼어요 rule. The step-1 inputs
  // (기분/충동/트리거) are persisted into today's record so 최근 기록 can show what
  // was logged (§0.6.5). Persisting these fields does NOT affect reward eligibility
  // — milestones unlock on streak day only (isMilestoneClaimable). The shard grant
  // is the existing 체크인 reward, gated to ONCE PER CALENDAR DAY (checkinRewardDay):
  // a later re-check-in the same day re-saves the fields but never re-grants — so
  // re-tapping 체크인 완료 can't farm 잔불 조각.
  const completeCheckin = (checkin = {}) => {
    const s = summarizeRules(rules);
    const now = Date.now();
    const todayKey = dayKey(now);
    const rewardAlreadyGivenToday = checkinRewardDay === todayKey;
    setTodayRecord((prev) => ({
      abstinenceState: prev?.abstinenceState ?? 'clean',
      reflection: prev?.reflection ?? null,
      nextAction: prev?.nextAction ?? null,
      triggers: prev?.triggers ?? [],
      failureReason: prev?.failureReason ?? null,
      badges: { ...EMPTY_BADGES, ...(prev?.badges ?? {}) },
      checkin: {
        moodLabel: checkin.moodLabel ?? null,
        urge: typeof checkin.urge === 'number' ? checkin.urge : null,
        triggers: Array.isArray(checkin.triggers) ? checkin.triggers : [],
        completedAt: now,
      },
    }));
    if (!rewardAlreadyGivenToday) {
      earn(EARN.checkin + s.held * EARN.disciplineHeld, '오늘의 체크인');
      setCheckinRewardDay(todayKey);
    }
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

  // 고양이에게 간식 주기 (§0.6.9): consume one snack, show a warm fixed response.
  const feedSnack = () => {
    if ((inventory.snack ?? 0) <= 0) return;
    setInventory((inv) => ({ ...inv, snack: inv.snack - 1 }));
    setPetCareState((p) => {
      const fedCount = (p.fedCount ?? 0) + 1;
      return { fedCount, reaction: feedReaction(fedCount - 1) };
    });
  };

  return (
    <div className="app-shell">
      {DEBUG_NAV ? (
        <ScreenSwitcher screens={SCREENS} value={screenId} onChange={setScreenId} />
      ) : null}
      <div className="device-frame">
        <div className="device-status-bar">
          <span>9:41</span>
          <span className="device-notch" />
          <span>● ● ●</span>
        </div>
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
            onRelapse={relapse}
            onStartSlipReflection={startSlipReflection}
            onCompleteReflection={completeReflection}
            onCompleteCheckin={completeCheckin}
            onCrisisHeld={crisisHeld}
            reflectionCtx={reflectionCtx}
            todayRecord={todayRecord}
            emberShards={emberShards}
            inventory={inventory}
            ownedItems={ownedItems}
            placements={placements}
            activeRoomTheme={activeRoomTheme}
            petCareState={petCareState}
            claimedRewardIds={claimedRewardIds}
            lastEarn={lastEarn}
            onClaimReward={claimReward}
            onBuyItem={buyItem}
            onPlaceItemAt={placeItemAt}
            onMoveItem={placeItemAt}
            onRemovePlacement={removePlacement}
            onChooseRoomTheme={chooseRoomTheme}
            onFeedSnack={feedSnack}
          />
        </main>
        <BottomNav value={screenId} onChange={setScreenId} />
      </div>
    </div>
  );
}
