#!/usr/bin/env node
/*
 * NoF source-level regression checks (run: `npm run check:nof`).
 *
 * Static guard rails for the commercial invariants that a build alone won't catch.
 * These are deliberately lightweight string/AST-free assertions over the source —
 * not a test runner — so they stay fast and dependency-free. Each check fails loud
 * with a file:line hint; a non-zero exit blocks the "safe to review" claim.
 *
 * Invariants enforced:
 *   1. Reward claim eligibility is consulted by BOTH App and the reward screen.
 *   2. isMilestoneClaimable gates on real streak progress + not-already-claimed.
 *   3. The daily check-in shard grant is once-per-calendar-day (no farm).
 *   4. No discipline delete affordance exists (only explanatory comments allowed).
 *   5. Scene mode keeps drag disabled until transparent item sprites are approved.
 *   6. No fake-motion copy / emoji furniture / blob-cat tokens leak into source.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8');
const rel = (abs) => abs.replace(ROOT + '/', '');

const results = [];
function check(name, fn) {
  try {
    fn();
    results.push({ name, pass: true });
  } catch (e) {
    results.push({ name, pass: false, detail: e.message });
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function walk(dir, exts) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p, exts));
    else if (exts.includes(extname(p))) out.push(p);
  }
  return out;
}

// A line is treated as a comment (and thus exempt from token bans) when it is a
// pure comment line. Inline trailing comments are intentionally NOT exempted —
// real code on a line still counts.
const isCommentLine = (line) => {
  const t = line.trim();
  return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*');
};

// 1 — both the App action and the screen must consult the single claim guard.
check('reward claim guard consulted by App and PetRewardScreen', () => {
  assert(read('src/App.jsx').includes('isMilestoneClaimable('), 'App.jsx never calls isMilestoneClaimable');
  assert(
    read('src/screens/PetRewardScreen.jsx').includes('isMilestoneClaimable('),
    'PetRewardScreen.jsx never calls isMilestoneClaimable',
  );
});

// 2 — the guard itself must gate on streak day AND not-already-claimed.
check('isMilestoneClaimable gates on streak day + not-already-claimed', () => {
  const r = read('src/constants/rewards.js');
  assert(/export function isMilestoneClaimable/.test(r), 'isMilestoneClaimable not exported from rewards.js');
  assert(r.includes('streakDays >= milestone.day'), 'claim guard missing streak-day check');
  assert(r.includes('claimedIds.includes(milestone.id)'), 'claim guard missing already-claimed check');
});

// 3 — the daily check-in shard grant must be gated to once per calendar day.
check('check-in reward is granted once per calendar day (no farm)', () => {
  const app = read('src/App.jsx');
  assert(app.includes('checkinRewardDay'), 'no checkinRewardDay guard state in App.jsx');
  assert(/function dayKey\(/.test(app), 'no dayKey() calendar-day helper in App.jsx');
  const m = app.match(/const completeCheckin = \(checkin = \{\}\) => \{[\s\S]*?setScreenId\('reward'\);\s*\};/);
  assert(m, 'completeCheckin function not found');
  const body = m[0];
  assert(/const rewardAlreadyGivenToday = checkinRewardDay === todayKey;/.test(body), 'missing once-per-day gate computation');
  assert(
    /if \(!rewardAlreadyGivenToday\) \{\s*earn\(EARN\.checkin/.test(body),
    "check-in earn() is not gated behind the once-per-day guard",
  );
  assert(/setCheckinRewardDay\(todayKey\);/.test(body), 'guard never records the grant day');
});

// 4 — no discipline delete path (button/handler/sheet); only comments may mention it.
check('no discipline delete affordance (only comments may mention it)', () => {
  const files = [
    ...walk(join(ROOT, 'src/screens'), ['.jsx', '.js']),
    ...walk(join(ROOT, 'src/components'), ['.jsx', '.js']),
    ...walk(join(ROOT, 'src/constants'), ['.jsx', '.js']),
    join(ROOT, 'src/App.jsx'),
  ];
  const tokens = ['onDeleteRule', 'handleDelete', 'removeRule', '삭제하기', '규율 삭제 확인'];
  const offenders = [];
  for (const f of files) {
    readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      if (tokens.some((t) => line.includes(t)) && !isCommentLine(line)) {
        offenders.push(`${rel(f)}:${i + 1}`);
      }
    });
  }
  assert(offenders.length === 0, `delete affordance in code: ${offenders.join(', ')}`);
});

// 5 — scene mode must keep drag disabled, and no item sprite may be flagged ready.
check('scene mode keeps drag disabled until item sprites are ready', () => {
  const screen = read('src/screens/PetRewardScreen.jsx');
  assert(
    /if \(sceneMode \|\| !isItemSpriteReady\(item\.assetId\)\) return;/.test(screen),
    'startInventoryDrag guard (sceneMode || !isItemSpriteReady) missing',
  );
  assert(
    screen.includes('!sceneMode && isItemSpriteReady(it.assetId)'),
    'inventory placeable gate (!sceneMode && isItemSpriteReady) missing',
  );
  assert(
    !/spriteReady:\s*true/.test(read('src/constants/petAssets.js')),
    'a petAssets entry sets spriteReady:true — drag would activate without approved transparent sprites',
  );
});

// 6 — forbidden fake-motion / emoji-furniture / blob-cat tokens absent from source.
check('no fake-motion / emoji-furniture / blob tokens in source', () => {
  const tokens = [
    '기지개', '꼬리', '먹었', '먹는', '움직였', 'eating',
    'pet-cat-svg', 'room-token-glow',
    '🐱', '🪑', '🧺', '🛏️', '🪔', '💡', '🛋️', '🟫', '🐟',
  ];
  const offenders = [];
  for (const f of walk(join(ROOT, 'src'), ['.js', '.jsx'])) {
    readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      const loc = `${rel(f)}:${i + 1}`;
      for (const t of tokens) if (line.includes(t)) offenders.push(`${loc} (${t})`);
      // 'stretch' is a legitimate flex value; only ban it outside flex/align usage.
      if (line.includes('stretch') && !/align|flex|justify/.test(line)) offenders.push(`${loc} (stretch)`);
      // sprite-readiness must stay false everywhere it is declared.
      if (/spriteReady:\s*true/.test(line)) offenders.push(`${loc} (spriteReady:true)`);
    });
  }
  assert(offenders.length === 0, `forbidden token(s): ${offenders.join('; ')}`);
});

let failed = 0;
for (const r of results) {
  if (r.pass) {
    console.log(`[PASS] ${r.name}`);
  } else {
    failed += 1;
    console.log(`[FAIL] ${r.name}\n        ${r.detail}`);
  }
}
console.log(`\n${results.length - failed}/${results.length} checks passed`);
if (failed > 0) {
  console.error(`${failed} regression check(s) FAILED`);
  process.exit(1);
}
console.log('All NoF source-level regression checks passed.');
