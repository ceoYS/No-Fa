#!/usr/bin/env node
/*
 * nof-rc17-provisioning-doctor.mjs — one command that says exactly what is still missing before the
 * real services connect. When the Founder gets a Supabase slot, run this to see, at a glance, which
 * env values are present and what still needs a live check.
 *
 *   node scripts/nof-rc17-provisioning-doctor.mjs
 *
 * Guarantees: makes NO network call, makes NO paid call, and prints NO secret value (names + a
 * PRESENT/MISSING/UNSET status only). With no .env / .env.local it safely reports MISSING — never throws.
 * Live-only facts (auth works, migrations applied, functions deployed) are reported as
 * LIVE_CHECK_REQUIRED and verified separately by scripts/nof-rc17-live-smoke.mjs.
 */
import {
  loadEnv, present, CLIENT_REQUIRED, SERVER_SECRETS, IMAGE_GUARD, EDGE_FUNCTIONS,
  onDiskInventory, expectedEndpoints,
} from './lib/rc17-env.mjs';

const env = loadEnv();
const yn = (b) => (b ? 'PRESENT' : 'MISSING');
const line = (name, status, note = '') => console.log(`  ${name.padEnd(30)} = ${status}${note ? `   ${note}` : ''}`);

console.log('NoF RC-17 provisioning doctor — what is still missing before live services connect.');
console.log('(secret-safe: names only, never values · no network · no paid calls)\n');

// ── SUMMARY: the exact pre-provisioning field contract (secret-safe — states/names, never values) ──
// The two server-secret rows are ALWAYS SERVER_SIDE_UNVERIFIED here on purpose: a local tool can never
// confirm a DEPLOYED Supabase secret; only an edge function's behaviour (the live smoke) can. Live-only
// facts are LIVE_CHECK_REQUIRED and proven by nof-rc17-live-smoke.mjs after provisioning.
const paidAuthorized = present(env, 'NOF_ALLOW_PAID_IMAGE_TEST') && String(env.NOF_ALLOW_PAID_IMAGE_TEST).toUpperCase() === 'YES';
console.log('SUMMARY (pre-provisioning contract)');
line('SUPABASE_URL', yn(present(env, 'VITE_SUPABASE_URL')));
line('SUPABASE_ANON_KEY', yn(present(env, 'VITE_SUPABASE_ANON_KEY')));
line('STAGING_FLAG', yn(present(env, 'NOF_RC17_STAGING')));
line('PAID_IMAGE_TEST', paidAuthorized ? 'AUTHORIZED' : 'NOT_AUTHORIZED');
line('ANONYMOUS_AUTH', 'LIVE_CHECK_REQUIRED');
line('MIGRATIONS', 'LIVE_CHECK_REQUIRED');
line('EDGE_FUNCTIONS', 'LIVE_CHECK_REQUIRED');
line('OPENAI_SERVER_SECRET', 'SERVER_SIDE_UNVERIFIED');
line('CLEANUP_SECRET', 'SERVER_SIDE_UNVERIFIED');
console.log('');

console.log('CLIENT (Vite, public-safe — required for ANY live check)');
for (const n of CLIENT_REQUIRED) line(n, yn(present(env, n)));

console.log('\nSERVER SECRETS (live home = `supabase secrets set` / auto-injection; never in the bundle)');
for (const n of SERVER_SECRETS) {
  line(n, present(env, n) ? 'SET_LOCALLY' : 'SERVER_SIDE_UNVERIFIED',
    present(env, n) ? '(local .env copy for `functions serve`; deployed value still unverified)' : '(set it as a Supabase secret)');
}

console.log('\nIMAGE COST GUARD (server-only; UNSET ⇒ fail closed ⇒ generation OFF)');
for (const n of IMAGE_GUARD) line(n, present(env, n) ? 'SET' : 'UNSET (fail closed)');

const inv = onDiskInventory();
console.log('\nON DISK (apply/deploy these to the live project)');
line('MIGRATIONS_ON_DISK', `${inv.migrations.length} file(s)`, '→ `supabase db push`');
line('EDGE_FUNCTIONS_ON_DISK', `${inv.functions.length} function(s)`,
  `→ \`supabase functions deploy ${EDGE_FUNCTIONS.join(' ')}\``);

console.log('\nLIVE (verified by nof-rc17-live-smoke.mjs AFTER provisioning — not checked here)');
line('ANONYMOUS_AUTH', 'LIVE_CHECK_REQUIRED');
line('MIGRATIONS_APPLIED', 'LIVE_CHECK_REQUIRED');
line('EDGE_FUNCTIONS_DEPLOYED', 'LIVE_CHECK_REQUIRED');
line('MODERATION_CONFIGURED', 'LIVE_CHECK_REQUIRED', '(OPENAI_API_KEY set as a server secret)');

console.log('\nPAID');
line('PAID_IMAGE_TEST', paidAuthorized ? 'AUTHORIZED' : 'NOT_AUTHORIZED',
  paidAuthorized ? '(one paid generation permitted)' : '(set NOF_ALLOW_PAID_IMAGE_TEST=YES to authorize exactly one)');

// Readiness for the live smoke: needs the client values + the staging opt-in. No value is printed.
const clientReady = CLIENT_REQUIRED.every((n) => present(env, n));
const staging = present(env, 'NOF_RC17_STAGING') && String(env.NOF_RC17_STAGING).toUpperCase() === 'YES';
console.log('\nNEXT');
if (!clientReady) {
  console.log('  Client values missing → set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in .env, then re-run.');
} else if (!staging) {
  console.log('  Client values present. Set NOF_RC17_STAGING=YES (staging project only), then run:');
  console.log('    NOF_RC17_STAGING=YES node scripts/nof-rc17-live-smoke.mjs');
} else {
  console.log('  Ready. Run the live smoke (no paid image unless you also set NOF_ALLOW_PAID_IMAGE_TEST=YES):');
  console.log('    node scripts/nof-rc17-live-smoke.mjs');
}
const ep = expectedEndpoints(present(env, 'VITE_SUPABASE_URL') ? env.VITE_SUPABASE_URL : null);
console.log(`\n  (endpoints a live check will use: ${ep.anonSignup} · ${ep.rest} · ${ep.functions})`);

// A report, not a gate: always exit 0 so it is safe to run anywhere, anytime.
process.exit(0);
