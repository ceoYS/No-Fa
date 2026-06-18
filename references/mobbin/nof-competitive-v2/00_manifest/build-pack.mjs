// NoF competitive reference pack v2 — manifest + contact-sheet generator.
// Docs/reference tooling only (no app/src/engine/manifest/QA change). Re-runnable.
//   node references/mobbin/nof-competitive-v2/00_manifest/build-pack.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const MANIFEST_DIR = path.join(ROOT, '00_manifest');
const SHEET_DIR = path.join(ROOT, '99_contact-sheets');

// bucket dir -> contact-sheet file + heading
const BUCKETS = {
  'direct-competitor': { dir: '01_direct-competitors', sheet: 'direct-competitors.html', title: '직접 경쟁사 (Direct competitors)' },
  'adjacent-blocker': { dir: '02_adjacent-blockers', sheet: 'adjacent-blockers.html', title: '인접 차단/마찰 (Adjacent blockers)' },
  'mood-polish': { dir: '03_mood-polish', sheet: 'mood-polish.html', title: '무드/프리미엄 (Mood / polish — polish only)' },
  'current-nof': { dir: '04_current-nof', sheet: 'current-nof.html', title: '현재 NoF (current state — NOT a competitor reference)' },
};

// Per-image metadata. `why` = why it matters for NoF. Filenames must match disk.
const ITEMS = [
  // ---------- 01 direct competitors — QUITTR ----------
  ['direct-competitor','QUITTR','quittr__home__streak-panic-overlay__01.webp','home','상태반응 구체 + 초단위 streak + 빨강 Panic Button','Mobbin MCP','high','상태반응 중앙 오브제 + 항상-도달 위기 진입점 패턴만 차용. 회전 네온 spectacle·공포는 배제.'],
  ['direct-competitor','QUITTR','quittr__home__pornfree-5days-panic__02.webp','home','메인 대시보드: 포르노-프리 5일 + Brain Rewiring 6% + Panic','Mobbin MCP','high','직접 경쟁사 핵심 대시보드. "Brain Rewiring %" 의사과학 정량화는 반면교사.'],
  ['direct-competitor','QUITTR','quittr__home__pornfree-6days-rewiring__03.webp','home','6일차 + rewiring 7% (1일 변화 연출)','Mobbin MCP','high','스트릭 증가 연출. 정량화는 차분한 자기이해로 재해석.'],
  ['direct-competitor','QUITTR','quittr__home__analytics-challenge-ai-therapist__04.webp','home','Open Analytics + #QUITTR30 + Life Tree + Speak to Melius(24/7 AI therapist) + Panic','Mobbin MCP','high','AI 테라피스트/생명나무 게임화. NoF는 "치료/완치" 단정 배제(COPY_POLICY §4).'],
  ['direct-competitor','QUITTR','quittr__home__quit-by-date-save-a-friend__05.webp','home','quit-by date + "I\'m quitting because" 이유 + 28Day 32% + Save A Friend','Mobbin MCP','high','목표일+동기 입력은 차용. "Save A Friend(goons too much)" 익명 슬랭 초대는 배제.'],
  ['direct-competitor','QUITTR','quittr__onboarding__value-prop-benefit-chips__02.webp','onboarding','가치제안: Stronger/Healthier/Happier + 효익 칩(Testosterone/Prevent ED/Energy…) + "Purchase appears Discretely"','Mobbin MCP','high','남성성·신체효익 프레이밍 안티패턴. "은밀 결제" 신뢰 카피는 관찰점.'],
  ['direct-competitor','QUITTR','quittr__onboarding__custom-plan-quit-by-date__03.webp','onboarding','맞춤 플랜 "You will quit porn by Dec 14"','Mobbin MCP','high','개인화 약속일. "실패=약속 배신" 압박으로 되쓰지 않기.'],
  ['direct-competitor','QUITTR','quittr__onboarding__target-days-picker__01.webp','onboarding','달성가능 목표일 선택 3/5/7/10 days','Mobbin MCP','high','작은 목표 선택 패턴 차용 가능(부담 낮은 시작).'],
  ['direct-competitor','QUITTR','quittr__onboarding__method-content-blocking-filter__04.webp','onboarding','목표 달성법: content blocking filter + Panic Button + 일일 pledge','Mobbin MCP','high','"콘텐츠 차단 필터" = NoF Shield와 직접 대응. "100% science-based" 단정은 안티패턴.'],
  ['direct-competitor','QUITTR','quittr__self-assessment__choose-goals-reboot__01.webp','self-assessment','reboot 동안 추적할 목표 선택(관계/자신감/기분/에너지/욕구·성생활/자기통제/집중)','Mobbin MCP','high','자가 목표 선택 패턴. "desire and sex life"는 NoF 톤으로 순화.'],
  ['direct-competitor','QUITTR','quittr__pledge__pledge-sobriety-today__01.webp','pledge','오늘 다짐 + 24h 체크인 + "Achievable Goal/Take it Easy"','Mobbin MCP','high','일일 다짐 패턴. "not to masturbate" 직설 → NoF는 절제/자기통제 어휘.'],
  ['direct-competitor','QUITTR','quittr__panic__dont-break-promise-shame__01.webp','panic/urge','★Panic: "DON\'T BREAK THAT PROMISE… FOR A FEW SECONDS OF PLEASURE" + "Side effects: REDUCED PERFORMANCE" + I Relapsed','Mobbin MCP','high','대표 반면교사. NoF 잠깐 멈춤은 이 수치·공포·신체위협 카피를 0으로(DIRECT_COMPETITOR_VISUAL_AUDIT §4.1).'],
  ['direct-competitor','QUITTR','quittr__urge__dont-relapse-breathing-exit__01.webp','urge','"Don\'t Relapse" 공포 카피 + Talk in Chat / Start Breathing Exercise','Mobbin MCP','high','공포 카피는 배제, 호흡운동 출구는 차용.'],
  ['direct-competitor','QUITTR','quittr__checkin__feel-now-emoji-tempted-toggle__01.webp','checkin','"How do you feel right now?" 이모지 5점 + "tempted to relapse?" 토글','Mobbin MCP','high','감정 체크인+충동 토글. NoF 체크인 톤으로 차용 가능.'],
  ['direct-competitor','QUITTR','quittr__relapse__slip-ups-reset-counter__01.webp','relapse','"Slip-ups happen, don\'t be too hard" + "Embrace growth" + 빨강 Reset Counter','Mobbin MCP','high','카피는 부드러우나 빨강 Reset로 스트릭 0 = 가혹 연출 안티패턴.'],
  ['direct-competitor','QUITTR','quittr__relapse__community-checkin-social-proof__02.webp','relapse','"Did you relapse? 44,847 still going strong" No/Yes','Mobbin MCP','high','소셜 프루프 카운트. 부정감정 카운트(😔 X명)는 배제.'],
  ['direct-competitor','QUITTR','quittr__detox__session-length-begin__01.webp','detox','"How long was your porn session? 1–60min" + Begin detox','Mobbin MCP','medium','직설 수집. NoF가 수집하지 않는 영역 — 반면교사.'],
  ['direct-competitor','QUITTR','quittr__program__28day-challenge-start__01.webp','program','28-Day Challenge Day0/28 "reset dopamine receptors" 노드 1–8 + "I Relapsed, Reset Challenge"','Mobbin MCP','high','챌린지 노드 진행. "dopamine reset" 의사과학 단정 경계.'],
  ['direct-competitor','QUITTR','quittr__analytics__radar-64pct-quit-by-date__01.webp','analytics','Ring/Radar 64% (Intellect/Physical/Discipline/Mental/Relationship/Ambition) + Overall Progress','Mobbin MCP','high','레이더 정량화. "회복 %" 완치 인상 경계, 차분한 진척 시각화는 차용.'],
  ['direct-competitor','QUITTR','quittr__analytics__life-area-stat-cards__02.webp','analytics','영역별 점수 카드(100 Physical/Ambition…) + progress line','Mobbin MCP','high','영역 점수 카드 = 자기이해 프레이밍은 차용 가능.'],
  ['direct-competitor','QUITTR','quittr__progress__life-tree-sobriety-streak__01.webp','progress','"Life tree grows with your sobriety streak — 44 days"','Mobbin MCP','high','성장 메타포(나무). NoF는 고양이방/잔불로 차분히 표현.'],
  // LIVESTRONG MyQuit Coach
  ['direct-competitor','LIVESTRONG MyQuit Coach','livestrong-myquit-coach__tracker__day1-smoked-craving-duallog__01.webp','daily-record','Day 1/21, "0 cigarettes left", smoked/craved/saved, "I smoked" / "I\'m craving"','Mobbin MCP','high','★충동(craving)≠실패(smoked) 분리 로깅 — NoF 충동/회복 분리의 직접 모델. "cigarettes over" 빨강 실패강조는 피함.'],
  ['direct-competitor','LIVESTRONG MyQuit Coach','livestrong-myquit-coach__history__smoked-craved-timeline__01.webp','daily-record','히스토리 Day1 + Check In/Craved/Smoked 타임라인','Mobbin MCP','high','사건 단위 기록 타임라인.'],
  ['direct-competitor','LIVESTRONG MyQuit Coach','livestrong-myquit-coach__history__checkin-event-list__02.webp','daily-record','이벤트 리스트(Check In/Craved/Smoked 반복)','Mobbin MCP','medium','비난 없는 이벤트 로깅 리스트.'],

  // ---------- 02 adjacent blockers ----------
  ['adjacent-blocker','Opal','opal__blocks__dashboard-applock-unlock-5m__01.webp','blocker-dashboard','Blocks 리스트(Work Time/App Lock/Time with Gigi) + "Unlock for 5m / Edit Lock" 시트','Mobbin MCP','high','차단=내가 정한 세션. "5분 해제" 유예를 정상 옵션으로 — NoF 보호설정/잠깐멈춤 톤.'],
  ['adjacent-blocker','Opal','opal__blocklist__categories-adult-blocking-toggle__01.webp','blocklist','★Block List 카테고리(Games/Social/Entertainment) + "Adult Blocking" 토글 + "private browsing disabled" 정직 고지','Mobbin MCP','high','카테고리 차단 + Adult 토글 + 정직 고지 = NoF 위험신호/차단규칙과 직접 대응.'],
  ['adjacent-blocker','Opal','opal__blocked-state__instagram-blocked-sessions-intro__01.webp','blocked-state','"Instagram was blocked by Opal — Take action with sessions"','Mobbin MCP','high','차단 상태 안내. NoF blocked.html 톤 참고(처벌 아닌 안내).'],
  ['adjacent-blocker','Opal','opal__session__disabled-until-enable-dismiss__01.webp','session','"Disabled until 5 Sep — auto-enabled in 1 day" Enable/Dismiss','Mobbin MCP','high','세션 일시중지 정직 표현.'],
  ['adjacent-blocker','Opal','opal__session__set-disable-duration__01.webp','session','"Set disable duration — Disable for 1 day / indefinitely"','Mobbin MCP','high','해제 기간 선택 = 유예 정상화.'],
  ['adjacent-blocker','Opal','opal__blocks__applock-relock-apps__02.webp','blocker-dashboard','"App Lock Unlocked — Remaining 04:08" + "Relock these apps"','Mobbin MCP','medium','재잠금 동선.'],
  ['adjacent-blocker','Opal','opal__blocklist__all-internet-toggle__02.webp','blocklist','"Apps Blocked — All Internet" 토글','Mobbin MCP','medium','전체 인터넷 차단 옵션.'],
  ['adjacent-blocker','Opal','opal__blocklist__adult-dating-news-checklist__03.webp','blocklist','"Apps Blocked" 체크리스트(Binance/Revolut/Messaging/Dating/News/Adult)','Mobbin MCP','high','유형별 차단 선택(Adult/Dating 포함) — NoF 위험신호 카테고리 참고.'],
  ['adjacent-blocker','Opal','opal__setup__work-hours-schedule-step2__01.webp','permission-setup','"Step 2: Work Hours Schedule" 추천 세션 + 4 apps blocked','Mobbin MCP','medium','차단 온보딩 스텝(설정 유도).'],
  ['adjacent-blocker','bless.','bless__friction__breathe-do-you-need-open__01.webp','friction','★"Breathe in, breathe out. Do you really need to open this app right now? Don\'t Open / Open for 5 min"','Mobbin MCP','high','마찰형 개입(One Sec/ScreenZen 류)의 비공포 버전. NoF 잠깐 멈춤의 톤 모델.'],

  // ---------- 03 mood / polish ----------
  ['mood-polish','Oura','oura__dashboard__readiness-90-sleep-dark-premium__01.webp','dashboard','Readiness 90 Optimal + Sleep 91 다크 프리미엄','Mobbin MCP','high','다크=프리미엄 입증. 카드 위계/여백 polish (제품전략 아님).'],
  ['mood-polish','Oura','oura__dashboard__activity-stress-relaxed-cards__02.webp','dashboard','Activity goal + Daytime stress "Relaxed" 카드','Mobbin MCP','high','차분한 데이터 카드 톤.'],
  ['mood-polish','Headspace','headspace__pause__5-gentle-breaths-mindful-activity__01.webp','pause','"Treat Yourself to 5 Gentle Breaths" 1min + Play','Mobbin MCP','high','따뜻한 호흡 진입. 잠깐 멈춤 polish.'],
  ['mood-polish','Headspace','headspace__pause__grounding-ease-anxiety__02.webp','pause','"Grounding Exercise to Ease Anxiety"','Mobbin MCP','medium','그라운딩 일러스트 톤.'],
  ['mood-polish','Headspace','headspace__session__managing-anxiety-session1-start__01.webp','session','"Managing Anxiety — Session 1" 10/15min + Play','Mobbin MCP','medium','세션 시작 다크 톤.'],
  ['mood-polish','Breathwrk','breathwrk__breathing__breath-score-streak__01.webp','breathing','Breath Score 55/100 + Top Streak/Level','Mobbin MCP','medium','호흡 점수 게임화(차분 버전).'],

  // ---------- 04 current NoF (RC-15) — current state, NOT a competitor ----------
  ['current-nof','NoF (RC-15)','01_home.png','home','절제 시간 타이머 12일 03:24 + "내 기록으로 시작"','NoF local preview(:4173 ?dev=1) + CDP 390×844 DPR2','high','현재 상태: ink-and-ember, 타이머-우선 위계. Malgun Gothic(앱 폰트스택 내 Windows 폴백)으로 렌더.'],
  ['current-nof','NoF (RC-15)','02_today_record.png','daily-record','오늘 기록(체크인)','NoF local preview + CDP','high','현재 일일 기록 화면.'],
  ['current-nof','NoF (RC-15)','03_pause_flow.png','urge/pause','잠깐 멈춤','NoF local preview + CDP','high','현재 위기 진입 화면 — QUITTR Panic의 비공포 대척점.'],
  ['current-nof','NoF (RC-15)','04_protection_settings.png','settings','보호 설정','NoF local preview + CDP','high','로컬 보호 계획(자기 언어).'],
  ['current-nof','NoF (RC-15)','05_danger_signal_input.png','blocklist/danger-input','위험 신호 정리(RC-13): 피하고 싶은 사이트/검색어 + "차단 규칙 후보로 직접 확인" + 상황 메모(앱 전용)','NoF local preview + CDP','high','현재 차단규칙 입력. Opal Adult-blocking/QUITTR content-filter와 대비.'],
  ['current-nof','NoF (RC-15)','06_chrome_extension_setup.png','extension-setup','Chrome 확장 준비/연결 + 3분 보호 stepper','NoF local preview + CDP','high','현재 확장 연결 동선. 경쟁사엔 없는 NoF 고유 흐름.'],
  ['current-nof','NoF (RC-15)','07_blocked_html.png','blocked-state','확장 차단 인터스티셜 "잠깐 멈춤" + 오늘기록/계속/닫기 + "완벽한 벽이 아니라 마찰" 정직 고지','extensions/chrome-shield/blocked.html (file://)','high','현재 차단 화면 — Opal blocked-state 대비. 정직 고지가 차별점.'],
  ['current-nof','NoF (RC-15)','08_extension_popup.png','extension-ui','확장 popup','extensions/chrome-shield/popup.html (file://)','medium','확장 popup 레이아웃(개발 UI).'],
  ['current-nof','NoF (RC-15)','09_extension_options.png','extension-ui','확장 options','extensions/chrome-shield/options.html (file://)','medium','확장 options 레이아웃(개발 UI).'],
  ['current-nof','NoF (RC-15)','0A_block_settings.png','settings','차단 설정','NoF local preview + CDP','medium','보너스: 차단 설정 화면.'],
  ['current-nof','NoF (RC-15)','0B_safe_browser.png','settings','안전 브라우저','NoF local preview + CDP','medium','보너스: 안전 브라우저 안내.'],
];

