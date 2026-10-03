/*
 * rc17-env.mjs — shared, SECRET-SAFE env loading + the provisioning contract for the RC-17 live tools
 * (nof-rc17-provisioning-doctor.mjs, nof-rc17-live-smoke.mjs). Pure + fs only: no deps, no network.
 *
 * It NEVER exposes a value to a printed report. Callers only ever learn PRESENT / MISSING per NAME.
 * Values are read from .env.local then .env (repo root, both gitignored) then process.env — whichever
 * source provides a name counts. Reading a missing file is safe (reported MISSING, never a throw).
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, '..', '..');

// Client (Vite) values — public-safe, required for ANY live check to reach the project.
export const CLIENT_REQUIRED = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
// Server secrets — their real home is `supabase secrets set` (or Supabase auto-injection), NOT the
// client bundle. A local .env may hold them only for `supabase functions serve`. We can NEVER verify
// the deployed value from here — an edge function's behaviour is the only live evidence.
export const SERVER_SECRETS = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY', 'CLEANUP_SECRET'];
// Image cost-guard knobs (server-only; every one FAILS CLOSED when unset).
export const IMAGE_GUARD = [
  'NOF_IMAGE_GENERATION_ENABLED',
  'NOF_IMAGE_GLOBAL_DAILY_LIMIT',
  'NOF_IMAGE_USER_MONTHLY_FREE_LIMIT',
  'NOF_IMAGE_USER_MONTHLY_PRO_LIMIT',
];

// The community tables a live check expects to exist (mirrors the migrations + supabaseClient.js).
export const REQUIRED_TABLES = [
  'anonymous_profiles', 'weekly_leagues', 'league_memberships', 'league_contributions',
  'shout_messages', 'reactions', 'future_diary_shares', 'reports', 'block_relations', 'image_usage',
];
export const EDGE_FUNCTIONS = [
  'moderate-content', 'publish-shout', 'publish-future-diary-share', 'generate-future-image', 'plaza-cleanup',
];

// Parse a .env file body into { KEY: value }. Ignores blanks/comments; strips one layer of quotes. Pure.
export function parseEnv(text) {
  const out = {};
  for (const raw of String(text || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    out[key] = val;
  }
  return out;
}

// Merge .env then .env.local (file) then process.env; later sources override earlier. A name with a
// non-empty value is "set". The returned object is for present()/value lookups by the tools — never for
// printing. Missing files are skipped silently (safe MISSING, never a throw).
export function loadEnv() {
  const merged = {};
  for (const f of ['.env', '.env.local']) {
    const p = join(ROOT, f);
    if (existsSync(p)) {
      try { Object.assign(merged, parseEnv(readFileSync(p, 'utf8'))); } catch { /* unreadable → skip */ }
    }
  }
  Object.assign(merged, process.env);
  return merged;
}

export function present(env, name) {
  const v = env[name];
  return typeof v === 'string' ? v.trim() !== '' : v != null;
}
export function missing(env, names) {
  return names.filter((n) => !present(env, n));
}

// Count on-disk migrations / edge functions (inventory, not live state). Safe if the dirs are absent.
export function onDiskInventory() {
  const migDir = join(ROOT, 'supabase', 'migrations');
  const fnDir = join(ROOT, 'supabase', 'functions');
  const migrations = existsSync(migDir) ? readdirSync(migDir).filter((f) => f.endsWith('.sql')).sort() : [];
  const functions = existsSync(fnDir)
    ? readdirSync(fnDir).filter((d) => !d.startsWith('_') && statSync(join(fnDir, d)).isDirectory()).sort()
    : [];
  return { migrations, functions };
}

// The endpoint shapes a live check would exercise (so --preflight can report them without a call). No
// secrets — the base is the configured URL when present, else a placeholder.
export function expectedEndpoints(baseUrl) {
  const b = (baseUrl || '<VITE_SUPABASE_URL>').replace(/\/+$/, '');
  return {
    anonSignup: `${b}/auth/v1/signup`,
    tokenRefresh: `${b}/auth/v1/token?grant_type=refresh_token`,
    rest: `${b}/rest/v1/<table>`,
    rpc: `${b}/rest/v1/rpc/<fn>`,
    functions: `${b}/functions/v1/<name>`,
    realtime: `${b.replace(/^http/, 'ws')}/realtime/v1/websocket`,
  };
}

// ── runnable self-check (node scripts/lib/rc17-env.mjs) ──
if (typeof process !== 'undefined' && Array.isArray(process.argv) && import.meta.url === `file://${process.argv[1]}`) {
  const assert = (c, m) => { if (!c) throw new Error(m); };
  const e = parseEnv('# c\nA=1\nB="two"\nC=\n  D = spaced \nBAD_NO_EQ\n');
  assert(e.A === '1' && e.B === 'two' && e.C === '' && e.D === 'spaced', 'parseEnv basic');
  assert(!('BAD_NO_EQ' in e), 'parseEnv drops a line with no =');
  assert(present({ X: 'v' }, 'X') && !present({ X: '  ' }, 'X') && !present({}, 'Y'), 'present: non-empty only');
  assert(missing({ X: 'v' }, ['X', 'Y']).join() === 'Y', 'missing lists only unset names');
  const ep = expectedEndpoints('https://ref.supabase.co');
  assert(ep.anonSignup.endsWith('/auth/v1/signup') && ep.realtime.startsWith('wss://'), 'endpoint shapes');
  const inv = onDiskInventory();
  assert(Array.isArray(inv.migrations) && Array.isArray(inv.functions), 'inventory arrays');
  assert(inv.functions.includes('generate-future-image'), 'inventory sees edge functions on disk');
  assert(REQUIRED_TABLES.length === 10 && EDGE_FUNCTIONS.length === 5, 'contract counts');
  console.log('rc17-env.mjs self-check OK');
}
