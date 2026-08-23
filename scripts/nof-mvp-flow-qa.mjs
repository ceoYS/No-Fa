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

// The 37 MVP behaviors this harness drives and asserts. Every check() references one
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
  B36: 'RC-9 guided 3분 보호 설정 is reachable + honest: 4-step stepper (위험 신호 정리/Chrome 확장 연결/차단 규칙 반영/차단 테스트), browser-scoped scope, 잠깐 멈춤+오늘 기록 CTAs, no connected/complete state without a real extension, no 체크인/금욕/AI/device-wide/full-block claim',
  B37: 'RC-10 shield→app deep link: ?from=shield&to=urge opens 잠깐 멈춤, &to=record opens 오늘 기록, invalid destination falls back home, blocked target never passed, no 체크인/금욕/fake AI/device-wide/full-block claim',
  B38: 'RC-11 extension setup is compressed + honest: reachable setup flow (Chrome 확장 준비/압축해제 설치/확장 ID/연결 확인/이 브라우저 차단 규칙에 반영/차단 테스트), states Chrome 웹 스토어 not yet + this-Chrome-only + not device-wide/other-app, no connected/complete state without a real extension reply, 잠깐 멈춤+오늘 기록 exits, no 체크인/금욕/fake AI/device-wide/full-block claim',
  B40: 'placed decor stays VISIBLE in the normal room after 배치 마치기 (same position, no labels/outlines/handles), survives reopen + reload',
  B41: 'a decor card dragged onto the cat / the feeder is re-aimed to clear floor (real pointer drag, asserted on saved coordinates)',
  B42: 'the empty placement tray says what is TRUE of the tray, and still names the props that are in the room',
  B43: '상점 item name / description / category tab / action all clear 4.5:1 against their real rendered background',
  B39: 'RC-13 danger-signal input is product-like + honest: 위험 신호 정리 with a concrete 피하고 싶은 사이트나 검색어 field + an abstract 자주 흔들리는 상황 note, only user-confirmed 브라우저 차단 규칙 후보 are sent (situation note never sent), no rule-success/연결됨/설정 완료 without a real extension reply, this-Chrome-only + not device-wide, no 체크인/금욕/AI/자동 탐지/성인 사이트 목록 claim',
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
  // A CRITICAL 390px overflow is one that actually makes the document scroll horizontally
  // (docScrollW > vw) — that is what clips content or shows a horizontal scrollbar to the user.
  // An element wider than the viewport that is CLIPPED by an ancestor is not, on its own,
  // critical: e.g. the v13 잠깐 멈춤 screen (.screen.v13-pause) intentionally full-bleeds its
  // dark-ink background to the device-frame edges via a negative horizontal margin, with a
  // compensating equal padding so every piece of content stays inside the safe area. That
  // leaves docScrollW == vw (no scrollbar, nothing clipped), so it must not fail B22. We keep
  // the offender list for diagnostics but only record a screen when the document truly overflows.
  const realOverflow = o.docScrollW > o.vw + 1;
  if (realOverflow && o.bad && o.bad.length) overflowSeen.push({ screen, ...o });
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
  // v13 Final Handoff Home mounts as the ink-hero status surface with the 절제 항목 counter
  // list (root .v13-home). '절제 시간'/'절제 카운터' were the pre-v13 home strings; they now
  // live only in a confirm sheet / DisciplineScreen, so home is keyed on '절제 항목' + .v13-home.
  check('B01', await c.eval("!!document.querySelector('.v13-home')"));
  check('B02', (await c.has('절제 항목')) && (await c.eval('document.querySelectorAll(".v13-item-row").length >= 1')));
  // v13 in-the-moment actions: 잠깐 멈춤 (hero primary) + 오늘 기록 (secondary).
  check('B03', (await c.has('잠깐 멈춤')) && (await c.has('오늘 기록')));
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
  const onUrge = await c.has('지금 멈추면'); // v13 pause-vulnerable title (was '지금 충동을 멈춰요')
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
  check('B06', await c.waitForText('절제 항목', 6000)); // wait for re-hydration, not a fixed sleep
  await c.click('보호 설정'); // v13 Home 관리 row → 보호 설정 (was urge-side '보호 설정 적기')
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
  const toRecords = await c.click('최근 기록 보기'); // v13 reward → 월간 캘린더
  check('B13', toRecords && (await c.has('월간 캘린더')));
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
  // v13 recognition copy: '이번 달 흐름' card → "이 달 기록 N일 · 지금까지 N일".
  const recogShown = (await c.has('이번 달 흐름')) && (await c.has('이 달 기록')) && (await c.has('지금까지'));
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
  await c.clickExact('기록'); // v13 bottom nav → 오늘 기록(CheckinScreen) saved-state (was '오늘 기록')
  check('B15', (await c.has('오늘 기록이 저장됐어요')) && (await c.has(NOTE)));
  await scanOverflow(c, 'checkin-saved');
  await c.shot('checkin_saved');
  await c.clickExact('홈');

  // 16 · Protection clear empties the plan honestly.
  await c.click('보호 설정'); // v13 Home 관리 row → 보호 설정
  await c.click('계획 비우기');
  check(
    'B16',
    (await c.has('아직 보호 설정이 없어요')) && (await c.has('보호 설정을 비웠어요')) && !(await c.has(ALT)),
  );
  await c.shot('protection_cleared');

  // 17 · Urge returns to the no-plan empty state after the clear. The urge-unique title
  //      '지금 멈추면' is asserted too: '아직 보호 설정이 없어요' ALSO renders on the
  //      cleared ProtectionScreen, so without it a failed nav (staying on Protection)
  //      would falsely pass B17.
  const toUrgeEmpty = await c.click('잠깐 멈춤 열기'); // v13 protection next-action → urge
  check(
    'B17',
    toUrgeEmpty && (await c.has('지금 멈추면')) && (await c.has('아직 보호 설정이 없어요')) && !(await c.has(ALT)),
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
  check('B19', (await c.has('절제 항목')) && !(await c.has(NOTE)));
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
    const left = clicked && !(await c.has('절제 항목')); // '절제 항목' is v13 home-unique
    if (left) blobs.push(await c.text());
    else missed.push(name);
    await c.clickExact('홈');
    await sleep(200);
  };
  await sweep('urge', () => c.clickExact('잠깐 멈춤'));
  await sweep('checkin', () => c.clickExact('오늘 기록'));
  await sweep('room', () => c.clickExact('내 방'));
  await sweep('protection', () => c.click('보호 설정'));
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
  const awayFromHome = !(await c.has('절제 항목'));
  await c.clickExact('홈'); await sleep(200);
  const backHome = await c.has('절제 항목');
  check('B23', awayFromHome && backHome);

  // 24 · Every discipline counter ticks LIVE to the second (RC-1 feedback #1). Read a
  //      counter card's elapsed text, wait past a second, read again — it must advance.
  //      This proves the seconds are real (not a frozen stamp), on the rendered DOM.
  await c.clickExact('홈'); await sleep(300);
  const readCounter = `(() => { const el = document.querySelector('.v13-hero-timer'); return el ? el.textContent.replace(/\\s+/g,' ').trim() : null; })()`;
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
  const toRoom = await c.clickExact('내 방'); await sleep(450); // v13 bottom nav → 고양이 방(내 방)
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
    // v13 nav renders five buttons, each an indicator span (.bottom-nav-nd, empty) above a
    // label span — so assert on the five BUTTONS (their collapsed text is the label), not span count.
    const btns = [...el.querySelectorAll('button')];
    const labels = btns.map((b) => b.textContent.replace(/\\s+/g, ' ').trim());
    const wanted = ['홈', '캘린더', '기록', '미래일기', '내 방'];
    const allPresent = wanted.every((w) => labels.includes(w));
    const noneClipped = btns.length === 5 && btns.every((b) => {
      const bb = b.getBoundingClientRect();
      return b.offsetParent !== null && bb.width > 0 && bb.bottom <= vh + 1;
    });
    const navInView = r.bottom <= vh + 1 && r.top >= 0 && r.width <= vw + 1;
    return { ok: allPresent && noneClipped && navInView, allPresent, noneClipped, navInView, navBottom: Math.round(r.bottom), vh, labels };
  })()`);
  check('B26', nav.ok, nav.ok ? '' : JSON.stringify(nav));
  await c.shot('bottom_nav_visible');

  // 27 · The 기록 screen is a REAL monthly calendar: it shows the current 년/월, a weekday
  //      header and a distinguishable today cell, and the ‹/› controls move to the previous
  //      month and back. Asserts on the rendered DOM (month-nav label changes then returns).
  await c.clickExact('홈'); await sleep(150);
  await c.clickExact('캘린더'); await sleep(300); // v13 IA: 캘린더 tab = monthly calendar (기록 tab = writing)
  const onCal = await c.has('월간 캘린더');
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
  await c.clickExact('내 방'); await sleep(350); // v13 bottom nav → 고양이 방
  await c.click('아이템 배치하기'); await sleep(300);
  const trayBefore = await c.eval(`document.querySelectorAll('.room-tray-item').length`);
  const placedBefore = await c.eval(`document.querySelectorAll('.room-card').length`);
  await c.clickSelector('.room-tray-item'); await sleep(350); // tap-to-place the first tray item
  const placedAfter = await c.eval(`document.querySelectorAll('.room-card').length`);
  await c.reload(); await sleep(400);
  await c.clickExact('홈'); await sleep(200);
  await c.clickExact('내 방'); await sleep(350); // v13 bottom nav → 고양이 방
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

  // 40 · P1 CLOSEOUT — placement must SURVIVE leaving placement mode. The exact Founder
  //      flow: place → move → 배치 마치기 → THE OBJECT IS STILL THERE, at the same
  //      coordinates, with no edit chrome on it (no name label, no button/handle, no
  //      selection outline) → reopen 배치 → same position → hard reload → still present in
  //      the normal room without entering placement mode at all. All asserted on rendered
  //      DOM: a saved-count sentence would not satisfy any of these.
  const lampPos = `(() => { const el = document.querySelector('.room-card[data-item="ember_lamp"]');
    return el ? { left: parseFloat(el.style.left), top: parseFloat(el.style.top) } : null; })()`;
  const editPos = await c.eval(lampPos);
  await c.click('배치 마치기'); await sleep(400);
  const viewCards = await c.eval(`document.querySelectorAll('.room-card').length`);
  const viewPos = await c.eval(lampPos);
  // The placed object is really painted (not a 0-size / display:none ghost) and carries
  // no editing chrome of any kind in the normal room.
  const viewClean = await c.eval(`(() => {
    const el = document.querySelector('.room-card[data-item="ember_lamp"]');
    if (!el) return { drawn: false };
    const img = el.querySelector('img');
    const r = img ? img.getBoundingClientRect() : null;
    const cs = img ? getComputedStyle(img) : null;
    return {
      drawn: !!r && r.width > 8 && r.height > 8 && cs.visibility === 'visible' && parseFloat(cs.opacity) > 0.5,
      viewFlag: el.getAttribute('data-placed-view') === '1',
      labels: document.querySelectorAll('.room-card .room-card-name').length,
      handles: document.querySelectorAll('button.room-card').length,
      selected: document.querySelectorAll('.room-card.is-selected').length,
      outline: cs ? cs.outlineStyle : null,
      hits: el.getAttribute('style').includes('pointer-events: none'),
    };
  })()`);
  await c.shot('room_placed_visible_after_done');
  // Reopen placement: the same object, still at the same spot.
  await c.click('아이템 배치하기'); await sleep(350);
  const reopenPos = await c.eval(lampPos);
  await c.click('배치 마치기'); await sleep(350);
  // Hard reload, then straight into the normal room — no placement mode.
  await c.reload(); await sleep(400);
  await c.clickExact('홈'); await sleep(200);
  await c.clickExact('내 방'); await sleep(450);
  const reloadPos = await c.eval(lampPos);
  const reloadCards = await c.eval(`document.querySelectorAll('.room-card').length`);
  const same = (a, b) => a && b && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.top - b.top) < 0.5;
  const stayVisible =
    !!editPos
    && viewCards > 0
    && same(editPos, viewPos)
    && viewClean.drawn === true
    && viewClean.viewFlag === true
    && viewClean.labels === 0
    && viewClean.handles === 0
    && viewClean.selected === 0
    && viewClean.outline === 'none'
    && viewClean.hits === true
    && same(editPos, reopenPos)
    && reloadCards > 0
    && same(editPos, reloadPos);
  check('B40', stayVisible, stayVisible ? '' : `edit:${JSON.stringify(editPos)} view:${JSON.stringify(viewPos)} cards:${viewCards} clean:${JSON.stringify(viewClean)} reopen:${JSON.stringify(reopenPos)} reload:${JSON.stringify(reloadPos)}/${reloadCards}`);
  await c.shot('room_placed_after_reload');
  // Hand back to B30 in placement mode, exactly as it expects to find the room.
  await c.click('아이템 배치하기'); await sleep(300);

  // 41 · P1 SAFE PLACEMENT (Founder video QA, defect 1) — a decor card can no longer be
  //      dropped onto the cat or over the feeder. Two REAL pointer drags aim straight at
  //      the middle of the cat and then at the bowl tray; both must come to rest outside
  //      the protected boxes. Asserted on the coordinates the component actually saved,
  //      not on a hover state. The boxes below are the stage-space zones from
  //      src/constants/roomZones.js (cat = the approved 기쁨/휴식 pose rects mapped through
  //      the plate's cover-fit + 1.06 scene overscale; feeder = the measured bowl tray).
  const CAT_BOX = { x0: 37.69, x1: 81.67, y0: 29.84, y1: 87.62 };
  const FEEDER_BOX = { x0: 63.7, x1: 104.79, y0: 73.76, y1: 101.67 };
  const inBox = (p, b) => !!p && p.left > b.x0 && p.left < b.x1 && p.top > b.y0 && p.top < b.y1;
  const ontoCat = await c.pointerDrag(lampSel, 0.55, 0.55);
  const afterCat = await c.eval(lampPos);
  const ontoFeeder = await c.pointerDrag(lampSel, 0.86, 0.9);
  const afterFeeder = await c.eval(lampPos);
  const safeOk =
    ontoCat && ontoFeeder
    && !!afterCat && !!afterFeeder
    && !inBox(afterCat, CAT_BOX) && !inBox(afterCat, FEEDER_BOX)
    && !inBox(afterFeeder, CAT_BOX) && !inBox(afterFeeder, FEEDER_BOX);
  check('B41', safeOk, safeOk ? '' : `cat:${ontoCat}/${JSON.stringify(afterCat)} feeder:${ontoFeeder}/${JSON.stringify(afterFeeder)}`);
  await c.shot('room_placement_safe_zone');

  // 42 · P1 EMPTY-STATE SEMANTICS (Founder video QA, defect 4) — with every owned prop
  //      already placed, the tray is empty but the ROOM is not. The line must describe the
  //      tray ("nothing new to place") and name the props that are in the room; it must
  //      never read as "your room is empty" while the user's own props are on screen.
  const trayState = await c.eval(`(() => {
    const note = document.querySelector('.room-tray .hairline-note');
    return {
      trayItems: document.querySelectorAll('.room-tray-item').length,
      placed: document.querySelectorAll('.room-card').length,
      note: note ? note.textContent.trim() : null,
    };
  })()`);
  const emptyCopyOk =
    trayState.trayItems === 0
    && trayState.placed > 0
    && typeof trayState.note === 'string'
    && trayState.note.includes('새로 배치할 아이템이 없어요')
    && trayState.note.includes(`방에 놓은 소품 ${trayState.placed}개는 그대로 있어요`)
    && !trayState.note.startsWith('방에 놓을 아이템이 없어요');
  check('B42', emptyCopyOk, emptyCopyOk ? '' : JSON.stringify(trayState));
  await c.shot('room_tray_empty_copy');

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

  // 43 · P1 SHOP READABILITY (Founder video QA, defect 3) — the 상점 sheet kept the
  //      ORIGINAL dark palette under the v13 light shell, so item names and descriptions
  //      rendered dark-on-dark and the unaffordable action was faded to 0.45 opacity.
  //      This measures the REAL rendered contrast: the element's computed colour against
  //      the first opaque background behind it, as WCAG relative luminance. Everything the
  //      Founder named — item name, description, category tab, action/price state — must
  //      clear 4.5:1. Measured on two tabs so a decor row is covered too, not only 간식.
  const CONTRAST_EVAL = `(() => {
    const parse = (c) => { const m = String(c).match(/[0-9.]+/g); return m ? m.map(Number) : null; };
    const lin = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
    const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
    const bgOf = (el) => {
      let n = el;
      while (n) {
        const c = parse(getComputedStyle(n).backgroundColor);
        if (c && (c.length < 4 || c[3] > 0.5)) return c;
        n = n.parentElement;
      }
      return [255, 255, 255];
    };
    const ratio = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const fg = parse(cs.color);
      if (!fg) return null;
      // A faded label is exactly the defect, so opacity counts against the ratio.
      const alpha = parseFloat(cs.opacity);
      if (Number.isFinite(alpha) && alpha < 0.95) return 0;
      const a = lum(fg), b = lum(bgOf(el));
      return Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100;
    };
    return {
      name: ratio('.catalog-name'),
      blurb: ratio('.catalog-blurb'),
      tabOn: ratio('.shop-tab[data-selected="true"]'),
      tabOff: ratio('.shop-tab:not([data-selected="true"])'),
      action: ratio('.catalog-action'),
    };
  })()`;
  const shopOpen = await c.clickExact('상점'); await sleep(400);
  const shopSnack = await c.eval(CONTRAST_EVAL);
  await c.shot('shop_contrast_snack');
  await c.clickExact('가구'); await sleep(300);
  const shopDecor = await c.eval(CONTRAST_EVAL);
  await c.shot('shop_contrast_decor');
  const READABLE = 4.5;
  const allReadable = (m) =>
    !!m
    && Object.entries(m).every(([, v]) => v === null || v >= READABLE)
    && m.name !== null && m.blurb !== null && m.tabOn !== null && m.tabOff !== null;
  const shopOk = shopOpen && allReadable(shopSnack) && allReadable(shopDecor);
  check('B43', shopOk, shopOk ? '' : `open:${shopOpen} snack:${JSON.stringify(shopSnack)} decor:${JSON.stringify(shopDecor)}`);
  await c.clickExact('닫기'); await sleep(300);

  // 31 · RC-6 protection clarity. The 보호 설정 screen the user actually reaches (Home →
  //      보호 설정 관리 row) must be HONEST about scope — it is a self-opened protection plan, NOT
  //      an automatic or device-wide blocker — expose practical next actions to 잠깐 멈춤 and
  //      오늘 기록 through EXISTING routes, frame the real protection path as a NoF Chrome extension
  //      (browser-scoped blocking, not a toy experiment/preview), and carry NO 금욕/체크인 or fake
  //      AI/detection/medical/recovery claim. Asserted on the rendered DOM, and the 잠깐 멈춤 next
  //      action is actually clicked to prove it routes.
  await c.clickExact('홈'); await sleep(250);
  const toProtect = await c.click('보호 설정'); await sleep(350); // v13 Home 관리 row → 보호 설정
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
  const pauseRoutes = (await c.click('잠깐 멈춤 열기')) && (await c.has('지금 멈추면'));
  const protectionClear =
    toProtect && onProtectRc6 && scopeHonest && noAutoBlockClaim && hasPauseCta &&
    hasRecordCta && chromeBlockHonest && noExperimentCopy && noForbiddenProtect &&
    noFakeProtect && pauseRoutes;
  check('B33', protectionClear,
    protectionClear ? '' : `reach:${toProtect}/${onProtectRc6} scope:${scopeHonest} noAuto:${noAutoBlockClaim} pause:${hasPauseCta}/${pauseRoutes} record:${hasRecordCta} chrome:${chromeBlockHonest} noExp:${noExperimentCopy} clean:${noForbiddenProtect}/${noFakeProtect}`);

  // 34 · RC-7 app↔extension connection. The user can REACH the Chrome extension connection
  //      screen (Home → 보호 설정 → 차단 테스트하기), it states the honest browser-scoped
  //      scope (this Chrome only, not device-wide / other apps), offers a REAL connection
  //      mechanism (a local 확장 ID field + 연결 확인), and — with NO real extension answering in
  //      this headless run — it must NOT claim 연결됨 (no fake link). It also offers 테스트 신호
  //      보내기 and carries no 체크인/금욕 or fake AI/medical/auto-block claim. Rendered DOM only.
  await c.clickExact('홈'); await sleep(250);
  await c.click('보호 설정'); await sleep(300); // v13 Home 관리 row → 보호 설정
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

  // 39 · RC-13 danger-signal input. On the SAME extension screen, the danger-signal section
  //      separates a CONCRETE value (피하고 싶은 사이트나 검색어 → a real 브라우저 차단 규칙 후보)
  //      from an ABSTRACT 자주 흔들리는 상황 note (an in-app reminder NEVER sent as a rule). A typed
  //      concrete value can be confirmed into a candidate; only confirmed candidates are sent via
  //      SET_BLOCK_RULES, and — with NO extension answering in this headless run — the send must NOT
  //      claim a rule was installed (no 반영했어요 / 설정 완료 / 연결됨). The situation note stays
  //      app-only. No 체크인/금욕 or fake AI/auto-detection/adult-list/device-wide claim. Runs BEFORE
  //      B35 so the empty-candidate state is observable. Rendered DOM only.
  const dsTitle = await c.has('위험 신호 정리');
  const dsConcreteField = await c.has('피하고 싶은 사이트나 검색어');
  const dsSituationField = await c.has('자주 흔들리는 상황');
  const dsCandidateCard = await c.has('브라우저 차단 규칙 후보');
  const dsEmptyBefore = await c.has('아직 보낼 수 있는 구체 값이 없어요'); // no candidate confirmed yet
  const dsSituationAppOnly = await c.has('브라우저 규칙으로 보내지 않아요');
  const dsSituationNotRule = await c.has('상황 메모는 차단 규칙이 아니에요');
  const dsThisChromeOnly = await c.has('직접 확인한 값만 이 Chrome 브라우저에 반영해요');
  const dsNotDeviceWide = await c.has('기기 전체나 다른 앱까지 막는 기능은 아니에요');
  // A concrete value can be confirmed into a candidate (real state change).
  await c.type('#danger-site-value', 'nof-rc13-danger-signal');
  const dsConfirmed = await c.clickExact('차단 규칙 후보로 직접 확인'); await sleep(300);
  const dsCandidateShown = (await c.has('nof-rc13-danger-signal')) && (await c.has('직접 확인한 값'));
  // A situation note is typed but must remain app-only (never sent as a rule).
  await c.type('#danger-situation-note', '밤에 혼자 있을 때');
  // Send the confirmed candidate; with no extension answering, NO fake rule-success.
  const dsSent = await c.clickExact('선택한 값을 이 브라우저 차단 규칙에 반영'); await sleep(500);
  const dsNotConnected = await c.has('아직 연결되지 않았어요. 먼저 연결 확인을 눌러요.');
  const dsNoFakeInstall = !(await c.has('반영했어요'));
  const dsNoFakeComplete = !(await c.has('설정 완료')) && !(await c.has('연결됨'));
  const dsNoForbidden = !(await c.has('체크인')) && !(await c.has('금욕'));
  const dsNoFake =
    !(await c.has('AI')) && !(await c.has('자동 차단')) && !(await c.has('자동 탐지')) &&
    !(await c.has('성인 사이트 목록')) && !(await c.has('추천 차단 목록')) &&
    !(await c.has('모바일')) && !(await c.has('치료'));
  const dangerSignalOk =
    dsTitle && dsConcreteField && dsSituationField && dsCandidateCard && dsEmptyBefore &&
    dsSituationAppOnly && dsSituationNotRule && dsThisChromeOnly && dsNotDeviceWide &&
    dsConfirmed && dsCandidateShown && dsSent && dsNotConnected && dsNoFakeInstall &&
    dsNoFakeComplete && dsNoForbidden && dsNoFake;
  check('B39', dangerSignalOk,
    dangerSignalOk ? '' : `title:${dsTitle} concrete:${dsConcreteField} situation:${dsSituationField} cand:${dsCandidateCard} empty:${dsEmptyBefore} appOnly:${dsSituationAppOnly} notRule:${dsSituationNotRule} thisChrome:${dsThisChromeOnly} notDevice:${dsNotDeviceWide} confirm:${dsConfirmed} shown:${dsCandidateShown} sent:${dsSent} notConn:${dsNotConnected} noInstall:${dsNoFakeInstall} notDone:${dsNoFakeComplete} clean:${dsNoForbidden}/${dsNoFake}`);
  await c.shot('shield_danger_signal_input');

  // 35 · RC-13/RC-8 confirmed-candidate send is honest. On the SAME extension screen, a confirmed
  //      concrete candidate is sent to THIS Chrome's declarativeNetRequest rules via SET_BLOCK_RULES.
  //      With NO extension answering in this headless run, pressing 반영 must NOT claim a rule was
  //      installed — it must tell the user to connect first. Asserts: the concrete input field + the
  //      saved-signal count are present, a fresh value can be confirmed as a candidate, the honest
  //      not-connected result, no fake install, and no 체크인/금욕 or fake AI/auto-block/mobile claim.
  const blkUi = (await c.has('피하고 싶은 사이트나 검색어')) && (await c.has('위험 신호 정리'));
  const blkSavedCount = await c.has('저장한 위험 신호');
  await c.type('#danger-site-value', 'nof-rc13-b35-signal');
  const blkConfirmed = await c.clickExact('차단 규칙 후보로 직접 확인'); await sleep(250);
  const blkSent = await c.clickExact('선택한 값을 이 브라우저 차단 규칙에 반영'); await sleep(500);
  const blkNotConnected = await c.has('아직 연결되지 않았어요. 먼저 연결 확인을 눌러요.');
  const blkNoFakeInstall = !(await c.has('반영했어요'));
  const blkNoForbidden = !(await c.has('체크인')) && !(await c.has('금욕'));
  const blkNoFake =
    !(await c.has('AI')) && !(await c.has('자동 차단')) && !(await c.has('모바일')) && !(await c.has('치료'));
  const blockRuleClear =
    blkUi && blkSavedCount && blkConfirmed && blkSent && blkNotConnected && blkNoFakeInstall && blkNoForbidden && blkNoFake;
  check('B35', blockRuleClear,
    blockRuleClear ? '' : `ui:${blkUi} count:${blkSavedCount} confirm:${blkConfirmed} sent:${blkSent} notConn:${blkNotConnected} noInstall:${blkNoFakeInstall} clean:${blkNoForbidden}/${blkNoFake}`);
  await c.shot('shield_extension_block_rules');

  // 36 · RC-9 guided 3분 보호 설정. On the SAME extension screen (already reached via Home → 보호
  //      설정 적기 → 차단 테스트하기), a guided stepper walks the proven RC-7 + RC-8 chain: 위험 신호
  //      정리 → Chrome 확장 연결 → 차단 규칙 반영 → 차단 테스트. It must show the guided structure,
  //      keep the honest browser-scoped scope, expose 잠깐 멈춤 + 오늘 기록 CTAs, and — with NO real
  //      extension answering in this headless run (연결 확인/반영 were both pressed above and failed)
  //      — must NOT mark connected or complete. No 체크인/금욕 or fake AI/device-wide/full-block
  //      claim. Rendered DOM only (this is the RC-9 onboarding over the proven RC-7+RC-8 pieces).
  const guidedTitle = await c.has('3분 보호 설정');
  const guidedSteps =
    (await c.has('위험 신호 정리')) && (await c.has('Chrome 확장 연결')) &&
    (await c.has('차단 규칙 반영')) && (await c.has('차단 테스트'));
  const guidedScope =
    (await c.has('이 Chrome 브라우저에서 먼저 작동해요')) &&
    (await c.has('기기 전체나 다른 앱까지 막는 기능은 아니에요'));
  // With no extension answering, the guided flow must NOT show a connected/complete state:
  // no 연결됨 (real PING only), no 규칙 반영됨 (real SET_BLOCK_RULES ok only), no completion line.
  const notCompleted =
    !(await c.has('연결됨')) && !(await c.has('규칙 반영됨')) &&
    !(await c.has('이제 이 Chrome 브라우저에서 작동해요'));
  // The 잠깐 멈춤 / 오늘 기록 next actions are always available (not gated behind completion).
  const guidedCtas = (await c.has('잠깐 멈춤')) && (await c.has('오늘 기록'));
  const guidedNoForbidden = !(await c.has('체크인')) && !(await c.has('금욕'));
  const guidedNoFake =
    !(await c.has('AI')) && !(await c.has('자동 차단')) && !(await c.has('모바일')) &&
    !(await c.has('치료')) && !(await c.has('기기 전체 보호')) && !(await c.has('모든 앱 차단')) &&
    !(await c.has('성공 보장'));
  const guidedOk =
    guidedTitle && guidedSteps && guidedScope && notCompleted && guidedCtas &&
    guidedNoForbidden && guidedNoFake;
  check('B36', guidedOk,
    guidedOk ? '' : `title:${guidedTitle} steps:${guidedSteps} scope:${guidedScope} notDone:${notCompleted} cta:${guidedCtas} clean:${guidedNoForbidden}/${guidedNoFake}`);
  await c.shot('shield_guided_setup');

  // 38 · RC-11 compressed extension setup. On the SAME extension screen (already reached via Home →
  //      보호 설정 → 차단 테스트하기), the setup is compressed into one honest 준비 → 설치 → ID
  //      복사 → 연결 → 규칙 → 테스트 flow. It must surface the compressed setup terms, state the
  //      install KIND honestly (Chrome 웹 스토어 not yet, this Chrome only, not device-wide / other
  //      apps), keep useful 잠깐 멈춤 + 오늘 기록 exits, and — with NO real extension answering in this
  //      headless run (연결 확인/반영 pressed above both failed) — must NOT show the 설정 완료 / 연결됨
  //      state. No 체크인/금욕 or fake AI/device-wide/full-block claim. Rendered DOM only.
  //      ("Chrome 확장 준비" is a .card-label, uppercased by CSS for latin, so the 준비 concept is
  //      asserted via the hangul-stable body line 확장을 준비해요 + the 압축해제 설치 pill.)
  const setupOnExt = await c.has('실제 차단 테스트');
  const setupCompressed =
    (await c.has('확장을 준비해요')) && (await c.has('압축해제 설치')) &&
    (await c.has('확장 ID')) && (await c.has('연결 확인')) &&
    (await c.has('이 브라우저 차단 규칙에 반영')) && (await c.has('차단 테스트'));
  const setupHonest =
    (await c.has('웹 스토어 설치는 아직 아니에요')) &&
    (await c.has('이 Chrome 브라우저에서 먼저 작동해요')) &&
    (await c.has('기기 전체나 다른 앱까지 막는 기능은 아니에요'));
  // No connected/complete state earned in this headless run (no extension answered).
  const setupNotComplete = !(await c.has('설정 완료')) && !(await c.has('연결됨'));
  const setupExits = (await c.has('잠깐 멈춤')) && (await c.has('오늘 기록'));
  const setupNoForbidden = !(await c.has('체크인')) && !(await c.has('금욕'));
  const setupNoFake =
    !(await c.has('AI')) && !(await c.has('자동 차단')) && !(await c.has('기기 전체 보호')) &&
    !(await c.has('모든 앱 차단')) && !(await c.has('치료')) && !(await c.has('회복 점수')) &&
    !(await c.has('성공 보장'));
  const setupOk =
    setupOnExt && setupCompressed && setupHonest && setupNotComplete && setupExits &&
    setupNoForbidden && setupNoFake;
  check('B38', setupOk,
    setupOk ? '' : `onExt:${setupOnExt} steps:${setupCompressed} honest:${setupHonest} notDone:${setupNotComplete} exits:${setupExits} clean:${setupNoForbidden}/${setupNoFake}`);
  await c.shot('shield_extension_setup');

  // 37 · RC-10 shield → web-app deep-link handoff. The Chrome 실드 blocked page returns the user
  //      into the app via ?from=shield&to=urge|record. A FRESH load at that URL must land on the
  //      right screen (잠깐 멈춤 / 오늘 기록), an unknown destination must fall back to home, and
  //      neither landing may carry 체크인/금욕 or a fake AI/device-wide/medical/full-block claim.
  //      The blocked target is NEVER passed in the link. Asserted on rendered DOM after a real load.
  await c.goto(`${APP_URL}?from=shield&to=urge`); await sleep(500);
  const dlUrge = await c.has('지금 멈추면'); // v13 urge title
  const dlUrgeText = await c.text();
  await c.goto(`${APP_URL}?from=shield&to=record`); await sleep(500);
  const dlRecord = (await c.has('1분 기록')) || (await c.has('오늘의 기록'));
  const dlRecordText = await c.text();
  await c.goto(`${APP_URL}?from=shield&to=bogus`); await sleep(500);
  const dlFallback = (await c.has('절제 항목')) && !(await c.has('지금 멈추면'));
  const dlBlob = `${dlUrgeText}\n${dlRecordText}`;
  const dlNoForbidden = !dlBlob.includes('체크인') && !dlBlob.includes('금욕');
  const dlNoFake = ['자동 차단', 'AI', '기기 전체 보호', '모든 앱 차단', '치료', '회복 점수', '성공 보장']
    .every((w) => !dlBlob.includes(w));
  const deepLinkOk = dlUrge && dlRecord && dlFallback && dlNoForbidden && dlNoFake;
  check('B37', deepLinkOk,
    deepLinkOk ? '' : `urge:${dlUrge} record:${dlRecord} fallback:${dlFallback} clean:${dlNoForbidden}/${dlNoFake}`);
  await c.shot('shield_deeplink_handoff');
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