// ---- build manifest ----
const manifest = ITEMS.map(([bucket, app, file, flow_type, screen_purpose, source, quality, notes]) => {
  const rel = `${BUCKETS[bucket].dir}/${file}`;
  const abs = path.join(ROOT, rel);
  const exists = fs.existsSync(abs);
  return { file: rel, app, bucket, flow_type, screen_purpose, source, quality, notes, exists };
});

const missing = manifest.filter((m) => !m.exists);
const onDisk = new Set(
  Object.values(BUCKETS).flatMap((b) =>
    fs.existsSync(path.join(ROOT, b.dir))
      ? fs.readdirSync(path.join(ROOT, b.dir)).filter((f) => /\.(webp|png)$/i.test(f)).map((f) => `${b.dir}/${f}`)
      : []
  )
);
const unlisted = [...onDisk].filter((f) => !manifest.some((m) => m.file === f));

const counts = {};
for (const m of manifest) counts[m.bucket] = (counts[m.bucket] || 0) + 1;

fs.mkdirSync(MANIFEST_DIR, { recursive: true });
fs.writeFileSync(
  path.join(MANIFEST_DIR, 'capture-manifest.json'),
  JSON.stringify(
    {
      pack: 'nof-competitive-v2',
      generated_for: 'RC16 prep — Claude Design direct-competitor-weighted reference',
      method: 'Mobbin MCP search_screens → image_url short-token curl (live session); current-NoF via local vite preview + raw-CDP 390x844 DPR2 (Malgun Gothic = app font-stack Windows fallback).',
      counts,
      total: manifest.length,
      items: manifest,
    },
    null,
    2
  )
);

