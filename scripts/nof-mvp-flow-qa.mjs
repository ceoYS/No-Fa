#!/usr/bin/env node
// NoF MVP flow browser QA — drives the real recovery loop end-to-end over CDP.
//
// This is the repeatable, repo-owned form of the one-off freeze-audit QA that cleared
// 24/24. It actually clicks through the MVP journey in a real Chrome and asserts on
// rendered DOM text — not source strings — so a regression in the user's core loop
// fails this command loudly. It adds NO npm dependency (Node 22 global WebSocket +
// raw CDP via ./nof-cdp-client.mjs).
//
// Honesty contract:
//   - It clicks where a user clicks; it does not fake coverage.
//   - If it cannot drive a browser it FAILS with exact launch instructions (never a
//     green "passed" it did not earn).
//   - All artifacts (screenshots, throwaway browser profile) live in NOF_QA_OUT,
//     outside the repo, so nothing QA-generated is ever committed.
//
// Two harness mistakes the freeze audit caught — deliberately avoided here:
//   1. Never assert on the first-run card's brand-prefixed phrase by its
//      latin-boundary innerText: a .card-label text-transform:uppercase changes the
//      brand casing, so a mixed-case substring never matches the rendered text. We
//      assert on the hangul-stable phrase "이렇게 써요" instead.
//   2. Never confirm the reset by a broad substring click on "기록 지우기": that
//      substring also matches the trigger "이 기기의 기록 지우기" behind the backdrop.
//      We scope the confirm click to the open `.sheet`.
//
// Config (env):
//   NOF_CDP_URL     CDP endpoint               (default http://localhost:9222)
//   NOF_APP_URL     app URL to drive           (default http://localhost:4173/)
//   NOF_QA_OUT      screenshot/profile dir     (default /tmp/nof-mvp-qa)
//   NOF_CHROME      browser binary to launch   (default: auto-discover)
//   NOF_CHROME_LIBS prepend to LD_LIBRARY_PATH (for a browser missing system libs)
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CDP, CDP_URL, QA_OUT, cdpReachable } from './nof-cdp-client.mjs';

const APP_URL = process.env.NOF_APP_URL || 'http://localhost:4173/';

// The 35 MVP behaviors this harness drives and asserts. Every check() references one
// of these labels, so coverage is machine-checkable (the regression guard counts them).
const BEHAVIORS = {
  B01: 'fresh app mounts',
  B02: 'home shows the discipline counter list',
  B03: 'home shows the 잠깐 멈춤 + 오늘 기록 actions',
  B04: 'protection empty state visible',
  B05: 'save protection plan',
  B06: 'hard reload',
  B07: 'protection plan persists locally',
  B08: 'urge shows saved alternative action',
  B09: 'urge check-in continuation works',
  B10: 'complete writing-first check-in (회고/약속/다짐)',
  B11: 'reward landing appears',
  B12: 'reward landing save confirmation appears only after actual save',
  B13: 'reward to recent records opens records',
  B14: 'records show today writing (회고/약속/다짐)',
  B15: 'saved record reads back on the 오늘 기록 screen',
  B16: 'protection clear action clears plan',
  B17: 'urge returns to no-plan empty state',
  B18: 'reset local data through confirm sheet',
  B19: 'home returns to first-run/empty state',
  B20: 'no user-facing 금욕',
  B21: 'no fake AI/medical/cloud/blocker/edit/replay/growth claim',
  B22: '390x844 no critical horizontal overflow',
  B23: 'route home works',
  B24: 'discipline counter ticks live to the second',
  B25: 'cat room 쓰다듬기 interaction changes real state',
  B26: 'bottom nav fully visible at 390x844 (all 5 labels, none clipped)',
  B27: 'monthly calendar shows 년/월, weekday header, today, and navigates months',
  B28: 'room item can be placed and persists after reload',
  B29: 'placed room item can be dragged to a new position',
  B30: 'snack hand-off visibly animates and updates real fed state',
  B31: 'first-run is honest: 예시 samples labelled, one-tap real start, no unearned 최장',
  B32: 'records are useful: saved day distinct + real count, detail reads writing + useful CTA, recordless day honest',
  B33: 'protection is clear: honest non-blocking scope, real 잠깐 멈춤/오늘 기록 actions, real NoF Chrome-extension path (no toy experiment copy)',
  B34: 'chrome extension connection is real + honest: reachable connect screen, browser-scoped scope, local 확장 ID + 연결 확인 mechanism, no fake 연결됨 without a real extension reply, 테스트 신호 보내기 present, no 체크인/금욕/fake claim',
  B35: 'saved-signal / test-value → real browser block-rule send is honest: send field + saved-signal count present, no fake install without a connected extension, instructs connect-first, no 체크인/금욕/AI/auto-block/mobile claim',
};

// Test data planted by the flow and read back to prove persistence (not source scans).
// RC-1 check-in is writing-first: NOTE is 오늘 회고, plus 나와의 약속 / 오늘의 다짐.
const NOTE = '오늘은 흔들렸지만 버텼다 QA체크';
const PROMISE = '내일은 밤 11시에 휴대폰 내려놓기 QA약속';
const RESOLVE = '오늘 하루도 나를 믿어보기 QA다짐';
const ALT = '물 한 잔 마시고 거실로 나가기 QA';

