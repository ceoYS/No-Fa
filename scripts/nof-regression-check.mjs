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
 *   7. The crisis-held (잠깐 멈춤) shard grant is once-per-calendar-day (no farm).
 *   8. The slip-reflection shard grant is once-per-calendar-day (no farm).
 *   9. The pet-room sheets are real dialogs (role/aria) and Esc-dismissible.
 *  10. A top-level ErrorBoundary wraps the app (no white-screen on a render throw).
 *  11. Home is timer-first: abstinence timer hero + crisis/record hero CTAs.
 *  12. The urge 대체 활동 opens a real alternative-action panel, not a home route.
 *  13. The pet feed message is an honest hand-off (no cat-eating claim).
 *  14. Home relapse/restart requires a confirmation step (never an instant reset).
 *  15. Multiple default abstinence counters exist (multi-counter data model); the
 *      first-run seeds are honest 예시 samples (isSample:true, longestDays:0) so a
 *      cleared install never shows an unearned streak/record as the user's own.
 *  16. Home exposes add + edit counter UI (name / start date / time / target).
 *  17. Home renders a selectable counter list (tap selects → hero updates).
 *  18. relapse() is scoped to the selected counter (never resets all counters).
 *  19. The rule model carries counterId, linked to default counters (rule↔counter).
 *  20. The add-rule flow can link a rule to an existing counter.
 *  21. The add-rule flow can create a counter together with the rule.
 *  22. The selected counter reveals its linked rules on Home (status, not time).
 *  23. Discipline can filter/group rules by counter.
 *  24. The 배치 계획 mode is an honest no-overlay placeholder (no rect item crops).
 *  25. The snack feed travels an ember particle, not the raw rectangular snack image.
 *  26. No fake sound claim — audio stays an honest, silent gated fallback.
 *  27. The selected counter is visual-only (amber border/glow) — no 보는 중 text badge.
 *  28. The pet room uses the completed composite cat-room image (cat always visible).
 *  29. The Shield (차단 설정) screen is an honest 준비 중 placeholder — no fake blocking,
 *      no working-claim copy, no functional toggle; routed and linked from Home.
 *  30. The Shield risk-signal planner is non-enforcing AND never asks users to hunt
 *      for / paste a risky site: abstract signals only (category/keyword/app/situation),
 *      a safety note steering users away, no toggle, no fake "blocked" claim, empty seed.
 *  31. Shield reads as a plan, not a working blocker: planner says it does not block
 *      yet, 보호 방식 layers are roadmap info (no buttons), and the Safe Browser PoC is
 *      an in-app demo that opens no external link and routes a match to 잠깐 멈춤.
 *  32. The Chrome blocking PoC (extensions/chrome-shield) is a real, LOCAL-only MV3
 *      declarativeNetRequest prototype: it redirects a top-level navigation containing
 *      the harmless test token to the in-app NoF pause page, pulls in no remote code /
 *      CDN / external API, never reveals the visited target, and documents that it is
 *      Chrome-only (NOT mobile / SNS / image mosaic).
 *  33. The pet-room 소리/무음 toggle is hidden until real audio is probed present
 *      (usePetSound.hasSound) — no dead sound switch over a silent fallback. The
 *      HEAD probe must verify an audio/* content-type, because SPA dev/hosting
 *      fallbacks answer missing files with 200 text/html and would fake presence.
 *  34. The 5-minute crisis pause (잠깐 멈춤) is in the persistent bottom nav and
 *      routes to the real UrgeScreen — reachable in one tap from every screen.
 *  35. The chrome-shield extension keeps LEAST PRIVILEGE: the manifest requests only
 *      the minimal permission set (declarativeNetRequest), declares no dangerous keys
 *      (content_scripts / webRequest / tabs / cookies / scripting), keeps the RC-7
 *      externally_connectable bridge NARROW (NoF app origins only, no wildcard host),
 *      and still carries no remote code / CDN / analytics, no adult terms, and no
 *      blocked-target leak — pinning the security audit so future scope-creep fails loud.
 *  36. Selectable status controls expose aria-pressed (not only the data-selected visual
 *      hook), and every sheet keeps honest dialog semantics: role="dialog" + aria-modal
 *      live on the inner .sheet while the dimmed .sheet-backdrop closes on outside click
 *      (onClick) — never role on the backdrop, which would announce the dim layer as the
 *      dialog and historically shipped with no outside-click dismissal.
 *  37. The real-blocking path is discoverable AND honestly bounded: a dedicated
 *      ShieldExtensionScreen (routed as 'shieldExtension', linked from the Shield
 *      screen) states plainly that the in-app signal list is only a PLAN and that the
 *      real "blocked → 잠깐 멈춤" test runs only in the separate Chrome extension, using
 *      ONLY the harmless test token (nof-test-risk-signal). That screen ships no real
 *      adult URL / explicit term, claims no mobile / SNS / image / video / whole-web
 *      blocking, never says the app itself blocks browsing, and adds no network /
 *      remote-code / external-API sink (the one address shown is the reserved
 *      example.com test URL). The Shield screen stays planner-only / non-enforcing.
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

// 5 — RC-2B: room placement is REAL now, but it stays honest — placed items are
// framed CARDS (real art thumbnail + name), never a claim that transparent overlay
// sprites exist. So no petAssets entry may flip spriteReady, and the decorator must
// place via pointer events on a normalized (percent) coordinate stage.
check('real room placement stays honest (framed cards, no transparent-sprite claim)', () => {
  assert(
    !/spriteReady:\s*true/.test(read('src/constants/petAssets.js')),
    'a petAssets entry sets spriteReady:true — real placement must use honest framed cards, not a fake sprite claim',
  );
  const dec = read('src/components/PetRoomDecorator.jsx');
  assert(/onPointerDown=\{/.test(dec), 'decorator has no pointer-event drag handler (onPointerDown)');
  assert(
    /addEventListener\('pointermove'/.test(dec) && /addEventListener\('pointerup'/.test(dec),
    'decorator drag does not track pointermove/pointerup',
  );
  // normalized (percent) coordinates, clamped inside the stage rect — layout-safe on mobile.
  assert(/clamp01/.test(dec) && /getBoundingClientRect\(\)/.test(dec), 'decorator placement is not normalized to the stage rect');
  assert(/\* 100\}%/.test(dec), 'placed cards are not positioned by percent coordinates');
  // honest framed item cards (thumbnail + name), never a raw transparent-sprite overlay.
  assert(dec.includes('room-card-face') && dec.includes('room-card-name'), 'decorator does not render honest framed item cards');
});

// 6 — forbidden fake-motion / emoji-furniture / blob-cat tokens absent from source.
check('no fake-motion / emoji-furniture / blob tokens in source', () => {
  // Note: 'meow'/'purr' are NOT banned — they exist only as honest empty-string
  // audio placeholders in usePetSound.js, gated by hasPetSound() so no sound claim
  // reaches the UI until a real source is wired. Banning them would punish the
  // honesty gate. Fake *motion* copy is what we forbid here.
  const tokens = [
    '기지개', '꼬리', '먹었', '먹는', '움직였', 'eating', '파도처럼',
    'pet-cat-svg', 'room-token-glow', '직접 배치할 수 있어요',
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

// 7 — the crisis-held grant must be gated to once per calendar day.
check('crisis-held reward is granted once per calendar day (no farm)', () => {
  const app = read('src/App.jsx');
  assert(app.includes('crisisRewardDay'), 'no crisisRewardDay guard state in App.jsx');
  const m = app.match(/const crisisHeld = \(\) => \{[\s\S]*?setScreenId\('reward'\);\s*\};/);
  assert(m, 'crisisHeld function not found');
  const body = m[0];
  assert(
    /if \(crisisRewardDay !== todayKey\) \{\s*earn\(EARN\.crisisHeld/.test(body),
    'crisisHeld earn() is not gated behind the once-per-day guard',
  );
  assert(/setCrisisRewardDay\(todayKey\);/.test(body), 'crisisHeld never records the grant day');
});

// 8 — the slip-reflection grant must be gated to once per calendar day, while the
// relapse-reflection grant stays present (it is self-gated by the timer reset).
check('slip-reflection reward is granted once per calendar day (no farm)', () => {
  const app = read('src/App.jsx');
  assert(app.includes('slipReflectionDay'), 'no slipReflectionDay guard state in App.jsx');
  const m = app.match(/const completeReflection = \(\{[\s\S]*?setScreenId\('reward'\);\s*\};/);
  assert(m, 'completeReflection function not found');
  const body = m[0];
  assert(/earn\(EARN\.relapseReflection/.test(body), 'relapse-reflection grant missing');
  assert(
    /else if \(slipReflectionDay !== todayKey\) \{[\s\S]*?earn\(EARN\.slipReflection/.test(body),
    'slip-reflection earn() is not gated behind the once-per-day guard',
  );
  assert(/setSlipReflectionDay\(todayKey\);/.test(body), 'slip reflection never records the grant day');
});

// 9 — the pet-room sheets must be real dialogs and dismissible by keyboard.
check('pet-room sheets are dialogs and Esc-dismissible', () => {
  const screen = read('src/screens/PetRewardScreen.jsx');
  const dialogs = (screen.match(/role="dialog"/g) || []).length;
  assert(dialogs >= 2, `expected ≥2 role="dialog" sheets, found ${dialogs}`);
  assert(screen.includes('aria-label="아이템 보관함"'), 'inventory sheet missing dialog aria-label');
  assert(screen.includes('aria-label="상점"'), 'shop sheet missing dialog aria-label');
  assert(screen.includes('useDismissOnEscape('), 'pet-room sheets are not Esc-dismissible');
});

// 10 — a top-level ErrorBoundary must wrap the app (no white-screen crash).
check('top-level ErrorBoundary wraps the app', () => {
  const main = read('src/main.jsx');
  assert(/import ErrorBoundary from/.test(main), 'main.jsx does not import ErrorBoundary');
  assert(/<ErrorBoundary>[\s\S]*<App \/>[\s\S]*<\/ErrorBoundary>/.test(main), 'App is not wrapped by ErrorBoundary');
  assert(
    /getDerivedStateFromError/.test(read('src/components/ErrorBoundary.jsx')),
    'ErrorBoundary is not a real error boundary (no getDerivedStateFromError)',
  );
});

// 11 — Home must stay timer-first: the abstinence timer hero plus the crisis and
// record hero CTAs sit above the secondary cards (the core loop is not buried).
check('home is timer-first with crisis + record hero CTAs', () => {
  const home = read('src/screens/HomeScreen.jsx');
  assert(home.includes('abstinence-timer-card'), 'Home timer hero (abstinence-timer-card) missing');
  assert(home.includes('home-hero-actions'), 'Home hero CTA row (home-hero-actions) missing');
  assert(
    home.includes('못 참을 것 같아요') && home.includes("onNavigate('urge')"),
    'Home crisis CTA (못 참을 것 같아요 → urge) missing',
  );
  assert(
    home.includes('오늘 기록하기') && home.includes("onNavigate('checkin')"),
    'Home record CTA (오늘 기록하기 → checkin) missing',
  );
});

// 12 — the urge 대체 활동 must open a real in-screen alternative-action panel with
// concrete actions, rather than silently routing home under that label.
check('urge alternative-action panel is real (not a home route)', () => {
  const urge = read('src/screens/UrgeScreen.jsx');
  for (const label of ['물 한 잔 마시기', '휴대폰 내려놓기', '10번 천천히 숨쉬기', '자리에서 일어나기']) {
    assert(urge.includes(label), `urge alternative action missing: ${label}`);
  }
  assert(urge.includes('대체 활동 해보기'), 'urge 대체 활동 해보기 entry missing');
  assert(urge.includes("setView('alt')"), '대체 활동 does not open the alternative panel (no setView(alt))');
});

// 13 — the pet feed message must be an honest hand-off, never a cat-eating claim
// (eating tokens are banned globally by check 6; this pins the positive copy).
check('pet feed message is an honest hand-off (no eating claim)', () => {
  const screen = read('src/screens/PetRewardScreen.jsx');
  assert(
    screen.includes('간식을 고양이 곁에 놓아두었어요'),
    'feed hand-off message (간식을 고양이 곁에 놓아두었어요) missing',
  );
  assert(screen.includes('snack-toss-token'), 'snack hand-off token (snack-toss-token) missing');
});

// 14 — relapse/restart on Home must pass through a confirmation step. The visible
// 다시 시작 button only opens a confirm dialog; the real reset (onRelapse) is called
// solely from that dialog — never a direct inline onClick that would reset instantly.
check('home relapse restart requires confirmation (never instant reset)', () => {
  const home = read('src/screens/HomeScreen.jsx');
  assert(
    home.includes('기록은 끝이 아니라 다음 시작점이에요'),
    'required restart copy (기록은 끝이 아니라 다음 시작점이에요) missing on Home',
  );
  assert(home.includes('aria-label="다시 시작 확인"'), 'restart confirmation dialog (aria-label) missing');
  assert(home.includes('useDismissOnEscape('), 'restart confirm sheet is not Esc-dismissible');
  assert(home.includes('setConfirmRestart(true)'), 'restart CTA does not open the confirm sheet');
  assert(
    !/onClick=\{\(\)\s*=>\s*onRelapse/.test(home),
    'restart CTA calls onRelapse directly — it must go through the confirm sheet',
  );
});

// 15 — the multi-counter data model must seed multiple default counters with the
// required prototype shape ({ id, name, startMs, targetDays, longestDays, ... }).
check('multiple default abstinence counters exist (first-run seeds are honest 예시 samples)', () => {
  const app = read('src/App.jsx');
  assert(/function makeDefaultCounters\(/.test(app), 'makeDefaultCounters() seed factory missing');
  for (const name of ['콘텐츠 절제', 'SNS 줄이기', '야식 끊기', '음주 줄이기']) {
    assert(app.includes(name), `default counter missing: ${name}`);
  }
  for (const field of ['startMs', 'targetDays', 'longestDays']) {
    assert(app.includes(field), `counter model field missing: ${field}`);
  }
  assert(app.includes('selectedCounterId'), 'no selectedCounterId state in App.jsx');
  // RC-4 first-run honesty: the seeds are SAMPLES, not the user's own earned progress.
  // Every default counter must be flagged isSample:true and carry NO fabricated longest
  // record (longestDays:0). A nonzero seeded longestDays would claim a "최장" the user
  // never earned on first paint — exactly the dishonesty RC-4 removes.
  const mk = app.match(/function makeDefaultCounters\(\)\s*\{[\s\S]*?\n\}/);
  assert(mk, 'makeDefaultCounters() body not found');
  const seedCount = (mk[0].match(/id:\s*'c_/g) || []).length;
  assert(seedCount >= 4, `expected at least four seed counters, found ${seedCount}`);
  assert(
    (mk[0].match(/isSample:\s*true/g) || []).length === seedCount,
    'every seed counter must be flagged isSample:true (honest 예시 label, not the user\'s own run)',
  );
  assert(
    !/longestDays:\s*[1-9]/.test(mk[0]),
    'seed counters must not carry a fabricated nonzero longestDays (RC-4: no unearned 최장 record)',
  );
});

// 16 — Home must expose add + edit counter UI covering all four fields.
check('home exposes add + edit counter UI (name/date/time/target)', () => {
  const home = read('src/screens/HomeScreen.jsx');
  assert(/function AddCounterSheet\(/.test(home), 'AddCounterSheet missing');
  assert(/function EditCounterSheet\(/.test(home), 'EditCounterSheet missing');
  assert(home.includes('+ 카운터 추가'), 'add-counter entry (+ 카운터 추가) missing');
  assert(home.includes('type="date"') && home.includes('type="time"'), 'start date/time inputs missing');
  assert(home.includes('목표 일수'), 'target-days field (목표 일수) missing');
  assert(
    home.includes('onAddCounter') && home.includes('onEditCounter'),
    'add/edit counter handlers not wired',
  );
});

// 17 — Home must render a selectable counter list (cards) that changes selection.
check('home renders a selectable counter list', () => {
  const home = read('src/screens/HomeScreen.jsx');
  assert(home.includes('counter-card'), 'counter card markup (counter-card) missing');
  assert(home.includes('counters.map('), 'Home does not iterate counters into a list');
  assert(home.includes('onSelectCounter'), 'counter selection handler (onSelectCounter) not wired');
  const app = read('src/App.jsx');
  assert(
    /const selectCounter = \(id\) =>/.test(app) && app.includes('setSelectedCounterId('),
    'App selectCounter() does not change the selected counter',
  );
});

// 18 — relapse must restart ONLY the selected counter; it must never reset all
// counters. The scoped guard (skip non-selected ids) is the key invariant.
check('relapse is scoped to the selected counter (no reset-all)', () => {
  const app = read('src/App.jsx');
  const m = app.match(/const relapse = \(\) => \{[\s\S]*?setScreenId\('recovery'\);\s*\};/);
  assert(m, 'relapse function not found');
  const body = m[0];
  assert(body.includes('setCounters('), 'relapse no longer updates the counters list');
  assert(
    /if \(c\.id !== selectedCounterId\) return c;/.test(body),
    'relapse is not scoped to the selected counter (missing id guard) — could reset all',
  );
  assert(body.includes('startMs: now'), 'relapse does not restart the selected counter start');
});

// 19 — the rule model must carry counterId, with the default rules linked to the
// example counters (충동/검색 → 콘텐츠 절제 c_nofap; 밤 시간/숏폼 → SNS 줄이기 c_sns).
check('rule model carries counterId linked to default counters', () => {
  const app = read('src/App.jsx');
  assert(app.includes('counterId'), 'rule model has no counterId field');
  assert(app.includes("counterId: 'c_nofap'"), 'no default rule linked to 콘텐츠 절제 (c_nofap)');
  assert(app.includes("counterId: 'c_sns'"), 'no default rule linked to SNS 줄이기 (c_sns)');
  // addRule must thread an explicit counterId into the new rule object.
  const m = app.match(/const addRule = \([\s\S]*?\n  \};/);
  assert(m, 'addRule function not found');
  assert(/counterId: linkedCounterId/.test(m[0]), 'addRule does not set the rule counterId');
});

// 20 — the add-rule sheet must let a new rule link to an EXISTING counter: it
// renders the counters as choices and submits a counterId.
check('add-rule flow links a rule to an existing counter', () => {
  const screen = read('src/screens/DisciplineScreen.jsx');
  assert(screen.includes('연결할 절제 카운터'), 'add-rule counter section (연결할 절제 카운터) missing');
  assert(screen.includes('counters.map('), 'add-rule sheet does not list counters to link');
  assert(/counterId:/.test(screen), 'add-rule submit never sends a counterId');
  assert(screen.includes('onAddRule'), 'DisciplineScreen does not call onAddRule');
});

// 21 — the add-rule sheet must also support creating a counter WITH the rule:
// the "새 카운터도 함께 만들기" path with name/date/time/target → newCounter payload.
check('add-rule flow can create a counter together with the rule', () => {
  const screen = read('src/screens/DisciplineScreen.jsx');
  assert(screen.includes('새 카운터도 함께 만들기'), 'create-counter-with-rule toggle missing');
  assert(screen.includes('newCounter'), 'add-rule submit never builds a newCounter payload');
  assert(
    screen.includes('type="date"') && screen.includes('type="time"'),
    'new-counter sub-form is missing start date/time inputs',
  );
  assert(screen.includes('목표 일수'), 'new-counter sub-form is missing the target-days field');
  // App must accept newCounter and create + link it.
  const app = read('src/App.jsx');
  assert(/newCounter/.test(app) && app.includes('makeCounter('), 'App addRule does not create the linked counter');
});

// 22 — the selected counter must reveal its linked rules on Home, as a TODAY
// status view that stays separate from the counter's elapsed time.
check('home reveals the selected counter linked rules (status, not time)', () => {
  const home = read('src/screens/HomeScreen.jsx');
  assert(home.includes('연결된 규율'), 'Home linked-rules block (연결된 규율) missing');
  assert(home.includes('linkedRules('), 'Home does not derive the selected counter linked rules');
  assert(home.includes('counterRuleSummary'), 'Home linked-rules status summary missing');
  // discipline.js must expose the link helper.
  assert(
    /export function linkedRules/.test(read('src/constants/discipline.js')),
    'linkedRules() helper not exported from discipline.js',
  );
});

// 23 — Discipline must be able to filter/group rules by counter.
check('discipline filters/groups rules by counter', () => {
  const screen = read('src/screens/DisciplineScreen.jsx');
  assert(screen.includes('rule-filter-row'), 'counter filter row (rule-filter-row) missing');
  assert(screen.includes('rule-group'), 'per-counter rule group (rule-group) missing');
  assert(screen.includes('filterCounterId'), 'no counter-filter state in Discipline');
  // Group summary must be a TODAY rule-status tally, not elapsed time.
  assert(screen.includes('지키는 중'), 'rule group summary does not report today rule status');
});

// 24 — RC-2B: the old 배치 계획 (준비 중) placeholder is replaced by a REAL decorator.
// The pet room wires the decorator to App's persisted placement handler, and the
// stale "배치 계획" / "준비 중" placeholder wording is gone (placement is implemented).
check('pet room offers real placement (decorator wired + persisted, no 준비 중 placeholder)', () => {
  const screen = read('src/screens/PetRewardScreen.jsx');
  assert(screen.includes('PetRoomDecorator'), 'PetRoomDecorator not used by the pet room');
  assert(screen.includes('placementMode'), 'no placement-mode state in PetRewardScreen');
  assert(/onPlace=\{onPlaceItemAt\}/.test(screen), 'decorator place action is not wired to App onPlaceItemAt');
  // the stale placeholder wording must be gone now that placement is real.
  assert(!screen.includes('배치 계획'), 'stale "배치 계획" placeholder wording is still present');
  assert(!screen.includes('준비 중'), 'stale "준비 중" placement placeholder wording is still present');
  // App must persist placements through saveState (a placement survives reload).
  const app = read('src/App.jsx');
  assert(/const placeItemAt = \(itemId, x, y\) =>/.test(app), 'App has no placeItemAt handler');
  assert(/saveState\(\{[\s\S]*?placements,[\s\S]*?\}\)/.test(app), 'placements are not persisted through saveState');
});

// 25 — the snack feed must animate a real hand-off MOVEMENT (a travel), but with
// the current non-transparent snack art it must NOT fling the raw rectangular snack
// image — it travels a small ember particle token instead, still on the keyframe.
check('snack feed travels an ember particle (no raw rectangular image)', () => {
  const screen = read('src/screens/PetRewardScreen.jsx');
  assert(screen.includes('data-active={snackToss}'), 'snack token is not driven by a feed trigger');
  assert(screen.includes('snack-toss-ember'), 'snack hand-off is not an ember particle token');
  assert(!screen.includes('snack-toss-img'), 'snack hand-off still flings the raw rectangular snack image');
  const css = read('src/styles/components.css');
  const m = css.match(/@keyframes snack-toss \{[\s\S]*?\n\}/);
  assert(m, 'snack-toss keyframes missing');
  assert(/translateY\(-?\d+px\)/.test(m[0]), 'snack-toss is not a travel animation (no translateY distance)');
});

// 26 — sound must stay an honest, gated, silent fallback: no copy may CLAIM a
// sound played, and the hook must short-circuit known-missing files silently.
// (The audio files are not committed; play() must be a no-op until they land.)
check('audio is an honest silent fallback (no fake sound claim)', () => {
  const hook = read('src/hooks/usePetSound.js');
  assert(
    hook.includes('known missing → stay silent') || hook.includes('availability.current[name] === false'),
    'usePetSound has no silent fallback for missing audio',
  );
  const screen = read('src/screens/PetRewardScreen.jsx');
  // No fabricated "the cat made a sound" copy anywhere in the screen.
  for (const fake of ['소리가 났', '야옹 소리가', '골골 소리가', '소리가 재생']) {
    assert(!screen.includes(fake), `fake sound claim copy present: ${fake}`);
  }
});

// 27 — the selected counter must be shown by VISUAL treatment only: a data-selected
// hook drives an amber border + glow, and selection reaches assistive tech via
// aria-pressed. No 보는 중 / 현재 / 선택됨 text badge may render inside the card.
check('counter selected state is visual-only (no 보는 중 text badge)', () => {
  const home = read('src/screens/HomeScreen.jsx');
  assert(home.includes('data-selected={selected}'), 'counter card has no data-selected visual hook');
  assert(home.includes('aria-pressed={selected}'), 'counter card selection is not exposed via aria-pressed');
  for (const badge of ['보는 중', '선택됨', 'counter-card-flag']) {
    assert(!home.includes(badge), `counter card still renders a selected text badge: ${badge}`);
  }
  const css = read('src/styles/components.css');
  assert(
    /\.counter-card\[data-selected='true'\][\s\S]*?border-color:\s*var\(--accent-ember\)/.test(css),
    'selected counter card has no amber border treatment',
  );
});

// 28 — the pet room's finished scene must reference the completed composite cat-room
// image (cat always visible in the main scene), and the scene resolver must return
// it — never a plain room that needs a pasted cat/item overlay.
check('pet room uses the completed cat-room image (ember_room_with_white_kitten)', () => {
  const assets = read('src/constants/petAssets.js');
  assert(
    assets.includes('ember_room_with_white_kitten.webp'),
    'composite cat-room image (ember_room_with_white_kitten.webp) is not registered',
  );
  assert(/with_white_kitten[\s\S]*?sceneReady:\s*true/.test(assets), 'scene room is not marked sceneReady');
  assert(/with_white_kitten[\s\S]*?containsCat:\s*true/.test(assets), 'scene room is not flagged as containing the cat');
  assert(
    /resolveRoomSceneAsset[\s\S]*?with_white_kitten/.test(assets),
    'resolveRoomSceneAsset does not return the composite cat-room image',
  );
});

// 29 — the Shield screen must stay an HONEST 준비 중 placeholder. NoF has no
// content-blocking engine yet, so the screen must (a) be routed + reachable from
// Home, (b) state plainly that real blocking is not provided yet, (c) make NO
// present-tense working claim, and (d) ship no functional toggle (a dead switch
// would read as fake blocking).
check('shield screen is an honest 준비 중 placeholder (no fake blocking)', () => {
  const app = read('src/App.jsx');
  assert(app.includes("import ShieldScreen from"), 'App.jsx does not import ShieldScreen');
  assert(/id:\s*'shield'/.test(app), "App.jsx does not route a 'shield' screen");

  const home = read('src/screens/HomeScreen.jsx');
  assert(home.includes("onNavigate('shield')"), 'Home has no entry that navigates to the Shield screen');

  const screen = read('src/screens/ShieldScreen.jsx');
  assert(screen.includes('준비 중'), 'Shield screen is missing the 준비 중 status');
  assert(
    screen.includes('아직 실제 차단은 제공하지 않아요'),
    'Shield screen is missing the honest "no real blocking yet" copy',
  );
  // No present-tense claim that blocking is active.
  for (const fake of ['차단했어요', '차단하고 있어요', '차단 중이에요', '막고 있어요', '차단되었어요']) {
    assert(!screen.includes(fake), `Shield screen makes a fake working-blocking claim: ${fake}`);
  }
  // No functional toggle/switch — the placeholder must not look operable.
  assert(!/type="checkbox"/.test(screen), 'Shield screen ships a checkbox toggle — placeholder must not look operable');
  assert(!/role="switch"/.test(screen), 'Shield screen ships a switch control — placeholder must not look operable');
  // The planned layers must be documented honestly in the screen.
  for (const layer of ['브라우저 확장', 'NoF 안전 브라우저', 'iOS·Android 기기 차단']) {
    assert(screen.includes(layer), `Shield screen is missing a planned layer: ${layer}`);
  }
});

// 30 — the Shield risk-signal planner must stay NON-ENFORCING and must NEVER ask
// users to hunt for or paste a risky site (that search is itself a relapse trigger).
// It edits abstract signals only (category / keyword / app·SNS / situation); it must
// not claim to block, ship no toggle, carry a visible "this list does not block yet"
// banner plus a safety note, expose no address vocabulary, and shield.js must hardcode
// no real domain, drop the old 'domain' kind, and seed an empty list.
check('shield risk-signal planner is honest, non-enforcing, and never asks for risky URLs', () => {
  const app = read('src/App.jsx');
  assert(app.includes("from './constants/shield.js'"), 'App.jsx does not use the shield signal model');
  assert(/const \[blocklist, setBlocklist\] = useState\(/.test(app), 'App.jsx has no blocklist state');
  assert(
    app.includes('onAddBlockEntry') && app.includes('onRemoveBlockEntry'),
    'App.jsx does not wire add/remove signal handlers',
  );

  const screen = read('src/screens/ShieldScreen.jsx');
  assert(
    screen.includes('onAddBlockEntry') && screen.includes('onRemoveBlockEntry'),
    'Shield planner does not call the add/remove handlers',
  );
  assert(
    screen.includes('이 목록은 아직 차단에 쓰이지 않아요'),
    'Shield planner is missing the "list does not block yet" banner',
  );
  // SAFETY: no user-facing address vocabulary, and a visible note must steer users
  // away from hunting for risky sites themselves.
  for (const addr of ['주소', '도메인', 'URL', '링크']) {
    assert(!screen.includes(addr), `Shield planner exposes risky address vocabulary to users: ${addr}`);
  }
  assert(
    screen.includes('위험한 사이트를 직접 찾아 적지 마세요'),
    'Shield planner is missing the safety note telling users not to hunt for risky sites',
  );
  // Still no present-tense blocking claim and no functional toggle.
  for (const fake of ['차단했어요', '차단하고 있어요', '차단 중이에요', '막고 있어요', '차단되었어요']) {
    assert(!screen.includes(fake), `Shield planner makes a fake working-blocking claim: ${fake}`);
  }
  assert(!/type="checkbox"/.test(screen), 'Shield planner ships a checkbox toggle');
  assert(!/role="switch"/.test(screen), 'Shield planner ships a switch control');

  // The model must be a 4-kind risk-signal planner (no 'domain' kind), hardcode no
  // real domains, and seed an empty list — suggestions are abstract labels only.
  const model = read('src/constants/shield.js');
  for (const dom of ['http', 'www.', '.com', '.net', '.org', '.xxx']) {
    assert(!model.includes(dom), `shield.js hardcodes a domain-like string: ${dom}`);
  }
  for (const k of ['category', 'keyword', 'appCategory', 'situation']) {
    assert(model.includes(`'${k}'`), `shield.js is missing risk-signal kind: ${k}`);
  }
  assert(
    !/BLOCK_KINDS\s*=\s*\[[^\]]*'domain'/.test(model),
    "shield.js still exposes a 'domain' kind — it must be removed",
  );
  assert(/DEFAULT_BLOCKLIST\s*=\s*\[\]/.test(model), 'shield.js DEFAULT_BLOCKLIST must ship empty (no preset entries)');
});

// 31 — Shield must read as a plan, not a working blocker, AND the Safe Browser PoC
// must stay an in-app demo that opens nothing. So: the planner states plainly it
// does not block yet; the 보호 방식 layers are roadmap INFO (no buttons); a Safe
// Browser experiment is routed; and that screen opens no external link, matches via
// the local helper, and routes a matched signal to 잠깐 멈춤 (never a real site).
check('shield safe browser PoC is honest, in-app only, and routes a match to 잠깐 멈춤', () => {
  const app = read('src/App.jsx');
  assert(app.includes('import SafeBrowserScreen from'), 'App.jsx does not import SafeBrowserScreen');
  assert(/id:\s*'shieldBrowser'/.test(app), "App.jsx does not route a 'shieldBrowser' screen");

  const screen = read('src/screens/ShieldScreen.jsx');
  // Planner must say plainly it does not block yet, and point at where real blocking lives.
  assert(
    screen.includes('지금 입력한 신호는 아직 실제 차단에 쓰이지 않아요'),
    'Shield planner is missing the explicit "signals do not block yet" copy',
  );
  assert(
    screen.includes('실제 차단은 Safe Browser 또는 브라우저 확장 단계에서 동작해요'),
    'Shield planner is missing the "real blocking happens at Safe Browser / extension" copy',
  );
  // 보호 방식 section is roadmap INFO, not interactive controls.
  assert(screen.includes('앞으로 연결될 보호 방식'), 'Shield is missing the renamed roadmap section title');
  const roadmap = screen.match(/<ul className="shield-roadmap"[\s\S]*?<\/ul>/);
  assert(roadmap, 'Shield roadmap list (shield-roadmap) not found');
  assert(!/<button/.test(roadmap[0]), 'Shield roadmap layers must not be buttons — they are roadmap info, not controls');
  // Entry to the Safe Browser experiment.
  assert(screen.includes('안전 브라우저 실험 열기'), 'Shield is missing the Safe Browser experiment entry button');
  assert(screen.includes("onNavigate('shieldBrowser')"), 'Shield entry does not navigate to the Safe Browser screen');

  const browser = read('src/screens/SafeBrowserScreen.jsx');
  // Local matching only — must use the in-memory helper, never a real engine.
  assert(browser.includes('matchSignals('), 'SafeBrowserScreen does not match via the local matchSignals helper');
  // Opens NOTHING: no network, no iframe, no external navigation.
  for (const ext of ['http', 'window.open', '<iframe', 'href=']) {
    assert(!browser.includes(ext), `SafeBrowserScreen can open an external target (${ext}) — it must stay in-app only`);
  }
  // A matched signal hands off to 잠깐 멈춤 (UrgeScreen), not a site.
  assert(browser.includes("onNavigate('urge')"), 'SafeBrowserScreen does not route a matched signal to 잠깐 멈춤');
  assert(browser.includes('이 신호는 멀리 두기로 정했어요'), 'SafeBrowserScreen is missing the matched interstitial title');
  assert(browser.includes('지금은 열지 않고 5분만 늦춰볼까요'), 'SafeBrowserScreen is missing the matched 잠깐 멈춤 nudge');
  assert(browser.includes('이 실험에서는 실제 웹을 열지 않아요'), 'SafeBrowserScreen is missing the no-match "opens no real web" copy');
  // No present-tense claim that a real site/app/SNS is being blocked.
  for (const fake of ['차단했어요', '차단하고 있어요', '차단 중이에요', '막고 있어요', '차단되었어요']) {
    assert(!browser.includes(fake), `SafeBrowserScreen makes a fake working-blocking claim: ${fake}`);
  }
  // The local matcher must exist and be exported.
  assert(read('src/constants/shield.js').includes('export function matchSignals'), 'shield.js does not export matchSignals');
});

// 32 — the Chrome blocking PoC (extensions/chrome-shield) must be a real, LOCAL-only
// Manifest V3 prototype: declarativeNetRequest redirects a top-level navigation whose
// URL/query contains the harmless test token (nof-test-risk-signal) to the in-app NoF
// pause page (blocked.html); it pulls in NO remote code / CDN / external API, never
// reveals the visited target, ships no adult terms, and documents that it is
// Chrome-only (NOT mobile / SNS / image mosaic).
check('chrome-shield extension is a local MV3 declarativeNetRequest PoC (honest, no remote code)', () => {
  const dir = 'extensions/chrome-shield';
  const files = [
    'manifest.json', 'rules.json', 'signals.js', 'service_worker.js',
    'blocked.html', 'blocked.js', 'popup.html', 'popup.js',
    'options.html', 'options.js', 'README.md',
  ];
  const src = {};
  for (const f of files) {
    try {
      src[f] = read(`${dir}/${f}`);
    } catch {
      throw new Error(`missing extension file: ${dir}/${f}`);
    }
  }

  // manifest: MV3, DNR ruleset, module service worker, DNR permission, WAR pause page.
  const mf = JSON.parse(src['manifest.json']);
  assert(mf.manifest_version === 3, 'manifest is not Manifest V3');
  assert(
    mf.background && mf.background.service_worker === 'service_worker.js',
    'manifest background service_worker is not service_worker.js',
  );
  assert(
    Array.isArray(mf.permissions) && mf.permissions.includes('declarativeNetRequest'),
    'manifest lacks the declarativeNetRequest permission',
  );
  const rr = mf.declarative_net_request && mf.declarative_net_request.rule_resources;
  assert(
    Array.isArray(rr) && rr.some((r) => r.path === 'rules.json' && r.enabled === true),
    'manifest does not enable the rules.json static ruleset',
  );
  const war = mf.web_accessible_resources;
  assert(
    Array.isArray(war) && war.some((w) => Array.isArray(w.resources) && w.resources.includes('blocked.html')),
    'manifest does not expose blocked.html as a web-accessible redirect target',
  );

  // static rule: test token → redirect to the in-app pause page, scoped to navigation.
  const rules = JSON.parse(src['rules.json']);
  const rule = rules.find(
    (r) => r.condition && typeof r.condition.urlFilter === 'string'
      && r.condition.urlFilter.includes('nof-test-risk-signal'),
  );
  assert(rule, 'rules.json has no rule for the nof-test-risk-signal test token');
  assert(rule.action && rule.action.type === 'redirect', 'test rule does not redirect');
  assert(
    rule.action.redirect && String(rule.action.redirect.extensionPath || '').includes('blocked.html'),
    'test rule does not redirect to the in-app blocked.html pause page',
  );
  assert(
    Array.isArray(rule.condition.resourceTypes) && rule.condition.resourceTypes.includes('main_frame'),
    'test rule does not scope to main_frame navigation',
  );

  // signals model: harmless test token + dynamic-rule builder, shared by SW/popup/options.
  assert(
    /export const TEST_SIGNAL\s*=\s*'nof-test-risk-signal'/.test(src['signals.js']),
    'signals.js does not export the harmless TEST_SIGNAL (nof-test-risk-signal)',
  );
  assert(src['signals.js'].includes('export function buildDynamicRules'), 'signals.js does not export buildDynamicRules');

  // service worker: real DNR usage + future app-sync path, imports the shared model.
  assert(src['service_worker.js'].includes('declarativeNetRequest'), 'service worker does not use declarativeNetRequest');
  assert(src['service_worker.js'].includes('updateDynamicRules'), 'service worker has no dynamic-rule sync path (updateDynamicRules)');
  assert(/from '\.\/signals\.js'/.test(src['service_worker.js']), 'service worker does not import the shared signals model');
  assert(
    /from '\.\/signals\.js'/.test(src['popup.js']) && /from '\.\/signals\.js'/.test(src['options.js']),
    'popup/options do not reuse the shared signals model',
  );

  // the in-app pause page: honest prototype copy, offers 잠깐 멈춤, hides the target.
  assert(src['blocked.html'].includes('로컬 Chrome 전용 프로토타입'), 'blocked.html is missing the local Chrome-only prototype label');
  assert(src['blocked.html'].includes('잠깐 멈춤으로 가기'), 'blocked.html is missing the 잠깐 멈춤으로 가기 action');
  for (const leak of ['referrer', 'URLSearchParams', 'document.URL']) {
    assert(!src['blocked.js'].includes(leak), `blocked.js may reveal the visited target (${leak}) — the pause page must not show it`);
  }

  // SAFETY: no remote code / CDN / network / external API anywhere in the extension
  // CODE (manifest host_permissions legitimately list http/https, so it is exempt).
  const codeFiles = [
    'rules.json', 'signals.js', 'service_worker.js', 'blocked.html', 'blocked.js',
    'popup.html', 'popup.js', 'options.html', 'options.js',
  ];
  const remoteTokens = ['http://', 'https://', 'cdn.', 'googleapis', 'unpkg', 'jsdelivr', 'fetch(', 'XMLHttpRequest', 'import("http'];
  // RC-10: blocked.html/js legitimately carry the NoF app deep-link (a user-navigated return
  // target, NOT remote code or a fetch). Exempt ONLY that exact origin for those two files;
  // every other http(s)/CDN/fetch token still trips, including there.
  const APP_DEEPLINK = 'https://nof-mauve.vercel.app';
  for (const f of codeFiles) {
    const scan = (f === 'blocked.html' || f === 'blocked.js') ? src[f].split(APP_DEEPLINK).join('') : src[f];
    for (const t of remoteTokens) {
      assert(!scan.includes(t), `${dir}/${f} pulls in remote code / network (${t}) — the PoC must stay local`);
    }
  }
  // No fake present-tense blocking claim in the user-facing pages.
  for (const f of ['blocked.html', 'popup.html', 'options.html']) {
    for (const fake of ['차단했어요', '차단하고 있어요', '차단 중이에요', '막고 있어요', '차단되었어요']) {
      assert(!src[f].includes(fake), `${dir}/${f} makes a fake working-blocking claim: ${fake}`);
    }
  }
  // No explicit/adult tokens anywhere in the extension code.
  for (const f of codeFiles) {
    for (const bad of ['porn', 'xxx', 'sex', 'adult', 'xvideos', 'nsfw']) {
      assert(!src[f].toLowerCase().includes(bad), `${dir}/${f} contains an explicit/adult token: ${bad}`);
    }
  }

  // README must state the honest scope: Chrome-only, NOT mobile / SNS / mosaic.
  assert(src['README.md'].includes('Chrome 데스크톱 전용'), 'README does not state the Chrome-desktop-only scope');
  assert(
    src['README.md'].includes('iOS·Android·SNS·이미지 모자이크 차단이 아니다'),
    'README does not disclaim mobile/SNS/mosaic blocking',
  );

  // ShieldScreen must tell users real browser blocking needs the Chrome extension.
  assert(
    read('src/screens/ShieldScreen.jsx').includes('실제 브라우저 차단은 Chrome 확장'),
    'ShieldScreen does not point real browser blocking to the Chrome extension',
  );
});

// 33 — the pet-room 소리/무음 toggle must be CONDITION-GATED on real audio
// availability. While the .mp3s are uncommitted every play() is a silent no-op, so
// an always-rendered on/off sound control would be a dead switch implying audio that
// does not exist (the same anti-pattern the Shield screen removed). usePetSound must
// expose an honest hasSound signal (false until a real file is probed present), and
// the screen must only render the toggle when hasSound is true.
check('pet-room sound toggle is hidden until real audio is available (no dead switch)', () => {
  const hook = read('src/hooks/usePetSound.js');
  assert(
    /const \[hasSound, setHasSound\] = useState\(false\)/.test(hook),
    'usePetSound has no hasSound availability state defaulting to false',
  );
  assert(/setHasSound\(/.test(hook), 'usePetSound never derives hasSound from the audio probe');
  assert(/return \{[^}]*hasSound[^}]*\}/.test(hook), 'usePetSound does not return the hasSound signal');
  // The probe must verify the response is REAL audio, not an SPA fallback: dev /
  // hosting servers answer missing paths with 200 text/html (index.html), which
  // would silently resurrect the dead toggle. ok + content-type audio/* only.
  assert(
    hook.includes("res.headers.get('content-type')"),
    'usePetSound probe never reads the content-type header — an SPA 200 text/html fallback would count as audio',
  );
  assert(
    /res\.ok\s*&&\s*type\.startsWith\('audio\/'\)/.test(hook),
    'usePetSound availability is not gated on BOTH res.ok and an audio/* content-type',
  );

  const screen = read('src/screens/PetRewardScreen.jsx');
  assert(screen.includes('hasSound'), 'PetRewardScreen does not read the hasSound availability signal');
  assert(
    /hasSound \?[\s\S]{0,220}className="sound-toggle"/.test(screen),
    'the sound-toggle is not gated behind hasSound — a silent dead switch could render',
  );
});

// 34 — the 5-minute crisis pause (잠깐 멈춤) must be reachable in one tap from EVERY
// screen, not only Home. It must live in the persistent bottom nav and route to the
// real UrgeScreen (never a dead entry). This is the single highest-urgency action in
// a self-control app, so gating it behind a Home round-trip is a real-use harm.
check('global crisis pause (잠깐 멈춤) is in the persistent nav and routes to the real urge screen', () => {
  const nav = read('src/components/BottomNav.jsx');
  assert(/id:\s*'urge'/.test(nav), 'BottomNav has no 잠깐 멈춤 (urge) tab');
  assert(nav.includes('잠깐 멈춤'), 'BottomNav urge tab is missing the warm 잠깐 멈춤 label');
  assert(/onChange\(t\.id\)/.test(nav), 'BottomNav tabs do not route via onChange(tab id) — could be a dead entry');

  const app = read('src/App.jsx');
  // The nav must route to the screen router. RC-10 routes it through navigate() — a thin wrapper
  // that consumes the one-shot 실드 deep-link note and then calls the real router — so accept
  // either a direct setScreenId or a handler whose body actually calls setScreenId (never a dead
  // entry). We extract the bound handler name and verify it routes.
  const bottomNavRouter = app.match(/<BottomNav[\s\S]*?onChange=\{(\w+)\}/);
  assert(bottomNavRouter, 'App does not wire BottomNav onChange to the screen router');
  const navHandler = bottomNavRouter[1];
  assert(
    navHandler === 'setScreenId' || new RegExp(`const ${navHandler} = \\([\\s\\S]*?setScreenId\\(`).test(app),
    `App BottomNav onChange handler (${navHandler}) is not the real screen router (does not call setScreenId)`,
  );
  assert(
    /id:\s*'urge',\s*label:\s*'잠깐 멈춤',\s*Component:\s*UrgeScreen/.test(app),
    "App does not route 'urge' to the real UrgeScreen",
  );
});

// 34b — RC-2A: the persistent bottom nav must stay visible on mobile. The fixed
// 390×844 demo frame (plus its 32px margin) used to push its own bottom — and the nav
// with it — below the viewport fold, so the tabs read as clipped. The fix is an
// UNCONDITIONAL vertical fit on .device-frame: max-height 100dvh + a margin clamped to
// 0 when the frame can't fit, so the nav always sits on the real bottom edge (no media
// query, so it also holds under device emulation). The nav itself is safe-area-aware and
// non-shrinking. This pins the fix plus the five tab labels (RC-2A 체크인 → 오늘 기록).
check('bottom nav stays visible on mobile (device frame fits viewport + safe-area nav)', () => {
  const css = read('src/styles/components.css');
  const nav = read('src/components/BottomNav.jsx');

  // (a) The base .device-frame fits the viewport unconditionally: capped to 100dvh with
  //     a vertical margin that clamps to 0 when the 844px frame would otherwise overflow.
  const frame = css.match(/\.device-frame \{[\s\S]*?\}/);
  assert(frame, '.device-frame rule missing');
  assert(/max-height:\s*100dvh/.test(frame[0]), '.device-frame is not capped to the viewport height (max-height: 100dvh)');
  assert(
    /margin:\s*clamp\(\s*0px[^;]*100dvh[^;]*\)\s*auto/.test(frame[0]),
    '.device-frame margin does not clamp to 0 when the frame cannot fit — a fixed margin pushes the nav off-screen',
  );

  // (b) The nav footer is safe-area-aware and never shrinks under a tall viewport.
  const navCss = css.match(/\.bottom-nav \{[\s\S]*?\}/);
  assert(navCss, '.bottom-nav rule missing');
  assert(navCss[0].includes('env(safe-area-inset-bottom'), '.bottom-nav does not pad for the home-indicator safe area');
  assert(/flex-shrink:\s*0/.test(navCss[0]), '.bottom-nav can shrink (no flex-shrink:0) — labels could be squeezed/clipped');

  // (c) All five tab labels are present, using the RC-2A 오늘 기록 wording (not 체크인).
  for (const label of ['홈', '기록', '잠깐 멈춤', '오늘 기록', '복기']) {
    assert(nav.includes(`label: '${label}'`), `BottomNav is missing the tab label: ${label}`);
  }
  assert(!nav.includes("label: '체크인'"), 'BottomNav still shows the old 체크인 tab label');
});

// 35 — the chrome-shield extension must keep LEAST PRIVILEGE. The manifest may request
// ONLY the minimal permission it actually uses (declarativeNetRequest), must declare
// none of the dangerous extension keys/permissions (content_scripts / webRequest /
// tabs / cookies / scripting) on any surface, and the code must still carry no remote
// code / CDN / analytics, no explicit/adult terms, and no blocked-target leak. RC-7 adds
// externally_connectable for the app↔extension bridge — ALLOWED, but pinned NARROW here
// (NoF app origins only; no wildcard host). This pins the security-audit hardening so a
// future change that adds a risky permission/key — or widens the bridge — fails the build.
check('chrome-shield manifest keeps least privilege (minimal perms, no dangerous keys)', () => {
  const dir = 'extensions/chrome-shield';
  const mf = JSON.parse(read(`${dir}/manifest.json`));

  // Permission allow-list: the PoC may request ONLY what it actually uses.
  const ALLOWED_PERMS = ['declarativeNetRequest'];
  assert(Array.isArray(mf.permissions), 'manifest permissions is not an array');
  const extraPerms = mf.permissions.filter((p) => !ALLOWED_PERMS.includes(p));
  assert(extraPerms.length === 0, `manifest requests non-minimal permission(s): ${extraPerms.join(', ')}`);
  assert(mf.permissions.includes('declarativeNetRequest'), 'manifest lost the required declarativeNetRequest permission');

  // Dangerous keys/permissions must be absent on EVERY manifest surface (top-level
  // key, permissions, and optional_permissions / optional_host_permissions).
  const DANGEROUS = ['content_scripts', 'webRequest', 'tabs', 'cookies', 'scripting'];
  const optional = [...(mf.optional_permissions || []), ...(mf.optional_host_permissions || [])];
  for (const k of DANGEROUS) {
    assert(!(k in mf), `manifest declares a dangerous top-level key: ${k}`);
    assert(!mf.permissions.includes(k), `manifest requests a dangerous permission: ${k}`);
    assert(!optional.includes(k), `manifest requests a dangerous optional permission: ${k}`);
  }

  // RC-7: externally_connectable is ALLOWED (the app↔extension bridge needs it) but must
  // stay NARROW — scoped to the NoF app origins only. A broad/wildcard match would re-open
  // the very scope this least-privilege guard protects, so any wildcard host fails here.
  if ('externally_connectable' in mf) {
    const ecm = (mf.externally_connectable && mf.externally_connectable.matches) || [];
    assert(Array.isArray(ecm) && ecm.length > 0, 'externally_connectable present but has no matches allow-list');
    for (const bad of ['<all_urls>', '*://*/*', 'https://*/*', 'http://*/*', '*']) {
      assert(!ecm.includes(bad), `externally_connectable exposes a broad origin (${bad}) — keep it scoped to the NoF app`);
    }
  }

  // No remote code / CDN / analytics / external API / fetch / XHR in the extension code
  // (manifest host_permissions legitimately list http/https, so the manifest is exempt).
  const codeFiles = [
    'rules.json', 'signals.js', 'service_worker.js', 'blocked.html', 'blocked.js',
    'popup.html', 'popup.js', 'options.html', 'options.js',
  ];
  const remoteTokens = ['http://', 'https://', 'cdn.', 'googleapis', 'unpkg', 'jsdelivr', 'fetch(', 'XMLHttpRequest', 'import("http', 'analytics'];
  // RC-10: blocked.html/js legitimately carry the NoF app deep-link (a user-navigated return
  // target, NOT remote code). Exempt ONLY that exact origin for those two files; the adult-token
  // scan below still runs on the full source, and every other remote token still trips.
  const APP_DEEPLINK = 'https://nof-mauve.vercel.app';
  for (const f of codeFiles) {
    const s = read(`${dir}/${f}`);
    const scan = (f === 'blocked.html' || f === 'blocked.js') ? s.split(APP_DEEPLINK).join('') : s;
    for (const t of remoteTokens) {
      assert(!scan.includes(t), `${dir}/${f} pulls in remote code / network (${t}) — the PoC must stay local`);
    }
    for (const bad of ['porn', 'xxx', 'sex', 'adult', 'xvideos', 'nsfw']) {
      assert(!s.toLowerCase().includes(bad), `${dir}/${f} contains an explicit/adult token: ${bad}`);
    }
  }

  // The in-app pause page must still not leak the blocked target URL.
  const blockedJs = read(`${dir}/blocked.js`);
  for (const leak of ['referrer', 'URLSearchParams', 'document.URL']) {
    assert(!blockedJs.includes(leak), `blocked.js may reveal the visited target (${leak}) — the pause page must not show it`);
  }
});

