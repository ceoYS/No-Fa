/*
 * socialClient.js — the SINGLE network seam for League + 광장 + 영감 (P1). RC-17: the backend is
 * SUPABASE (founder decision). When Supabase is configured (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY),
 * every network method delegates to the real adapter in supabaseClient.js. When it is NOT configured,
 * each method returns an honest not-configured result — { configured:false, ... } or
 * { ok:false, error:'not_connected' } — and fabricates NO users, posts, rankings, reactions, or shares.
 * There is NO fake fallback anywhere: no backend → honest empty, never invented data.
 *
 * REAL and local regardless of backend: the user's own anonymous cosmetic identity (getProfile) and the
 * local block/mute relation (hides content client-side). The deterministic PRACTICE league lives
 * separately (useLeague/league.js), always labelled 연습 리그, never presented as real competitors.
 */
import {
  makeAnonymousProfile,
  makeShout,
  validateShoutText,
  makeReport,
  makeBlockRelation,
} from '../constants/social.js';
import { isSupabaseConfigured } from './supabaseClient.js';
import * as supa from './supabaseClient.js';

const PROFILE_KEY = 'nof.social.profile.v1';
const BLOCKS_KEY = 'nof.social.blocks.v1';

// ── backend configuration probe (SUPABASE) ───────────────────────────────────
export function isSocialConfigured() {
  return isSupabaseConfigured();
}

export function getBackendState() {
  return isSocialConfigured()
    ? { configured: true, backend: 'supabase' }
    : { configured: false, reason: 'NOT_CONFIGURED' };
}

// ── local, REAL: the user's own anonymous public identity (cosmetic; mirrored to the server on connect)
export function getProfile({ kittenForm = 'ember', leagueTier = 'ember' } = {}) {
  try {
    const raw = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
    if (raw && raw.anonymousUserId) return raw;
  } catch {
    /* fall through to fresh profile */
  }
  const profile = makeAnonymousProfile({ kittenForm, leagueTier });
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* storage unavailable — profile still usable this session */
  }
  return profile;
}

// ── local, REAL: block / mute relation (hides content client-side) ───────────
function readBlocks() {
  try {
    const arr = JSON.parse(localStorage.getItem(BLOCKS_KEY) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function writeBlocks(list) {
  try {
    localStorage.setItem(BLOCKS_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}
export function blockUser(profile, blockedId) {
  const rel = makeBlockRelation({ profile, blockedId });
  const list = readBlocks();
  if (!list.some((b) => b.blockedId === blockedId)) list.push(rel);
  writeBlocks(list);
  return { ok: true, blocked: list.map((b) => b.blockedId) };
}
export function unblockUser(blockedId) {
  const list = readBlocks().filter((b) => b.blockedId !== blockedId);
  writeBlocks(list);
  return { ok: true, blocked: list.map((b) => b.blockedId) };
}
export function blockedIds() {
  return readBlocks().map((b) => b.blockedId);
}

// ── NETWORK methods — real Supabase when configured, honest not-connected otherwise ───────────────
// League: the REAL network leaderboard. Not configured → empty + configured:false (NO fake rows). The
// deterministic practice league is a separate local thing (useLeague), always 연습 리그.
export async function getLeaderboard() {
  if (!isSocialConfigured()) return { configured: false, rows: [] };
  return supa.getLeaderboard();
}
export async function submitLeagueContribution(kind) {
  if (!isSocialConfigured()) return { ok: false, error: 'not_connected' };
  return supa.submitLeagueContribution(kind);
}
export async function getLeague() {
  // Facts only. mode:'network' once a real backend exists; 'practice' means the local deterministic
  // league (연습 리그) is all there is yet.
  return { configured: isSocialConfigured(), mode: isSocialConfigured() ? 'network' : 'practice' };
}

// 광장 — shout stream. Not configured → empty + configured:false (NO fabricated live posts).
export async function getShouts() {
  if (!isSocialConfigured()) return { configured: false, messages: [] };
  return supa.getShouts();
}
// Validate + moderate locally BEFORE any send. Without a backend, honestly cannot post. With a backend,
// the moderated publish edge function is authoritative (server re-checks).
export async function postShout(profile, text) {
  const v = validateShoutText(text);
  if (!v.ok) return { ok: false, error: v.error };
  if (!isSocialConfigured()) return { ok: false, error: 'not_connected', draft: makeShout({ profile, text: v.text }) };
  return supa.postShout(v.text);
}
export async function reactToShout(messageId, kind) {
  if (!isSocialConfigured()) return { ok: false, error: 'not_connected' };
  return supa.reactToShout(messageId, kind);
}

// Report — the network report needs a backend; the LOCAL block is always available (see blockUser).
export async function reportContent({ profile, targetType, targetId, reason }) {
  const report = makeReport({ profile, targetType, targetId, reason });
  if (!isSocialConfigured()) return { ok: false, error: 'not_connected', report };
  return supa.reportContent({ targetType, targetId, reason });
}

// 영감 — publish a scrubbed public copy through the moderated edge function. Without a backend it cannot
// be published; the local public copy is kept by useFutureDiaryShare (delete-public ≠ delete-private).
export async function shareFutureDiary(copy) {
  if (!isSocialConfigured()) return { ok: false, error: 'not_connected' };
  return supa.shareFutureDiary(copy);
}
export async function getInspiration() {
  if (!isSocialConfigured()) return { configured: false, cards: [] };
  return supa.getInspiration();
}

// ── runnable self-check ──
if (typeof process !== 'undefined' && Array.isArray(process.argv) && import.meta.url === `file://${process.argv[1]}`) {
  const assert = (c, m) => {
    if (!c) throw new Error(m);
  };
  // No backend configured in a bare node run → every network method is honestly empty/not-connected.
  assert(isSocialConfigured() === false, 'no backend configured by default');
  Promise.all([getLeaderboard(), getShouts(), getInspiration()]).then(([lb, sh, insp]) => {
    assert(lb.configured === false && lb.rows.length === 0, 'leaderboard: no fake rows');
    assert(sh.configured === false && sh.messages.length === 0, 'shouts: no fake posts');
    assert(insp.configured === false && insp.cards.length === 0, 'inspiration: no fake cards');
    return Promise.all([postShout({ displayAlias: 'x' }, 'hi there'), shareFutureDiary()]);
  }).then(([post, share]) => {
    assert(post.ok === false && post.error === 'not_connected', 'cannot post without backend');
    assert(share.ok === false && share.error === 'not_connected', 'cannot publish without backend');
    console.log('socialClient.js self-check OK');
  });
}