// B20 user-facing vocabulary that must never reach the screen.
const FORBIDDEN_VOCAB = ['금욕'];
// B21 fake AI / medical / cloud / blocker / edit / replay / growth-unlock claims.
const FORBIDDEN_CLAIMS = [
  'AI 분석', 'AI 추천', '회복 점수', '치료', '진단', '처방',
  '실패 복구', '다시 재생', '기록 수정', '자동 차단', '클라우드 동기화',
  '잠금 해제', '해금', '프리미엄',
];

const log = (s) => console.log(`[qa] ${s}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
function check(id, ok, extra = '') {
  const label = BEHAVIORS[id] || id;
  results.push({ id, label, ok: !!ok, extra });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id} — ${label}${extra ? ' :: ' + extra : ''}`);
}

const overflowSeen = [];
async function scanOverflow(c, screen) {
  const o = await c.overflow();
  if (o.bad && o.bad.length) overflowSeen.push({ screen, ...o });
  return o;
}

// ---------------------------------------------------------------------------
// Process lifecycle: any server / browser we start, we stop. detached:true makes
// each child its own group leader so we can kill its whole subtree (vite's node
// children, chrome's gpu/crashpad helpers) and never leak a process.
// ---------------------------------------------------------------------------
const spawned = [];
let cleaned = false;
function cleanup() {
  if (cleaned) return;
  cleaned = true;
  for (const { child } of spawned) {
    try { if (child.pid) process.kill(-child.pid, 'SIGTERM'); } catch { /* gone */ }
    try { child.kill('SIGKILL'); } catch { /* gone */ }
  }
}
process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(130); });
process.on('SIGTERM', () => { cleanup(); process.exit(143); });

function repoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
}

async function httpReachable(url, timeoutMs = 1500) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    return r.status > 0;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

async function waitUntil(fn, timeoutMs, intervalMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await fn()) return true;
    await sleep(intervalMs);
  }
  return false;
}

// Serve the BUILT app. Reuse a server already answering at APP_URL; otherwise build
// (if dist is missing) and start `vite preview` on the URL's host/port, tracked for
// cleanup. Option A from the sprint, done with no leaked process.
async function ensureServer(root) {
  if (await httpReachable(APP_URL)) {
    log(`reusing app server at ${APP_URL}`);
    return;
  }
  if (!fs.existsSync(path.join(root, 'dist', 'index.html'))) {
    log('no dist/ — running npm run build first');
    const b = spawnSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' });
    if (b.status !== 0) throw new Error('npm run build failed; cannot serve preview');
  }
  const u = new URL(APP_URL);
  const host = u.hostname || '127.0.0.1';
  const port = u.port || '4173';
  log(`starting vite preview on ${host}:${port}`);
  const child = spawn('npm', ['run', 'preview', '--', '--host', host, '--port', port, '--strictPort'], {
    cwd: root,
    detached: true,
    stdio: 'ignore',
  });
  spawned.push({ name: 'preview', child });
  const up = await waitUntil(() => httpReachable(APP_URL), 25000, 400);
  if (!up) throw new Error(`vite preview did not come up at ${APP_URL}`);
  log(`app server ready at ${APP_URL}`);
}

function isExecutable(p) {
  try { fs.accessSync(p, fs.constants.X_OK); return true; } catch { return false; }
}
function resolveBin(candidate) {
  if (!candidate) return null;
  if (candidate.includes('/')) return fs.existsSync(candidate) ? candidate : null;
  for (const dir of (process.env.PATH || '').split(':')) {
    const p = path.join(dir, candidate);
    if (isExecutable(p)) return p;
  }
  return null;
}
// Playwright-managed chromium builds, newest first (used by the freeze audit; no repo
// dependency is added — we only reuse a binary if it happens to be on disk).
function playwrightChromes() {
  const base = path.join(os.homedir(), '.cache', 'ms-playwright');
  const out = [];
  try {
    for (const e of fs.readdirSync(base)) {
      if (/^chromium-\d+$/.test(e)) out.push(path.join(base, e, 'chrome-linux64', 'chrome'));
    }
  } catch { /* no cache */ }
  return out.sort().reverse();
}
function findBrowser() {
  const candidates = [];
  if (process.env.NOF_CHROME) candidates.push(process.env.NOF_CHROME);
  candidates.push('google-chrome-stable', 'google-chrome', 'chromium', 'chromium-browser');
  candidates.push(...playwrightChromes());
  candidates.push('/mnt/c/Program Files/Google/Chrome/Application/chrome.exe');
  candidates.push('/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe');
  for (const c of candidates) {
    const r = resolveBin(c);
    if (r) return r;
  }
  return null;
}

function printChromeInstructions(cdpBase) {
  const port = (() => { try { return new URL(cdpBase).port || '9222'; } catch { return '9222'; } })();
  const profile = path.join(QA_OUT, 'chrome-profile');
  console.error('\n──────────────────────────────────────────────────────────────');
  console.error(`NoF QA: no Chrome DevTools endpoint at ${cdpBase} and no launchable browser found.`);
  console.error('Start Chrome/Chromium with remote debugging, then re-run `npm run qa:mvp`:\n');
  console.error('  chrome \\');
  console.error(`    --remote-debugging-port=${port} \\`);
  console.error('    --headless=new \\');
  console.error('    --no-first-run \\');
  console.error('    --disable-gpu \\');
  console.error(`    --user-data-dir=${profile}\n`);
  console.error('Or point the harness at an existing endpoint / specific binary:');
  console.error(`  NOF_CDP_URL=${cdpBase}      (CDP endpoint to connect to)`);
  console.error('  NOF_CHROME=/path/to/chrome           (auto-launch this binary)');
  console.error('  NOF_CHROME_LIBS=/path/to/libs        (prepend to LD_LIBRARY_PATH if libs are missing)');
  console.error('──────────────────────────────────────────────────────────────\n');
}

