/*
 * useProgression — PERSONAL XP store (permanent progression). localStorage ONLY, its OWN
 * key (separate bundle from App's nof.mvp.state.v1 and from League Score), so it is additive
 * with zero migration risk and can never be confused with the weekly league value. No
 * network, ever.
 *
 * XP is earned only by real completed actions and is gated once-per-action-per-day so
 * re-recording the same day cannot farm XP (mirrors the app's existing daily-grant honesty).
 * A hard day never removes XP; the kitten is never punished. The growth FORM is derived from
 * cumulative XP at the frozen thresholds (progression.js); a form crossing raises a one-shot
 * celebration that is acknowledged durably (never an endless replay).
 */
import { useEffect, useState } from 'react';
import {
  DEFAULT_KITTEN_NAME,
  XP_SOURCES,
  computeXpBreakdown,
  formForXp,
  nextForm,
  formProgress,
  levelForXp,
  unlockedAccessories,
} from '../constants/progression.js';

const KEY = 'nof.progression.v1';

function dayKey(now = Date.now()) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function load() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return p && typeof p === 'object' ? p : null;
  } catch {
    return null;
  }
}

function save(state) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* full / disabled / private mode — skip, never throw */
  }
}

// New store seeds with the starting form already acknowledged, so an existing balance never
// retro-fires a celebration; only a real threshold crossing from here on raises one.
function seed() {
  return {
    xp: 0,
    kittenName: DEFAULT_KITTEN_NAME,
    // The day the companion store began ("함께한 지 N일"). Stamped once at creation so a
    // relapse (an abstinence-timer reset) never shortens the relationship with the cat.
    startedDay: dayKey(),
    awardDay: null,
    awardedIds: [],
    // recoveryReturn (어려운 하루 후 복귀, +15): remember the last recorded day and whether it
    // was a hard day, so the NEXT day's first record grants the return bonus exactly once.
    lastRecordDay: null,
    lastRecordHard: false,
    // Growth-celebration acknowledgement — form ids whose EG-07 modal has been seen.
    ackForms: [formForXp(0).id],
    // Accessory equip is separate from unlock (registry §5): unlocked is monotonic; equipped
    // is the user's toggle. Later growth never removes an older unlock or a chosen equip.
    equippedAccessories: [],
  };
}

