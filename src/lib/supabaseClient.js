/*
 * supabaseClient.js — the REAL Supabase adapter (RC-17, founder: SOCIAL_BACKEND = SUPABASE). It talks
 * to Supabase over plain HTTP (Auth + PostgREST + Edge Functions) and WebSocket (Realtime) using the
 * global `fetch`/`WebSocket` — NO npm SDK, so the client bundle gains no dependency (package.json is
 * SHA-pinned by the regression guard) and `npm run build` stays green offline.
 *
 * HONESTY: dormant until BOTH VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set at build time.
 * Until then isSupabaseConfigured() is false and socialClient/moderation/futureImageProvider keep their
 * honest NOT_CONFIGURED states — this file fabricates NO users, posts, rankings, reactions, shares, or
 * images, and has NO fake fallback.
 *
 * SECRETS: only the PUBLIC anon key lives here (safe in the client, RLS-guarded). The SERVICE ROLE key
 * and the OPENAI_API_KEY are NEVER referenced here or anywhere in the client bundle — moderation and
 * image generation go through server-side Edge Functions that hold those secrets.
 */

const SESSION_KEY = 'nof.supabase.session.v1';
const SOCIAL_PROFILE_KEY = 'nof.social.profile.v1'; // socialClient's local cosmetic identity (alias mirror)
const REQUEST_TIMEOUT_MS = 12000;

// ── configuration probe (no network) ─────────────────────────────────────────
export function supabaseUrl() {
  try {
    return (import.meta.env && import.meta.env.VITE_SUPABASE_URL) || '';
  } catch {
    return '';
  }
}
export function supabaseAnonKey() {
  try {
    return (import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || '';
  } catch {
    return '';
  }
}
export function isSupabaseConfigured() {
  return !!supabaseUrl() && !!supabaseAnonKey();
}

// ── low-level fetch with timeout; never throws to callers (returns {ok:false,...}) ───────────────
async function httpJson(url, { method = 'GET', headers = {}, body, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method,
      headers: { apikey: supabaseAnonKey(), ...headers },
      body: body != null ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, error: String((e && e.message) || e) };
  } finally {
    clearTimeout(timer);
  }
}

// ── session (Supabase anonymous auth) ─────────────────────────────────────────
let memSession = null; // fallback when localStorage is blocked
function readSession() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    return s && s.access_token ? s : null;
  } catch {
    return null;
  }
}
function writeSession(s) {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable — session held in module memory for this tab */
  }
}
function currentSession() {
  return memSession || readSession();
}
function storeSession(s) {
  if (s && !s.expires_at && s.expires_in) s.expires_at = Math.floor(Date.now() / 1000) + s.expires_in;
  memSession = s;
  writeSession(s);
  return s;
}
function sessionExpired(s) {
  if (!s || !s.expires_at) return true;
  return Date.now() / 1000 > s.expires_at - 30; // refresh 30s early
}