// Use a CDP endpoint already listening; otherwise auto-launch a discovered browser
// headless. If none can be launched, print exact instructions and exit non-zero —
// the harness must never claim a pass it could not drive.
async function ensureBrowser() {
  if (await cdpReachable(CDP_URL)) {
    log(`reusing CDP endpoint at ${CDP_URL}`);
    return;
  }
  const bin = findBrowser();
  if (!bin) {
    printChromeInstructions(CDP_URL);
    process.exit(2);
  }
  const port = (() => { try { return new URL(CDP_URL).port || '9222'; } catch { return '9222'; } })();
  const profile = path.join(QA_OUT, 'chrome-profile');
  fs.mkdirSync(profile, { recursive: true });
  const args = [
    `--remote-debugging-port=${port}`,
    '--remote-debugging-address=127.0.0.1',
    '--headless=new',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    `--user-data-dir=${profile}`,
    'about:blank',
  ];
  const env = { ...process.env };
  if (process.env.NOF_CHROME_LIBS) {
    env.LD_LIBRARY_PATH = process.env.NOF_CHROME_LIBS + (env.LD_LIBRARY_PATH ? ':' + env.LD_LIBRARY_PATH : '');
  }
  log(`launching browser: ${bin}`);
  const child = spawn(bin, args, { env, detached: true, stdio: 'ignore' });
  spawned.push({ name: 'chrome', child });
  const up = await waitUntil(() => cdpReachable(CDP_URL), 20000, 400);
  if (!up) {
    printChromeInstructions(CDP_URL);
    throw new Error(`browser launched but CDP never became reachable at ${CDP_URL}`);
  }
  log(`CDP endpoint ready at ${CDP_URL}`);
}