// 36 — selectable status controls must expose aria-pressed (assistive-tech state),
// not only the data-selected visual hook, AND every sheet must keep honest dialog
// semantics: role="dialog" + aria-modal belong on the INNER .sheet while the dimmed
// .sheet-backdrop closes on outside click (onClick). Putting role on the backdrop would
// announce the dim layer as the dialog and (historically) shipped with no outside-click
// close. Window scans (not line matches) keep this robust to whitespace/attribute order.
check('selectable controls expose aria-pressed + sheets keep honest dialog semantics', () => {
  const exposesPressed = (file, cls) => {
    const src = read(file);
    const at = src.indexOf(`className="${cls}"`);
    assert(at !== -1, `${cls} not found in ${file}`);
    const tag = src.slice(at, at + 200);
    assert(
      tag.includes('data-selected') && tag.includes('aria-pressed'),
      `${cls} must expose aria-pressed alongside data-selected (${file})`,
    );
  };
  exposesPressed('src/screens/CheckinScreen.jsx', 'checkin-tap');
  exposesPressed('src/screens/DisciplineScreen.jsx', 'status-option');

  // For each .sheet-backdrop, the span up to its inner .sheet (the backdrop's own
  // opening tag) must carry onClick and NOT role="dialog"; the inner .sheet must.
  const sheetsAccessible = (file) => {
    const src = read(file);
    let i = src.indexOf('className="sheet-backdrop"');
    let n = 0;
    while (i !== -1) {
      const innerAt = src.indexOf('className="sheet"', i);
      assert(innerAt !== -1, `${file}: a .sheet-backdrop has no inner .sheet`);
      const backdropTag = src.slice(i, innerAt);
      assert(
        !backdropTag.includes('role="dialog"'),
        `${file}: role="dialog" must live on the inner .sheet, not the .sheet-backdrop`,
      );
      assert(
        backdropTag.includes('onClick'),
        `${file}: .sheet-backdrop must close on outside click (onClick missing)`,
      );
      const innerTag = src.slice(innerAt, innerAt + 200);
      assert(
        innerTag.includes('role="dialog"') && innerTag.includes('aria-modal'),
        `${file}: inner .sheet must carry role="dialog" + aria-modal`,
      );
      n += 1;
      i = src.indexOf('className="sheet-backdrop"', i + 1);
    }
    assert(n >= 1, `${file}: expected at least one sheet-backdrop`);
  };
  sheetsAccessible('src/screens/HomeScreen.jsx');
  sheetsAccessible('src/screens/DisciplineScreen.jsx');
});