// ---- contact sheets ----
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function card(m) {
  const rel = `../${m.file}`;
  return `<figure class="card q-${m.quality}">
  <a href="${rel}" target="_blank"><img loading="lazy" src="${rel}" alt="${esc(m.app)} ${esc(m.flow_type)}"></a>
  <figcaption>
    <div class="app">${esc(m.app)} <span class="flow">${esc(m.flow_type)}</span></div>
    <div class="purpose">${esc(m.screen_purpose)}</div>
    <div class="why"><b>NoF:</b> ${esc(m.notes)}</div>
    <div class="src">${esc(m.source)} · ${esc(m.quality)}</div>
  </figcaption>
</figure>`;
}
const STYLE = `<style>
:root{color-scheme:dark}
body{margin:0;background:#0b0b0f;color:#e9e6df;font:14px/1.5 'Malgun Gothic',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
header{padding:24px 28px;border-bottom:1px solid #26242c}
h1{margin:0 0 6px;font-size:20px}
.sub{color:#9b95a3;font-size:13px}
nav{margin-top:10px;font-size:13px}
nav a{color:#e9a45c;margin-right:14px;text-decoration:none}
.counts{margin-top:8px;color:#c9c3cf;font-size:13px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px;padding:24px 28px}
.card{margin:0;background:#15131a;border:1px solid #26242c;border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
.card img{width:100%;display:block;background:#000;aspect-ratio:390/844;object-fit:contain}
figcaption{padding:10px 12px;font-size:12px}
.app{font-weight:700;color:#fff}
.flow{font-weight:400;color:#e9a45c;font-size:11px;margin-left:4px}
.purpose{color:#cfc9d6;margin:4px 0}
.why{color:#9b95a3;margin:6px 0 4px}
.why b{color:#e9a45c}
.src{color:#6f6a77;font-size:11px;margin-top:6px}
.q-high{border-left:3px solid #4caf7d}
.q-medium{border-left:3px solid #b98a3a}
section h2{padding:18px 28px 0;margin:0;font-size:16px;color:#e9a45c}
</style>`;
const NAVLINKS = `<nav><a href="all-reference-pack.html">전체</a>${Object.values(BUCKETS)
  .map((b) => `<a href="${b.sheet}">${esc(b.title.split(' (')[0])}</a>`)
  .join('')}</nav>`;