// ---------------------------------------------------------------------------
// The MVP flow. Each numbered step maps to one or more B## behaviors.
// ---------------------------------------------------------------------------
async function runFlow(c) {
  // 1–3 · Fresh open → first-run guidance → daily action hub.
  await c.goto(APP_URL);
  await c.clearLS();
  await c.goto(APP_URL);
  check('B01', await c.has('절제 시간'));
  // RC-2A: Home is a status surface — the counter list + the two actions, no dashboard hub.
  check('B02', await c.has('절제 카운터'));
  check('B03', (await c.has('오늘 기록하기')) && (await c.has('못 참을 것 같아요')));
  await scanOverflow(c, 'home-fresh');
  await c.shot('home_fresh');

  // 3.5 · RC-4 first-run honesty. A CLEARED install (clearLS above) must not present unearned
  //       abstinence progress as the user's own. On this fresh mount the seed counters are
  //       SAMPLES: the 예시 label is visible, the hero shows NO earned-looking 최장 record, and a
  //       one-tap honest start (내 기록으로 시작) is offered. The first screen carries no 금욕 / 체크인.
  //       Asserted on the rendered DOM of the very first paint, before any data is planted.
  const sampleLabeled = await c.has('예시');
  const honestStartPath = await c.has('내 기록으로 시작');
  const noEarnedLongest = !(await c.has('최장')); // samples hide the 최장 record on first run
  const noForbiddenFirstRun = !(await c.has('금욕')) && !(await c.has('체크인'));
  const firstRunHonest = sampleLabeled && honestStartPath && noEarnedLongest && noForbiddenFirstRun;
  check('B31', firstRunHonest,
    firstRunHonest ? '' : `sample:${sampleLabeled} start:${honestStartPath} noLongest:${noEarnedLongest} clean:${noForbiddenFirstRun}`);
  await c.shot('home_first_run_honest');

  // 4 · Home → 잠깐 멈춤 (bottom-nav center) → urge empty-protection honesty.
  await c.clickExact('잠깐 멈춤');
  const onUrge = await c.has('지금 충동을 멈춰요');
  check('B04', onUrge && (await c.has('아직 보호 설정이 없어요')) && (await c.has('보호 설정 적기')));
  await scanOverflow(c, 'urge-empty-protection');
  await c.shot('urge_empty_protection');

  // 5 · → 보호 설정 → save plan.
  await c.click('보호 설정 적기');
  const onProtect = await c.has('흔들리는 순간을 미리 적어둬요');
  await c.type('#protect-time', '밤 11시 이후');
  await c.type('#protect-situation', '잠자리에서 휴대폰을 들 때');
  await c.type('#protect-alt', ALT);
  await c.click('보호 설정 저장');
  check('B05', onProtect && (await c.has('저장된 보호 설정')) && (await c.has(ALT)));
  await scanOverflow(c, 'protection-saved');
  await c.shot('protection_saved');

  // 6–7 · Hard reload keeps the app; plan persists locally across the reload.
  await c.reload();
  check('B06', await c.waitForText('절제 시간', 6000)); // wait for re-hydration, not a fixed sleep
  await c.click('보호 설정 적기');
  check('B07', (await c.has('저장된 보호 설정')) && (await c.has(ALT)));
  await c.shot('protection_persisted');

  // 8 · Urge surfaces the saved alternative action.
  await c.click('잠깐 멈춤에서 확인하기');
  check('B08', (await c.has(ALT)) && (await c.has('내가 정해둔 대체 행동')));
  await scanOverflow(c, 'urge-with-plan');
  await c.shot('urge_with_plan');

  // 9 · Urge → check-in continuation (start the 5-min hold so the CTA appears).
  const held = await c.click('5분 같이 버티기');
  const toCheckin = await c.click('오늘 기록에 한 줄 남기기');
  check('B09', held && toCheckin && (await c.has('1분 기록')));

  // 10 · Complete the WRITING-first check-in (RC-1): the user's own 회고 (the gate), plus
  //      나와의 약속 / 오늘의 다짐. Verify each writing input actually registered (a silently
  //      failed selector must not pass as "done") and that typing the 회고 enables 다음.
  const retroTyped = await c.type('textarea[aria-label="오늘 회고"]', NOTE);
  const promiseTyped = await c.type('textarea[aria-label="나와의 약속"]', PROMISE);
  const resolveTyped = await c.type('textarea[aria-label="오늘의 다짐"]', RESOLVE);
  const nextEnabled = await c.click('다음 · 오늘의 규율 점검'); // writing-gated; only clicks once step1Ready
  const finished = await c.click('오늘 기록 마치기');
  check('B10', retroTyped && promiseTyped && resolveTyped && nextEnabled && finished,
    retroTyped && promiseTyped && resolveTyped && nextEnabled && finished
      ? '' : `retro:${retroTyped} promise:${promiseTyped} resolve:${resolveTyped} next:${nextEnabled} finish:${finished}`);
  await sleep(400);

  // 11–12 · Reward landing appears; its save confirmation is gated on the real save.
  const onReward = await c.waitForText('고양이 방', 4000);
  check('B11', onReward);
  check('B12', onReward && (await c.has('오늘 기록이 저장됐어요')));
  await scanOverflow(c, 'reward-confirm');
  await c.shot('reward_confirm');

  // 13–14 · Reward → 기록 (monthly calendar); open TODAY's cell in the month grid and the
  //         day detail reads the typed writing (회고 + 약속 + 다짐) verbatim.
  const toRecords = await c.click('최근 기록 보기');
  check('B13', toRecords && (await c.has('하루하루 남긴 기록이에요')));
  const cellClicked = await c.clickSelector('.month-cell[data-today="true"]');
  await sleep(500);
  const recHasNote = await c.has(NOTE);
  const recHasPromise = await c.has(PROMISE);
  const recHasResolve = await c.has(RESOLVE);
  check('B14', cellClicked && recHasNote && recHasPromise && recHasResolve,
    cellClicked && recHasNote && recHasPromise && recHasResolve
      ? '' : `today writing not fully read back (cell:${cellClicked} note:${recHasNote} promise:${recHasPromise} resolve:${recHasResolve})`);
  await c.shot('records_today_note');

  // 14.5 · RC-5 records usefulness. With today's REAL record saved (B14), the records area is
  //        genuinely useful AND still honest: the month calendar shows an honest recognition
  //        (a real count of recorded days), the saved-record day is visually distinct, the day
  //        detail reads the saved writing + offers useful next actions through EXISTING routes,
  //        a recordless day still reads 기록 전, and NO fake insight / 금욕 / 체크인 appears.
  //        Asserted on rendered DOM with a real record present (not a source scan).
  await c.click('닫기'); await sleep(250); // close today's detail opened in B14
  const recogShown = (await c.has('이 달 기록한 날')) && (await c.has('지금까지 기록한 날'));
  const distinctDay =
    (await c.eval(`document.querySelectorAll('.month-cell[data-has-record="true"]').length`)) >= 1;
  const reopened = await c.clickSelector('.month-cell[data-today="true"]'); await sleep(350);
  const writingBack = await c.has(NOTE);
  const usefulCta = (await c.has('오늘 기록으로 이어가기')) && (await c.has('보호 계획'));
  const noFakeInsight =
    !(await c.has('패턴')) && !(await c.has('연속')) && !(await c.has('성공')) && !(await c.has('분석'));
  const noForbiddenRecords = !(await c.has('금욕')) && !(await c.has('체크인'));
  await c.click('닫기'); await sleep(250);
  // A recordless real day (exclude leading blanks, today, and the saved day) stays honest.
  const recordlessOpened = await c.clickSelector(
    '.month-cell:not(.month-cell-empty):not([data-today="true"]):not([data-has-record="true"])',
  );
  await sleep(350);
  const recordlessHonest = (await c.has('기록 전')) || (await c.has('남긴 기록이 없어요'));
  await c.click('닫기'); await sleep(200);
  const recordsUseful =
    recogShown && distinctDay && reopened && writingBack && usefulCta &&
    noFakeInsight && noForbiddenRecords && recordlessOpened && recordlessHonest;
  check('B32', recordsUseful,
    recordsUseful ? '' : `recog:${recogShown} distinct:${distinctDay} reopen:${reopened} writing:${writingBack} cta:${usefulCta} noInsight:${noFakeInsight} clean:${noForbiddenRecords} recordless:${recordlessOpened}/${recordlessHonest}`);
  await c.shot('records_usefulness');

  // 15 · RC-2A: Home no longer carries a saved-summary card (it is a status surface). The
  //      saved record reads back on the 오늘 기록 screen itself — open it via the bottom nav
  //      and confirm the saved-state summary + the typed 회고 note.
  await c.clickExact('오늘 기록');
  check('B15', (await c.has('오늘 기록이 저장됐어요')) && (await c.has(NOTE)));
  await scanOverflow(c, 'checkin-saved');
  await c.shot('checkin_saved');
  await c.clickExact('홈');

  // 16 · Protection clear empties the plan honestly.
  await c.click('보호 설정 적기');
  await c.click('계획 비우기');
  check(
    'B16',
    (await c.has('아직 보호 설정이 없어요')) && (await c.has('보호 설정을 비웠어요')) && !(await c.has(ALT)),
  );
  await c.shot('protection_cleared');

  // 17 · Urge returns to the no-plan empty state after the clear. The urge-unique title
  //      '지금 충동을 멈춰요' is asserted too: '아직 보호 설정이 없어요' ALSO renders on the
  //      cleared ProtectionScreen, so without it a failed nav (staying on Protection)
  //      would falsely pass B17.
  const toUrgeEmpty = await c.clickExact('잠깐 멈춤');
  check(
    'B17',
    toUrgeEmpty && (await c.has('지금 충동을 멈춰요')) && (await c.has('아직 보호 설정이 없어요')) && !(await c.has(ALT)),
  );
  await c.shot('urge_empty_after_clear');

  // 18–19 · Reset local data through the confirm sheet (.sheet-scoped); home returns
  // to first-run and the saved note is gone.
  await c.clickExact('홈');
  await c.click('이 기기의 기록 지우기');
  const sheetOpen = await c.has('정말 이 기기의 기록을 지울까요');
  check('B18', sheetOpen);
  await c.clickInScope('.sheet', '기록 지우기'); // scoped: never the trigger behind the backdrop
  await sleep(500);
  // RC-2A: after reset Home returns to its base status surface (timer + counters) and the
  // typed note is gone. (No first-run onboarding card to assert anymore.)
  check('B19', (await c.has('절제 시간')) && (await c.has('절제 카운터')) && !(await c.has(NOTE)));
  await scanOverflow(c, 'home-after-reset');
  await c.shot('home_after_reset');

  // 20–21 · Forbidden vocabulary / fake-claim sweep across the MVP-loop screens
  // (rendered text, not source). Each hop is VERIFIED to actually leave home and reach
  // its screen; an unreached screen invalidates the sweep — we cannot claim "no
  // forbidden copy" on a screen we never rendered — so it fails B20/B21 loudly.
  const blobs = [await c.text()]; // home (first-run)
  const missed = [];
  const sweep = async (name, navFn) => {
    const clicked = await navFn();
    await sleep(350);
    const left = clicked && !(await c.has('절제 시간')); // '절제 시간' is home-unique
    if (left) blobs.push(await c.text());
    else missed.push(name);
    await c.clickExact('홈');
    await sleep(200);
  };
  await sweep('urge', () => c.clickExact('잠깐 멈춤'));
  await sweep('checkin', () => c.click('오늘 기록하기'));
  await sweep('room', () => c.click('고양이 방 꾸미기'));
  await sweep('protection', () => c.click('보호 설정 적기'));
  const blob = blobs.join('\n');
  const vocabHits = FORBIDDEN_VOCAB.filter((w) => blob.includes(w));
  const claimHits = FORBIDDEN_CLAIMS.filter((w) => blob.includes(w));
  const sweepNote = missed.length ? ` sweep-incomplete:${missed.join(',')}` : '';
  check('B20', vocabHits.length === 0 && missed.length === 0, (vocabHits.join(',') + sweepNote).trim());
  check('B21', claimHits.length === 0 && missed.length === 0, (claimHits.join(',') + sweepNote).trim());

  // 22 · No critical horizontal overflow on any screen captured at 390x844.
  check('B22', overflowSeen.length === 0, overflowSeen.map((o) => `${o.screen}:${o.bad.join('|')}`).join(' ; '));

  // 23 · Route home works: leave home, tap the home nav, land back on home.
  await c.clickExact('잠깐 멈춤'); await sleep(200);
  const awayFromHome = !(await c.has('절제 시간'));
  await c.clickExact('홈'); await sleep(200);
  const backHome = await c.has('절제 시간');
  check('B23', awayFromHome && backHome);

  // 24 · Every discipline counter ticks LIVE to the second (RC-1 feedback #1). Read a
  //      counter card's elapsed text, wait past a second, read again — it must advance.
  //      This proves the seconds are real (not a frozen stamp), on the rendered DOM.
  await c.clickExact('홈'); await sleep(300);
  const readCounter = `(() => { const el = document.querySelector('.counter-card-time'); return el ? el.textContent.replace(/\\s+/g,' ').trim() : null; })()`;
  const tick1 = await c.eval(readCounter);
  await sleep(1500);
  const tick2 = await c.eval(readCounter);
  const ticked = !!tick1 && !!tick2 && tick1 !== tick2;
  check('B24', ticked, ticked ? '' : `counter time did not advance live: "${tick1}" -> "${tick2}"`);
  await c.shot('home_counter_tick');

  // 25 · The cat room has a REAL, visible 쓰다듬기 (놀아주기) interaction with an honest
  //      persisted count: open the room, press 쓰다듬기, and the "지금까지 쓰다듬기 N번"
  //      read-back appears (absent before the first pet) — proving the interaction changed
  //      real state, not just played a glow. Asserts on rendered DOM, not source.
  await c.clickExact('홈'); await sleep(250);
  const toRoom = await c.click('고양이 방 꾸미기'); await sleep(450);
  const beforePet = await c.has('지금까지 쓰다듬기'); // no petting yet this run → absent
  const petClicked = await c.click('쓰다듬기'); await sleep(350);
  const afterPet = await c.has('지금까지 쓰다듬기'); // count read-back now visible
  const petOk = toRoom && petClicked && !beforePet && afterPet;
  check('B25', petOk, petOk ? '' : `room:${toRoom} pet:${petClicked} before:${beforePet} after:${afterPet}`);
  await c.shot('room_pet_interaction');

  // 26 · The persistent bottom nav must be fully visible at 390x844: the nav sits
  //      inside the viewport (not pushed below the fold by the demo frame), all five
  //      tab labels render, and NONE is clipped below the viewport bottom or overflows
  //      horizontally. Asserts on real getBoundingClientRect() at the emulated viewport.
  await c.clickExact('홈'); await sleep(250);
  const nav = await c.eval(`(() => {
    const el = document.querySelector('.bottom-nav');
    if (!el) return { ok: false, why: 'no .bottom-nav' };
    const vh = window.innerHeight;
    const vw = document.documentElement.clientWidth;
    const r = el.getBoundingClientRect();
    const spans = [...el.querySelectorAll('button > span')].map((s) => {
      const b = s.getBoundingClientRect();
      return { t: s.textContent.replace(/\\s+/g, ' ').trim(), bottom: b.bottom, w: b.width, vis: s.offsetParent !== null };
    });
    const texts = spans.map((s) => s.t);
    const wanted = ['홈', '기록', '잠깐 멈춤', '오늘 기록', '복기'];
    const allPresent = wanted.every((w) => texts.includes(w));
    const noneClipped = spans.length === 5 && spans.every((s) => s.vis && s.w > 0 && s.bottom <= vh + 1);
    const navInView = r.bottom <= vh + 1 && r.top >= 0 && r.width <= vw + 1;
    return { ok: allPresent && noneClipped && navInView, allPresent, noneClipped, navInView, navBottom: Math.round(r.bottom), vh, texts };
  })()`);
  check('B26', nav.ok, nav.ok ? '' : JSON.stringify(nav));
  await c.shot('bottom_nav_visible');

  // 27 · The 기록 screen is a REAL monthly calendar: it shows the current 년/월, a weekday
  //      header and a distinguishable today cell, and the ‹/› controls move to the previous
  //      month and back. Asserts on the rendered DOM (month-nav label changes then returns).
  await c.clickExact('홈'); await sleep(150);
  await c.clickExact('기록'); await sleep(300);
  const onCal = await c.has('하루하루 남긴 기록이에요');
  const readMonth = `(() => { const el = document.querySelector('.month-nav-label'); return el ? el.textContent.trim() : null; })()`;
  const monthNow = await c.eval(readMonth);
  const hasWeekday = await c.eval(`(() => !!document.querySelector('.month-weekday'))()`);
  const hasToday = await c.eval(`(() => !!document.querySelector('.month-cell[data-today="true"]'))()`);
  await c.clickSelector('button[aria-label="이전 달"]'); await sleep(250);
  const monthPrev = await c.eval(readMonth);
  await c.clickSelector('button[aria-label="다음 달"]'); await sleep(250);
  const monthBack = await c.eval(readMonth);
  const calOk = onCal && !!monthNow && hasWeekday && hasToday && monthPrev !== monthNow && monthBack === monthNow;
  check('B27', calOk, calOk ? '' : `cal:${onCal} now:${monthNow} weekday:${hasWeekday} today:${hasToday} prev:${monthPrev} back:${monthBack}`);
  await c.shot('records_month_nav');

  // 28 · 고양이 방 꾸미기 — REAL placement. Open the room, enter 배치 mode, tap a tray item
  //      to place it, and a placed card appears on the stage; after a HARD RELOAD the card
  //      is still there (coordinates persisted to localStorage), asserted on rendered DOM.
  await c.clickExact('홈'); await sleep(200);
  await c.click('고양이 방 꾸미기'); await sleep(350);
  await c.click('아이템 배치하기'); await sleep(300);
  const trayBefore = await c.eval(`document.querySelectorAll('.room-tray-item').length`);
  const placedBefore = await c.eval(`document.querySelectorAll('.room-card').length`);
  await c.clickSelector('.room-tray-item'); await sleep(350); // tap-to-place the first tray item
  const placedAfter = await c.eval(`document.querySelectorAll('.room-card').length`);
  await c.reload(); await sleep(400);
  await c.clickExact('홈'); await sleep(200);
  await c.click('고양이 방 꾸미기'); await sleep(350);
  await c.click('아이템 배치하기'); await sleep(300);
  const placedAfterReload = await c.eval(`document.querySelectorAll('.room-card').length`);
  const placeOk = trayBefore > 0 && placedAfter > placedBefore && placedAfterReload >= placedAfter;
  check('B28', placeOk, placeOk ? '' : `tray:${trayBefore} before:${placedBefore} after:${placedAfter} reload:${placedAfterReload}`);
  await c.shot('room_place_persist');

  // 29 · A placed card can be DRAGGED to a new position. Read the lamp card's left% before
  //      and after a real pointer drag (pointerdown → pointermove → pointerup); it must move.
  const lampSel = '.room-card[data-item="ember_lamp"]';
  const leftBefore = await c.eval(`(() => { const el = document.querySelector('${lampSel}'); return el ? parseFloat(el.style.left) : null; })()`);
  const dragged = await c.pointerDrag(lampSel, 0.28, 0.82);
  const leftAfter = await c.eval(`(() => { const el = document.querySelector('${lampSel}'); return el ? parseFloat(el.style.left) : null; })()`);
  const moveOk = dragged && leftBefore != null && leftAfter != null && Math.abs(leftAfter - leftBefore) > 5;
  check('B29', moveOk, moveOk ? '' : `dragged:${dragged} left ${leftBefore} -> ${leftAfter}`);
  await c.shot('room_card_repositioned');

  // 30 · The snack hand-off is a REAL visible motion that updates real state. Leave 배치
  //      mode, press 간식 놓아주기 → the snack token animates (data-active) and the fed state
  //      appears (지금까지 놓아준 간식 + 오늘 간식 놓아주기 완료), gated on a real feed.
  await c.click('배치 마치기'); await sleep(300);
  const fedBefore = await c.has('지금까지 놓아준 간식');
  const fed = await c.click('간식 놓아주기');
  const tossActive = await c.eval(`!!document.querySelector('.snack-toss-token[data-active="true"]')`);
  await sleep(1000);
  const fedAfter = await c.has('지금까지 놓아준 간식');
  const fedTodayShown = await c.has('오늘 간식 놓아주기 완료');
  const feedOk = fed && !fedBefore && tossActive && fedAfter && fedTodayShown;
  check('B30', feedOk, feedOk ? '' : `fed:${fed} before:${fedBefore} toss:${tossActive} after:${fedAfter} today:${fedTodayShown}`);
  await c.shot('room_snack_handoff');

  // 31 · RC-6 protection clarity. The 보호 설정 screen the user actually reaches (Home →
  //      보호 설정 적기) must be HONEST about scope — it is a self-opened protection plan, NOT
  //      an automatic or device-wide blocker — expose practical next actions to 잠깐 멈춤 and
  //      오늘 기록 through EXISTING routes, frame the real protection path as a NoF Chrome extension
  //      (browser-scoped blocking, not a toy experiment/preview), and carry NO 금욕/체크인 or fake
  //      AI/detection/medical/recovery claim. Asserted on the rendered DOM, and the 잠깐 멈춤 next
  //      action is actually clicked to prove it routes.
  await c.clickExact('홈'); await sleep(250);
  const toProtect = await c.click('보호 설정 적기'); await sleep(350);
  const onProtectRc6 = await c.has('흔들리는 순간을 미리 적어둬요');
  // Honest scope: a self-opened plan, no automatic / device-wide blocking claim.
  const scopeHonest =
    (await c.has('보호 계획')) && (await c.has('자동으로 막아주지')) && (await c.has('막지 않아요'));
  const noAutoBlockClaim = !(await c.has('자동 차단'));
  // Practical next actions through existing routes.
  const hasPauseCta = await c.has('잠깐 멈춤 열기');
  const hasRecordCta = await c.has('오늘 기록으로 남기기');
  // The real protection path is framed as a NoF Chrome extension (browser-scoped blocking),
  // not a toy experiment/preview, and routes to the real 차단 테스트 screen.
  // (title "이 기기 Chrome 차단" renders uppercase via .card-label text-transform, so anchor on
  //  the body promise + pill + the browser-scoped honesty line, which are not case-transformed.)
  const chromeBlockHonest =
    (await c.has('Chrome 확장을 연결하면')) && (await c.has('Chrome 확장')) &&
    (await c.has('아직 기기 전체나 다른 앱까지 막는 기능은 아니에요'));
  // No developer-facing experiment/preview/PoC copy on this product surface.
  const noExperimentCopy =
    !(await c.has('실험 기능')) && !(await c.has('앱 안에서만 확인하는 실험 기능')) &&
    !(await c.has('PoC')) && !(await c.has('멈춤 흐름을 미리 확인'));
  // No forbidden vocabulary / fake claims on this surface.
  const noForbiddenProtect = !(await c.has('금욕')) && !(await c.has('체크인'));
  const noFakeProtect =
    !(await c.has('AI')) && !(await c.has('회복 점수')) && !(await c.has('치료')) && !(await c.has('감지'));
  await c.shot('protection_clarity');
  // The 잠깐 멈춤 next action actually routes to the real urge screen.
  const pauseRoutes = (await c.click('잠깐 멈춤 열기')) && (await c.has('지금 충동을 멈춰요'));
  const protectionClear =
    toProtect && onProtectRc6 && scopeHonest && noAutoBlockClaim && hasPauseCta &&
    hasRecordCta && chromeBlockHonest && noExperimentCopy && noForbiddenProtect &&
    noFakeProtect && pauseRoutes;
  check('B33', protectionClear,
    protectionClear ? '' : `reach:${toProtect}/${onProtectRc6} scope:${scopeHonest} noAuto:${noAutoBlockClaim} pause:${hasPauseCta}/${pauseRoutes} record:${hasRecordCta} chrome:${chromeBlockHonest} noExp:${noExperimentCopy} clean:${noForbiddenProtect}/${noFakeProtect}`);

  // 34 · RC-7 app↔extension connection. The user can REACH the Chrome extension connection
  //      screen (Home → 보호 설정 적기 → 차단 테스트하기), it states the honest browser-scoped
  //      scope (this Chrome only, not device-wide / other apps), offers a REAL connection
  //      mechanism (a local 확장 ID field + 연결 확인), and — with NO real extension answering in
  //      this headless run — it must NOT claim 연결됨 (no fake link). It also offers 테스트 신호
  //      보내기 and carries no 체크인/금욕 or fake AI/medical/auto-block claim. Rendered DOM only.
  await c.clickExact('홈'); await sleep(250);
  await c.click('보호 설정 적기'); await sleep(300);
  const toExt = await c.click('차단 테스트하기'); await sleep(400);
  const onExt = await c.has('실제 차단 테스트'); // ShieldExtensionScreen title (hangul-stable)
  // Honest scope: a NoF Chrome extension, this browser only, not device-wide / other apps.
  const extScopeHonest =
    (await c.has('Chrome 확장')) &&
    (await c.has('이 Chrome 브라우저에서 먼저 작동해요')) &&
    (await c.has('기기 전체나 다른 앱까지 막는 기능은 아니에요'));
  // Real connection mechanism: a local 확장 ID input + a 연결 확인 action + a 테스트 신호 보내기 action.
  const hasIdField = await c.has('확장 ID를 붙여넣어 연결을 확인해요');
  const hasConnectBtn = await c.has('연결 확인');
  const hasSendTestBtn = await c.has('테스트 신호 보내기');
  // Default state is honestly NOT connected, never a fake 연결됨.
  const honestBeforeClick = (await c.has('아직 연결되지 않았어요')) && !(await c.has('연결됨'));
  // Pressing 연결 확인 with no extension present must STAY not-connected (real PING fails) —
  // it must never flip to 연결됨 on click. This is the core anti-fake assertion.
  await c.click('연결 확인'); await sleep(500);
  const stillNotConnected = (await c.has('아직 연결되지 않았어요')) && !(await c.has('연결됨'));
  // No forbidden vocab / fake claims on this surface.
  const extNoForbidden = !(await c.has('체크인')) && !(await c.has('금욕'));
  const extNoFake =
    !(await c.has('AI')) && !(await c.has('회복 점수')) && !(await c.has('치료')) && !(await c.has('자동 차단'));
  await c.shot('shield_extension_connect');
  const extConnectClear =
    toExt && onExt && extScopeHonest && hasIdField && hasConnectBtn && hasSendTestBtn &&
    honestBeforeClick && stillNotConnected && extNoForbidden && extNoFake;
  check('B34', extConnectClear,
    extConnectClear ? '' : `reach:${toExt}/${onExt} scope:${extScopeHonest} id:${hasIdField} connect:${hasConnectBtn} send:${hasSendTestBtn} honestBefore:${honestBeforeClick} stillNot:${stillNotConnected} clean:${extNoForbidden}/${extNoFake}`);

  // 35 · RC-8 saved-signal / test-value → REAL browser block rule. On the SAME extension screen,
  //      a connected user sends a concrete 차단 테스트용 값 (default the reserved harmless
  //      example.com) to THIS Chrome's declarativeNetRequest rules via SET_BLOCK_RULES. With NO
  //      extension answering in this headless run, pressing 반영 must NOT claim a rule was
  //      installed — it must tell the user to connect first. Asserts: the send field + the
  //      saved-signal count are present, the honest not-connected result, no fake install, and no
  //      체크인/금욕 or fake AI/auto-block/mobile claim. Rendered DOM only (this is the RC-8 gap
  //      closer over RC-7, which only sent the harmless static test token).
  const blkUi = (await c.has('차단 테스트용 값')) && (await c.has('브라우저 차단 규칙 반영'));
  const blkSavedCount = await c.has('저장한 위험 신호');
  const blkSent = await c.clickExact('이 브라우저 차단 규칙에 반영'); await sleep(500);
  const blkNotConnected = await c.has('아직 연결되지 않았어요. 먼저 연결 확인을 눌러요.');
  const blkNoFakeInstall = !(await c.has('반영했어요'));
  const blkNoForbidden = !(await c.has('체크인')) && !(await c.has('금욕'));
  const blkNoFake =
    !(await c.has('AI')) && !(await c.has('자동 차단')) && !(await c.has('모바일')) && !(await c.has('치료'));
  const blockRuleClear =
    blkUi && blkSavedCount && blkSent && blkNotConnected && blkNoFakeInstall && blkNoForbidden && blkNoFake;
  check('B35', blockRuleClear,
    blockRuleClear ? '' : `ui:${blkUi} count:${blkSavedCount} sent:${blkSent} notConn:${blkNotConnected} noInstall:${blkNoFakeInstall} clean:${blkNoForbidden}/${blkNoFake}`);
  await c.shot('shield_extension_block_rules');
}

