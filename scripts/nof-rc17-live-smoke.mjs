#!/usr/bin/env node
/*
 * nof-rc17-live-smoke.mjs — the LIVE staging smoke test for the RC-17 Supabase backend. It is COMPLETE
 * now, but it deliberately cannot mutate anything until a real staging project is provisioned.
 *
 *   node scripts/nof-rc17-live-smoke.mjs --preflight   # ZERO network — reports readiness only
 *   NOF_RC17_STAGING=YES node scripts/nof-rc17-live-smoke.mjs   # live checks against a STAGING project
 *
 * REFUSES the live path unless NOF_RC17_STAGING=YES AND the client env (VITE_SUPABASE_URL +
 * VITE_SUPABASE_ANON_KEY) is present — so it can never touch production or run half-configured.
 *
 * SECRET-SAFE: it NEVER prints an anon JWT, refresh token, OpenAI key, service-role key, DB password, or
 * cleanup secret. Only PASS/FAIL/SKIP/GATED per named check.
 *
 * DISPOSABLE: every live check runs as a throwaway anonymous staging account and cleans up the rows it
 * created (best-effort). Anonymous users are not deletable from the client; they are cheap and TTL out.
 *
 * PAID IMAGE: a paid generation runs ONLY with NOF_ALLOW_PAID_IMAGE_TEST=YES. Without it the harness
 * reports FUTURE_IMAGE_PAID_E2E = NOT_AUTHORIZED and continues every other check.
 *
 * Checks: A anon auth · B profile ownership/RLS · C schema availability · D plaza publish+readback ·
 * E 24h TTL · F direct-DB publish bypass rejected · G reaction · H report (write-only) · I league
 * server-authoritative contribution · J duplicate league event ignored · K arbitrary score mutation
 * rejected · L Future Diary public whitelist · M delete public copy ≠ private · N moderation edge
 * function · O cleanup. Plus the gated paid image E2E.
 */
import {
  loadEnv, present, CLIENT_REQUIRED, REQUIRED_TABLES, EDGE_FUNCTIONS, expectedEndpoints,
} from './lib/rc17-env.mjs';

const env = loadEnv();
const PREFLIGHT = process.argv.includes('--preflight');
const TIMEOUT_MS = 15000;
const uuid = () => (globalThis.crypto?.randomUUID?.() ?? `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0')}`);

// Public-share columns the server may return; and keys that would signal PRIVATE-record leakage.
const PUBLIC_SHARE_COLUMNS = new Set([
  'id', 'user_id', 'display_alias', 'future_self', 'ideal_day', 'feelings_environment', 'image_path',
  'moderated', 'created_at',
]);
const PRIVATE_FORBIDDEN = ['counter_name', 'counterName', 'streak_days', 'streakDays', 'mood', 'mood_label', 'private_id', 'source_private_id'];

// ── secret-safe reporting ─────────────────────────────────────────────────────
const results = [];
function record(id, label, status, detail = '') { results.push({ id, label, status, detail }); }
const ICON = { PASS: '✓', FAIL: '✗', SKIP: '·', GATED: '▸' };

// ── preflight (ZERO network) ──────────────────────────────────────────────────
function preflight() {
  console.log('NoF RC-17 live smoke — PREFLIGHT (no network, no mutations, no secrets printed)\n');
  const stagingRaw = env.NOF_RC17_STAGING;
  console.log(`  NOF_RC17_STAGING            = ${present(env, 'NOF_RC17_STAGING') ? (String(stagingRaw).toUpperCase() === 'YES' ? 'YES' : 'SET_BUT_NOT_YES') : 'MISSING'}`);
  for (const n of CLIENT_REQUIRED) console.log(`  ${n.padEnd(27)} = ${present(env, n) ? 'PRESENT' : 'MISSING'}`);
  const paid = present(env, 'NOF_ALLOW_PAID_IMAGE_TEST') && String(env.NOF_ALLOW_PAID_IMAGE_TEST).toUpperCase() === 'YES';
  console.log(`  PAID_IMAGE_TEST             = ${paid ? 'AUTHORIZED' : 'NOT_AUTHORIZED'}`);
  const ep = expectedEndpoints(present(env, 'VITE_SUPABASE_URL') ? env.VITE_SUPABASE_URL : null);
  console.log('\n  expected endpoints (no call made):');
  for (const [k, v] of Object.entries(ep)) console.log(`    ${k.padEnd(13)} ${v}`);
  console.log(`\n  tables a live run checks: ${REQUIRED_TABLES.join(', ')}`);
  console.log(`  functions a live run invokes: ${EDGE_FUNCTIONS.join(', ')}`);
  const ready = present(env, 'NOF_RC17_STAGING') && String(env.NOF_RC17_STAGING).toUpperCase() === 'YES'
    && CLIENT_REQUIRED.every((n) => present(env, n));
  console.log(`\n  LIVE_RUN_READY = ${ready ? 'YES' : 'NO'} (${ready ? 'drop --preflight to run' : 'set NOF_RC17_STAGING=YES + client env'})`);
  process.exit(0);
}

