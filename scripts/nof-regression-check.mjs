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
 *  15. Multiple default abstinence counters exist (multi-counter data model).
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
 *      (usePetSound.hasSound) — no dead sound switch over a silent fallback.
 *  34. The 5-minute crisis pause (잠깐 멈춤) is in the persistent bottom nav and
 *      routes to the real UrgeScreen — reachable in one tap from every screen.
 *  35. The chrome-shield extension keeps LEAST PRIVILEGE: the manifest requests only
 *      the minimal permission set (declarativeNetRequest), declares no dangerous keys
 *      (content_scripts / webRequest / tabs / cookies / scripting / externally_connectable),
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
    home.includes('오늘 상태 남기기') && home.includes("onNavigate('checkin')"),
    'Home record CTA (오늘 상태 남기기 → checkin) missing',
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
check('multiple default abstinence counters exist', () => {
  const app = read('src/App.jsx');
  assert(/function makeDefaultCounters\(/.test(app), 'makeDefaultCounters() seed factory missing');
  for (const name of ['금딸', 'SNS 줄이기', '야식 끊기', '음주 줄이기']) {
    assert(app.includes(name), `default counter missing: ${name}`);
  }
  for (const field of ['startMs', 'targetDays', 'longestDays']) {
    assert(app.includes(field), `counter model field missing: ${field}`);
  }
  assert(app.includes('selectedCounterId'), 'no selectedCounterId state in App.jsx');
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
// example counters (충동/검색 → 금딸 c_nofap; 밤 시간/숏폼 → SNS 줄이기 c_sns).
check('rule model carries counterId linked to default counters', () => {
  const app = read('src/App.jsx');
  assert(app.includes('counterId'), 'rule model has no counterId field');
  assert(app.includes("counterId: 'c_nofap'"), 'no default rule linked to 금딸 (c_nofap)');
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
  assert(screen.includes('연결할 금욕 카운터'), 'add-rule counter section (연결할 금욕 카운터) missing');
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

// 24 — the 배치 계획 mode must be an HONEST placeholder: with the current
// non-transparent decor art it must NOT overlay rectangular item crops on the room
// (no placement-token-img, no pointer drag). It shows the finished room + an owned
// item inventory and states real placement waits on transparent sprites.
check('pet room 배치 계획 mode is an honest no-overlay placeholder', () => {
  const screen = read('src/screens/PetRewardScreen.jsx');
  assert(screen.includes('PetPlacementEditor'), 'PetPlacementEditor not used by the pet room');
  assert(screen.includes('placementMode'), 'no placement-mode state in PetRewardScreen');
  const editor = read('src/components/PetPlacementEditor.jsx');
  assert(
    editor.includes('배치 기능은 투명 아이템 이미지가 준비되면 제공돼요'),
    'placement mode is missing the honest pending copy',
  );
  assert(
    !editor.includes('placement-token-img'),
    'placement mode still overlays rectangular item images (placement-token-img)',
  );
  assert(
    !/onPointerDown/.test(editor),
    'placement mode still drags item tokens — drag must wait for transparent sprites',
  );
  assert(!/spriteReady:\s*true/.test(editor), 'placement editor flips spriteReady — must not claim final sprites');
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
  assert(browser.includes('프로토타입에서는 실제 웹을 열지 않아요'), 'SafeBrowserScreen is missing the no-match "opens no real web" copy');
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
  for (const f of codeFiles) {
    for (const t of remoteTokens) {
      assert(!src[f].includes(t), `${dir}/${f} pulls in remote code / network (${t}) — the PoC must stay local`);
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
  assert(/<BottomNav[\s\S]*?onChange=\{setScreenId\}/.test(app), 'App does not wire BottomNav onChange to the screen router');
  assert(
    /id:\s*'urge',\s*label:\s*'잠깐 멈춤',\s*Component:\s*UrgeScreen/.test(app),
    "App does not route 'urge' to the real UrgeScreen",
  );
});

// 35 — the chrome-shield extension must keep LEAST PRIVILEGE. The manifest may request
// ONLY the minimal permission it actually uses (declarativeNetRequest), must declare
// none of the dangerous extension keys/permissions (content_scripts / webRequest /
// tabs / cookies / scripting / externally_connectable) on any surface, and the code
// must still carry no remote code / CDN / analytics, no explicit/adult terms, and no
// blocked-target leak. This pins the security-audit hardening so a future change that
// adds a risky permission or key fails the build instead of silently shipping.
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
  const DANGEROUS = ['content_scripts', 'webRequest', 'tabs', 'cookies', 'scripting', 'externally_connectable'];
  const optional = [...(mf.optional_permissions || []), ...(mf.optional_host_permissions || [])];
  for (const k of DANGEROUS) {
    assert(!(k in mf), `manifest declares a dangerous top-level key: ${k}`);
    assert(!mf.permissions.includes(k), `manifest requests a dangerous permission: ${k}`);
    assert(!optional.includes(k), `manifest requests a dangerous optional permission: ${k}`);
  }

  // No remote code / CDN / analytics / external API / fetch / XHR in the extension code
  // (manifest host_permissions legitimately list http/https, so the manifest is exempt).
  const codeFiles = [
    'rules.json', 'signals.js', 'service_worker.js', 'blocked.html', 'blocked.js',
    'popup.html', 'popup.js', 'options.html', 'options.js',
  ];
  const remoteTokens = ['http://', 'https://', 'cdn.', 'googleapis', 'unpkg', 'jsdelivr', 'fetch(', 'XMLHttpRequest', 'import("http', 'analytics'];
  for (const f of codeFiles) {
    const s = read(`${dir}/${f}`);
    for (const t of remoteTokens) {
      assert(!s.includes(t), `${dir}/${f} pulls in remote code / network (${t}) — the PoC must stay local`);
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