export function useProgression() {
  const [state, setState] = useState(() => {
    const p = load();
    return p ? { ...seed(), ...p } : seed();
  });

  useEffect(() => {
    save(state);
  }, [state]);

  const xp = Math.max(0, Math.floor(state.xp || 0));
  const level = levelForXp(xp);
  const form = formForXp(xp);
  const upcoming = nextForm(xp);
  const progress = formProgress(xp);
  const accessories = unlockedAccessories(xp);
  const equipped = (state.equippedAccessories || []).filter((id) => accessories.includes(id));

  // XP actually earned TODAY (honest "오늘 +N XP") — sum of today's granted sources.
  const today = dayKey();
  const todayXp =
    state.awardDay === today
      ? (state.awardedIds || []).reduce((sum, id) => sum + (XP_SOURCES[id]?.xp || 0), 0)
      : 0;

  // A form was reached but its celebration has not been acknowledged yet (one-shot, durable).
  const pendingCelebration = !(state.ackForms || []).includes(form.id) ? form : null;

  // Days the companion has been growing ("함께한 지 N일") — from the store's creation day,
  // never the abstinence timer (a relapse must not shorten it). At least 1 on the first day.
  const daysTogether = Math.max(1, Math.floor((today - (state.startedDay ?? today)) / 86400000) + 1);

  // recoveryReturn is eligible when the previous recorded day was a HARD day, it was an
  // earlier calendar day than now, and it has not already been granted today.
  const recoveryEligible = (now = Date.now()) => {
    const day = dayKey(now);
    if (!state.lastRecordHard || state.lastRecordDay == null || state.lastRecordDay >= day) return false;
    const already = state.awardDay === day ? state.awardedIds || [] : [];
    return !already.includes('recoveryReturn');
  };

  // Which action ids can still be awarded today (not yet granted).
  const grantableToday = (actions, now = Date.now()) => {
    const day = dayKey(now);
    const already = state.awardDay === day ? state.awardedIds : [];
    const on = Array.isArray(actions) ? actions : Object.keys(actions).filter((k) => actions[k]);
    return on.filter((id) => XP_SOURCES[id] && !already.includes(id));
  };

  // Compute the next state + the honest result view for a set of actions, WITHOUT committing.
  // Grants ONLY sources not already granted today (anti-farm) and folds in the recoveryReturn
  // bonus when returning after a hard day. `opts.dayState` ('hard' etc.) is remembered so the
  // NEXT day can offer the return bonus. Shared by the pure preview (EG-03 display) and the
  // durable award (EG-03 commit) so the number shown is exactly the number granted.
  const buildAward = (actions, opts = {}) => {
    const now = opts.now ?? Date.now();
    const day = dayKey(now);
    let ids = grantableToday(actions, now);
    if (recoveryEligible(now) && !ids.includes('recoveryReturn')) ids = [...ids, 'recoveryReturn'];
    const { rows, total } = computeXpBreakdown(ids);
    const baseXp = Math.max(0, Math.floor(state.xp || 0));
    const beforeForm = formForXp(baseXp);
    const afterXp = baseXp + total;
    const afterForm = formForXp(afterXp);
    const prevIds = state.awardDay === day ? state.awardedIds || [] : [];
    const next = {
      ...state,
      xp: afterXp,
      awardDay: day,
      awardedIds: [...new Set([...prevIds, ...ids])],
      lastRecordDay: day,
      lastRecordHard: opts.dayState === 'hard',
    };
    const view = {
      rows,
      total,
      grantedIds: ids,
      beforeLevel: beforeForm.level,
      afterLevel: afterForm.level,
      beforeForm,
      afterForm,
      // "leveledUp" here means a GROWTH FORM was crossed (the celebration trigger).
      leveledUp: afterForm.n > beforeForm.n,
      afterProgress: formProgress(afterXp),
      afterEvolution: afterForm,
    };
    return { next, view };
  };

  // PURE preview — the itemized result WITHOUT persisting. EG-03 shows this; nothing is
  // committed until the result CTA, so an interruption on the preview leaves no orphan XP.
  const preview = (actions, opts = {}) => buildAward(actions, opts).view;

  /*
   * Award XP for the real actions completed (the completion transaction). Writes localStorage
   * SYNCHRONOUSLY — not only through the save effect — so the grant is durable even though the
   * record commit in the same handler navigates away and unmounts this hook before its passive
   * effect could run. Returns the honest breakdown; never a fixed number. Anti-farm: a source
   * already granted today is not re-granted.
   */
  const award = (actions, opts = {}) => {
    const { next, view } = buildAward(actions, opts);
    save(next); // durable before the navigation-driven unmount (record ↔ XP commit together)
    setState(next);
    return view;
  };

  const setKittenName = (name) => {
    const n = (name ?? '').trim();
    if (n) setState((prev) => ({ ...prev, kittenName: n }));
  };

  // Mark the current form's celebration as seen (one-shot; persists so it never replays).
  const acknowledgeCelebration = () => {
    setState((prev) => {
      const id = formForXp(Math.max(0, Math.floor(prev.xp || 0))).id;
      if ((prev.ackForms || []).includes(id)) return prev;
      return { ...prev, ackForms: [...(prev.ackForms || []), id] };
    });
  };

  // Toggle an accessory's equipped state — only if it is actually unlocked. Unlock stays
  // monotonic; a later form never removes an older unlock or a chosen equip.
  const toggleAccessory = (id) => {
    setState((prev) => {
      const unlocked = unlockedAccessories(Math.max(0, Math.floor(prev.xp || 0)));
      if (!unlocked.includes(id)) return prev;
      const cur = prev.equippedAccessories || [];
      const nextEq = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      return { ...prev, equippedAccessories: nextEq };
    });
  };

  return {
    xp,
    level,
    form,
    evolution: form, // back-compat alias for consumers reading `evolution.name`
    nextForm: upcoming,
    nextEvolution: upcoming, // back-compat alias
    progress,
    accessories,
    equippedAccessories: equipped,
    toggleAccessory,
    kittenName: state.kittenName || DEFAULT_KITTEN_NAME,
    setKittenName,
    todayXp,
    daysTogether,
    pendingCelebration,
    acknowledgeCelebration,
    preview,
    award,
    grantableToday,
  };
}