// Sign in anonymously (GoTrue /signup with an empty body → an anonymous user). Requires anonymous
// sign-ins enabled on the project. Returns a session or null (never throws).
async function signInAnonymously() {
  const r = await httpJson(`${supabaseUrl()}/auth/v1/signup`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: { data: {}, gotrue_meta_security: {} },
  });
  if (r.ok && r.data && r.data.access_token) return storeSession(r.data);
  return null;
}
async function refreshSession(s) {
  const r = await httpJson(`${supabaseUrl()}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: { refresh_token: s.refresh_token },
  });
  if (r.ok && r.data && r.data.access_token) return storeSession(r.data);
  return null;
}

// The user's local cosmetic alias (written by socialClient.getProfile). Read straight from storage to
// mirror it onto the server profile WITHOUT importing socialClient (that would be a circular import).
// Falls back to a neutral '익명' when storage is empty/blocked (e.g. a bare node run).
function localDisplayAlias() {
  try {
    const p = JSON.parse(localStorage.getItem(SOCIAL_PROFILE_KEY) || 'null');
    const a = p && typeof p.displayAlias === 'string' ? p.displayAlias.trim() : '';
    if (a) return a.slice(0, 40);
  } catch {
    /* storage unavailable */
  }
  return '익명';
}

// Upsert the caller's row in anonymous_profiles. EVERY other table FKs this row (shout / share /
// league / reaction / report / block / image_usage), and the publish edge functions reject a caller
// with no profile ('no_profile'), so without this bootstrap the FIRST real write of the whole social /
// league / image backend would fail. A module guard keeps it to at most one POST per uid per session.
let profileEnsuredUid = null;
async function ensureProfile(uid, accessToken, { displayAlias, kittenForm = 'ember', leagueTier = 'ember' } = {}) {
  if (!uid) return;
  const alias = (displayAlias && String(displayAlias).trim().slice(0, 40)) || localDisplayAlias();
  const r = await httpJson(`${supabaseUrl()}/rest/v1/anonymous_profiles`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: { id: uid, display_alias: alias, kitten_form: kittenForm, league_tier: leagueTier },
  });
  if (r.ok) profileEnsuredUid = uid; // only stop retrying once the row is actually there
}

// ensureSession — the single entry the adapter uses before any authed call. Signs in anonymously the
// first time, refreshes near expiry, seeds the public profile row the FKs require (once per session),
// and returns { uid, accessToken } or null. Never throws.
export async function ensureSession({ kittenForm = 'ember', leagueTier = 'ember', displayAlias } = {}) {
  if (!isSupabaseConfigured()) return null;
  let s = currentSession();
  if (!s) s = await signInAnonymously();
  else if (sessionExpired(s)) s = (await refreshSession(s)) || (await signInAnonymously());
  if (!s || !s.access_token) return null;
  const uid = s.user && s.user.id;
  // Seed the profile once per session (or whenever a fresh alias is explicitly supplied). Without a
  // row here, every authed write below FK-fails / returns no_profile.
  if (uid && (displayAlias || profileEnsuredUid !== uid)) {
    await ensureProfile(uid, s.access_token, { displayAlias, kittenForm, leagueTier });
  }
  return { uid, accessToken: s.access_token };
}

// Authed PostgREST helper. Returns { ok, status, data }; never throws.
async function rest(path, { method = 'GET', body, prefer, query } = {}) {
  const auth = currentSession() && currentSession().access_token;
  const qs = query ? `?${new URLSearchParams(query).toString()}` : '';
  return httpJson(`${supabaseUrl()}/rest/v1/${path}${qs}`, {
    method,
    headers: {
      Authorization: `Bearer ${auth}`,
      'content-type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {}),
    },
    body,
  });
}
// Postgres RPC (SECURITY DEFINER server logic — e.g. league scoring).
async function rpc(fn, args) {
  return rest(`rpc/${fn}`, { method: 'POST', body: args || {} });
}
// Edge Function (server holds OpenAI / service-role secrets). Bearer = the user's JWT.
async function invokeFunction(name, body) {
  const auth = currentSession() && currentSession().access_token;
  return httpJson(`${supabaseUrl()}/functions/v1/${name}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${auth}`, 'content-type': 'application/json' },
    body,
  });
}

// ── League (server-authoritative scoring) ─────────────────────────────────────
export async function getLeaderboard() {
  if (!isSupabaseConfigured()) return { configured: false, rows: [] };
  const sess = await ensureSession();
  if (!sess) return { configured: false, rows: [] };
  const weekKey = isoWeekKey();
  const r = await rest('league_memberships', {
    query: {
      select: 'score,user_id,anonymous_profiles(display_alias,kitten_form,league_tier),weekly_leagues!inner(week_key)',
      'weekly_leagues.week_key': `eq.${weekKey}`,
      order: 'score.desc',
      limit: '50',
    },
  });
  if (!r.ok || !Array.isArray(r.data)) return { configured: true, rows: [], error: 'fetch_failed' };
  const rows = r.data.map((m) => ({
    anonymousUserId: m.user_id,
    displayAlias: m.anonymous_profiles?.display_alias ?? '익명',
    kittenForm: m.anonymous_profiles?.kitten_form ?? 'ember',
    score: m.score ?? 0,
    isSelf: m.user_id === sess.uid,
  }));
  return { configured: true, rows, weekKey };
}

export async function submitLeagueContribution(kind) {
  if (!isSupabaseConfigured()) return { ok: false, error: 'not_connected' };
  const sess = await ensureSession();
  if (!sess) return { ok: false, error: 'not_connected' };
  const r = await rpc('record_league_contribution', { p_kind: kind });
  if (!r.ok) return { ok: false, error: 'rpc_failed', detail: r.data };
  const row = Array.isArray(r.data) ? r.data[0] : r.data;
  return { ok: true, score: row?.score ?? null, counted: !!row?.counted, weekKey: row?.week_key };
}

// ── 광장 (shouts) ─────────────────────────────────────────────────────────────
export async function getShouts() {
  if (!isSupabaseConfigured()) return { configured: false, messages: [] };
  const sess = await ensureSession();
  if (!sess) return { configured: false, messages: [] };
  const nowIso = new Date().toISOString();
  const r = await rest('shout_messages', {
    query: {
      select: 'id,user_id,display_alias,text,created_at,expires_at',
      moderated: 'eq.true',
      expires_at: `gt.${nowIso}`,
      order: 'created_at.desc',
      limit: '100',
    },
  });
  if (!r.ok || !Array.isArray(r.data)) return { configured: true, messages: [], error: 'fetch_failed' };
  const messages = r.data.map((m) => ({
    id: m.id,
    anonymousUserId: m.user_id,
    displayAlias: m.display_alias,
    text: m.text,
    createdAt: Date.parse(m.created_at) || Date.now(),
    expiresAt: Date.parse(m.expires_at) || Date.now(),
  }));
  return { configured: true, messages };
}

// Publish through the SERVER (moderated edge function). The client never inserts a shout directly (RLS
// forbids it), so an un-moderated post can never appear. Unconfigured moderation → not published.
export async function postShout(text) {
  if (!isSupabaseConfigured()) return { ok: false, error: 'not_connected' };
  const sess = await ensureSession();
  if (!sess) return { ok: false, error: 'not_connected' };
  const r = await invokeFunction('publish-shout', { text });
  if (r.ok && r.data && r.data.ok) return { ok: true, shout: r.data.shout };
  return { ok: false, error: (r.data && r.data.error) || 'publish_failed' };
}

export async function reactToShout(messageId, kind) {
  if (!isSupabaseConfigured()) return { ok: false, error: 'not_connected' };
  const sess = await ensureSession();
  if (!sess) return { ok: false, error: 'not_connected' };
  const r = await rest('reactions', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=minimal',
    body: { message_id: messageId, user_id: sess.uid, kind },
  });
  return r.ok ? { ok: true } : { ok: false, error: 'react_failed' };
}

// A REAL Realtime subscription for 광장 with a reliable polling fallback. Returns an unsubscribe fn.
// Always polls (reliable); additionally opens a Realtime WebSocket for push when possible. Both call
// onChange (which should re-fetch). Fully guarded — a WS failure degrades to polling silently.
export function subscribeShouts(onChange, { intervalMs = 15000 } = {}) {
  if (!isSupabaseConfigured() || typeof onChange !== 'function') return () => {};
  let stopped = false;
  const poll = setInterval(() => {
    if (!stopped) onChange({ source: 'poll' });
  }, Math.max(5000, intervalMs));
  let ws = null;
  try {
    const sess = currentSession();
    const token = sess && sess.access_token;
    const wsUrl = `${supabaseUrl().replace(/^http/, 'ws')}/realtime/v1/websocket?apikey=${encodeURIComponent(supabaseAnonKey())}&vsn=1.0.0`;
    ws = new WebSocket(wsUrl);
    let ref = 0;
    let hb = null;
    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          topic: 'realtime:public:shout_messages',
          event: 'phx_join',
          payload: {
            config: { postgres_changes: [{ event: 'INSERT', schema: 'public', table: 'shout_messages' }] },
            access_token: token,
          },
          ref: String(++ref),
        }),
      );
      hb = setInterval(() => {
        try {
          ws.send(JSON.stringify({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(++ref) }));
        } catch {
          /* socket closing */
        }
      }, 30000);
    };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.event === 'postgres_changes' && !stopped) onChange({ source: 'realtime' });
      } catch {
        /* ignore malformed frame */
      }
    };
    ws.onclose = () => {
      if (hb) clearInterval(hb);
    };
    ws.onerror = () => {
      /* degrade to polling silently */
    };
  } catch {
    /* no WebSocket / blocked — polling covers it */
  }
  return () => {
    stopped = true;
    clearInterval(poll);
    try {
      if (ws) ws.close();
    } catch {
      /* already closed */
    }
  };
}

// ── 영감 (Future Diary public shares) ─────────────────────────────────────────
export async function getInspiration() {
  if (!isSupabaseConfigured()) return { configured: false, cards: [] };
  const sess = await ensureSession();
  if (!sess) return { configured: false, cards: [] };
  const r = await rest('future_diary_shares', {
    query: {
      select: 'id,display_alias,future_self,ideal_day,feelings_environment,image_path,created_at',
      moderated: 'eq.true',
      order: 'created_at.desc',
      limit: '50',
    },
  });
  if (!r.ok || !Array.isArray(r.data)) return { configured: true, cards: [], error: 'fetch_failed' };
  const cards = r.data.map((c) => ({
    publicShareId: c.id,
    displayAlias: c.display_alias,
    futureSelf: c.future_self,
    idealDay: c.ideal_day,
    feelingsEnvironment: c.feelings_environment,
    imagePath: c.image_path || null,
    createdAt: Date.parse(c.created_at) || Date.now(),
  }));
  return { configured: true, cards };
}

// Publish a scrubbed PUBLIC copy through the moderated server path. Returns a publicShareId on success.
export async function shareFutureDiary(copy = {}) {
  if (!isSupabaseConfigured()) return { ok: false, error: 'not_connected' };
  const sess = await ensureSession();
  if (!sess) return { ok: false, error: 'not_connected' };
  const r = await invokeFunction('publish-future-diary-share', {
    futureSelf: copy.futureSelf || '',
    idealDay: copy.idealDay || '',
    feelingsEnvironment: copy.feelingsEnvironment || '',
    imagePath: copy.imagePath || null,
  });
  if (r.ok && r.data && r.data.ok) return { ok: true, publicShareId: r.data.publicShareId };
  return { ok: false, error: (r.data && r.data.error) || 'publish_failed' };
}

// Delete ONLY the network public copy (RLS: own rows). The private local diary is never touched here.
export async function deleteShare(publicShareId) {
  if (!isSupabaseConfigured()) return { ok: false, error: 'not_connected' };
  const sess = await ensureSession();
  if (!sess) return { ok: false, error: 'not_connected' };
  const r = await rest('future_diary_shares', {
    method: 'DELETE',
    query: { id: `eq.${publicShareId}`, user_id: `eq.${sess.uid}` },
    prefer: 'return=minimal',
  });
  return r.ok ? { ok: true } : { ok: false, error: 'delete_failed' };
}

// ── safety: report + block (network) ──────────────────────────────────────────
export async function reportContent({ targetType, targetId, reason }) {
  if (!isSupabaseConfigured()) return { ok: false, error: 'not_connected' };
  const sess = await ensureSession();
  if (!sess) return { ok: false, error: 'not_connected' };
  const r = await rest('reports', {
    method: 'POST',
    prefer: 'return=minimal',
    body: { reporter_id: sess.uid, target_type: targetType, target_id: targetId, reason },
  });
  return r.ok ? { ok: true } : { ok: false, error: 'report_failed' };
}

export async function blockUserRemote(blockedId) {
  if (!isSupabaseConfigured()) return { ok: false, error: 'not_connected' };
  const sess = await ensureSession();
  if (!sess) return { ok: false, error: 'not_connected' };
  const r = await rest('block_relations', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=minimal',
    body: { blocker_id: sess.uid, blocked_id: blockedId },
  });
  return r.ok ? { ok: true } : { ok: false, error: 'block_failed' };
}

// ── moderation + image (server-side secrets; client only invokes) ─────────────
export async function moderateRemote({ type, text, imageUrl }) {
  if (!isSupabaseConfigured()) return { configured: false, state: 'MODERATION_NOT_CONFIGURED', allowed: false };
  const sess = await ensureSession();
  if (!sess) return { configured: false, state: 'MODERATION_NOT_CONFIGURED', allowed: false };
  const r = await invokeFunction('moderate-content', { type, text, imageUrl });
  if (r.ok && r.data) return r.data;
  return { configured: false, state: 'MODERATION_NOT_CONFIGURED', allowed: false, error: 'moderation_failed' };
}

export async function generateFutureImageRemote({ diaryText, quality }) {
  if (!isSupabaseConfigured()) return { state: 'not_configured' };
  const sess = await ensureSession();
  if (!sess) return { state: 'not_configured' };
  const r = await invokeFunction('generate-future-image', { diaryText, quality });
  if (r.ok && r.data && r.data.ok) {
    return { state: 'ready', imageUrl: r.data.signedUrl, imagePath: r.data.imagePath, used: r.data.used, limit: r.data.limit };
  }
  const err = (r.data && r.data.error) || 'provider_error';
  // Provider absent OR the server kill-switch is off → the feature is honestly not available (never a
  // fabricated image). quota / daily-capacity / provider errors surface as an honest 'failed'.
  if (err === 'IMAGE_PROVIDER_NOT_CONFIGURED' || err === 'IMAGE_GENERATION_DISABLED') return { state: 'not_configured' };
  if (err === 'quota_exceeded') return { state: 'failed', error: 'quota_exceeded', used: r.data && r.data.used, limit: r.data && r.data.limit };
  return { state: 'failed', error: err };
}

// ISO-week key mirror of the DB's to_char(now(),'IYYY"-W"IW'), so the client can query the current week.
export function isoWeekKey(d = new Date()) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7; // Mon=1..Sun=7
  date.setUTCDate(date.getUTCDate() + 4 - day); // nearest Thursday
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

// ── runnable self-check ──
if (typeof process !== 'undefined' && Array.isArray(process.argv) && import.meta.url === `file://${process.argv[1]}`) {
  const assert = (c, m) => {
    if (!c) throw new Error(m);
  };
  assert(isSupabaseConfigured() === false, 'not configured without env');
  Promise.all([
    getLeaderboard(),
    getShouts(),
    getInspiration(),
    postShout('hi'),
    submitLeagueContribution('checkin'),
    moderateRemote({ type: 'shout', text: 'hi' }),
    generateFutureImageRemote({ diaryText: 'x' }),
  ]).then(([lb, sh, insp, post, contrib, mod, img]) => {
    assert(lb.configured === false && lb.rows.length === 0, 'leaderboard not-configured empty');
    assert(sh.configured === false && sh.messages.length === 0, 'shouts not-configured empty');
    assert(insp.configured === false && insp.cards.length === 0, 'inspiration not-configured empty');
    assert(post.ok === false && post.error === 'not_connected', 'no publish without backend');
    assert(contrib.ok === false && contrib.error === 'not_connected', 'no league contribution without backend');
    assert(mod.allowed === false && mod.state === 'MODERATION_NOT_CONFIGURED', 'moderation not configured → not allowed');
    assert(img.state === 'not_configured', 'image not configured');
    assert(/^\d{4}-W\d{2}$/.test(isoWeekKey(new Date('2026-09-21'))), 'iso week key shape');
    assert(localDisplayAlias() === '익명', 'display alias falls back to 익명 when local storage is unavailable');
    assert(typeof subscribeShouts(() => {}) === 'function', 'subscribe returns unsub fn');
    console.log('supabaseClient.js self-check OK');
  });
}
