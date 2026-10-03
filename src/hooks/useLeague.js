/*
 * useLeague — weekly LEAGUE SCORE store. localStorage ONLY, its OWN key (separate from
 * Personal XP and from App's bundle). League Score is bounded (daily cap), weekly, and
 * RESETS at the configurable week boundary — while Personal XP is never touched by a
 * reset. There is no backend: the competitor field is a deterministic, anonymous LOCAL
 * field (league.js). No network, ever.
 */
import { useEffect, useState } from 'react';
import {
  DAILY_LEAGUE_CAP,
  DEFAULT_TIER_ID,
  LEAGUE_WEEK,
  buildLeagueField,
  dayKeyOf,
  nearbyRows,
  tierById,
  nextTier,
  weekKey,
} from '../constants/league.js';

const KEY = 'nof.league.v1';

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
    /* skip, never throw */
  }
}

const SEED = { score: 0, week: null, tierId: DEFAULT_TIER_ID, capDay: null, capUsed: 0 };

// Apply a weekly reset if the stored week is stale. Personal XP is a DIFFERENT store and
// is never touched here. (Promotion/relegation across weeks is a later slice; the tier is
// carried forward for now — the reset only zeroes the weekly score + daily cap.)
function rollWeek(state, now = Date.now()) {
  const wk = weekKey(now);
  if (state.week === wk) return state;
  return { ...state, score: 0, week: wk, capDay: null, capUsed: 0 };
}

export function useLeague() {
  const [state, setState] = useState(() => {
    const p = load();
    return rollWeek(p ? { ...SEED, ...p } : { ...SEED });
  });

  useEffect(() => {
    save(state);
  }, [state]);

  const score = Math.max(0, Math.floor(state.score || 0));
  const week = state.week ?? weekKey();
  const tier = tierById(state.tierId);
  const promoteTier = nextTier(state.tierId);
  const field = buildLeagueField({ myScore: score, week });
  const nearby = nearbyRows(field);

  /*
   * Add eligible weekly contribution, bounded by the TUNABLE daily cap. Rolls the week
   * first (so a new week starts at 0). Returns how much was actually added after the cap.
   */
  const addScore = (amount, now = Date.now()) => {
    const add = Math.max(0, Math.floor(amount || 0));
    const day = dayKeyOf(now);
    const rolled = rollWeek(state, now);
    const usedToday = rolled.capDay === day ? rolled.capUsed : 0;
    const granted = Math.max(0, Math.min(add, DAILY_LEAGUE_CAP - usedToday));
    const next =
      granted > 0
        ? { ...rolled, score: rolled.score + granted, capDay: day, capUsed: usedToday + granted }
        : rolled; // still commit a weekly reset even when the cap is full / add is 0
    if (next !== state) {
      save(next); // durable synchronously: this runs in the same handler as the record commit,
      setState(next); // which navigates away and unmounts before the save effect could fire.
    }
    return granted;
  };

  return {
    score,
    week,
    tier,
    nextTier: promoteTier,
    field,
    nearby,
    myRank: field.myRank,
    toPromote: field.toPromote,
    promoteRank: field.promoteRank,
    dailyCap: DAILY_LEAGUE_CAP,
    resetLabel: LEAGUE_WEEK.resetLabel,
    addScore,
  };
}