// 37 — the real-blocking path must be DISCOVERABLE from the running app yet honestly
// bounded. A dedicated ShieldExtensionScreen (routed 'shieldExtension', linked from the
// Shield screen) must say the in-app list is only a plan, that the real test runs only
// in the Chrome extension, name the harmless test token, steer users away from hunting
// risky sites, and carry NO real adult URL / explicit term, NO mobile/SNS/image/video/
// whole-web blocking claim, NO "the app blocks browsing" claim, and NO network/remote
// sink (the only address shown is the reserved example.com test URL). Shield stays planner-only.
check('shield real-blocking test path is discoverable AND honestly bounded (extension-only, no overclaim)', () => {
  // Route + wiring: the new screen is imported and registered, and Shield links to it.
  const app = read('src/App.jsx');
  assert(app.includes('import ShieldExtensionScreen from'), 'App.jsx does not import ShieldExtensionScreen');
  assert(app.includes("id: 'shieldExtension'"), "App.jsx does not route a 'shieldExtension' screen");
  assert(app.includes('Component: ShieldExtensionScreen'), "App.jsx route 'shieldExtension' is not mapped to ShieldExtensionScreen");

  const shield = read('src/screens/ShieldScreen.jsx');
  assert(shield.includes("onNavigate('shieldExtension')"), 'Shield screen has no entry to the Chrome extension test screen');
  // Shield itself must remain planner-only / non-enforcing (pinned here too).
  assert(shield.includes('이 목록은 아직 차단에 쓰이지 않아요'), 'Shield screen is no longer planner-only (missing "list does not block yet" banner)');

  let screen;
  try {
    screen = read('src/screens/ShieldExtensionScreen.jsx');
  } catch {
    throw new Error('src/screens/ShieldExtensionScreen.jsx is missing');
  }

  // Honest separation copy: in-app list is a plan; real test is extension-only; harmless.
  for (const must of [
    '앱 안 신호 목록은 아직 계획이에요.',
    '실제 차단 테스트는 Chrome 확장에서만 동작해요.',
    '해롭지 않은 테스트 신호만 사용해요.',
    '위험한 사이트를 직접 찾지 마세요.',
    'nof-test-risk-signal',
    'chrome://extensions',
    'extensions/chrome-shield',
    // Managed-browser honesty: org policy may block unpacked install; never tell users to bypass.
    '회사/조직에서 관리하는 브라우저',
    '정책을 우회하지',
  ]) {
    assert(screen.includes(must), `ShieldExtensionScreen is missing required honest copy: ${must}`);
  }
  // A back path must exist.
  assert(screen.includes("onNavigate('home')"), 'ShieldExtensionScreen has no back path to Home');

  // No present-tense fake-blocking claim (same canonical detector as #29/#30/#31).
  for (const fake of ['차단했어요', '차단하고 있어요', '차단 중이에요', '막고 있어요', '차단되었어요']) {
    assert(!screen.includes(fake), `ShieldExtensionScreen makes a fake working-blocking claim: ${fake}`);
  }
  // No claim of mobile / SNS / image / video blocking — the screen must not even name
  // those surfaces (it is Chrome-desktop-test-only; the extension README owns scope).
  for (const noun of ['iOS', 'Android', '모바일', 'SNS', '이미지', '영상', '동영상']) {
    assert(!screen.includes(noun), `ShieldExtensionScreen names an out-of-scope blocking surface: ${noun}`);
  }
  // No whole-web / app-blocks-browsing overclaim.
  for (const over of ['모든 사이트', '모든 웹', '웹 전체', '앱이 차단', '앱에서 차단', '앱이 막아']) {
    assert(!screen.includes(over), `ShieldExtensionScreen overclaims blocking scope: ${over}`);
  }
  // No explicit / adult tokens (reuse the existing extension-audit blocklist).
  for (const bad of ['porn', 'xxx', 'sex', 'adult', 'xvideos', 'nsfw']) {
    assert(!screen.toLowerCase().includes(bad), `ShieldExtensionScreen contains an explicit/adult token: ${bad}`);
  }
  // No network / remote-code / external-API sink. NOTE: target real call sites — the
  // bare 'http' substring is intentionally NOT banned because the harmless example URL
  // contains it; instead, strip that one allowed literal and assert nothing else has http.
  for (const sink of ['fetch(', 'XMLHttpRequest', 'window.open', '<iframe', 'import("http', "import('http", 'href="http', "href='http"]) {
    assert(!screen.includes(sink), `ShieldExtensionScreen adds a network/remote sink: ${sink}`);
  }
  const allowedExample = 'https://example.com/?q=nof-test-risk-signal';
  assert(screen.includes(allowedExample), 'ShieldExtensionScreen is missing the labelled harmless test example URL');
  const withoutExample = screen.split(allowedExample).join('');
  assert(!withoutExample.includes('http'), 'ShieldExtensionScreen contains an http(s) literal other than the harmless test example');
});

