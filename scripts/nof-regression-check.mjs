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
 *  24. The pet room has a placement-edit (배치 편집) mode with 배치 완료 / 초기화.
 *  25. The snack feed uses a real movement animation (travel), not a flash only.
 *  26. No fake sound claim — audio stays an honest, silent gated fallback.
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

// 24 — the pet room must offer a real placement-edit (배치 편집) mode: a dedicated
// draggable editor with 배치 완료 + 초기화, wired to the reset handler.
check('pet room has a placement-edit mode (배치 편집)', () => {
  const screen = read('src/screens/PetRewardScreen.jsx');
  assert(screen.includes('PetPlacementEditor'), 'PetPlacementEditor not used by the pet room');
  assert(screen.includes('placementMode'), 'no placement-mode state in PetRewardScreen');
  assert(screen.includes('배치 편집'), 'placement-edit entry (배치 편집) missing');
  assert(screen.includes('onResetPlacements'), 'placement editor is not wired to a reset handler');
  const editor = read('src/components/PetPlacementEditor.jsx');
  assert(editor.includes('배치 완료') && editor.includes('초기화'), '배치 완료 / 초기화 controls missing');
  assert(editor.includes('onPointerDown'), 'placement tokens are not pointer-draggable');
  // Honest MVP framing — it must NOT claim final art, and must not flip spriteReady.
  assert(editor.includes('미리보기'), 'placement editor does not label itself as an MVP preview');
  assert(!/spriteReady:\s*true/.test(editor), 'placement editor flips spriteReady — drag must not claim final sprites');
  // App must reset placements to the seeded layout (non-destructive).
  const app = read('src/App.jsx');
  assert(/const resetPlacements = \(\) => \{/.test(app), 'App resetPlacements() handler missing');
});

// 25 — the snack feed must animate a real hand-off MOVEMENT (a travel), not a
// flash-only opacity blink. The keyframe must translate the token a distance.
check('snack feed uses a movement animation (not flash-only)', () => {
  const screen = read('src/screens/PetRewardScreen.jsx');
  assert(screen.includes("data-active={snackToss}"), 'snack token is not driven by a feed trigger');
  assert(screen.includes('snack-toss-img'), 'snack token carries no visible snack image');
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