function sheet(title, items) {
  return `<!doctype html><html lang="ko"><meta charset="utf-8"><title>${esc(title)} · NoF v2</title>${STYLE}
<header><h1>${esc(title)}</h1>
<div class="sub">NoF Competitive Reference Pack v2 — RC16 prep. 색/카피/브랜드 복제 금지, 패턴·톤만.</div>
<div class="counts">${items.length}장</div>${NAVLINKS}</header>
<div class="grid">${items.map(card).join('\n')}</div></html>`;
}

fs.mkdirSync(SHEET_DIR, { recursive: true });
for (const b of Object.values(BUCKETS)) {
  const items = manifest.filter((m) => m.bucket === Object.keys(BUCKETS).find((k) => BUCKETS[k] === b));
  fs.writeFileSync(path.join(SHEET_DIR, b.sheet), sheet(b.title, items));
}
// all-in-one
const allSections = Object.entries(BUCKETS)
  .map(([key, b]) => {
    const items = manifest.filter((m) => m.bucket === key);
    return `<section><h2>${esc(b.title)} — ${items.length}</h2><div class="grid">${items.map(card).join('\n')}</div></section>`;
  })
  .join('\n');
fs.writeFileSync(
  path.join(SHEET_DIR, 'all-reference-pack.html'),
  `<!doctype html><html lang="ko"><meta charset="utf-8"><title>NoF Competitive Reference Pack v2</title>${STYLE}
<header><h1>NoF Competitive Reference Pack v2 — 전체</h1>
<div class="sub">RC16 prep · direct-competitor-weighted. 색/카피/브랜드 복제 금지, 패턴·톤만 참고.</div>
<div class="counts">${manifest.length}장 — ${Object.entries(counts).map(([k, v]) => `${k}:${v}`).join(' · ')}</div>${NAVLINKS}</header>
${allSections}</html>`
);

console.log('counts:', JSON.stringify(counts), 'total:', manifest.length);
console.log('missing (listed but not on disk):', missing.length, missing.map((m) => m.file));
console.log('unlisted (on disk but not in manifest):', unlisted.length, unlisted);
console.log('wrote manifest + 5 contact sheets');