// 38 — local persistence is honest: state is saved to localStorage ONLY via the
// versioned storage util, with NO network/analytics sink anywhere on the path, and
// the saved bundle carries NO browsing/visited/extension-blocked-target data. The
// Shield planner stays non-enforcing even though its signal list now persists.
check('local persistence is localStorage-only, no network, no browsing-target leak', () => {
  // (a) The storage util exists, uses the versioned key, exports load/save.
  let storage;
  try {
    storage = read('src/utils/storage.js');
  } catch {
    throw new Error('src/utils/storage.js is missing');
  }
  assert(storage.includes("'nof.mvp.state.v1'"), 'storage.js does not use the versioned key nof.mvp.state.v1');
  assert(/export function loadState\(/.test(storage), 'storage.js does not export loadState()');
  assert(/export function saveState\(/.test(storage), 'storage.js does not export saveState(');
  assert(storage.includes('localStorage'), 'storage.js does not use localStorage');

  const app = read('src/App.jsx');
  // (b) App actually wires the util in — load once, save on change.
  assert(app.includes("from './utils/storage.js'"), 'App.jsx does not import the storage util');
  assert(/useState\(\(\) => loadState\(\)\)/.test(app), 'App.jsx does not load persisted state via loadState() on init');
  assert(/saveState\(\{/.test(app), 'App.jsx does not save state via saveState(');

  // (c) No network / remote / analytics sink on the persistence path (storage.js + App).
  // localStorage is the ONLY allowed sink. Comment lines are exempt (storage.js documents
  // the banned APIs by name in its honesty note); only real code lines count.
  const sinks = ['fetch(', 'XMLHttpRequest', 'WebSocket', 'navigator.sendBeacon', 'EventSource', 'import("http', "import('http"];
  const analytics = ['analytics', 'telemetry', 'gtag', 'mixpanel', 'amplitude', 'sentry', 'datadog'];
  for (const f of ['src/utils/storage.js', 'src/App.jsx']) {
    read(f).split('\n').forEach((line, i) => {
      if (isCommentLine(line)) return;
      for (const sink of sinks) {
        assert(!line.includes(sink), `${f}:${i + 1} introduces a network/remote sink on the persistence path: ${sink}`);
      }
      for (const a of analytics) {
        assert(!line.toLowerCase().includes(a), `${f}:${i + 1} introduces an analytics/telemetry sink: ${a}`);
      }
    });
  }
  // storage.js carries no http(s) literal at all (it is a pure localStorage box).
  assert(!storage.includes('http'), 'storage.js contains an http(s) literal — it must be localStorage-only');

  // (d) The saved bundle must NOT persist browsing history / visited or blocked targets
  // / Chrome-extension activity. (Counter `history` is run lengths, not URLs — allowed.)
  const m = app.match(/saveState\(\{[\s\S]*?\}\)/);
  assert(m, 'could not locate the saveState({...}) bundle in App.jsx');
  const bundle = m[0];
  for (const banned of ['blockedTarget', 'blockedUrl', 'visitedUrl', 'visitedTarget', 'visited', 'browsingHistory', 'extensionActivity', 'http']) {
    assert(!bundle.includes(banned), `saveState bundle persists a forbidden browsing/extension field: ${banned}`);
  }
  // It SHOULD persist the core domain slices (spot-check the load-bearing ones).
  for (const key of ['counters', 'rules', 'todayRecord', 'blocklist', 'emberShards', 'claimedRewardIds']) {
    assert(new RegExp(`\\b${key}\\b`).test(bundle), `saveState bundle is missing the persisted slice: ${key}`);
  }

  // (e) Persisting the Shield signal list did not turn it into an enforcer: the planner
  // banner stays and no present-tense fake-block claim appears (same detector as #29/#37).
  const shield = read('src/screens/ShieldScreen.jsx');
  assert(shield.includes('이 목록은 아직 차단에 쓰이지 않아요'), 'Shield planner banner missing — persistence must not imply enforcement');
  for (const fake of ['차단했어요', '차단하고 있어요', '차단 중이에요', '막고 있어요', '차단되었어요']) {
    assert(!shield.includes(fake), `Shield screen now makes a fake working-blocking claim: ${fake}`);
  }
});

// 39 — Pet-room tiny real-interaction round. Feeding must (a) surface the persisted
// cumulative feed count (petCareState.fedCount) so a feed leaves a lasting trace, not
// just a one-frame flash, and (b) keep the honest hand-off label 간식 놓아주기 with no
// cat-eating claim. And the AddRuleSheet new-counter name must auto-suggest from the
// rule label non-destructively: a touched flag (ncNameTouched) latches on the user's
// first manual edit so the suggestion can never overwrite what they typed.
check('pet feed surfaces persisted count + honest label; rule sheet auto-suggests counter name', () => {
  const screen = read('src/screens/PetRewardScreen.jsx');
  assert(
    screen.includes('petCareState.fedCount'),
    'pet feed area does not surface the persisted petCareState.fedCount (feed leaves no lasting trace)',
  );
  assert(screen.includes('간식 놓아주기'), 'honest feed label (간식 놓아주기) missing');
  for (const eat of ['먹었', '먹는', '먹이를 먹']) {
    assert(!screen.includes(eat), `pet screen makes a cat-eating claim: ${eat}`);
  }
  // R-8: while the room is a static composite scene, copy must speak in
  // room-state terms — no gaze / mood-reading / approach lines that set up a
  // live-reaction expectation the scene cannot honor.
  const reactionPool = read('src/constants/roomItems.js');
  for (const reacty of ['바라봐', '기분 좋아', '가까이 온']) {
    assert(!screen.includes(reacty), `pet screen reads the cat's gaze/mood over a static scene: ${reacty}`);
    assert(!reactionPool.includes(reacty), `feed reaction pool reads the cat's gaze/mood over a static scene: ${reacty}`);
  }
  const disc = read('src/screens/DisciplineScreen.jsx');
  assert(
    disc.includes('ncNameTouched'),
    'AddRuleSheet has no touched flag (ncNameTouched) for non-destructive auto-suggest',
  );
  assert(
    disc.includes('setNcNameTouched(true)'),
    'AddRuleSheet does not latch the touched flag on the user\'s manual counter-name edit',
  );
  assert(
    disc.includes('!ncNameTouched'),
    'AddRuleSheet auto-suggest is not gated by the touched flag — it could overwrite user input',
  );
  assert(
    disc.includes('setNcName(label)'),
    'AddRuleSheet does not auto-suggest the new-counter name from the rule label',
  );
});

// 40 — internal stage vocabulary must never reach user-facing product copy. Words
// like 프로토타입 / MVP / P0 / WIP are team-stage labels (COPY_POLICY §4.1); honest
// boundaries are said in user words instead (실험, 준비 중). Product surfaces =
// src/screens + src/components + src/constants + src/App.jsx. Excluded on purpose:
// the dev-only ScreenSwitcher — but ONLY while it stays gated behind DEBUG_NAV
// (debugNavEnabled(): DEV / explicit ?dev=1), which is asserted here so un-gating
// it fails this check; and extensions/chrome-shield, a separately installed
// desktop test artifact whose 프로토타입 label guard #32 REQUIRES. Comments are
// exempt: block comments are blanked line-preservingly, and a // line comment is
// cut only when preceded by line start or whitespace so 'https://…' literals survive.
check('no internal stage vocabulary (프로토타입/MVP/P0/WIP) in user-facing product source', () => {
  const app = read('src/App.jsx');
  assert(/function debugNavEnabled\(/.test(app), 'debugNavEnabled() gate missing from App.jsx');
  assert(
    /DEBUG_NAV \?[\s\S]{0,120}<ScreenSwitcher/.test(app),
    'ScreenSwitcher is no longer gated behind DEBUG_NAV — an un-gated switcher ships stage labels to users',
  );

  const files = [
    ...walk(join(ROOT, 'src/screens'), ['.jsx', '.js']),
    ...walk(join(ROOT, 'src/components'), ['.jsx', '.js']),
    ...walk(join(ROOT, 'src/constants'), ['.jsx', '.js']),
    join(ROOT, 'src/App.jsx'),
  ].filter((f) => !f.endsWith('ScreenSwitcher.jsx'));

  const stripComments = (s) =>
    s
      .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
      .split('\n')
      .map((line) => line.replace(/(^|\s)\/\/.*$/, '$1'))
      .join('\n');

  const offenders = [];
  for (const f of files) {
    stripComments(readFileSync(f, 'utf8')).split('\n').forEach((line, i) => {
      if (line.includes('프로토타입')) offenders.push(`${rel(f)}:${i + 1} (프로토타입)`);
      for (const word of ['MVP', 'P0', 'WIP']) {
        if (new RegExp(`\\b${word}\\b`).test(line)) offenders.push(`${rel(f)}:${i + 1} (${word})`);
      }
    });
  }
  assert(offenders.length === 0, `internal stage vocabulary in product source: ${offenders.join('; ')}`);
});

// R-10: the product names the multi-counter concept with ONE vocabulary family.
// The Home title says 절제 시간, so every product surface says 절제 카운터 — the
// 금욕 family is search/community vocabulary (COPY_POLICY) and stays out of
// product copy entirely (Home R-10, then DisciplineScreen/ShieldScreen helper
// copy in the residual-cleanup batch). User free-naming is not restricted —
// this pins NoF-authored strings only.
check('product speaks one counter vocabulary (절제 카운터, no 금욕 in product copy)', () => {
  const home = read('src/screens/HomeScreen.jsx');
  assert(home.includes('절제 카운터'), 'Home counter section label 절제 카운터 missing');
  assert(!home.includes('금욕'), 'Home surface still uses 금욕 vocabulary (R-10)');
  for (const file of ['src/screens/DisciplineScreen.jsx', 'src/screens/ShieldScreen.jsx']) {
    assert(!read(file).includes('금욕'), `${file} still uses 금욕 vocabulary (residual cleanup)`);
  }
});

// R-12: the counter sheets must disclose, inline and live, the two quiet input
// corrections App applies on save (a future start clamped to now; an empty or
// invalid target defaulting to 30 days on add / keeping the existing target on
// edit). A silently rewritten input is an honesty bug even when small.
check('counter sheets disclose start/target auto-corrections instead of applying them silently', () => {
  const home = read('src/screens/HomeScreen.jsx');
  assert(home.includes('시작 시점을 지금으로 맞춰요'), 'future-start clamp disclosure missing');
  assert(home.includes('30일로 저장돼요'), 'empty-target default disclosure missing (add sheet)');
  assert(home.includes('지금 목표 그대로 유지돼요'), 'empty-target keep disclosure missing (edit sheet)');
  assert(
    /startInFuture[\s\S]{0,120}dateTimeToMs\(date, time\) > Date\.now\(\)/.test(home),
    'live future-start detection missing from the sheets',
  );
});

// R-13: the iPhone status-bar mockup (9:41 · notch) is demo-shell chrome, not
// product UI. It must stay isolated behind the DEMO_FRAME flag (demoFrameEnabled():
// default on for the P0 demo, ?frame=0 persisted opt-out) so a product cut can
// drop the double frame without surgery. Un-gating it fails this check.
check('demo status-bar mockup stays isolated behind the DEMO_FRAME flag', () => {
  const app = read('src/App.jsx');
  assert(/function demoFrameEnabled\(/.test(app), 'demoFrameEnabled() flag missing from App.jsx');
  assert(/params\.get\('frame'\)/.test(app), 'demo frame flag does not read the ?frame param');
  assert(
    /DEMO_FRAME \?[\s\S]{0,160}device-status-bar/.test(app),
    'device-status-bar is no longer gated behind DEMO_FRAME — demo chrome ships un-isolated',
  );
});

// Scene Mode v1: the pet-room scene viewer shows preset finished images (room
// moods + cat poses) as honestly labeled static views. It must disclose that
// nothing moves and the view choice is not saved, must resolve art through the
// petAssets registry (never hardcoded paths), and must never grow drag handlers
// or cat motion/feeling claims — those need real assets first (guardrails doc).
check('pet-room scene viewer stays a disclosed static preset display', () => {
  const viewer = read('src/components/PetSceneViewer.jsx');
  assert(viewer.includes('미리 그려둔'), 'viewer does not say the scenes are pre-drawn presets');
  assert(viewer.includes('움직이'), 'viewer does not disclose that the scene does not move');
  assert(viewer.includes('저장되지 않아요'), 'viewer does not disclose the view choice is not saved');
  assert(
    /resolveRoomAsset|resolveCatAsset/.test(viewer),
    'viewer does not resolve art through the petAssets registry',
  );
  for (const banned of ['onPointerDown', 'beginPlaceDrag', 'draggable', '먹었', '꼬리', '기지개']) {
    assert(!viewer.includes(banned), `viewer contains banned token: ${banned}`);
  }
  assert(
    /THEME_BY_ID/.test(viewer) && /cost === 0/.test(viewer),
    'viewer ownership must mirror shop semantics (cost-0 seeded theme counts as owned)',
  );
  const screen = read('src/screens/PetRewardScreen.jsx');
  assert(screen.includes('PetSceneViewer'), 'PetRewardScreen does not render the scene viewer');
});

// Check-in / Journal v1: the daily capture flow writes the user's mood, urge,
// trigger and a free-text note through onCompleteCheckin into today's record, which
// App persists to localStorage ONLY (guard #38). Because it persists locally, the
// screen MUST disclose the local-only storage in calm Korean and read today's saved
// record back as a saved-state summary (no blank re-entry). It must NEVER imply
// cloud sync, AI analysis, medical treatment, or real blocking, and must carry no
// shaming / punishing / religious vocabulary (COPY_POLICY §0.5.8.1).
check('check-in journal is honest: local-only disclosure, saved state, no fake cloud/AI/medical/shame', () => {
  const screen = read('src/screens/CheckinScreen.jsx');

  // (a) Local-only storage disclosure must be present in user-facing copy.
  assert(
    screen.includes('이 기기에만 저장'),
    'CheckinScreen is missing the local-only storage disclosure (이 기기에만 저장…)',
  );

  // (b) RC-1: the check-in is WRITING-FIRST. The user's own three writing fields
  // (오늘 회고 / 나와의 약속 / 오늘의 다짐) exist as the primary content and the gate, and
  // all three are threaded through onCompleteCheckin AND persisted by App. 오늘 회고 reuses
  // the persisted `note` field so the records/home read-back keeps flowing.
  for (const field of ['오늘 회고', '나와의 약속', '오늘의 다짐']) {
    assert(screen.includes(field), `check-in writing field (${field}) missing`);
  }
  assert(/<textarea/.test(screen), 'check-in free-text writing (textarea) missing');
  assert(/onCompleteCheckin\(\{[\s\S]*?note[\s\S]*?promise[\s\S]*?resolve/.test(screen), 'check-in does not pass note + promise + resolve to onCompleteCheckin');
  // The gate is the user's writing, not the optional survey: step1Ready reads the
  // three writing fields, never mood/urge.
  assert(
    /const step1Ready = \[note, promise, resolve\]\.some/.test(screen),
    'check-in gate (step1Ready) is not driven by the user writing fields (note/promise/resolve)',
  );
  // (b2) The optional 오늘 상태 survey (mood / urge / trigger) stays available but secondary.
  assert(screen.includes('오늘 상태 (선택)'), 'optional 오늘 상태 (선택) survey section missing');
  assert(screen.includes('오늘 기분'), 'check-in mood field (오늘 기분) missing');
  assert(screen.includes('충동 강도'), 'check-in urge field (충동 강도) missing');
  assert(screen.includes('트리거'), 'check-in trigger field (트리거) missing');
  // App normalizes the three writing fields into savedCheckin and writes that object to
  // today's record (and the rolling ledger) — so the user's words are persisted.
  const appSrc = read('src/App.jsx');
  assert(
    /note:\s*typeof checkin\.note === 'string'/.test(appSrc) && /checkin:\s*savedCheckin/.test(appSrc),
    'App.completeCheckin does not persist the check-in note',
  );
  assert(
    /promise:\s*typeof checkin\.promise === 'string'/.test(appSrc) && /resolve:\s*typeof checkin\.resolve === 'string'/.test(appSrc),
    'App.completeCheckin does not persist the 나와의 약속 / 오늘의 다짐 writing fields',
  );

  // (c) Saved/empty state: re-opening after today's check-in reads the saved record
  // back (todayRecord) instead of forcing a blank form.
  assert(screen.includes('todayRecord'), 'CheckinScreen does not read todayRecord (no saved-state summary)');

  // (d) No fake cloud-sync / AI-analysis / medical-treatment / real-blocking claims.
  for (const fake of [
    '클라우드', '동기화', '서버에 저장', '백업',
    'AI가', 'AI 분석', '인공지능', '자동 분석',
    '치료', '진단', '처방', '의학',
    '차단했어요', '차단하고 있어요', '차단 중이에요',
  ]) {
    assert(!screen.includes(fake), `CheckinScreen makes a fake cloud/AI/medical/blocking claim: ${fake}`);
  }

  // (e) No shaming / punishing / religious vocabulary.
  for (const bad of ['위반', '벌점', '실패자', '강등', '랭킹', '점수', '회개', '심판']) {
    assert(!screen.includes(bad), `CheckinScreen carries shaming/punishing/religious vocabulary: ${bad}`);
  }
});

// Records / 최근 기록 v2: the Calendar day-detail sheet reads today's saved check-in
// back (mood / urge / trigger / note). The note is the field that was captured in
// Check-in v1 but never surfaced in Records — it must now render. Today's detail also
// shows a calm, non-shaming empty state when no check-in exists yet. Like the capture
// screen, Records must NEVER imply cloud sync, AI analysis, medical treatment, or real
// blocking, and must carry no shaming / religious vocabulary (COPY_POLICY §0.5.8.1).
check('records day-detail surfaces the check-in note + calm empty state, no fake cloud/AI/medical/shame', () => {
  const screen = read('src/screens/CalendarScreen.jsx');

  // (a) The day-detail check-in block reads the persisted writing back: 오늘 회고 (note),
  // 나와의 약속 (promise) and 오늘의 다짐 (resolve) — the user's own words (RC-1).
  assert(/day\.checkin\.note/.test(screen), 'CalendarScreen day-detail does not read the check-in note (day.checkin.note)');
  assert(/day\.checkin\.promise/.test(screen), 'CalendarScreen day-detail does not read back 나와의 약속 (day.checkin.promise)');
  assert(/day\.checkin\.resolve/.test(screen), 'CalendarScreen day-detail does not read back 오늘의 다짐 (day.checkin.resolve)');

  // (b) Mood / urge / trigger read-back stays present alongside the note.
  assert(screen.includes('오늘의 기록'), 'CalendarScreen is missing the 오늘의 기록 detail block');
  assert(/day\.checkin\.moodLabel/.test(screen), 'CalendarScreen day-detail dropped the mood read-back');
  assert(/day\.checkin\.urge/.test(screen), 'CalendarScreen day-detail dropped the urge read-back');
  assert(/day\.checkin\.triggers/.test(screen), 'CalendarScreen day-detail dropped the trigger read-back');

  // (c) A calm empty state exists for today when no check-in is saved yet.
  assert(
    /day\.isToday/.test(screen) && screen.includes('아직 오늘 기록을 남기지 않았어요'),
    'CalendarScreen is missing the calm today empty state for an unsaved check-in',
  );

  // (d) No fake cloud-sync / AI-analysis / medical-treatment / real-blocking claims.
  for (const fake of [
    '클라우드', '동기화', '서버에 저장', '백업',
    'AI가', 'AI 분석', '인공지능', '자동 분석',
    '치료', '진단', '처방', '의학',
    '차단했어요', '차단하고 있어요', '차단 중이에요',
  ]) {
    assert(!screen.includes(fake), `CalendarScreen makes a fake cloud/AI/medical/blocking claim: ${fake}`);
  }

  // (e) No shaming / punishing / religious vocabulary.
  for (const bad of ['위반', '벌점', '실패자', '강등', '랭킹', '점수', '회개', '심판']) {
    assert(!screen.includes(bad), `CalendarScreen carries shaming/punishing/religious vocabulary: ${bad}`);
  }

  // (f) C4: the record surface speaks the one counter vocabulary too — no 금욕 in the
  // day-detail screen or the day-record builder (R-10 covers Home/Discipline/Shield;
  // this pins the Records surface the saved note reads back on).
  const builder = read('src/constants/recentDays.js');
  assert(!screen.includes('금욕'), 'CalendarScreen uses 금욕 vocabulary (one-vocabulary policy)');
  assert(!builder.includes('금욕'), 'recentDays.js uses 금욕 vocabulary (one-vocabulary policy)');

  // (g) C4: the record read-back shows only PERSISTED check-in data (todayRecord /
  // checkinLedger). The transient C3 urge-screen draft (checkinNoteDraft) must never
  // leak into the Records surface — a draft is not a saved note.
  assert(
    !screen.includes('checkinNoteDraft') && !builder.includes('checkinNoteDraft'),
    'Records surface reads the transient checkinNoteDraft — day-detail must only show persisted check-in data',
  );
});

// Character Growth Loop v1: the pet room surfaces a DERIVED warmth/growth status from
// LOCAL records only (today's check-in + the abstinence streak + earned 잔불 조각). It
// must read today's check-in from todayRecord, disclose the local-record basis, and
// explicitly deny a live pet reaction AND automatic growth/evolution — the cat is a
// static composite (no animation/sound/eating claim). No AI/cloud/medical claims, no
// shaming / punishing / decay copy (COPY_POLICY §0.5.8.1).
check('pet growth surface is honest: local-record basis, no fake evolution/live-reaction/AI/cloud/shame', () => {
  const screen = read('src/screens/PetRewardScreen.jsx');

  // (a) The derived warmth/growth surface exists and reads today's check-in locally.
  assert(screen.includes('고양이 방 온기'), 'PetRewardScreen is missing the 고양이 방 온기 growth surface');
  assert(/todayRecord\?\.checkin/.test(screen), 'pet growth does not derive today check-in from local todayRecord');

  // (b) Discloses the local-record basis AND denies live reaction + auto-growth.
  assert(screen.includes('기기에 저장된'), 'pet growth surface does not disclose the local-record basis');
  assert(/실시간으로\s+반응/.test(screen) && screen.includes('아니'), 'pet growth surface does not deny a live pet reaction');
  assert(/저절로\s+자라/.test(screen) && screen.includes('아니'), 'pet growth surface does not deny automatic growth/evolution');

  // (c) No fake evolution / live-reaction / AI / cloud / medical claims.
  for (const fake of [
    '성장했어요', '성장했습니다', '진화', '레벨업',
    '실시간으로 반응해요', '실시간 반응',
    'AI가', 'AI 분석', '인공지능', '자동 분석',
    '클라우드', '동기화', '서버에 저장',
    '치료', '진단', '처방',
  ]) {
    assert(!screen.includes(fake), `pet growth surface makes a fake evolution/AI/cloud/medical claim: ${fake}`);
  }

  // (d) No shaming / punishing / decay / religious vocabulary.
  for (const bad of ['위반', '벌점', '실패자', '강등', '랭킹', '점수', '회개', '심판', '망가져']) {
    assert(!screen.includes(bad), `pet growth surface carries shaming/punishing/decay vocabulary: ${bad}`);
  }
});

// Pet feed day-scoping (Character Growth): the snack hand-off must produce a
// DAY-SCOPED "fed today" signal, not only a cumulative lifetime fedCount. App stamps
// the calendar day of the hand-off (fedDay via dayKey) and derives petFedToday by
// comparing that stamp to today's dayKey, so a stale yesterday stamp reads false. The
// pet room consumes that signal and reflects today's hand-off as an honest delivery —
// never an eating, live-reaction, or auto-growth/evolution claim.
check('pet feed signal is day-scoped + honest: fedDay stamped by dayKey, no fake eating/live-reaction', () => {
  const app = read('src/App.jsx');
  const screen = read('src/screens/PetRewardScreen.jsx');

  // (a) feedSnack stamps a calendar-day key (day-scoped), not just a cumulative count.
  assert(/fedDay:\s*dayKey\(/.test(app), 'feedSnack does not stamp a day-scoped fedDay via dayKey');

  // (b) App derives "fed today" by comparing the stored fedDay to today's dayKey and
  // passes it down — so the signal can't be faked from the cumulative tally alone.
  assert(/fedDay === dayKey\(/.test(app), 'App does not derive petFedToday from fedDay === dayKey(today)');
  assert(/petFedToday/.test(app), 'App does not pass a petFedToday signal to the pet room');

  // (c) The pet room consumes the day-scoped signal and reflects today's hand-off honestly.
  assert(/petFedToday/.test(screen), 'PetRewardScreen does not consume the day-scoped petFedToday signal');
  assert(
    screen.includes('오늘 간식 놓아주기 완료') || screen.includes('오늘의 방 온기에 반영'),
    "pet feed surface does not honestly reflect today's snack hand-off",
  );

  // (d) Still no fake eating / live-reaction / auto-growth/evolution claim.
  for (const fake of ['고양이가 먹었', '먹었어요', '실시간으로 반응해요', '성장했어요', '성장했습니다', '진화', '레벨업']) {
    assert(!screen.includes(fake), `pet feed surface makes a fake eating/reaction/evolution claim: ${fake}`);
  }
});

// Rolling check-in ledger (Records history, storage integration): completeCheckin must
// persist each day's check-in into a localStorage-only map keyed by the calendar day
// (dayKey), so Records can later read REAL past-day entries. The ledger must start EMPTY
// (no fabricated history), ride the same no-network storage box as the rest of the
// bundle (guard #38), and store the same normalized fields shown in the live read-back.
check('check-in ledger is localStorage-only + day-keyed, no fabricated history', () => {
  const app = read('src/App.jsx');
  const store = read('src/utils/storage.js');

  // (a) The ledger exists and starts empty — no seeded/fabricated past check-ins.
  assert(/checkinLedger/.test(app), 'App has no checkinLedger state');
  assert(/persisted\?\.checkinLedger \?\? \{\}/.test(app), 'checkinLedger does not start empty (risk of fabricated history)');

  // (b) Entries are keyed by the calendar-day key and written from a real check-in.
  assert(/todayKey = dayKey\(/.test(app), 'completeCheckin does not derive a dayKey for the ledger key');
  assert(
    /setCheckinLedger\(\(prev\) => \(\{ \.\.\.prev, \[todayKey\]: savedCheckin \}\)\)/.test(app),
    'completeCheckin does not append the saved check-in to the ledger under its dayKey',
  );

  // (c) The ledger is in the persisted bundle (survives reload) and rides the
  // localStorage-only, no-network storage box (guard #38).
  assert(/saveState\(\{[\s\S]*checkinLedger[\s\S]*\}\)/.test(app), 'checkinLedger is not included in the persisted bundle');
  // Match CALL-form network primitives, not bare words — storage.js's privacy comment
  // names "fetch / XMLHttpRequest / WebSocket" to PROMISE it makes none, and a bare-word
  // scan would false-positive on that disclosure (see docs/NOF_LOOP_FAILURE_LOG.md).
  assert(
    !/fetch\(|new XMLHttpRequest|new WebSocket\(|sendBeacon\(/.test(store),
    'storage box must stay localStorage-only (no network) for the check-in ledger',
  );
});

// Records history read (RC-2A monthly calendar): the 기록 calendar must read REAL records
// from the rolling checkinLedger by date and NEVER fabricate them. The seeded sample was
// removed from recentDays.js, and CalendarScreen reads the ledger entry for a date with an
// honest null fallback (today from the live record, past days from the ledger). A past
// day's block is labelled day-aware ("그날의 기록"). No fake cloud/AI/medical claims and no
// shaming vocabulary on the read surface (COPY_POLICY §0.5.8.1).
check('records reads historical check-ins from the ledger, no fabricated history', () => {
  const rd = read('src/constants/recentDays.js');
  const cal = read('src/screens/CalendarScreen.jsx');

  // (a) The fabricated past-day SEED sample is gone from recentDays.js entirely.
  assert(!/const SEED\s*=/.test(rd), 'recentDays.js still defines a fabricated SEED sample of past records');
  assert(!rd.includes('밤 늦게 짧게 무너질 뻔했어요'), 'recentDays.js still carries a fabricated past-record reflection');

  // (b) The calendar reads the real ledger by date, with an honest null fallback (no invented
  //     history) — today from the live record, every other day straight from the ledger.
  assert(/checkinLedger/.test(cal), 'CalendarScreen does not read the check-in ledger');
  assert(
    /ledger\[dateMs\] \?\? null/.test(cal),
    'CalendarScreen does not read ledger[dateMs] with an honest null fallback (risk of fabricated history)',
  );
  assert(/const recordFor = /.test(cal), 'CalendarScreen has no single ledger-by-date record resolver (recordFor)');
  // It must NOT pull in the old seeded day-builder.
  assert(!cal.includes('buildDayRecords'), 'CalendarScreen must not use the seeded day-record builder (read the ledger by date)');

  // (c) A past day's record block is labelled day-aware, not the hardcoded "오늘의".
  assert(
    /day\.isToday \? '오늘의 기록' : '그날의 기록'/.test(cal),
    'CalendarScreen does not label a past-day record as 그날의 기록',
  );

  // (d) No fake cloud/AI/medical/blocking + no shaming vocabulary on the read surface.
  for (const fake of ['클라우드', '동기화', '서버에 저장', 'AI가', 'AI 분석', '인공지능', '자동 분석', '치료', '진단', '처방', '차단했어요']) {
    assert(!cal.includes(fake), `CalendarScreen makes a fake cloud/AI/medical/blocking claim: ${fake}`);
  }
  for (const bad of ['위반', '벌점', '실패자', '강등', '랭킹', '점수', '회개', '심판']) {
    assert(!cal.includes(bad), `CalendarScreen carries shaming/punishing/religious vocabulary: ${bad}`);
  }
});

// 52 — C1 crisis routine: the 잠깐 멈춤 screen offers an honest, guided 5-step
// alternative-activity routine (breathe → step away → move → pick a replacement →
// finish). It must stay text/action-only (no fake video/audio), must NOT claim a
// durable saved log of the routine, and its 마치기 must delegate to the SAME
// once-per-day onCrisisHeld grant — UrgeScreen can never earn/grant on its own, so
// the routine cannot farm 잔불 조각. Tone stays self-control, never shame/medical.
check('crisis routine is an honest guided 5-step flow routed to the gated 마치기', () => {
  const urge = read('src/screens/UrgeScreen.jsx');

  // (a) Guided routine exists and is reachable from the crisis screen.
  assert(urge.includes('ROUTINE_STEPS'), 'crisis routine steps (ROUTINE_STEPS) missing');
  assert(urge.includes("setView('routine')"), 'no entry into the guided routine (setView(routine))');
  assert(urge.includes('5분 루틴 따라가기'), 'routine entry button (5분 루틴 따라가기) missing');

  // (b) The 5 ordered steps are present. breathe's id is shared with an ALT_ACTION,
  //     so the other four distinctive ids pin the routine shape.
  for (const id of ['step_away', 'move', 'replace', 'done']) {
    assert(new RegExp(`id: '${id}'`).test(urge), `crisis routine step missing: ${id}`);
  }
  assert(urge.includes('지금은 5분만 버티면 됩니다'), 'routine 5분 framing copy missing');

  // (c) Completion delegates to the once-per-day crisis grant — UrgeScreen itself
  //     must never earn/grant (no farm, no self-owned fake reward path).
  assert(urge.includes('완료했어요 · 마치기'), 'routine completion button (완료했어요 · 마치기) missing');
  assert(/onCrisisHeld\?\.\(\)/.test(urge), 'routine completion does not call onCrisisHeld');
  for (const grant of ['earn(', 'EARN.', 'setCrisisRewardDay']) {
    assert(!urge.includes(grant), `UrgeScreen fakes its own grant (${grant}) instead of delegating to onCrisisHeld`);
  }

  // (d) Honest media + history: no fake video/audio guide or cloud/medical claim, and
  //     the no-durable-log disclosure is present (routine must not claim saved history).
  for (const fake of ['동영상', '영상 가이드', '음성 가이드', '자동 재생', '클라우드', 'AI가', '치료', '진단', '처방']) {
    assert(!urge.includes(fake), `crisis routine makes a fake media/cloud/medical claim: ${fake}`);
  }
  assert(
    urge.includes('세부 단계 진행은 저장하지 않아요'),
    'routine does not disclose that step progress is not saved (durable-history honesty)',
  );

  // (e) Tone stays self-control recovery — no shame/punishment/religious vocabulary.
  for (const bad of ['위반', '벌점', '실패자', '강등', '랭킹', '점수', '회개', '심판']) {
    assert(!urge.includes(bad), `crisis routine carries shaming/punishing/religious vocabulary: ${bad}`);
  }
});

// 53 — C2 recovery read-back: completing the crisis routine shows an honest
// "방금 해낸 것" summary of what the user actually did, discloses that step progress is
// NOT saved (only the once-per-day onCrisisHeld completion persists), offers a real
// next action (체크인으로 이어가기 → checkin) and never fakes analysis/AI/medical/shame.
check('crisis routine read-back is honest (no saved-step claim, real next action)', () => {
  const urge = read('src/screens/UrgeScreen.jsx');

  // (a) Read-back summary of the real actions taken in the routine.
  assert(urge.includes('방금 해낸 것'), 'read-back summary header (방금 해낸 것) missing');
  for (const line of ['5분 위기 루틴을 끝냈어요', '자극에서 한 걸음 떨어졌어요', '안전한 대체 행동을 골랐어요']) {
    assert(urge.includes(line), `read-back summary line missing: ${line}`);
  }

  // (b) Honest persistence disclosure: steps are not saved; only today's completion records.
  assert(urge.includes('세부 단계 진행은 저장하지 않아요'), 'read-back does not disclose step progress is not saved');
  assert(urge.includes('오늘 완료로 기록돼요'), 'read-back does not state that completion is what gets recorded');

  // (c) A real next action that routes to an existing screen (no dead end).
  assert(urge.includes('오늘 기록으로 이어가기'), 'read-back next action (오늘 기록으로 이어가기) missing');
  assert(/onNavigate\('checkin'\)/.test(urge), 'read-back does not route to the real check-in screen');

  // (d) No fake analysis / AI / medical / religious / shaming claims on the read-back.
  for (const bad of ['분석 완료', 'AI 분석', '자동 분석', '인공지능', '치료', '중독 치료', '진단', '처방', '타락', '실패자', '회개', '심판', '위반', '벌점']) {
    assert(!urge.includes(bad), `read-back carries a fake-analysis / medical / shaming claim: ${bad}`);
  }
});

// 54 — C3 recovery reflection note: after the C2 read-back the user may leave a one-line
// reflection ("오늘 나에게 남길 한마디"). It is NOT saved on the urge screen — it persists
// ONLY by being carried into the existing check-in note (the real localStorage ledger
// path, guards #38 + check-in ledger). So the read-back must (a) invite the line, (b)
// disclose honestly that it saves only when the check-in is finished, (c) carry the draft
// into the check-in via onStashCheckinNote while still routing to the real check-in, and
// (d) never claim the line is already saved. App must keep the draft TRANSIENT (never its
// own persisted slice) and CheckinScreen must seed its note from it. No shame/medical/AI.
check('recovery reflection note is honest: transient until the check-in saves it (no fake save claim)', () => {
  const urge = read('src/screens/UrgeScreen.jsx');
  const app = read('src/App.jsx');
  const checkin = read('src/screens/CheckinScreen.jsx');

  // (a) The reflection invite exists on the read-back.
  assert(urge.includes('오늘 나에게 남길 한마디'), 'C3 reflection invite (오늘 나에게 남길 한마디) missing from the read-back');

  // (b) Honest disclosure: the line persists only when the check-in is finished.
  assert(
    urge.includes('기록을 마치면 오늘 기록에 저장돼요'),
    'C3 reflection note is missing the honest "saved only when the check-in is finished" disclosure',
  );

  // (c) The draft is carried into the existing check-in note path, and the read-back still
  //     routes to the real check-in screen (no dead end; reuses the real persistence path).
  assert(/onStashCheckinNote\?\.\(/.test(urge), 'read-back does not hand the reflection line to the check-in (onStashCheckinNote)');
  assert(/onNavigate\('checkin'\)/.test(urge), 'read-back reflection path does not continue to the real check-in screen');

  // (d) The urge screen must NOT claim the line is already saved — only the check-in
  //     ledger persists it. Ban present/past fake-save claims (future "저장돼요" is allowed).
  for (const fake of ['저장했어요', '저장되었어요', '저장 완료', '기록했어요', '기록되었어요', '메모가 저장']) {
    assert(!urge.includes(fake), `read-back falsely claims the reflection line is already saved: ${fake}`);
  }

  // (e) App keeps the draft TRANSIENT — a hand-off buffer, never its own persisted slice
  //     (it persists only through the check-in note). It must not enter the saveState bundle.
  assert(/checkinNoteDraft/.test(app), 'App has no checkinNoteDraft hand-off state for the reflection line');
  const m = app.match(/saveState\(\{[\s\S]*?\}\)/);
  assert(m, 'could not locate the saveState({...}) bundle in App.jsx');
  assert(!m[0].includes('checkinNoteDraft'), 'checkinNoteDraft must stay transient — it must not be persisted as its own slice');

  // (f) CheckinScreen seeds its note from the carried draft so the line actually lands.
  assert(/checkinNoteDraft/.test(checkin), 'CheckinScreen does not seed its note from the carried reflection draft');

  // (g) Tone: no shame / medical / AI / religious vocabulary on the new path.
  for (const bad of ['위반', '벌점', '실패자', '강등', '랭킹', '점수', '회개', '심판', 'AI 분석', '자동 분석', '치료', '진단', '처방']) {
    assert(!urge.includes(bad), `C3 reflection note carries forbidden vocabulary: ${bad}`);
  }
});

// 55 — C6 record-detail recovery CTA: the day-detail sheet (Records / Calendar) turns a
// read-back into a real next action. It threads App's navigator into DayDetailSheet and
// offers two honest CTAs that route to EXISTING screens only — 잠깐 멈춤 (urge/crisis) and
// 체크인 (check-in). It must keep past records read-only (records stay as-is), must NOT
// claim to replay a historical routine, edit a past record, or invoke AI/score/medical
// recovery, and must carry no shaming vocabulary (COPY_POLICY §0.5.8.1).
check('record detail offers honest recovery CTAs routed to existing screens (no edit/replay/AI claim)', () => {
  const cal = read('src/screens/CalendarScreen.jsx');

  // (a) App's navigator is threaded into the day-detail sheet (no new router/storage).
  assert(/function DayDetailSheet\(\{[^}]*onNavigate[^}]*\}\)/.test(cal), 'DayDetailSheet does not receive onNavigate');
  assert(/<DayDetailSheet[\s\S]*onNavigate=\{onNavigate\}/.test(cal), 'CalendarScreen does not pass onNavigate into DayDetailSheet');

  // (b) The RC-5 next-action CTAs exist with their exact copy AND route to real existing
  //     screens only: 오늘 기록으로 이어가기 → check-in, 잠깐 멈춤 → urge, 보호 계획 확인 → protection.
  assert(cal.includes('오늘 기록으로 이어가기'), 'record detail missing the 오늘 기록으로 이어가기 CTA');
  assert(/onNavigate\('checkin'\)/.test(cal), 'record detail 오늘 기록 CTA does not route to the real check-in screen');
  assert(cal.includes('잠깐 멈춤'), 'record detail missing the 잠깐 멈춤 CTA');
  assert(/onNavigate\('urge'\)/.test(cal), 'record detail 잠깐 멈춤 CTA does not route to the real urge screen');
  assert(cal.includes('보호 계획 확인'), 'record detail missing the 보호 계획 확인 CTA');
  assert(/onNavigate\('protection'\)/.test(cal), 'record detail 보호 계획 CTA does not route to the real protection screen');

  // (c) Honest framing: records are left as-is, the CTA only continues to a live action.
  assert(cal.includes('기록은 그대로 두고, 오늘 할 수 있는 행동으로 이어가요.'), 'record detail recovery CTA missing the records-stay-as-is honesty copy');

  // (d) No fake edit/replay/AI/score/medical claim on the recovery surface.
  for (const fake of ['과거 기록 수정', '기록 수정', '기록을 수정', '다시 재생', '재생하기', '그대로 재현', 'AI 추천', 'AI 분석', '자동 분석', '회복 점수', '실패 복구', '치료', '진단', '처방', '금욕']) {
    assert(!cal.includes(fake), `record detail recovery CTA makes a forbidden edit/replay/AI/medical claim: ${fake}`);
  }
});

// 56 — C7 day-context hand-off: tapping 오늘 체크인하기 from a record detail continues to
// the REAL check-in and shows a neutral, clearly-today prompt — WITHOUT auto-copying the
// past-day note into today's note (that would blur 오늘 vs 그날). The hand-off is a transient
// one-shot flag (sibling to checkinNoteDraft), never a persisted slice, and today's note
// still seeds ONLY from today's saved record or the C3 reflection draft.
check('record→check-in carries a neutral day-context prompt, never auto-copying the past note', () => {
  const app = read('src/App.jsx');
  const cal = read('src/screens/CalendarScreen.jsx');
  const checkin = read('src/screens/CheckinScreen.jsx');

  // (a) App exposes a transient one-shot context hand-off that routes to the real check-in.
  assert(/const \[checkinContext, setCheckinContext\] = useState\(null\)/.test(app), 'App has no transient checkinContext hand-off state');
  assert(
    /const startCheckinFromRecord = \(\) => \{[\s\S]*?setCheckinContext\('record'\);[\s\S]*?setScreenId\('checkin'\);\s*\};/.test(app),
    'App has no startCheckinFromRecord that flags the record context and routes to the real check-in',
  );
  // It must stay TRANSIENT — never persisted as its own slice.
  const m = app.match(/saveState\(\{[\s\S]*?\}\)/);
  assert(m && !m[0].includes('checkinContext'), 'checkinContext must stay transient — it must not be persisted');

  // (b) The record day-detail 체크인 CTA routes through the context hand-off (still lands real).
  assert(
    /onCheckinFromRecord \? onCheckinFromRecord\(\) : onNavigate\('checkin'\)/.test(cal),
    'record detail 체크인 CTA does not route through the day-context hand-off (with the real check-in fallback)',
  );

  // (c) The check-in entry shows the neutral, clearly-today prompt only when arrived from a record.
  assert(checkin.includes('그날의 기록을 참고해 오늘 한 줄을 남겨볼까요?'), 'check-in is missing the neutral day-context prompt');
  assert(/checkinContext === 'record'/.test(checkin), 'check-in does not gate the day-context prompt on the record entry context');

  // (d) The past note is NOT auto-copied: today's note seed reads ONLY today's saved record or
  //     the transient C3 draft — never a past-day ledger note.
  assert(/savedCheckin\?\.note \?\? checkinNoteDraft \?\? ''/.test(checkin), "check-in note seed changed — today's note must stay (saved note → C3 draft → empty), never a past-day note");
  for (const leak of ['checkinLedger', 'day.checkin', 'pastNote', 'previousNote']) {
    assert(!checkin.includes(leak), `check-in entry references a past-record note source (${leak}) — today's note must not be pre-filled from a past day`);
  }
});

// 57 — C8 saved confirmation: once today's check-in is actually saved (todayRecord.checkin),
// the saved-summary states plainly it was saved and offers a real next action (최근 기록 보기 →
// records). The confirmation must be GATED behind the real saved record, so it can never appear
// before completion (it lives inside the !editing && savedCheckin branch, above the entry form).
check('check-in saved confirmation + next action appear only after the check-in is saved', () => {
  const checkin = read('src/screens/CheckinScreen.jsx');

  // (a) Explicit save confirmation copy + the 최근 기록 보기 next action, routed to records.
  assert(checkin.includes('오늘 기록이 저장됐어요'), 'check-in is missing the explicit save confirmation copy');
  assert(checkin.includes('최근 기록 보기'), 'check-in saved state is missing the 최근 기록 보기 next action');
  assert(/onNavigate\('calendar'\)/.test(checkin), '최근 기록 보기 does not route to the records screen');

  // (b) Gated behind a REAL saved check-in: derived from persisted todayRecord.checkin, and the
  //     confirmation copy sits INSIDE the saved branch (after the gate, before the entry form) —
  //     so it cannot render before completion.
  assert(/const savedCheckin = todayRecord\?\.checkin/.test(checkin), 'saved state is not derived from the persisted todayRecord.checkin');
  const gateIdx = checkin.indexOf('if (!editing && savedCheckin)');
  const confirmIdx = checkin.indexOf('오늘 기록이 저장됐어요');
  const formIdx = checkin.indexOf('다음 · 오늘의 규율 점검');
  assert(gateIdx !== -1, 'saved confirmation is not gated behind a real saved check-in (!editing && savedCheckin)');
  assert(confirmIdx > gateIdx && confirmIdx < formIdx, 'save confirmation is not inside the saved-state branch — it could show before completion');
});

// 58 — C9 read-back polish: the records day-detail check-in read-back stays READ-ONLY and keeps
// the 오늘 vs 지난 boundary explicit. Today's saved entry points editing to the real 오늘 체크인
// (where editing exists); a past entry is stated view-only / kept as-is — no fake past-record edit.
check('records day-detail keeps the check-in read-back read-only and 오늘/지난 explicit', () => {
  const cal = read('src/screens/CalendarScreen.jsx');

  assert(cal.includes('오늘 남긴 기록이에요. 고치려면 오늘 기록에서 바꿀 수 있어요.'), 'today read-back is missing the edit-in-check-in note');
  assert(cal.includes('지난 기록은 그대로 보관돼요. 여기서는 보기만 해요.'), 'past read-back is missing the read-only note');
  assert(
    /day\.isToday\s*\?\s*'오늘 남긴 기록이에요[\s\S]*?:\s*'지난 기록은 그대로 보관돼요/.test(cal),
    'read-only affirmation is not gated on day.isToday (오늘 vs 지난)',
  );
  // Records surface stays read-only — no free-text edit control on the day-detail.
  assert(!/<textarea/.test(cal), 'records day-detail must stay read-only — no edit textarea');
  assert(!/<input/.test(cal), 'records day-detail must stay read-only — no edit input');
});

// 59/60 — REMOVED in RC-2A. The Home daily-action hub (오늘의 회복 루프) and the Home
// check-in saved-summary card were part of the "Home as daily dashboard" era; RC-2A
// reduces Home to a status surface (timer + counters), so both were deleted from Home.
// The recovery loop is still reachable: 잠깐 멈춤 + 오늘 기록 from Home and the bottom
// nav, and the saved record reads back on the 오늘 기록 screen and the 기록 calendar
// (guard 57 / records guards). Home minimal structure is pinned by the rewritten
// guard 65 + guard 68 below.

// 61 — C13 urge → check-in continuation: the breath-timer crisis flow offers an honest
// "오늘 체크인에 한 줄 남기기" continuation alongside 마치기, routing to the real check-in.
// Nothing is saved on the urge screen — the copy says the line saves only once the check-in
// is finished (future tense), and no present/past fake-save claim may appear.
check('urge completion offers an honest check-in continuation (no fake save claim)', () => {
  const urge = read('src/screens/UrgeScreen.jsx');

  // (a) The continuation CTA exists and routes to the real check-in.
  assert(urge.includes('오늘 기록에 한 줄 남기기'), 'urge check-in continuation CTA (오늘 기록에 한 줄 남기기) missing');
  assert(/onNavigate\('checkin'\)/.test(urge), 'urge continuation does not route to the real check-in screen');
  assert(urge.includes('방금 넘긴 순간을 오늘 기록으로 남겨볼까요?'), 'urge continuation invite copy missing');

  // (b) Honest persistence: only future-tense "저장돼요"; no present/past fake-save claim.
  assert(urge.includes('기록을 마치면 오늘 기록에 저장돼요'), 'urge continuation is missing the "saved only when the check-in is finished" disclosure');
  for (const fake of ['저장했어요', '저장되었어요', '저장 완료', '기록했어요', '기록되었어요']) {
    assert(!urge.includes(fake), `urge continuation falsely claims the line is already saved: ${fake}`);
  }
  assert(!urge.includes('금욕'), 'urge carries the forbidden user-facing 금욕 vocabulary');
});

// 62 — REMOVED in RC-2A. The Home "오늘의 방" pet-room state shell + the cosmetic 고양이의
// 방 warmth card were part of the Home dashboard; RC-2A removed them from Home (the room
// is reached via the 관리 → 고양이 방 꾸미기 link and after a record). The real, persisted
// 쓰다듬기 interaction and the no-fake-growth invariants are still pinned by guard 73 on
// the PetRewardScreen itself, which is where the room actually lives.

// 63 — C19/C20/C21 honest protection setup: a dedicated 보호 설정 screen lets the user write
// their OWN coping plan (trigger time / situation to avoid / replacement action). It is NOT a
// blocker and makes NO automatic-blocking, AI, or cloud/sync claim. The plan persists in the
// localStorage-only bundle (survives reload) with an explicit this-device-only disclosure, an
// all-blank save clears it, and it is surfaced in 잠깐 멈춤 ONLY from the saved user plan.
check('protection setup is honest, local-only, and surfaced from the saved user plan', () => {
  const app = read('src/App.jsx');
  const home = read('src/screens/HomeScreen.jsx');
  const screen = read('src/screens/ProtectionScreen.jsx');
  const urge = read('src/screens/UrgeScreen.jsx');

  // (a) Routed screen + Home entry.
  assert(/import ProtectionScreen from/.test(app), 'App.jsx does not import ProtectionScreen');
  assert(/id:\s*'protection'/.test(app), "App.jsx does not route a 'protection' screen");
  assert(home.includes("onNavigate('protection')"), 'Home has no entry that navigates to 보호 설정');
  assert(screen.includes('보호 설정'), 'ProtectionScreen is missing its 보호 설정 title');

  // (b) The three plan fields exist (trigger time / situation / replacement action).
  assert(screen.includes('트리거 시간대'), 'protection setup is missing the trigger-time field');
  assert(screen.includes('피하고 싶은 상황'), 'protection setup is missing the situation field');
  assert(screen.includes('위기 때 할 대체 행동') || screen.includes('대체 행동'), 'protection setup is missing the replacement-action field');

  // (c) Durable localStorage-only persistence with an explicit device-only disclosure.
  assert(/const \[protectionPlan, setProtectionPlan\] = useState\(\(\) => persisted\?\.protectionPlan/.test(app), 'App does not seed protectionPlan from the persisted bundle');
  // Capture ONLY the saveState({...}) object body (up to the first `});`), so a
  // protectionPlan that lives only in the useEffect deps array cannot satisfy this.
  const saveBody = app.match(/saveState\(\{([\s\S]*?)\}\);/);
  assert(saveBody && saveBody[1].includes('protectionPlan'), 'protectionPlan is not included in the persisted saveState bundle object');
  assert(screen.includes('이 설정은 이 기기에만 저장돼요'), 'protection setup is missing the explicit local-only (this-device) disclosure');

  // (d) An all-blank save clears the plan (no empty husk persisted).
  assert(
    /const empty = !next\.triggerTime && !next\.situation && !next\.altAction;\s*setProtectionPlan\(empty \? null/.test(app),
    'saveProtectionPlan does not clear the plan to null on an all-blank save',
  );

  // (e) No fake blocker / AI / cloud / medical claim anywhere in the setup screen.
  for (const fake of ['자동 차단', '차단했어요', '차단하고 있어요', '차단 중이에요', '막고 있어요', 'AI 추천', 'AI 분석', '자동 분석', '인공지능', '클라우드', '동기화', '서버에 저장', '치료', '진단', '처방']) {
    assert(!screen.includes(fake), `protection setup makes a forbidden blocker/AI/cloud/medical claim: ${fake}`);
  }

  // (f) Surfaced in 잠깐 멈춤 ONLY from the saved user plan, framed as the user's own writing.
  assert(/protectionPlan/.test(urge), 'UrgeScreen does not read the saved protection plan');
  assert(urge.includes('내가 정해둔 대체 행동'), 'UrgeScreen is missing the protection-plan section title');
  assert(urge.includes('직접 적어둔 계획만 보여줘요'), 'UrgeScreen does not frame the plan as the user\'s own writing (not AI)');
  assert(urge.includes('아직 보호 설정이 없어요'), 'UrgeScreen is missing the empty-state for no saved plan');
  assert(urge.includes("onNavigate('protection')"), 'UrgeScreen empty state does not route to 보호 설정');
  for (const fake of ['AI 추천', 'AI 분석', '자동 분석', '자동 차단']) {
    assert(!urge.includes(fake), `UrgeScreen protection plan makes a forbidden AI/auto-block claim: ${fake}`);
  }
});

// 64 — RC-2A empty states + reset trust: the Home first-run onboarding card was REMOVED
// in the Home diet (Home is now timer + counters), so this no longer pins onboarding.
// What it still guards: 기록 (records) shows an honest empty-state when no record exists;
// and a local-data reset clears the logged data INCLUDING protectionPlan, through a
// confirm sheet (never a one-tap wipe), with no account/cloud-deletion claim. The reset
// now lives in the compact Home 관리 section, still behind the confirm sheet.
check('records empty state + reset are honest and clear the local state (Home diet: no onboarding)', () => {
  const app = read('src/App.jsx');
  const home = read('src/screens/HomeScreen.jsx');
  const cal = read('src/screens/CalendarScreen.jsx');

  // (a) The Home diet removed the first-run onboarding card — it must NOT come back as a
  //     long explanatory section (RC-2A: Home is a status surface, not a dashboard).
  assert(!home.includes('home-onboarding'), 'Home onboarding card returned — RC-2A keeps Home minimal (timer + counters)');
  assert(!home.includes('NoF는 이렇게 써요'), 'Home onboarding copy returned — RC-2A keeps Home minimal');

  // (b) Empty state on 기록, gated on REAL absence (ledger empty + no today record), with a
  //     forward CTA, still read-only.
  assert(cal.includes('calendar-empty'), '기록 empty-state card (calendar-empty) missing');
  assert(cal.includes('아직 남긴 기록이 없어요'), '기록 empty-state copy missing');
  assert(/const hasAnyCheckin = Object\.keys\(ledger\)\.length > 0 \|\| !!todayRecord\?\.checkin/.test(cal), '기록 empty-state is not gated on a real has-any-record signal (ledger/today)');
  assert(/\{!hasAnyCheckin \? \(/.test(cal), '기록 empty-state is not gated to hide once a record exists');
  const ceStart = cal.indexOf('calendar-empty');
  const ceEnd = cal.indexOf('이 기록을 보는 방법', ceStart);
  assert(ceStart !== -1 && ceEnd !== -1 && ceEnd > ceStart, 'could not isolate the calendar-empty section');
  const emptyCard = cal.slice(ceStart, ceEnd);
  assert(emptyCard.includes('오늘 기록하기') && /onNavigate\('checkin'\)/.test(emptyCard), '최근 기록 empty-state does not offer a 오늘 기록하기 CTA to the check-in screen');

  // (c) Reset clears the logged data INCLUDING the new protectionPlan, and routes home.
  const m = app.match(/const resetLocalData = \(\) => \{[\s\S]*?\};/);
  assert(m, 'resetLocalData handler not found');
  for (const clear of ['setTodayRecord(null)', 'setCheckinLedger({})', 'setProtectionPlan(null)', 'setCheckinRewardDay(null)', 'setCrisisRewardDay(null)']) {
    assert(m[0].includes(clear), `resetLocalData does not clear: ${clear}`);
  }
  assert(/onResetLocalData=\{resetLocalData\}/.test(app), 'App does not pass onResetLocalData down');

  // (d) Reset goes through a confirm sheet — the real onResetLocalData is never a one-tap wipe.
  assert(home.includes('aria-label="데이터 초기화 확인"'), 'reset confirm dialog (aria-label) missing');
  assert(home.includes('setConfirmReset(true)'), 'reset CTA does not open the confirm sheet');
  assert(!/onClick=\{\(\)\s*=>\s*onResetLocalData/.test(home), 'reset CTA calls onResetLocalData directly — it must go through the confirm sheet');
  assert(/onResetLocalData\?\.\(\)/.test(home), 'reset confirm sheet never calls the real onResetLocalData');

  // (e) No fake account/cloud-deletion claim — only on-device local data is cleared.
  for (const fake of ['계정 삭제', '클라우드 삭제', '서버에서 삭제', '클라우드 동기화', '계정을 삭제']) {
    assert(!home.includes(fake), `reset surface makes a fake account/cloud-deletion claim: ${fake}`);
  }
  assert(home.includes('계정이나 클라우드는 없'), 'reset surface is missing the honest "no account/cloud" disclosure');
});

// 65 — final guard pack for the 24h MVP recovery loops. A single cross-cutting sweep so a
// future change to any recovery screen fails loud if it (a) leaks forbidden user-facing
// vocabulary, (b) drops the core daily-action structure on Home, (c) loses the scoped a11y
// region labels added this sprint, or (d) reverts the onboarding list back to inline styles.
check('final recovery-loop guard pack: vocab, structure, a11y, styling stay intact', () => {
  const home = read('src/screens/HomeScreen.jsx');
  const urge = read('src/screens/UrgeScreen.jsx');
  const checkin = read('src/screens/CheckinScreen.jsx');
  const cal = read('src/screens/CalendarScreen.jsx');
  const protect = read('src/screens/ProtectionScreen.jsx');
  const css = read('src/styles/components.css');

  // (a) No forbidden user-facing vocabulary anywhere on the recovery-loop screens.
  const FORBIDDEN = ['금욕', '중독 치료', 'AI 분석', 'AI 추천', '회복 점수', '실패 복구', '자동 차단', '클라우드 동기화', '다시 재생', '기록 수정'];
  for (const [name, src] of [['HomeScreen', home], ['UrgeScreen', urge], ['CheckinScreen', checkin], ['CalendarScreen', cal], ['ProtectionScreen', protect]]) {
    for (const bad of FORBIDDEN) {
      assert(!src.includes(bad), `${name} carries forbidden user-facing vocabulary: ${bad}`);
    }
  }

  // (b) RC-2A: Home keeps the REDUCED status-surface structure — the timer hero, the
  //     crisis/record hero actions, the counter list, and the compact 관리 links. The old
  //     dashboard sections must stay gone so Home cannot drift back into a long scroll.
  for (const hook of ['abstinence-timer-card', 'home-hero-actions', 'home-counters', 'home-manage']) {
    assert(home.includes(hook), `Home lost a status-surface section: ${hook}`);
  }
  for (const gone of ['home-onboarding', 'home-loop-hub', 'home-checkin-summary', 'home-room-state']) {
    assert(!home.includes(gone), `Home dashboard section returned (RC-2A removed it): ${gone}`);
  }

  // (c) The reset trigger keeps its dialog-opener a11y hint, and the 관리 group is labelled.
  assert(home.includes('aria-haspopup="dialog"'), 'reset trigger lost its dialog-opener a11y hint');
  assert(home.includes('aria-label="관리 바로가기"'), 'Home 관리 links group lost its a11y region label');
  // The old onboarding ordered-list / hub / room a11y labels must not linger.
  for (const gone of ['aria-label="오늘의 회복 루프"', 'aria-label="오늘의 방"', 'aria-label="NoF 사용 3단계 안내"']) {
    assert(!home.includes(gone), `Home kept a removed a11y region label: ${gone}`);
  }
});

// 66 — C31/C32 reward landing confirmation: when the reward room is reached with today's
// check-in actually saved (checkinDoneToday, derived from the persisted todayRecord.checkin),
// the landing opens with a short save acknowledgement and the two next-action routes
// (최근 기록 → calendar, 홈 → home). It is gated on the real saved state so it can never render
// before a save, and makes NO growth / unlock / shop / cloud / AI / medical / 금욕 claim.
check('reward landing confirmation is gated by the saved today check-in (no fake growth/cloud claim)', () => {
  const screen = read('src/screens/PetRewardScreen.jsx');

  // (a) The confirmation card exists with its save + read-back copy.
  assert(screen.includes('reward-checkin-confirm'), 'reward landing confirmation card (reward-checkin-confirm) missing');
  assert(screen.includes('오늘 기록이 저장됐어요'), 'reward landing is missing the save confirmation copy');
  assert(screen.includes('최근 기록에서 다시 볼 수 있어요'), 'reward landing is missing the records read-back copy');

  // (b) Gated behind a REAL saved today check-in (derived from persisted todayRecord.checkin).
  assert(/const checkinDoneToday = todayRecord\?\.checkin/.test(screen), 'reward confirmation is not derived from the persisted todayRecord.checkin');
  assert(
    /\{checkinDoneToday \? \(\s*<section className="card reward-checkin-confirm"/.test(screen),
    'reward confirmation is not gated behind the real saved check-in (could show before completion)',
  );

  // (c) Isolate the card and assert BOTH next-action routes live inside it.
  const start = screen.indexOf('reward-checkin-confirm');
  const end = screen.indexOf('{placementMode ? (', start);
  assert(start !== -1 && end !== -1 && end > start, 'could not isolate the reward-checkin-confirm card');
  const card = screen.slice(start, end);
  assert(card.includes('최근 기록 보기') && /onNavigate\('calendar'\)/.test(card), 'reward confirmation 최근 기록 보기 does not route to the records screen');
  assert(card.includes('홈으로 가기') && /onNavigate\('home'\)/.test(card), 'reward confirmation 홈으로 가기 does not route home');

  // (d) No fake growth / unlock / shop / cloud / AI / medical / 금욕 claim inside the card.
  for (const fake of ['성장했', '진화', '레벨업', '해금', '잠금 해제', '뽑기', '가챠', '상점', '프리미엄', '결제', '클라우드', '동기화', 'AI 분석', 'AI 추천', '회복 점수', '치료', '진단', '처방', '금욕']) {
    assert(!card.includes(fake), `reward confirmation makes a forbidden growth/unlock/shop/cloud/AI claim: ${fake}`);
  }
});

// 67 — C34/C35 protection plan management: the saved-plan card exposes an explicit
// "계획 비우기" clear that routes through the EXISTING saveProtectionPlan all-blank path (which
// normalizes to null — the real clear-to-null contract in App), discloses it is this-device-only,
// and falls back to an honest empty state. The clear must leave 잠깐 멈춤 honestly empty, and the
// surface must make NO account/cloud-deletion, blocker, AI, or medical claim.
check('protection plan management is honest: explicit local-only clear + saved/empty states', () => {
  const screen = read('src/screens/ProtectionScreen.jsx');
  const app = read('src/App.jsx');

  // (a) Saved-plan card with an explicit, wired clear action (a button bound to clearPlan).
  assert(screen.includes('protection-saved'), 'saved protection plan card (protection-saved) missing');
  assert(screen.includes('계획 비우기'), 'protection plan is missing the explicit 계획 비우기 clear action');
  assert(/onClick=\{clearPlan\}/.test(screen), 'the 계획 비우기 action is not wired to the clearPlan handler');

  // (b) The clear routes through the EXISTING handler with all-blank fields, and App still maps
  //     an all-blank save to null (so the clear genuinely sets protectionPlan === null).
  assert(
    /const clearPlan = \(\) => \{[\s\S]*?onSaveProtectionPlan\?\.\(\{ triggerTime: '', situation: '', altAction: '' \}\)/.test(screen),
    'clearPlan does not clear through the existing onSaveProtectionPlan all-blank path',
  );
  assert(
    /const empty = !next\.triggerTime && !next\.situation && !next\.altAction;\s*setProtectionPlan\(empty \? null/.test(app),
    'App.saveProtectionPlan no longer clears an all-blank plan to null',
  );

  // (c) This-device-only disclosure on the clear, and no off-device / blocker / AI / medical claim.
  assert(screen.includes('이 기기에 저장된 보호 설정만'), 'protection clear is missing the this-device-only disclosure');
  for (const fake of ['계정 삭제', '클라우드 삭제', '서버에서 삭제', '클라우드 동기화', '자동 차단', '차단했어요', 'AI 추천', 'AI 분석', '치료', '진단', '처방', '금욕']) {
    assert(!screen.includes(fake), `protection management makes a forbidden account/cloud/blocker/AI/medical claim: ${fake}`);
  }

  // (d) Honest empty state, gated on the real protectionPlan.
  assert(screen.includes('protection-empty'), 'protection empty-state card (protection-empty) missing');
  assert(screen.includes('아직 보호 설정이 없어요'), 'protection empty-state copy missing');
  assert(/\{protectionPlan \? \([\s\S]*?\) : \(/.test(screen), 'protection saved/empty states are not gated on the real protectionPlan');

  // (e) Clearing leaves 잠깐 멈춤 honestly empty (its read-back is gated on a real saved plan).
  const urge = read('src/screens/UrgeScreen.jsx');
  assert(urge.includes('아직 보호 설정이 없어요'), 'urge no-plan empty state missing (clear must leave it honestly empty)');
  assert(
    /protectionPlan && \(protectionPlan\.altAction \|\| protectionPlan\.situation \|\| protectionPlan\.triggerTime\)/.test(urge),
    'urge does not gate the plan read-back on a real saved plan',
  );
});

// 68 — C38 MVP closeout sweep: a single cross-cutting net over the surfaces this sprint
// touched. (a) Home must stay timer-first → 회복 루프 허브 → secondary, so it does not get more
// scattered. (b) The two new/changed surfaces (reward landing confirmation, protection
// management) carry NO user-facing 금욕 and no fake AI / medical / cloud / blocker / growth /
// unlock / edit / replay claim ANYWHERE in the file — a file-level net beyond the card-scoped
// C31/C34 guards (PetRewardScreen had no such 금욕 sweep before). (c) Both surfaces stay present
// and gated on real state.
check('MVP closeout surfaces stay honest: reward confirm + protection clear, Home core order intact', () => {
  const home = read('src/screens/HomeScreen.jsx');
  const reward = read('src/screens/PetRewardScreen.jsx');
  const protect = read('src/screens/ProtectionScreen.jsx');

  // (a) RC-2A Home core order: timer hero → counters → compact 관리 links. The status
  //     surface leads with the timer, then the counters, with secondary entries last.
  const tHero = home.indexOf('timer-hero');
  const tCounters = home.indexOf('home-counters');
  const tManage = home.indexOf('home-manage');
  assert(tHero !== -1 && tCounters !== -1 && tManage !== -1, 'Home lost a core section marker (timer-hero / home-counters / home-manage)');
  assert(tHero < tCounters && tCounters < tManage, 'Home core order regressed — must stay timer hero → counters → 관리 links');

  // (b) No forbidden 금욕 / fake claim anywhere on the two closeout surfaces (file-level). 상점
  //     is intentionally absent from this list — the cosmetic room shop is a real feature.
  const FAKE = ['금욕', 'AI 분석', 'AI 추천', '회복 점수', '실패 복구', '치료', '진단', '처방', '자동 차단', '클라우드 동기화', '다시 재생', '기록 수정', '잠금 해제', '해금', '뽑기', '가챠', '프리미엄'];
  for (const [name, src] of [['PetRewardScreen', reward], ['ProtectionScreen', protect]]) {
    for (const bad of FAKE) {
      assert(!src.includes(bad), `${name} carries a forbidden MVP-closeout claim/vocabulary: ${bad}`);
    }
  }

  // (c) Both closeout surfaces present and gated on real state.
  assert(reward.includes('reward-checkin-confirm') && /checkinDoneToday \? \(/.test(reward), 'reward confirmation surface missing or not state-gated');
  assert(protect.includes('계획 비우기') && /\{protectionPlan \? \(/.test(protect), 'protection clear / saved-state gating surface missing');
});

// 69 — C42 MVP browser-QA harness guard. The repeatable `npm run qa:mvp` is now the
// repo's lock on the user's core recovery loop (it actually clicks the flow in a real
// browser). This guards the TOOL so a future change can't quietly hollow it out: drop
// a behavior, fake coverage, smuggle in a dependency, or reintroduce one of the two
// freeze-audit harness mistakes (brittle "NoF는" innerText / unscoped reset click).
check('NoF MVP browser QA harness stays runnable + honest (qa:mvp, 33 behaviors, no harness traps)', () => {
  const pkg = JSON.parse(read('package.json'));
  assert(pkg.scripts && typeof pkg.scripts['qa:mvp'] === 'string', 'package.json has no qa:mvp script');
  assert(pkg.scripts['qa:mvp'].includes('nof-mvp-flow-qa.mjs'), 'qa:mvp must run scripts/nof-mvp-flow-qa.mjs');
  // The harness is zero-dependency (raw CDP over Node 22 WebSocket) — keep it that way.
  for (const name of ['puppeteer', 'puppeteer-core', 'playwright', '@playwright/test', 'playwright-core']) {
    const inDeps = (pkg.dependencies && pkg.dependencies[name]) || (pkg.devDependencies && pkg.devDependencies[name]);
    assert(!inDeps, `qa:mvp must stay dependency-free, but ${name} is declared`);
  }

  const helper = read('scripts/nof-cdp-client.mjs'); // throws if the CDP helper is missing
  const qa = read('scripts/nof-mvp-flow-qa.mjs');    // throws if the flow script is missing

  // (a) All 33 behaviors are driven by a REAL check('B##', <expr>) call — not just a
  //     substring, and never a constant like check('B##', true). This stops the harness
  //     being silently gutted (labels kept, assertions swapped for a tautology) while
  //     still reporting 33/33 PASS.
  for (let i = 1; i <= 33; i += 1) {
    const id = 'B' + String(i).padStart(2, '0');
    const called = new RegExp(`check\\(\\s*['"]${id}['"]\\s*,`);
    const constant = new RegExp(`check\\(\\s*['"]${id}['"]\\s*,\\s*(?:true|false|1|0)\\b`);
    assert(called.test(qa), `QA flow has no real check('${id}', …) call`);
    assert(!constant.test(qa), `QA flow check('${id}', …) is gutted to a constant assertion`);
  }

  // (b) Reset confirmation is scoped to the open .sheet — never a broad substring click
  //     that would hit the trigger button behind the backdrop (freeze-audit mistake #2).
  assert(
    /clickInScope\(\s*['"]\.sheet['"]\s*,\s*['"]기록 지우기['"]/.test(qa),
    'reset confirm must be scoped to the .sheet (clickInScope(".sheet", "기록 지우기"))',
  );

  // (c) Must NOT reintroduce the brittle latin-boundary "NoF는 …" innerText assertion
  //     (freeze-audit mistake #1: text-transform:uppercase makes the substring never
  //     match). RC-2A removed the first-run onboarding card from Home, so the harness no
  //     longer asserts its "이렇게 써요" phrase — it now asserts the Home status surface
  //     (절제 카운터) on a fresh mount instead.
  assert(!qa.includes('NoF는'), 'QA flow must not assert the brittle "NoF는 …" innerText');
  assert(/check\(\s*'B02'\s*,\s*await c\.has\('절제 카운터'\)/.test(qa), 'QA flow must assert the Home counter list (절제 카운터) on a fresh mount');

  // (d) Forbidden user-facing copy is actually checked (금욕 vocabulary + fake-claim sweep).
  assert(qa.includes('FORBIDDEN_VOCAB') && qa.includes('금욕'), 'QA flow must sweep forbidden vocabulary (금욕)');
  assert(
    qa.includes('FORBIDDEN_CLAIMS') && qa.includes('AI 분석') && qa.includes('클라우드 동기화'),
    'QA flow must sweep forbidden fake AI/medical/cloud claims',
  );

  // (e) Horizontal overflow is actually probed at 390x844.
  assert(/async overflow\(/.test(helper), 'CDP helper lost its overflow probe');
  assert(qa.includes('scanOverflow') && qa.includes('390x844'), 'QA flow must scan 390x844 horizontal overflow');

  // (f) QA artifacts default OUTSIDE the repo (an ignored /tmp path) so nothing is committed.
  assert(
    /QA_OUT\s*=\s*process\.env\.NOF_QA_OUT\s*\|\|\s*'\/tmp\//.test(helper),
    'QA output (NOF_QA_OUT) must default to an out-of-repo /tmp path',
  );

  // (g) Honest failure: with no drivable browser, the harness prints exact launch
  //     instructions and exits non-zero — it must never silently report a pass.
  assert(
    qa.includes('printChromeInstructions') && qa.includes('--remote-debugging-port'),
    'QA flow must print exact Chrome launch instructions when CDP is unreachable',
  );
});

// 70 — C44 R-9 font loading policy guard. The app's type must resolve with zero
// external runtime dependency, so it renders deterministically in local preview, on
// managed company networks, and offline. This locks the two halves of R-9: no
// external font <link> creeps back into index.html, and the system stack keeps a
// deterministic Hangul fallback (system-ui alone has no Hangul on Windows).
check('NoF font policy stays local/system-safe (no external font CDN, Hangul fallback intact)', () => {
  const html = read('index.html');
  const flat = html.replace(/\s+/g, ' ');
  // No external stylesheet <link> may return — that external font CDN was the R-9 dependency we removed.
  assert(
    !/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']https?:\/\//i.test(flat) &&
      !/<link\b[^>]*href=["']https?:\/\/[^>]*["'][^>]*rel=["']stylesheet["']/i.test(flat),
    'index.html must not load an external stylesheet (font CDN); R-9 keeps fonts local/system-safe',
  );
  for (const host of ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net', 'rsms.me']) {
    assert(!flat.includes(host), `index.html must not reference the external font host ${host}`);
  }

  const tokens = read('src/styles/tokens.css');
  assert(/--font-base\s*:/.test(tokens), 'tokens.css must define --font-base');
  // Check the actual --font-kr declaration value (not the whole file) so the fallback
  // can't be "satisfied" by a face name that only appears in a comment.
  const krMatch = tokens.match(/--font-kr\s*:\s*([^;]+);/);
  assert(krMatch, 'tokens.css must define the Korean font stack --font-kr');
  const krStack = krMatch[1];
  // A deterministic Hangul fallback must survive in the stack even when no webfont is installed.
  for (const face of ['Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic']) {
    assert(krStack.includes(face), `--font-kr declaration must keep the Hangul fallback "${face}"`);
  }
});

// 71 — RC-2A monthly calendar record-indicator clarity. The 기록 calendar must stay
// understandable without guessing: it is a real month grid with year/month navigation, a
// weekday header, today distinguishable, and each day cell carries a date + record-state
// accessible name. The record dot renders only for a day that actually has a saved record,
// and the indicator copy never drifts into forbidden vocabulary. (Home no longer carries a
// records strip — records live on the 기록 tab.)
check('NoF record indicators stay clear (monthly grid: date+state a11y, today marker, honest copy)', () => {
  const home = read('src/screens/HomeScreen.jsx');
  const cal = read('src/screens/CalendarScreen.jsx');

  // (a) Real month grid with year + month navigation controls and a weekday header.
  assert(cal.includes('month-grid') && cal.includes('month-cell'), '기록 is not a month grid (month-grid / month-cell missing)');
  assert(cal.includes('month-weekday') && /WEEKDAYS\s*=\s*\[/.test(cal), 'month grid is missing a weekday header row');
  assert(/aria-label="이전 달"/.test(cal) && /aria-label="다음 달"/.test(cal), 'month grid is missing previous/next month controls');
  assert(/aria-label="이전 연도"/.test(cal) && /aria-label="다음 연도"/.test(cal), 'month grid is missing previous/next year controls');
  assert(/\$\{view\.year\}년 \$\{view\.month \+ 1\}월/.test(cal), 'month grid does not show the current 년/월 label');

  // (b) Each day cell carries a date + record-state accessible name, and today is marked.
  assert(/aria-label=\{`\$\{view\.month \+ 1\}월 \$\{cell\.d\}일/.test(cal), 'day cell aria-label does not name the date');
  assert(cal.includes('기록 있음') && cal.includes('기록 없음'), 'day cell aria-label does not name the record state (기록 있음/없음)');
  assert(/data-today=\{cell\.isToday\}/.test(cal), 'today cell is not distinguishable (data-today)');

  // (c) The record dot renders ONLY for a day with a real saved record (no fabricated dots).
  assert(/data-has-record=\{cell\.hasRecord\}/.test(cal), 'record dot is not gated on a real record (data-has-record)');
  assert(/cell\.hasRecord \? <span className="month-cell-dot"/.test(cal), 'record dot is not gated on cell.hasRecord');

  // (d) Home no longer renders a records strip — records live on the 기록 tab.
  assert(!home.includes('EmberCalendarStrip'), 'Home should no longer render the records strip (RC-2A Home diet)');

  // (e) Indicator / calendar copy stays honest — no forbidden vocabulary on the read surface.
  for (const bad of ['금욕', '치료', '진단', '처방', '회복 점수', '타락', '죄', 'AI 분석']) {
    assert(!cal.includes(bad), `기록 calendar copy must not use forbidden word "${bad}"`);
  }
});

// 72 — RC-1 live counters. Feedback #1: the counters must show every 절제 item in real
// time, down to seconds — not just the selected hero. The 1-second Home tick already
// re-renders the list; this pins that each counter card derives elapsed from the live
// `now` and renders seconds, with an honest 절제 중 status and no 금욕 vocabulary.
check('discipline counters tick live to the second on Home', () => {
  const home = read('src/screens/HomeScreen.jsx');
  // (a) The 1-second tick that drives every counter card's re-render.
  assert(/setInterval\(\(\) => setNow\(Date\.now\(\)\), 1000\)/.test(home), 'Home lost its 1-second now tick');
  // (b) Each counter card's elapsed is derived from the live `now` (not a frozen stamp).
  assert(/const el = formatElapsed\(now - c\.startMs\)/.test(home), 'counter card elapsed is not derived from the live now');
  // (c) The card renders seconds (el.ss), so all items tick visibly — not just hh:mm.
  assert(/counter-card-time[\s\S]{0,120}el\.ss/.test(home), 'counter card does not render live seconds (el.ss)');
  assert(/formatElapsed[\s\S]*?ss:/.test(home) || /ss = String/.test(home), 'formatElapsed does not expose seconds');
  // (d) Honest live-status copy, one vocabulary (no 금욕).
  assert(home.includes('절제 중'), 'counter card is missing the 절제 중 live-status label');
  assert(!home.includes('금욕'), 'counter surface uses forbidden 금욕 vocabulary');
});

// 73 — RC-1 cat interaction. Feedback #3: the cat room must offer a real, visible
// interaction, not a static placeholder. The honest answer (the cat art is a static
// composite — no transparent sprites) is a 쓰다듬기 (놀아주기) action that records a real,
// day-scoped, persisted count in App and answers with a VISIBLE affection cue, while never
// claiming the cat moved / purred / ate (those tokens stay banned by guard #6).
check('cat room has a real 쓰다듬기 interaction: visible cue + honest day-scoped count', () => {
  const app = read('src/App.jsx');
  const screen = read('src/screens/PetRewardScreen.jsx');
  const css = read('src/styles/components.css');

  // (a) App records the affection as a day-scoped, persisted count and passes it down.
  assert(/const petPet = \(\) =>/.test(app), 'App has no petPet interaction handler');
  assert(/pettedDay: dayKey\(/.test(app), 'petPet does not stamp a day-scoped pettedDay (via dayKey)');
  assert(/onPetPet=\{petPet\}/.test(app), 'App does not pass onPetPet down to the pet room');
  const saveBody = app.match(/saveState\(\{([\s\S]*?)\}\);/);
  assert(saveBody && saveBody[1].includes('petCareState'), 'petCareState (with the pet count) is not persisted');

  // (b) A visible 쓰다듬기 affordance wired to a handler that calls onPetPet + reads the count.
  assert(screen.includes('쓰다듬기'), 'pet room is missing the 쓰다듬기 interaction');
  assert(/onClick=\{handlePet\}/.test(screen), '쓰다듬기 button is not wired to handlePet');
  assert(/onPetPet\?\.\(\)/.test(screen), 'handlePet does not call the onPetPet handler');
  assert(screen.includes('pet-affection-token'), 'pet interaction has no visible affection cue token');
  assert(/petCareState\.pettedCount/.test(screen), 'pet interaction does not read back the persisted pet count');

  // (c) A real travel animation exists in CSS (a movement cue, not just an opacity flash).
  const m = css.match(/@keyframes pet-affection \{[\s\S]*?\n\}/);
  assert(m, 'pet-affection keyframes missing');
  assert(/translateY\(-?\d+px\)/.test(m[0]), 'pet-affection cue is not a travel animation (no translateY distance)');

  // (d) No fake cat-motion / sound claim in the positive interaction copy.
  for (const fake of ['먹었', '먹는', '움직였', '꼬리', '기지개', '골골', '야옹']) {
    assert(!screen.includes(fake), `pet interaction makes a fake cat-motion/sound claim: ${fake}`);
  }
});

// 74 — RC-1 product reality loop. A single cross-cutting net pinning the RC-1 intent so a
// future change can't quietly revert it: the check-in is writing-first (회고/약속/다짐 are the
// primary fields + the gate — the user's own words), that writing reads back in records,
// counters tick live to the second, the cat room has a real 쓰다듬기 interaction, and no
// forbidden user-facing vocabulary regressed onto the changed surfaces.
check('RC-1 product loop: writing-first check-in, live counters, real cat interaction', () => {
  const checkin = read('src/screens/CheckinScreen.jsx');
  const cal = read('src/screens/CalendarScreen.jsx');
  const home = read('src/screens/HomeScreen.jsx');
  const reward = read('src/screens/PetRewardScreen.jsx');

  // (a) Writing is the primary check-in concept and the gate (not the optional survey).
  for (const field of ['오늘 회고', '나와의 약속', '오늘의 다짐']) {
    assert(checkin.includes(field), `check-in lost the writing-first field: ${field}`);
  }
  assert(/const step1Ready = \[note, promise, resolve\]\.some/.test(checkin), 'check-in gate is no longer the user writing (회고/약속/다짐)');

  // (b) The user's own writing reads back in records.
  assert(/day\.checkin\.promise/.test(cal) && /day\.checkin\.resolve/.test(cal), 'records do not read back the user writing (약속/다짐)');

  // (c) Counters tick to the second on Home (every item, not just the hero).
  assert(/counter-card-time[\s\S]{0,120}el\.ss/.test(home), 'counters no longer tick to the second');

  // (d) The cat room has a real, visible, persisted 쓰다듬기 interaction.
  assert(
    reward.includes('쓰다듬기') && /onClick=\{handlePet\}/.test(reward) && reward.includes('pet-affection-token'),
    'cat room lost the real 쓰다듬기 interaction',
  );

  // (e) No forbidden user-facing vocabulary regressed onto the RC-1 surfaces.
  for (const [name, src] of [['CheckinScreen', checkin], ['HomeScreen', home], ['PetRewardScreen', reward]]) {
    for (const bad of ['금욕', 'AI 분석', 'AI 추천', '회복 점수', '자동 차단', '클라우드 동기화', '치료', '진단', '처방']) {
      assert(!src.includes(bad), `${name} regressed forbidden vocabulary: ${bad}`);
    }
  }
});

// 75 — RC-2A clarity loop. A single cross-cutting net pinning the RC-2A intent so a future
// change can't quietly revert it: (1) NO user-facing "체크인" survives on any rendered
// screen surface — the word was replaced by 오늘 기록 / 오늘 회고 (internal code names like
// checkinLedger may remain, and comments are exempt); (2) the new 오늘 기록 / 오늘 회고 copy
// is present where it matters; (3) the decorative ember/잔불 filler line is gone; (4) Home
// stays a reduced status surface (timer + counters + 관리), not a dashboard; (5) the 기록
// calendar is a real month grid that reads the ledger by date with no fabricated history.
check('RC-2A clarity loop: no user-facing 체크인, 오늘 기록 copy, no fluff, Home diet, monthly calendar', () => {
  // Strip block comments (incl. JSX {/* … */}) and full-line // comments, so a 체크인 left
  // only in an explanatory comment / internal identifier does not trip the rendered-copy
  // check. Any remaining 체크인 is real rendered text or a string literal — i.e., user-facing.
  const stripComments = (src) =>
    src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  // (1) No user-facing 체크인 on the rendered surfaces.
  const renderedFiles = [
    'src/components/BottomNav.jsx',
    'src/screens/HomeScreen.jsx',
    'src/screens/CheckinScreen.jsx',
    'src/screens/CalendarScreen.jsx',
    'src/screens/UrgeScreen.jsx',
    'src/screens/PetRewardScreen.jsx',
  ];
  for (const f of renderedFiles) {
    assert(!stripComments(read(f)).includes('체크인'), `${f} still shows user-facing "체크인" — RC-2A renamed it to 오늘 기록 / 오늘 회고`);
  }

  // (1b) RC-6 — the protection / Shield / Chrome-extension / safe-browser surfaces must ALSO
  //      never show user-facing 체크인. Internal route 'checkin' (latin) and comments are exempt
  //      (stripComments removes comments; 'checkin' ≠ 체크인).
  for (const f of [
    'src/screens/ProtectionScreen.jsx',
    'src/screens/ShieldScreen.jsx',
    'src/screens/ShieldExtensionScreen.jsx',
    'src/screens/SafeBrowserScreen.jsx',
  ]) {
    assert(!stripComments(read(f)).includes('체크인'), `${f} shows user-facing "체크인" — use 오늘 기록`);
  }

  // (2) The RC-2A vocabulary is present where it matters.
  assert(read('src/components/BottomNav.jsx').includes("label: '오늘 기록'"), 'BottomNav lost the 오늘 기록 tab label');
  const checkin = read('src/screens/CheckinScreen.jsx');
  assert(checkin.includes('오늘 회고') && checkin.includes('오늘 기록이 저장됐어요'), 'CheckinScreen lost the 오늘 회고 / 오늘 기록 wording');
  assert(read('src/screens/CalendarScreen.jsx').includes('오늘 회고'), 'CalendarScreen lost the 오늘 회고 read-back label');

  // (3) The decorative ember/잔불 filler line the user called out is gone from every screen.
  for (const f of renderedFiles) {
    const src = read(f);
    assert(!src.includes('작은 잔불은 아직 꺼지지 않았어요'), `${f} still carries the decorative ember filler line`);
    assert(!src.includes('흔들려도 다시 이어갈 수 있어요'), `${f} still carries the decorative "흔들려도 다시 이어갈" filler`);
  }

  // (4) Home stays a reduced status surface — timer + counters + compact 관리, no dashboard.
  const home = read('src/screens/HomeScreen.jsx');
  for (const keep of ['abstinence-timer-card', 'home-counters', 'home-manage']) {
    assert(home.includes(keep), `Home lost its RC-2A status-surface section: ${keep}`);
  }
  for (const gone of ['home-loop-hub', 'home-checkin-summary', 'home-room-state', 'home-onboarding']) {
    assert(!home.includes(gone), `Home dashboard section returned (RC-2A removed it): ${gone}`);
  }

  // (5) 기록 is a real month grid reading the ledger by date, with no fabricated history.
  const cal = read('src/screens/CalendarScreen.jsx');
  assert(cal.includes('month-grid') && /WEEKDAYS\s*=\s*\[/.test(cal), '기록 is not a real month grid');
  assert(/aria-label="이전 달"/.test(cal) && /aria-label="다음 달"/.test(cal), '기록 month grid lost month navigation');
  assert(/ledger\[dateMs\] \?\? null/.test(cal), '기록 calendar does not read records from the ledger by date');
  assert(!cal.includes('buildDayRecords'), '기록 calendar must not use the old seeded day builder');
  assert(!/const SEED\s*=/.test(read('src/constants/recentDays.js')), 'a fabricated SEED of past records returned to recentDays.js');
});

// 76 — RC-2B real cat room. A single cross-cutting net pinning the RC-2B intent so a
// future change can't quietly revert it: the cat room offers REAL drag-and-drop item
// placement (pointer events, normalized coords) that persists across reload, items
// are repositionable + removable, the snack hand-off is a real travel that updates
// real fed state, and NONE of it makes a fake cat motion/eating claim (the cat art is
// still a static composite — placement uses honest framed cards, not fake sprites).
check('RC-2B real cat room: drag placement persists, snack handoff animates, honest copy', () => {
  const dec = read('src/components/PetRoomDecorator.jsx');
  const screen = read('src/screens/PetRewardScreen.jsx');
  const app = read('src/App.jsx');
  const css = read('src/styles/components.css');
  const qa = read('scripts/nof-mvp-flow-qa.mjs');

  // (a) Real pointer-event drag/drop in the decorator: place from the tray AND move a
  //     placed card; plus a remove/return action. (Two onPointerDown wirings: tray + card.)
  assert((dec.match(/onPointerDown=\{/g) || []).length >= 2, 'decorator must wire pointer drag for BOTH tray place and card move');
  assert(
    /addEventListener\('pointermove'/.test(dec) && /addEventListener\('pointerup'/.test(dec),
    'decorator drag does not track window pointermove/pointerup',
  );
  assert(/beginCardDrag/.test(dec) && /onMove\?\.\(/.test(dec), 'decorator cannot reposition a placed card (no onMove)');
  assert(/onRemove\?\.\(/.test(dec), 'decorator has no remove/return action for a placed item');

  // (b) Coordinates are normalized percent of the stage and clamped inside it (mobile-safe).
  assert(/clamp01/.test(dec) && /\* 100\}%/.test(dec), 'placement coordinates are not normalized percent of the stage');

  // (c) Placement is wired to App and persisted through saveState (survives a reload).
  assert(/onPlace=\{onPlaceItemAt\}/.test(screen) && /onMove=\{onMoveItem\}/.test(screen), 'decorator place/move are not wired to App handlers');
  const saveBody = app.match(/saveState\(\{[\s\S]*?\}\)/);
  assert(saveBody && /placements,/.test(saveBody[0]), 'placements are not persisted through saveState');

  // (d) The stale 배치 계획 (준비 중) placeholder is gone — placement is implemented.
  assert(!screen.includes('배치 계획') && !screen.includes('준비 중'), 'stale 배치 계획/준비 중 placement placeholder wording remains');

  // (e) Snack hand-off is a real travel that updates real fed state — no cat-eating claim.
  assert(/@keyframes snack-toss \{[\s\S]*?translateY\(-?\d+px\)[\s\S]*?\}/.test(css), 'snack-toss is not a real translateY travel');
  assert(screen.includes('petFedToday') && screen.includes('오늘 간식 놓아주기 완료'), 'feed does not surface the real persisted fed-today state');
  for (const fake of ['먹었', '먹는', '움직였', '달려', '골골', '야옹', '반응했']) {
    assert(!dec.includes(fake) && !screen.includes(fake), `cat room makes a fake cat-motion/eating claim: ${fake}`);
  }

  // (f) The browser QA covers the three new behaviors with REAL (non-constant) assertions,
  //     and drives a real pointer drag for the reposition behavior.
  for (const id of ['B28', 'B29', 'B30']) {
    assert(new RegExp(`check\\(\\s*['"]${id}['"]\\s*,`).test(qa), `QA flow has no real check('${id}', …)`);
    assert(!new RegExp(`check\\(\\s*['"]${id}['"]\\s*,\\s*(?:true|false|1|0)\\b`).test(qa), `QA flow check('${id}') is gutted to a constant`);
  }
  assert(/pointerDrag\(/.test(qa), 'QA flow does not drive a real pointer drag (reposition) for B29');
});

// 77 — RC-4 first-run honesty (counters / Home). A cleared install must never present
// unearned abstinence progress as the user's own. The seeds are explicit 예시 samples;
// Home discloses that, hides the 최장 record while a counter is still a sample (the
// longest was not earned), and offers a one-tap honest "내 기록으로 시작" that converts the
// samples into a real run (start = now, isSample dropped, longest 0). Editing a sample
// also takes ownership (clears isSample). The banner must NOT reuse a removed Home
// dashboard/onboarding section (RC-2A Home diet stays intact).
check('RC-4 first-run counters are honest 예시 samples with a one-tap real start (no unearned streak)', () => {
  const app = read('src/App.jsx');
  const home = read('src/screens/HomeScreen.jsx');

  // (a) Samples are seeded ONLY on a first-ever load (no persisted bundle yet).
  assert(
    /persisted\?\.counters \?\? makeDefaultCounters\(\)/.test(app),
    'counters are not seeded from makeDefaultCounters() only on first load',
  );

  // (b) A one-tap handler converts the samples to a REAL run: start = now, isSample false,
  //     longest 0 — so no fabricated elapsed/longest carries into the user's own run.
  const own = app.match(/const startOwnRun = \(\)[\s\S]*?\n  \};/);
  assert(own, "no startOwnRun() handler to convert 예시 samples into the user's own run");
  assert(
    /startMs:\s*now/.test(own[0]) && /isSample:\s*false/.test(own[0]) && /longestDays:\s*0/.test(own[0]),
    'startOwnRun() must reset start to now, drop isSample, and zero longest',
  );
  assert(/onStartOwnRun=\{startOwnRun\}/.test(app), 'App does not pass onStartOwnRun down to the screen');

  // (c) Editing a sample counter also takes ownership (clears the 예시 flag).
  const edit = app.match(/const editCounter = \([\s\S]*?\n  \};/);
  assert(
    edit && /isSample:\s*false/.test(edit[0]),
    'editCounter() must clear isSample so a user-set start is no longer a sample',
  );

  // (d) Home discloses the sample state, offers the one-tap honest start, and gates the
  //     최장 record on a non-sample counter (a sample never shows an earned-looking 최장).
  assert(home.includes('예시'), 'Home does not label the sample counters (예시)');
  assert(home.includes('내 기록으로 시작'), 'Home offers no one-tap honest start (내 기록으로 시작)');
  assert(home.includes('onStartOwnRun'), 'Home does not wire the onStartOwnRun handler');
  assert(home.includes('isSample'), 'Home does not branch on isSample (sample label + 최장 gating)');
  assert(
    /!heroIsSample \?[\s\S]{0,160}최장 \{bestDays\}일/.test(home),
    'hero 최장 record is not gated behind a non-sample check (!heroIsSample)',
  );
  assert(
    /!c\.isSample \?[\s\S]{0,200}최장 /.test(home),
    'counter-card 최장 record is not gated behind a non-sample check (!c.isSample)',
  );
  for (const banned of ['home-onboarding', 'home-loop-hub', 'home-checkin-summary', 'home-room-state']) {
    assert(!home.includes(banned), `RC-4 sample banner must not reuse a removed Home section class: ${banned}`);
  }
});

// 78 — RC-4 first-run honesty (calendar). The monthly record calendar must not synthesise
// a per-day abstinence streak from the current run start: an unrecorded past day reads
// 기록 전 (unknown), never a fabricated 이어가는 중 · N일째. Only TODAY uses the live recorded
// abstinence state. The greeting no longer claims pattern insight the screen never computes.
// The RC-2A real-ledger month grid (no fabricated history) stays intact.
check('RC-4 calendar shows no synthesised per-day abstinence streak (honest greeting)', () => {
  const cal = read('src/screens/CalendarScreen.jsx');

  // (a) The old synthesis from abstinenceStartMs is gone (no fabricated clean days / streak).
  assert(!/withinRun\s*\?\s*'clean'/.test(cal), "calendar still synthesises a past-day 'clean' state from the run start");
  assert(!cal.includes('abstinenceStartMs'), 'calendar still reads abstinenceStartMs to fabricate per-day state');
  assert(!/streakDay:\s*withinRun/.test(cal), 'calendar still derives a per-day streakDay from the run start');

  // (b) Past, unrecorded days read 기록 전 (the honest neutral/unknown state).
  assert(cal.includes("unknown: '기록 전'"), 'calendar lost the honest unknown (기록 전) state label');

  // (c) The greeting no longer overclaims pattern insight it does not compute.
  assert(!cal.includes('패턴이 보이기 시작했어요'), 'calendar greeting still overclaims pattern insight (패턴이 보이기 시작했어요)');

  // (d) Still a real ledger-backed month grid (RC-2A invariant intact, no fabricated history).
  assert(
    /ledger\[dateMs\] \?\? null/.test(cal) && cal.includes('month-grid'),
    'calendar is no longer a real ledger-backed month grid',
  );
});

// 79 — RC-4 first-run honesty is verified by a REAL browser behavior (B31): on a freshly
// cleared install the harness asserts the 예시 sample label, a one-tap 내 기록으로 시작 path,
// NO earned-looking 최장 record, and no 금욕/체크인 — on rendered DOM, not source strings.
// Pins the behavior so it can't be silently dropped or gutted to a constant tautology.
check('RC-4 first-run honesty is verified by a real browser behavior (B31)', () => {
  const qa = read('scripts/nof-mvp-flow-qa.mjs');
  assert(/B31:/.test(qa), 'B31 is not declared in the BEHAVIORS map');
  assert(/check\(\s*'B31'\s*,/.test(qa), "QA flow has no real check('B31', …) call");
  assert(!/check\(\s*'B31'\s*,\s*(?:true|false|1|0)\b/.test(qa), "QA flow check('B31') is gutted to a constant");
  // The B31 assertion must actually probe the first-run honesty signals (not a stub).
  assert(qa.includes("c.has('내 기록으로 시작')"), 'B31 does not assert the one-tap honest start path');
  assert(/!\(await c\.has\('최장'\)\)/.test(qa), 'B31 does not assert the unearned 최장 record is hidden on first run');
  assert(qa.includes("c.has('체크인')"), 'B31 does not assert the first run is free of 체크인');
});

// 80 — RC-5 records/calendar usefulness must stay HONEST. The month calendar now gives REAL
// recognition for days the user actually recorded — a pure COUNT of real entries, never a
// streak/insight/success claim — and the day detail surfaces the saved writing plus useful
// next actions through EXISTING routes only, without copying a past note into today. This
// pins those gains so they can't quietly regress into a fabricated insight or a fake claim.
check('RC-5 records usefulness stays honest (real recorded-day count, honest CTAs, no fake insight)', () => {
  const cal = read('src/screens/CalendarScreen.jsx');

  // (a) Recognition is a REAL count derived from actual data, not a hardcoded number.
  assert(/monthRecordCount\s*=\s*cells/.test(cal), 'month record count is not derived from the real rendered cells');
  assert(
    /totalRecordCount\s*=/.test(cal) && /Object\.keys\(ledger\)/.test(cal),
    'total record count is not derived from the real saved ledger',
  );
  assert(
    /\{monthRecordCount\}/.test(cal) && /\{totalRecordCount\}/.test(cal),
    'the recorded-day counts are not rendered from the computed values',
  );
  assert(
    cal.includes('이 달 기록한 날') && cal.includes('지금까지 기록한 날'),
    'records lost the honest recorded-day recognition labels',
  );

  // (b) The recognition only appears when there is REAL history — no "0일" recognition on a
  //     fresh install (the honest empty state covers that case).
  assert(/totalRecordCount > 0 \?/.test(cal), 'recorded-day recognition must be gated on real history (totalRecordCount > 0)');

  // (c) The day detail offers useful next actions through EXISTING routes only.
  assert(cal.includes('오늘 기록으로 이어가기'), 'day detail lost the 오늘 기록으로 이어가기 next action');
  assert(cal.includes('잠깐 멈춤'), 'day detail lost the 잠깐 멈춤 next action');
  assert(
    cal.includes('보호 계획') && /onNavigate\('protection'\)/.test(cal),
    'day detail lost the 보호 계획 확인 route',
  );

  // (d) A past note is NEVER auto-copied into today (criterion 5): the continue action goes
  //     through onCheckinFromRecord (a neutral day-context flag, no note), and the copy says so.
  assert(/onCheckinFromRecord/.test(cal), 'continue-to-today must go through onCheckinFromRecord (no note copy)');
  assert(cal.includes('오늘로 옮겨지지 않아요'), 'day detail must state that a past note is not copied into today');

  // (e) No fabricated analysis/pattern/streak/success claim leaks into the records surface.
  for (const fake of ['패턴', '분석', '성공', '연속']) {
    assert(!cal.includes(fake), `records surface makes a fake insight claim: ${fake}`);
  }
});

// 81 — RC-5 records usefulness is verified by a REAL browser behavior (B32): with a real saved
// record present, the month calendar shows the recorded day distinctly + a real recorded-day
// count, the day detail reads back the saved writing and offers useful next actions, a
// recordless day still reads 기록 전, and no fake insight / 금욕 / 체크인 appears — all on
// rendered DOM, not source strings. Pins the behavior so it can't be dropped or gutted.
check('RC-5 records usefulness is verified by a real browser behavior (B32)', () => {
  const qa = read('scripts/nof-mvp-flow-qa.mjs');
  assert(/B32:/.test(qa), 'B32 is not declared in the BEHAVIORS map');
  assert(/check\(\s*'B32'\s*,/.test(qa), "QA flow has no real check('B32', …) call");
  assert(!/check\(\s*'B32'\s*,\s*(?:true|false|1|0)\b/.test(qa), "QA flow check('B32') is gutted to a constant");
  // The B32 assertion must actually probe the usefulness signals (not a stub).
  assert(qa.includes('data-has-record="true"'), 'B32 does not assert the saved-record day is visually distinct');
  assert(
    qa.includes('이 달 기록한 날') || qa.includes('지금까지 기록한 날'),
    'B32 does not assert the real recorded-day recognition',
  );
  assert(
    qa.includes('오늘 기록으로 이어가기') || qa.includes('보호 계획'),
    'B32 does not assert a useful next action through an existing route',
  );
  assert(
    qa.includes('기록 전') || qa.includes('남긴 기록이 없어요'),
    'B32 does not assert a recordless day stays honest (기록 전)',
  );
});

// 82 — RC-6 protection clarity (corrected). The 보호 설정 screen the user actually reaches must
// state its honest scope up front (a self-opened protection plan, NOT an automatic or
// device-wide blocker), give practical next actions through EXISTING routes only (잠깐 멈춤 +
// 오늘 기록), and present the REAL protection path as a NoF Chrome extension ("이 기기 Chrome 차단")
// that is honest it is browser-scoped (not device-wide / other-app) and routes to the real
// 차단 테스트 screen — NOT a toy "experiment/preview". Developer-facing experiment/preview/PoC
// copy is banned on this product surface. The same device-wide honesty + 오늘 기록 next action are
// reinforced on the Shield (차단 설정) screen. This pins the gains so the protection area can't
// quietly regress into a fake/auto/device-wide blocking claim OR a toy-demo framing. The
// disclaimer is a plain negation on purpose — the bare "자동 차단" token stays forbidden.
check('RC-6 protection clarity stays honest (explicit non-blocking scope, real next actions, real Chrome-extension path)', () => {
  const screen = read('src/screens/ProtectionScreen.jsx');
  const shield = read('src/screens/ShieldScreen.jsx');

  // (a) Explicit honest scope: it is a plan, it does not auto-block, and it does not lock the
  //     whole device or other apps.
  assert(screen.includes('보호 계획'), 'protection screen lost the honest 보호 계획 framing');
  assert(/자동으로 막아주지/.test(screen), 'protection screen must state it does NOT automatically block');
  assert(/기기 전체/.test(screen) && /막지/.test(screen), 'protection screen must state it does NOT lock the whole device/other apps');

  // (b) Practical next actions through EXISTING routes (no new fake feature): 잠깐 멈춤 + 오늘 기록.
  assert(screen.includes('지금 할 수 있는 행동'), 'protection screen lost the practical action card');
  assert(/onNavigate\('urge'\)/.test(screen), 'protection screen lost the 잠깐 멈춤 next action');
  assert(/onNavigate\('checkin'\)/.test(screen) && screen.includes('오늘 기록'), 'protection screen lost the 오늘 기록 next action');

  // (c) The REAL protection path is a NoF Chrome extension (browser-scoped blocking), honest
  //     that it is not device-wide/other-app, routing to the real 차단 테스트 (shieldExtension) screen.
  assert(screen.includes('이 기기 Chrome 차단'), 'protection screen lost the Chrome-extension blocking card');
  assert(screen.includes('Chrome 확장'), 'protection Chrome card is not framed as a Chrome extension');
  assert(screen.includes('아직 기기 전체나 다른 앱까지 막는 기능은 아니에요'), 'protection Chrome card must state it is browser-scoped, not device-wide/other-app');
  assert(/onNavigate\('shieldExtension'\)/.test(screen), 'protection Chrome card does not route to the real 차단 테스트 (shieldExtension) screen');

  // (c2) NO developer-facing experiment/preview/PoC copy on this product surface (RC-6 fix).
  for (const dev of ['실험 기능', '앱 안에서만 확인하는 실험 기능', 'PoC', '실제 웹은 열지 않고', '멈춤 흐름을 미리 확인', '미리보기']) {
    assert(!screen.includes(dev), `protection screen still carries developer-facing experiment/preview copy: ${dev}`);
  }

  // (d) No fake/auto/device-wide blocking, AI, cloud, or medical claim on the surface.
  for (const fake of ['자동 차단', '차단했어요', '차단하고 있어요', '차단 중이에요', '막고 있어요', '기기 전체 보호', '모든 앱 차단', 'AI가 감지', 'AI 분석', 'AI 추천', '클라우드', '동기화', '치료', '진단', '처방', '회복 점수', '금욕', '체크인']) {
    assert(!screen.includes(fake), `protection clarity surface makes a forbidden claim/vocabulary: ${fake}`);
  }

  // (e) The Shield (차단 설정) screen reinforces the same device-wide honesty + 오늘 기록 action.
  assert(/기기 전체/.test(shield) && /막지/.test(shield), 'Shield screen must state it does NOT lock the whole device/other apps');
  assert(/onNavigate\('checkin'\)/.test(shield) && shield.includes('오늘 기록'), 'Shield screen lost the 오늘 기록 next action');
});

// 83 — RC-6 protection clarity is verified by a REAL browser behavior (B33): the 보호 설정 screen
// the user reaches states its honest scope (a self-opened plan, not an automatic or device-wide
// blocker), exposes practical 잠깐 멈춤 + 오늘 기록 next actions, frames the real protection path as
// a NoF Chrome extension (no toy experiment/preview copy), and carries no 금욕/체크인 or fake
// AI/medical/recovery claim — all on rendered DOM, with the 잠깐 멈춤 route actually exercised.
// Pins the behavior so it can't be dropped or gutted to a constant tautology.
check('RC-6 protection clarity is verified by a real browser behavior (B33)', () => {
  const qa = read('scripts/nof-mvp-flow-qa.mjs');
  assert(/B33:/.test(qa), 'B33 is not declared in the BEHAVIORS map');
  assert(/check\(\s*'B33'\s*,/.test(qa), "QA flow has no real check('B33', …) call");
  assert(!/check\(\s*'B33'\s*,\s*(?:true|false|1|0)\b/.test(qa), "QA flow check('B33') is gutted to a constant");
  // The B33 assertion must actually probe the protection clarity signals (not a stub).
  assert(qa.includes("c.has('자동 차단')"), 'B33 does not assert the absence of an automatic-blocking claim');
  assert(qa.includes('자동으로 막아주지'), 'B33 does not assert the honest non-blocking scope copy');
  assert(qa.includes('Chrome 확장을 연결하면'), 'B33 does not assert the real NoF Chrome-extension blocking card');
  assert(qa.includes("c.has('실험 기능')"), 'B33 does not assert the absence of developer experiment/preview copy');
  assert(qa.includes('오늘 기록으로 남기기'), 'B33 does not assert the 오늘 기록 next action');
  assert(qa.includes('지금 충동을 멈춰요'), 'B33 does not assert the 잠깐 멈춤 route actually lands on urge');
});

// 84 — RC-7 app↔extension bridge (chrome-shield side). The web app can only reach the
// extension through a NARROW externally_connectable allow-list + an onMessageExternal
// handler that speaks the RC-7 protocol (PING / GET_STATUS / SET_TEST_SIGNAL /
// SET_BLOCK_RULES / CLEAR_RULES) and REUSES the existing local declarativeNetRequest path
// (applySignals). No broad origin, no port (invalid in match patterns), no second engine,
// and the same-extension onMessage handler stays for popup/options.
check('chrome-shield exposes a narrow RC-7 app↔extension bridge (externally_connectable + onMessageExternal + protocol)', () => {
  const dir = 'extensions/chrome-shield';
  const mf = JSON.parse(read(`${dir}/manifest.json`));
  const ec = mf.externally_connectable;
  assert(ec && Array.isArray(ec.matches) && ec.matches.length > 0, 'manifest has no externally_connectable.matches for the NoF app');
  // Production + local-dev origins. NOTE: Chrome match patterns do NOT support ports, so the
  // localhost/127.0.0.1 patterns are port-LESS — a port-less host matches ALL dev ports
  // (4173/5173/…). A ported pattern is invalid and makes Chrome reject the whole manifest.
  const REQUIRED_ORIGINS = [
    'https://nof-mauve.vercel.app/*',
    'http://localhost/*',
    'http://127.0.0.1/*',
  ];
  for (const o of REQUIRED_ORIGINS) {
    assert(ec.matches.includes(o), `externally_connectable is missing the allowed origin: ${o}`);
  }
  for (const bad of ['<all_urls>', '*://*/*', 'https://*/*', 'http://*/*', '*']) {
    assert(!ec.matches.includes(bad), `externally_connectable exposes a broad origin: ${bad}`);
  }
  for (const m of ec.matches) {
    assert(!/:\d+\//.test(m), `externally_connectable pattern has a port (invalid match pattern, breaks manifest load): ${m}`);
  }
  // service worker: handle EXTERNAL messages (a web page needs onMessageExternal), keep the
  // same-extension onMessage, speak the full RC-7 protocol, and reuse the local engine.
  const sw = read(`${dir}/service_worker.js`);
  assert(sw.includes('onMessageExternal'), 'service_worker.js has no onMessageExternal listener (web app cannot reach it)');
  assert(/onMessage\.addListener/.test(sw), 'service_worker.js dropped the same-extension onMessage handler');
  for (const type of ['PING', 'GET_STATUS', 'SET_TEST_SIGNAL', 'SET_BLOCK_RULES', 'CLEAR_RULES']) {
    assert(sw.includes(`'${type}'`), `service_worker.js does not handle the RC-7 message type: ${type}`);
  }
  assert(sw.includes('applySignals('), 'service_worker.js does not reuse the local dynamic-rule path (applySignals) for app-driven signals');
});

// 85 — RC-7 web-app side. ShieldExtensionScreen wires a REAL connection: it imports the
// bridge, PINGs the extension, offers a local 확장 ID field + 연결 확인 + 테스트 신호 보내기,
// and shows 연결됨 ONLY behind a connection-state branch (conn.state === 'connected'), never
// a static label, with an honest 아직 연결되지 않았어요 fallback. The bridge never fabricates a
// link (honors lastError, degrades to ok:false) and adds no network sink (runtime messaging
// only). The screen also stays in the no-user-facing-체크인 sweep (RC-2A guard above).
check('RC-7 app extension-connection UI is real and honest (PING-gated, no fake 연결됨)', () => {
  const screen = read('src/screens/ShieldExtensionScreen.jsx');
  assert(/from '\.\.\/lib\/chromeExtensionBridge\.js'/.test(screen), 'ShieldExtensionScreen does not import the chromeExtensionBridge');
  assert(screen.includes('pingExtension('), 'ShieldExtensionScreen never PINGs the extension (no real connection check)');
  assert(screen.includes('확장 ID'), 'ShieldExtensionScreen has no 확장 ID connection field');
  assert(screen.includes('연결 확인'), 'ShieldExtensionScreen has no 연결 확인 action');
  assert(screen.includes('테스트 신호 보내기'), 'ShieldExtensionScreen has no 테스트 신호 보내기 action');
  assert(screen.includes('아직 연결되지 않았어요'), 'ShieldExtensionScreen lost the honest not-connected copy');
  assert(screen.includes('연결됨'), 'ShieldExtensionScreen lost the connected-state copy');
  assert(screen.includes("conn.state === 'connected'"), 'ShieldExtensionScreen renders 연결됨 without a real connection-state condition');

  const bridge = read('src/lib/chromeExtensionBridge.js');
  assert(bridge.includes('lastError'), 'bridge does not honor chrome.runtime.lastError (could fake a connection)');
  assert(bridge.includes('no_chrome_runtime'), 'bridge does not degrade gracefully when chrome.runtime is absent');
  assert(/sendMessage\(/.test(bridge), 'bridge does not actually send a runtime message');
  for (const sink of ['fetch(', 'XMLHttpRequest', 'http://', 'https://']) {
    assert(!bridge.includes(sink), `chromeExtensionBridge adds a network sink (${sink}) — it must use chrome.runtime messaging only`);
  }
});

// 86 — RC-7 connection is verified by a REAL browser behavior (B34): the connection screen
// is reachable, states browser-scoped scope, offers the local 확장 ID + 연결 확인 mechanism,
// exercises 연결 확인, and asserts it never flips to 연결됨 without a real extension reply.
// Pins the behavior so it can't be dropped or gutted to a constant tautology.
check('RC-7 extension connection is verified by a real browser behavior (B34)', () => {
  const qa = read('scripts/nof-mvp-flow-qa.mjs');
  assert(/B34:/.test(qa), 'B34 is not declared in the BEHAVIORS map');
  assert(/check\(\s*'B34'\s*,/.test(qa), "QA flow has no real check('B34', …) call");
  assert(!/check\(\s*'B34'\s*,\s*(?:true|false|1|0)\b/.test(qa), "QA flow check('B34') is gutted to a constant");
  assert(qa.includes('확장 ID를 붙여넣어 연결을 확인해요'), 'B34 does not assert the extension-ID connection mechanism');
  assert(qa.includes("c.click('연결 확인')"), 'B34 does not actually exercise the 연결 확인 action');
  assert(qa.includes("c.has('연결됨')"), 'B34 does not assert that no fake connected state appears without a real extension');
  assert(qa.includes('테스트 신호 보내기'), 'B34 does not assert the 테스트 신호 보내기 action');
});

// 87 — RC-8 saved-signal → REAL browser block rule. The web app can push a user-authored
// concrete signal to THIS Chrome's declarativeNetRequest dynamic rules and prove a redirect,
// closing the RC-7 gap (which only sent the harmless static TEST_SIGNAL). It must stay honest:
// abstract saved 위험 신호 (category/situation) are surfaced as a COUNT only — never sent as if
// a label were a browser rule — the bridge has a real SET_BLOCK_RULES sender (no network sink),
// the screen shows success ONLY behind res.ok and keeps the not-connected fallback, and the
// extension normalizes conservatively (caps the count, rejects dangerous schemes) before
// reusing the local applySignals/buildDynamicRules path. README documents the slice + limits.
check('RC-8 saved-signal → real browser block rule is honest (test-value send, ok-gated, conservative normalize)', () => {
  // bridge: a real SET_BLOCK_RULES sender, runtime messaging only (no network sink).
  const bridge = read('src/lib/chromeExtensionBridge.js');
  assert(/export function sendBlockRules/.test(bridge), 'bridge has no sendBlockRules() sender for RC-8');
  assert(bridge.includes("type: 'SET_BLOCK_RULES'"), 'sendBlockRules does not send the SET_BLOCK_RULES message');
  for (const sink of ['fetch(', 'XMLHttpRequest', 'http://', 'https://']) {
    assert(!bridge.includes(sink), `chromeExtensionBridge adds a network sink (${sink}) — runtime messaging only`);
  }

  // screen: a real send field wired to the bridge, ok-gated success, honest not-connected
  // fallback, saved signals surfaced as a COUNT (blocklist.length) — not sent as abstract rules.
  const screen = read('src/screens/ShieldExtensionScreen.jsx');
  assert(screen.includes('sendBlockRules'), 'ShieldExtensionScreen does not import/use sendBlockRules');
  assert(screen.includes('차단 테스트용 값'), 'ShieldExtensionScreen has no 차단 테스트용 값 send field');
  assert(screen.includes('이 브라우저 차단 규칙에 반영'), 'ShieldExtensionScreen has no block-rule send action');
  assert(screen.includes('blocklist.length'), 'ShieldExtensionScreen does not surface the saved-signal count');
  assert(/blocklist\s*=\s*\[\]/.test(screen), 'ShieldExtensionScreen does not accept the blocklist prop (default [])');
  assert(/res\s*&&\s*res\.ok/.test(screen), 'ShieldExtensionScreen claims a block result without gating on res.ok');
  assert(screen.includes('아직 연결되지 않았어요'), 'ShieldExtensionScreen lost the honest not-connected fallback');
  // It must NOT send the abstract saved signals as rules (that would fake blocking).
  assert(!/sendBlockRules\([^)]*blocklist/.test(screen), 'ShieldExtensionScreen sends abstract saved signals as rules — that fakes blocking');

  // extension: SET_BLOCK_RULES reuses the local engine AND normalizes conservatively.
  const sw = read('extensions/chrome-shield/service_worker.js');
  assert(sw.includes("case 'SET_BLOCK_RULES'"), 'service_worker.js dropped the SET_BLOCK_RULES handler');
  assert(sw.includes('applySignals(normalizeSignals('), 'SET_BLOCK_RULES does not reuse applySignals on normalized signals');
  assert(sw.includes('buildDynamicRules'), 'service_worker.js no longer builds dynamic rules via buildDynamicRules');
  assert(/MAX_BLOCK_RULES\s*=\s*\d+/.test(sw), 'normalizeSignals has no rule-count cap (MAX_BLOCK_RULES)');
  assert(sw.includes('BLOCKED_SCHEME') && /BLOCKED_SCHEME\.test\(/.test(sw), 'normalizeSignals does not reject dangerous URL schemes via BLOCKED_SCHEME');
  assert(/javascript\|data/.test(sw), 'BLOCKED_SCHEME does not list javascript|data dangerous schemes');

  // README documents the RC-8 slice + its honest limits, and points at the smoke script.
  const readme = read('extensions/chrome-shield/README.md');
  assert(/RC-8/.test(readme), 'README does not document the RC-8 saved-signal block-rule slice');
  assert(readme.includes('nof-extension-smoke.mjs'), 'README does not reference the RC-8 extension smoke script');
});

// 88 — RC-8 block-rule path is verified by a REAL browser behavior (B35): the send field is
// present, pressing 반영 with no extension answering stays honestly not-connected (no fake
// install), and the saved-signal count is surfaced. Pins the behavior against constant-gutting.
check('RC-8 block-rule send is verified by a real browser behavior (B35)', () => {
  const qa = read('scripts/nof-mvp-flow-qa.mjs');
  assert(/B35:/.test(qa), 'B35 is not declared in the BEHAVIORS map');
  assert(/check\(\s*'B35'\s*,/.test(qa), "QA flow has no real check('B35', …) call");
  assert(!/check\(\s*'B35'\s*,\s*(?:true|false|1|0)\b/.test(qa), "QA flow check('B35') is gutted to a constant");
  assert(qa.includes('차단 테스트용 값'), 'B35 does not assert the block-rule send field');
  assert(qa.includes("clickExact('이 브라우저 차단 규칙에 반영')"), 'B35 does not exercise the block-rule send action');
  assert(qa.includes('아직 연결되지 않았어요. 먼저 연결 확인을 눌러요.'), 'B35 does not assert the honest not-connected result');
  assert(qa.includes('저장한 위험 신호'), 'B35 does not assert the saved-signal count surfacing');
});

// 89 — RC-9: the extension smoke negative-control must be HOST-AGNOSTIC so qa:ext passes
// against BOTH local preview and the production origin (nof-mauve). It must NOT require the
// pass-through URL to contain a hardcoded 127.0.0.1 host; instead it proves "not blocked"
// STRUCTURALLY — the non-target did NOT redirect to blocked.html and did NOT land on a
// chrome-extension:// page — while still confirming it stayed in the app (the allowed token
// or the app URL). This pins the RC-8 prod-smoke script limitation closed for good.
check('RC-9 extension smoke negative-control is host-agnostic (no hardcoded 127.0.0.1)', () => {
  const ext = read('scripts/nof-extension-smoke.mjs');
  assert(
    !/allowHref\.includes\(\s*['"]127\.0\.0\.1['"]\s*\)/.test(ext),
    'extension smoke still hardcodes 127.0.0.1 in the negative-control pass-through check',
  );
  assert(
    /!\s*allowHref\.includes\(\s*['"]blocked\.html['"]\s*\)/.test(ext),
    'negative-control must assert the non-target did NOT redirect to blocked.html',
  );
  assert(
    /chrome-extension:\/\//.test(ext) && /allowHref/.test(ext),
    'negative-control must assert the non-target did NOT land on a chrome-extension:// page',
  );
  // It must still confirm the non-target stayed in the app context, not merely "not blocked".
  assert(
    /ALLOW_TOKEN/.test(ext) && /passedThrough/.test(ext),
    'negative-control lost the in-app pass-through confirmation',
  );
});

// 90 — RC-9 guided 3분 보호 설정 is honest. ShieldExtensionScreen carries a guided stepper that
// ORCHESTRATES the proven RC-7 (PING) + RC-8 (SET_BLOCK_RULES) pieces into a 위험 신호 정리 →
// Chrome 확장 연결 → 차단 규칙 반영 → 차단 테스트 flow. Completion state must be DERIVED from real
// responses — connected only via conn.state === 'connected', rule-applied only behind res.ok —
// never set optimistically; it keeps the honest browser-scoped scope + always-available 잠깐 멈춤
// / 오늘 기록 CTAs; and it carries no 체크인/금욕 or fake AI/medical/device-wide/full-block claim.
check('RC-9 guided protection setup is honest (guided copy, real-state completion, honest scope)', () => {
  const screen = read('src/screens/ShieldExtensionScreen.jsx');

  // (a) The guided stepper title + the four step labels are present.
  assert(screen.includes('3분 보호 설정'), 'guided setup is missing the 3분 보호 설정 title');
  for (const step of ['위험 신호 정리', 'Chrome 확장 연결', '차단 규칙 반영', '차단 테스트']) {
    assert(screen.includes(step), `guided setup is missing the step label: ${step}`);
  }

  // (b) Completion is DERIVED from real state, never set optimistically: a ruleApplied flag
  //     flips true ONLY inside the res.ok branch and resets to false on a failed/empty send,
  //     and the connected step reads conn.state === 'connected'.
  assert(/const \[ruleApplied, setRuleApplied\] = useState\(false\)/.test(screen), 'guided setup has no ruleApplied real-state flag');
  assert(/res && res\.ok[\s\S]{0,120}setRuleApplied\(true\)/.test(screen), 'ruleApplied is not gated behind a real SET_BLOCK_RULES ok response');
  assert(/setRuleApplied\(false\)/.test(screen), 'guided setup never resets ruleApplied on a failed/empty send (could fake completion)');
  assert(screen.includes("conn.state === 'connected'"), 'guided connected step is not gated on a real connection state');

  // (c) Honest browser-scoped scope + the always-available 잠깐 멈춤 / 오늘 기록 next actions.
  assert(screen.includes('이 Chrome 브라우저에서 먼저 작동해요'), 'guided setup lost the browser-scoped honesty line');
  assert(screen.includes('기기 전체나 다른 앱까지 막는 기능은 아니에요'), 'guided setup lost the not-device-wide honesty line');
  assert(/onNavigate\('urge'\)/.test(screen) && screen.includes('잠깐 멈춤'), 'guided setup lost the 잠깐 멈춤 CTA');
  assert(/onNavigate\('checkin'\)/.test(screen) && screen.includes('오늘 기록'), 'guided setup lost the 오늘 기록 CTA');

  // (d) No forbidden vocabulary / fake claim anywhere on the surface.
  for (const bad of ['체크인', '금욕', '자동 차단', '모든 앱 차단', '기기 전체 보호', '성공 보장', 'AI 감지', '치료', '회복 점수']) {
    assert(!screen.includes(bad), `guided setup makes a forbidden claim/vocabulary: ${bad}`);
  }
});

// 91 — RC-9 guided setup is verified by a REAL browser behavior (B36): the guided stepper is
// reachable and shows the four-step structure, keeps honest scope, exposes 잠깐 멈춤 + 오늘 기록
// CTAs, and — with no real extension answering — does NOT mark connected/complete. Pins the
// behavior so it can't be dropped or gutted to a constant tautology.
check('RC-9 guided setup is verified by a real browser behavior (B36)', () => {
  const qa = read('scripts/nof-mvp-flow-qa.mjs');
  assert(/B36:/.test(qa), 'B36 is not declared in the BEHAVIORS map');
  assert(/check\(\s*'B36'\s*,/.test(qa), "QA flow has no real check('B36', …) call");
  assert(!/check\(\s*'B36'\s*,\s*(?:true|false|1|0)\b/.test(qa), "QA flow check('B36') is gutted to a constant");
  assert(qa.includes('3분 보호 설정'), 'B36 does not assert the guided 3분 보호 설정 structure');
  assert(
    qa.includes('위험 신호 정리') && qa.includes('Chrome 확장 연결') && qa.includes('차단 규칙 반영'),
    'B36 does not assert the guided step labels',
  );
  assert(qa.includes('규칙 반영됨'), 'B36 does not assert the not-completed state token (규칙 반영됨 absent without a real extension)');
});

// 92 — RC-10 blocked-page handoff contract. The in-extension pause page (blocked.html/js) must
// offer an HONEST return path into the NoF web app: the two handoff actions (오늘 기록으로 남기기 /
// 잠깐 멈춤 계속하기) built as NoF app deep links (from=shield&to=record / to=urge). It must keep the
// required honest copy, still never read or reveal the blocked target, and carry no fake
// auto-block/detection claim or 체크인/금욕. Default target is the production app; only a
// localStorage override (a test hook) may repoint it. The link passes from=shield + a coarse
// destination ONLY — never the blocked URL.
check('RC-10 blocked page returns to the app honestly (deep-link handoff, no target leak)', () => {
  const dir = 'extensions/chrome-shield';
  const html = read(`${dir}/blocked.html`);
  const js = read(`${dir}/blocked.js`);

  // (a) Both handoff actions + the required honest copy are present.
  for (const s of ['오늘 기록으로 남기기', '잠깐 멈춤 계속하기', 'NoF 잠깐 멈춤', '지금은 한 번 멈추는 시간이에요', '이 주소는 표시하지 않아요']) {
    assert(html.includes(s), `blocked.html is missing required handoff copy: ${s}`);
  }
  // The original local 5-min pause entry stays (RC-10 adds a return path; it does not remove the pause).
  assert(html.includes('잠깐 멈춤으로 가기'), 'blocked.html lost the local pause entry (잠깐 멈춤으로 가기)');
  // Stable anchor hooks blocked.js targets.
  assert(html.includes('id="go-record"') && html.includes('id="go-urge"'), 'blocked.html is missing the handoff anchors (go-record/go-urge)');

  // (b) blocked.js builds NoF app deep links (from=shield + to=record/urge) with a default app
  //     base, wires both anchors, and passes NO blocked target.
  assert(js.includes('from=shield'), 'blocked.js does not build a from=shield deep link');
  assert(/to=\$\{to\}/.test(js) || (js.includes('to=record') && js.includes('to=urge')), 'blocked.js does not target the record/urge destinations');
  assert(js.includes("getElementById('go-record')") && js.includes("getElementById('go-urge')"), 'blocked.js does not wire the handoff anchors');
  assert(js.includes('nof-mauve.vercel.app'), 'blocked.js has no default NoF app deep-link target');

  // (c) Still no target leak: the pause page must not read the blocked URL / referrer / query.
  for (const leak of ['referrer', 'URLSearchParams', 'document.URL', 'location.search', 'location.href']) {
    assert(!js.includes(leak), `blocked.js may reveal the blocked target (${leak}) — the pause page must not read it`);
  }
  // (d) No fake-blocking / detection / forbidden vocabulary on the pause page.
  for (const bad of ['차단 성공', '자동 차단됨', '자동 차단', '위험 사이트 감지', 'AI가 막았어요', 'AI 감지', '회복 성공', '금욕', '체크인']) {
    assert(!html.includes(bad), `blocked.html makes a forbidden claim/vocabulary: ${bad}`);
    assert(!js.includes(bad), `blocked.js makes a forbidden claim/vocabulary: ${bad}`);
  }
});

// 93 — RC-10 safe deep-link routing in the web app. App.jsx must accept the Chrome 실드 return link
// (from=shield) and open ONLY a coarse destination — to=urge → the 잠깐 멈춤 screen, to=record → the
// 오늘 기록 (checkin) screen — with any unknown/missing destination falling back to home. It must
// NOT read or route on a blocked target URL. The continuation note is one-shot (cleared on the
// first navigation), so it can't grow into a persistent banner.
check('RC-10 web app deep-link routing is safe (from=shield → urge/record, invalid → home)', () => {
  const app = read('src/App.jsx');
  // Gated on from=shield, reads a to= destination.
  assert(/get\('from'\)/.test(app) && app.includes("'shield'"), 'App.jsx does not gate the deep link on from=shield');
  assert(/get\('to'\)/.test(app), 'App.jsx does not read the to= destination');
  // Maps to the two real screens and falls back to home.
  assert(app.includes("'urge'") && app.includes("'checkin'"), 'App.jsx deep link does not map to the urge/checkin screens');
  assert(/\? 'home'|: 'home'|\?\? 'home'|return 'home'/.test(app), 'App.jsx deep link has no safe home fallback');
  // It must NOT read a blocked target from the deep link — only the coarse destination.
  assert(!/get\('target'\)|get\('url'\)|get\('site'\)|get\('q'\)/.test(app), 'App.jsx must not read a blocked target from the deep link');
  // One-shot continuation flag (cleared on navigate), never a persistent banner.
  assert(/fromShield/.test(app), 'App.jsx has no fromShield continuation flag');
  assert(/setFromShield\(false\)/.test(app), 'App.jsx never clears the fromShield flag (the note would persist)');
});

// 94 — RC-10 shield→app deep-link handoff is verified by a REAL browser behavior (B37): a fresh
// load at ?from=shield&to=urge|record lands on the right screen, an invalid destination falls back
// home, and neither landing carries forbidden copy. Pins it against being dropped/gutted.
check('RC-10 shield→app deep-link is verified by a real browser behavior (B37)', () => {
  const qa = read('scripts/nof-mvp-flow-qa.mjs');
  assert(/B37:/.test(qa), 'B37 is not declared in the BEHAVIORS map');
  assert(/check\(\s*'B37'\s*,/.test(qa), "QA flow has no real check('B37', …) call");
  assert(!/check\(\s*'B37'\s*,\s*(?:true|false|1|0)\b/.test(qa), "QA flow check('B37') is gutted to a constant");
  assert(qa.includes('from=shield&to=urge') && qa.includes('from=shield&to=record'), 'B37 does not drive the shield deep-link URLs');
  assert(qa.includes('from=shield&to=bogus'), 'B37 does not assert the invalid-destination fallback');
  assert(qa.includes('지금 충동을 멈춰요'), 'B37 does not assert the 잠깐 멈춤 landing');
});

// 95 — RC-11 compressed extension setup. ShieldExtensionScreen must present setup as one honest
// 준비 → 설치 → ID 복사 flow: the compressed step terms are present, the install KIND is stated
// honestly (Chrome 웹 스토어 not yet; the unpacked ID is not fixed), connection stays PING-gated, and
// the single 완료 (F) state is DERIVED from BOTH a real connection AND a real rule — never a
// static/rendered-only "완료" the screen did not earn.
check('RC-11 chrome extension setup is compressed + honest (install kind, ID copy, real-state 완료)', () => {
  const screen = read('src/screens/ShieldExtensionScreen.jsx');
  // (a) The compressed setup terms (preferred RC-11 copy) are present.
  for (const term of [
    'Chrome 확장 준비', '압축해제 설치', 'Chrome 확장을 준비해요',
    '지금은 개발자용 압축해제 설치 방식이에요', 'chrome://extensions', 'extensions/chrome-shield',
    '확장 ID를 복사해요', '확장 ID', '연결 확인', '이 브라우저 차단 규칙에 반영', '차단 테스트',
  ]) {
    assert(screen.includes(term), `ShieldExtensionScreen is missing the compressed setup term: ${term}`);
  }
  // (b) Web Store is NOT claimed — the honest "not yet" line is present, and no positive
  //     store-install claim is made (this stays an unpacked dev load).
  assert(screen.includes('Chrome 웹 스토어 설치는 아직 아니에요'), 'setup does not state the Chrome 웹 스토어 install is not available yet');
  for (const claim of ['웹 스토어에서 설치', '웹 스토어 설치 완료', '스토어에 등록', '스토어에서 받', '스토어 설치했']) {
    assert(!screen.includes(claim), `setup falsely claims a Chrome 웹 스토어 install: ${claim}`);
  }
  // (c) A fixed/permanent extension ID is NOT claimed (the unpacked id is path-derived / can change),
  //     and the paste mechanism stays (a real input the user fills — connection is user-driven).
  assert(screen.includes('ID가 고정되지 않아요'), 'setup does not state the unpacked extension ID is not fixed');
  for (const claim of ['고정 ID', '고정된 ID', '항상 같은 ID', '영구 ID']) {
    assert(!screen.includes(claim), `setup falsely claims a fixed extension ID: ${claim}`);
  }
  assert(/id="ext-id"/.test(screen), 'setup lost the 확장 ID paste input (#ext-id) — connection must stay user-driven');
  // (d) Connected state stays PING-gated (real reply only), reused from the proven RC-7 bridge.
  assert(screen.includes('pingExtension('), 'setup connection is not PING-gated (no real reply check)');
  assert(screen.includes("conn.state === 'connected'"), 'setup renders connected without a real connection state');
  // (e) The 완료 (F) state is DERIVED from real state — BOTH a real connection AND a real rule —
  //     never a static/rendered-only completion. The 설정 완료 copy must sit behind both flags.
  assert(
    /conn\.state === 'connected' && ruleApplied[\s\S]{0,160}설정 완료/.test(screen),
    'the 설정 완료 state is not gated on BOTH conn.state === connected AND ruleApplied (could fake completion)',
  );
  // (f) The honest auto-confirm limit (the app cannot observe a navigation in another tab) is stated.
  assert(screen.includes('자동으로 확인하지 못해요'), 'setup does not state the app cannot auto-confirm a navigation in another tab');
});

// 96 — RC-11 setup surface stays honest: NO user-facing 체크인 / 금욕 and NO fake AI-detection /
// device-wide / medical / full-blocking claim on ShieldExtensionScreen. Comments are exempt (the
// header comment legitimately discusses internal stage history); only rendered copy is scanned.
check('RC-11 extension setup surface carries no forbidden vocabulary or fake claim', () => {
  const stripComments = (src) =>
    src
      .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
      .split('\n')
      .map((line) => line.replace(/(^|\s)\/\/.*$/, '$1'))
      .join('\n');
  const screen = stripComments(read('src/screens/ShieldExtensionScreen.jsx'));
  for (const bad of [
    '체크인', '금욕', '실험 기능', 'PoC', '자동 차단', '완전 차단', '모든 앱 차단',
    '기기 전체 보호', 'AI 감지', '치료', '회복 점수', '성공 보장',
  ]) {
    assert(!screen.includes(bad), `ShieldExtensionScreen (RC-11) shows forbidden user-facing copy: ${bad}`);
  }
});

// 97 — RC-11 compressed setup is verified by a REAL browser behavior (B38): the setup flow is
// reachable, surfaces the compressed terms + honest install-kind copy, and shows no connected/
// complete state without a real extension reply. Pins it against being dropped/gutted to a constant.
check('RC-11 compressed extension setup is verified by a real browser behavior (B38)', () => {
  const qa = read('scripts/nof-mvp-flow-qa.mjs');
  assert(/B38:/.test(qa), 'B38 is not declared in the BEHAVIORS map');
  assert(/check\(\s*'B38'\s*,/.test(qa), "QA flow has no real check('B38', …) call");
  assert(!/check\(\s*'B38'\s*,\s*(?:true|false|1|0)\b/.test(qa), "QA flow check('B38') is gutted to a constant");
  assert(
    qa.includes('압축해제 설치') && qa.includes('웹 스토어 설치는 아직 아니에요'),
    'B38 does not assert the compressed setup + Chrome 웹 스토어 honesty',
  );
  assert(qa.includes("!(await c.has('설정 완료'))"), 'B38 does not assert the no-fake-completion state');
});

// 98 — RC-11 README alignment: the extension README's manual setup steps match the in-app setup
// terms (chrome://extensions, 개발자 모드, 압축해제, extensions/chrome-shield, 확장 ID copy → paste →
// 연결 확인 → 차단 규칙에 반영 → 차단 테스트), and the limits are honest (unpacked dev load, no Web
// Store / fixed production id yet, Chrome desktop only).
check('RC-11 extension README setup steps match the in-app UI terms + honest limits', () => {
  const readme = read('extensions/chrome-shield/README.md');
  for (const term of [
    'chrome://extensions', '개발자 모드', '압축해제', 'extensions/chrome-shield', '확장 ID',
    '연결 확인', '이 브라우저 차단 규칙에 반영', '차단 테스트',
  ]) {
    assert(readme.includes(term), `README is missing the setup term shown in the UI: ${term}`);
  }
  // Copy + paste the ID into the app — the app-side handoff the UI now spells out.
  assert(/복사/.test(readme) && /붙여넣/.test(readme), 'README does not describe copying + pasting the 확장 ID into the app');
  // Honest limits — unpacked dev load, no Web Store / fixed production id yet, Chrome desktop only.
  assert(/압축해제|언팩/.test(readme), 'README does not state this is an unpacked dev load');
  assert(/웹스토어|웹 스토어/.test(readme), 'README does not address the Chrome Web Store status');
  assert(readme.includes('ID 가 아직 없다') || readme.includes('ID 는 아직 없다') || /고정[^\n]*ID[\s\S]{0,40}(없다|않)/.test(readme),
    'README does not state there is no fixed production extension ID yet');
  assert(/Chrome 데스크톱/.test(readme), 'README does not state Chrome-desktop-only scope');
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