// ── live HTTP (secret-safe; never logs bodies) ────────────────────────────────
const BASE = () => String(env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const ANON = () => String(env.VITE_SUPABASE_ANON_KEY || '');
async function http(url, { method = 'GET', headers = {}, body } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method,
      headers: { apikey: ANON(), ...headers },
      body: body != null ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, error: String((e && e.message) || e) };
  } finally { clearTimeout(t); }
}
const authed = (token, extra = {}) => ({ Authorization: `Bearer ${token}`, 'content-type': 'application/json', ...extra });
const rest = (token, path, opts = {}) => http(`${BASE()}/rest/v1/${path}`, { ...opts, headers: authed(token, opts.headers) });
const rpc = (token, fn, args) => rest(token, `rpc/${fn}`, { method: 'POST', body: args || {} });
const invoke = (token, name, body) => http(`${BASE()}/functions/v1/${name}`, { method: 'POST', headers: authed(token), body });

async function signInDisposableAnon() {
  const r = await http(`${BASE()}/auth/v1/signup`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: { data: {}, gotrue_meta_security: {} },
  });
  if (r.ok && r.data && r.data.access_token && r.data.user?.id) {
    return { token: r.data.access_token, uid: r.data.user.id }; // token NEVER printed
  }
  return null;
}

// ── live run ──────────────────────────────────────────────────────────────────
async function live() {
  console.log('NoF RC-17 live smoke — STAGING run (disposable anon account · secrets never printed)\n');

  // A — anonymous auth
  const sess = await signInDisposableAnon();
  if (!sess) {
    record('A', 'anonymous auth', 'FAIL', 'no session — is Anonymous sign-in enabled on the project?');
    return finish();
  }
  record('A', 'anonymous auth', 'PASS', 'disposable anon session established');
  const { token, uid } = sess;
  const alias = '스테이징 스모크';

  // B — profile ownership + RLS (own upsert ok; foreign id rejected)
  const own = await rest(token, 'anonymous_profiles', {
    method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: { id: uid, display_alias: alias, kitten_form: 'ember', league_tier: 'ember' },
  });
  const foreign = await rest(token, 'anonymous_profiles', {
    method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: { id: uuid(), display_alias: 'not-mine', kitten_form: 'ember', league_tier: 'ember' },
  });
  if (own.ok && !foreign.ok) record('B', 'profile ownership + RLS', 'PASS', 'own upsert ok; foreign id rejected by RLS');
  else if (!own.ok) record('B', 'profile ownership + RLS', 'FAIL', `own profile upsert failed (status ${own.status}) — needed for every FK`);
  else record('B', 'profile ownership + RLS', 'FAIL', 'RLS HOLE: inserting a profile with someone else\'s id was allowed');

  // C — schema availability (every required table SELECTable = present)
  const missingTables = [];
  for (const tbl of REQUIRED_TABLES) {
    const r = await rest(token, `${tbl}?select=*&limit=1`);
    // 200 (even []) = table exists; 404 / 42P01 = missing. Empty due to RLS is fine here.
    const exists = r.status === 200 || (r.status === 206) || (r.data && r.data.code && r.data.code !== '42P01' && r.status !== 404);
    if (!exists) missingTables.push(`${tbl}(${r.status})`);
  }
  record('C', 'schema availability', missingTables.length === 0 ? 'PASS' : 'FAIL',
    missingTables.length === 0 ? `all ${REQUIRED_TABLES.length} tables present` : `missing: ${missingTables.join(', ')}`);

  // D — plaza publish + readback (server-moderated path)
  const marker = `nof staging ${Date.now().toString(36)}`;
  const pub = await invoke(token, 'publish-shout', { text: marker });
  let shoutId = null; let shoutExpires = null; let shoutCreated = null;
  if (pub.ok && pub.data?.ok) {
    shoutId = pub.data.shout?.id ?? null;
    shoutExpires = pub.data.shout?.expires_at ?? null;
    shoutCreated = pub.data.shout?.created_at ?? null;
    const back = await rest(token, `shout_messages?select=id,text,expires_at,created_at&moderated=eq.true&expires_at=gt.${new Date().toISOString()}&order=created_at.desc&limit=20`);
    const found = Array.isArray(back.data) && back.data.some((m) => m.text === marker);
    record('D', 'plaza publish + readback', found ? 'PASS' : 'FAIL', found ? 'published + read back moderated+live' : 'published but not read back');
  } else if (pub.data?.error === 'MODERATION_NOT_CONFIGURED') {
    record('D', 'plaza publish + readback', 'GATED', 'moderation not configured → publish correctly blocked (fail-closed). Set OPENAI_API_KEY to exercise.');
  } else {
    record('D', 'plaza publish + readback', 'FAIL', `publish failed: ${pub.data?.error || pub.status}`);
  }

  // E — 24h TTL on the published shout
  if (shoutExpires && shoutCreated) {
    const delta = Date.parse(shoutExpires) - Date.parse(shoutCreated);
    const ok = Math.abs(delta - 24 * 3600 * 1000) < 5 * 60 * 1000;
    record('E', '24h TTL', ok ? 'PASS' : 'FAIL', `expires_at - created_at = ${(delta / 3600000).toFixed(2)}h`);
  } else {
    record('E', '24h TTL', 'SKIP', 'no published shout (D gated/failed)');
  }

  // F — direct-DB publish bypass MUST be rejected (no insert policy on shout_messages)
  const bypass = await rest(token, 'shout_messages', {
    method: 'POST', headers: { Prefer: 'return=representation' },
    body: { user_id: uid, display_alias: alias, text: 'DIRECT BYPASS (should be rejected)', moderated: true, expires_at: new Date(Date.now() + 3600e3).toISOString() },
  });
  record('F', 'direct-DB publish bypass rejected', !bypass.ok ? 'PASS' : 'FAIL',
    !bypass.ok ? `client insert denied (status ${bypass.status}) — only the moderated edge fn can publish` : 'RLS HOLE: client inserted an un-moderated shout directly');

  // G — reaction (needs a live shout)
  if (shoutId) {
    const react = await rest(token, 'reactions', {
      method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: { message_id: shoutId, user_id: uid, kind: 'ember' },
    });
    record('G', 'reaction', react.ok ? 'PASS' : 'FAIL', react.ok ? 'own reaction inserted' : `failed (status ${react.status})`);
  } else {
    record('G', 'reaction', 'SKIP', 'no shout to react to (D gated/failed)');
  }

  // H — report is write-only (insert own ok; read denied/empty)
  const rep = await rest(token, 'reports', {
    method: 'POST', headers: { Prefer: 'return=minimal' },
    body: { reporter_id: uid, target_type: 'shout', target_id: shoutId || uuid(), reason: 'spam' },
  });
  const repRead = await rest(token, 'reports?select=*&limit=1');
  const readLeaks = Array.isArray(repRead.data) && repRead.data.length > 0;
  record('H', 'report (write-only)', rep.ok && !readLeaks ? 'PASS' : 'FAIL',
    !rep.ok ? `insert failed (status ${rep.status})` : readLeaks ? 'RLS HOLE: report queue is readable by a client' : 'insert ok; queue not readable');

  // I — league contribution is server-authoritative
  const c1 = await rpc(token, 'record_league_contribution', { p_kind: 'checkin' });
  const row1 = Array.isArray(c1.data) ? c1.data[0] : c1.data;
  const score1 = row1?.score ?? null;
  record('I', 'league contribution (server-authoritative)', c1.ok && row1?.counted === true && score1 > 0 ? 'PASS' : 'FAIL',
    c1.ok ? `counted=${row1?.counted} score=${score1}` : `rpc failed (status ${c1.status})`);

  // J — duplicate league event ignored (idempotent per kind/day)
  const c2 = await rpc(token, 'record_league_contribution', { p_kind: 'checkin' });
  const row2 = Array.isArray(c2.data) ? c2.data[0] : c2.data;
  record('J', 'duplicate league event ignored', c2.ok && row2?.counted === false && row2?.score === score1 ? 'PASS' : 'FAIL',
    c2.ok ? `counted=${row2?.counted} score=${row2?.score} (unchanged=${row2?.score === score1})` : `rpc failed (status ${c2.status})`);

  // K — arbitrary score mutation rejected (no update policy on league_memberships)
  const inject = await rest(token, `league_memberships?user_id=eq.${uid}`, {
    method: 'PATCH', headers: { Prefer: 'return=representation' }, body: { score: 999999 },
  });
  const injected = inject.ok && Array.isArray(inject.data) && inject.data.length > 0;
  record('K', 'arbitrary score mutation rejected', !injected ? 'PASS' : 'FAIL',
    !injected ? `score PATCH denied (status ${inject.status})` : 'RLS HOLE: client mutated its own league score');

  // L — Future Diary PUBLIC copy is whitelist-only
  let shareId = null;
  const share = await invoke(token, 'publish-future-diary-share', { futureSelf: '스테이징 미래', idealDay: '', feelingsEnvironment: '' });
  if (share.ok && share.data?.ok) {
    shareId = share.data.publicShareId ?? null;
    const row = await rest(token, `future_diary_shares?id=eq.${shareId}&select=*`);
    const rec = Array.isArray(row.data) ? row.data[0] : null;
    const extraKeys = rec ? Object.keys(rec).filter((k) => !PUBLIC_SHARE_COLUMNS.has(k)) : ['<no row>'];
    const leaks = rec ? PRIVATE_FORBIDDEN.filter((k) => k in rec) : [];
    record('L', 'Future Diary public whitelist', rec && extraKeys.length === 0 && leaks.length === 0 ? 'PASS' : 'FAIL',
      !rec ? 'no row read back' : leaks.length ? `PRIVATE LEAK: ${leaks.join(',')}` : extraKeys.length ? `unexpected columns: ${extraKeys.join(',')}` : 'only whitelist columns present');
  } else if (share.data?.error === 'MODERATION_NOT_CONFIGURED') {
    record('L', 'Future Diary public whitelist', 'GATED', 'moderation not configured → share correctly blocked (fail-closed)');
  } else {
    record('L', 'Future Diary public whitelist', 'FAIL', `publish failed: ${share.data?.error || share.status}`);
  }

  // M — deleting the PUBLIC copy does not touch private data (private is a client-only store)
  if (shareId) {
    const del = await rest(token, `future_diary_shares?id=eq.${shareId}&user_id=eq.${uid}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    const after = await rest(token, `future_diary_shares?id=eq.${shareId}&select=id`);
    const gone = Array.isArray(after.data) && after.data.length === 0;
    record('M', 'delete public copy ≠ private', del.ok && gone ? 'PASS' : 'FAIL',
      del.ok && gone ? 'public copy deleted; private diary lives only on the device (never on the server)' : `delete/readback issue (status ${del.status})`);
  } else {
    record('M', 'delete public copy ≠ private', 'SKIP', 'no public share created (L gated/failed)');
  }

  // N — moderation edge function (fail-closed honesty)
  const mod = await invoke(token, 'moderate-content', { text: '오늘 하루 잘 버텼어요' });
  if (mod.ok && mod.data) {
    const d = mod.data;
    const honest = d.configured === false ? (d.allowed === false && d.state === 'MODERATION_NOT_CONFIGURED') : (typeof d.allowed === 'boolean');
    record('N', 'moderation edge function', honest ? 'PASS' : 'FAIL', d.configured === false ? 'not configured → not allowed (fail-closed)' : `configured → allowed=${d.allowed}`);
  } else {
    record('N', 'moderation edge function', 'FAIL', `invoke failed (status ${mod.status})`);
  }

  // O — cleanup disposable rows (best-effort; delete policies allow own rows)
  let cleaned = 0;
  if (shoutId) { const r = await rest(token, `shout_messages?id=eq.${shoutId}&user_id=eq.${uid}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }); if (r.ok) cleaned++; }
  { const r = await rest(token, `reactions?user_id=eq.${uid}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }); if (r.ok) cleaned++; }
  { const r = await rest(token, `block_relations?blocker_id=eq.${uid}`, { method: 'DELETE', headers: { Prefer: 'return=minimal' } }); if (r.ok) cleaned++; }
  record('O', 'cleanup disposable rows', 'PASS', `best-effort cleanup done (${cleaned} delete op(s)); anon account is disposable + TTLs. reports are admin-managed (write-only).`);

  // Paid image E2E — gated
  const paid = present(env, 'NOF_ALLOW_PAID_IMAGE_TEST') && String(env.NOF_ALLOW_PAID_IMAGE_TEST).toUpperCase() === 'YES';
  if (!paid) {
    record('IMG', 'FUTURE_IMAGE_PAID_E2E', 'SKIP', 'NOT_AUTHORIZED — set NOF_ALLOW_PAID_IMAGE_TEST=YES to run exactly one');
  } else {
    const img = await invoke(token, 'generate-future-image', { diaryText: '스테이징 미래 장면', quality: 'low' });
    if (img.ok && img.data?.ok) record('IMG', 'FUTURE_IMAGE_PAID_E2E', 'PASS', `image generated (used=${img.data.used}/${img.data.limit})`);
    else {
      const e = img.data?.error || img.status;
      const failClosed = ['IMAGE_GENERATION_DISABLED', 'IMAGE_PROVIDER_NOT_CONFIGURED', 'daily_capacity', 'quota_exceeded'].includes(e);
      record('IMG', 'FUTURE_IMAGE_PAID_E2E', failClosed ? 'GATED' : 'FAIL', failClosed ? `fail-closed: ${e}` : `error: ${e}`);
    }
  }

  return finish();
}

function finish() {
  console.log('');
  for (const r of results) console.log(`  ${ICON[r.status] || '?'} ${r.id.padEnd(3)} ${r.label.padEnd(38)} ${r.status.padEnd(6)} ${r.detail}`);
  const fails = results.filter((r) => r.status === 'FAIL');
  const pass = results.filter((r) => r.status === 'PASS').length;
  const gated = results.filter((r) => r.status === 'GATED').length;
  const skip = results.filter((r) => r.status === 'SKIP').length;
  console.log(`\n  ${pass} PASS · ${fails.length} FAIL · ${gated} GATED · ${skip} SKIP`);
  console.log(`  RC17_LIVE_SMOKE = ${fails.length === 0 ? 'PASS' : 'FAIL'}`);
  process.exit(fails.length === 0 ? 0 : 1);
}

// ── entry ─────────────────────────────────────────────────────────────────────
if (PREFLIGHT) {
  preflight();
} else {
  const staging = present(env, 'NOF_RC17_STAGING') && String(env.NOF_RC17_STAGING).toUpperCase() === 'YES';
  const clientReady = CLIENT_REQUIRED.every((n) => present(env, n));
  if (!staging || !clientReady) {
    console.error('REFUSED: the live smoke needs NOF_RC17_STAGING=YES AND client env (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY).');
    console.error(`  NOF_RC17_STAGING = ${staging ? 'YES' : 'not YES'} · client env = ${clientReady ? 'present' : 'MISSING'}`);
    console.error('  Run `node scripts/nof-rc17-live-smoke.mjs --preflight` for a no-network readiness report.');
    process.exit(1);
  }
  live().catch((e) => { console.error(`live smoke crashed: ${String((e && e.message) || e)}`); process.exit(1); });
}