async function main() {
  const root = repoRoot();
  log(`NoF MVP flow QA — app=${APP_URL} cdp=${CDP_URL} out=${QA_OUT}`);
  await ensureServer(root);
  await ensureBrowser();
  const c = await CDP.connect(CDP_URL);
  try {
    await c.viewport();
    await runFlow(c);
  } finally {
    c.close();
  }
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n=== NoF MVP QA: ${passed}/${results.length} behaviors PASS ===`);
  const fails = results.filter((r) => !r.ok);
  if (fails.length) {
    console.log('FAILED:\n' + fails.map((f) => ` - ${f.id} ${f.label}${f.extra ? ' :: ' + f.extra : ''}`).join('\n'));
  }
  console.log(`screenshots: ${QA_OUT}`);
  cleanup();
  process.exit(fails.length ? 1 : 0);
}

main().catch((e) => {
  console.error('NoF MVP QA crashed:', e?.message || e);
  // Report partial progress so a mid-flow crash is honest about how far it got
  // (crash at B20 vs crash at setup are very different signals) — never silent.
  if (results.length) {
    const passed = results.filter((r) => r.ok).length;
    console.log(`\n=== NoF MVP QA: ${passed}/${results.length} behaviors checked before crash ===`);
    const fails = results.filter((r) => !r.ok);
    if (fails.length) {
      console.log('FAILED/INCOMPLETE:\n' + fails.map((f) => ` - ${f.id} ${f.label}${f.extra ? ' :: ' + f.extra : ''}`).join('\n'));
    }
  }
  cleanup();
  process.exit(1);
});
