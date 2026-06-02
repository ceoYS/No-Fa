# NoF UI / UX Element Review

Produced with the `nof-ui-element-review` skill (`.claude/skills/nof-ui-element-review/SKILL.md`).
Review is contextual, screen-by-screen, element-by-element, grounded in the actual
source on branch `wip/pet-room-scene-mode` (not in policy docs, which can be stale).

- **Scope of this round:** review only. No product UI was changed.
- **Baseline:** `npm run build` PASS, `npm run check:nof` 32/32 PASS.
- **Prime directive checked against every surface:** *Do not fake functionality. Do
  not claim blocking, motion, sound, dragging, placement, safety,
  iOS/Android/SNS blocking, image/video mosaic, or pet eating unless it actually works.*

## Severity legend

- **P0** — Breaks the prime directive or one of the 9 protected rules. Must fix before ship.
- **P1** — Real UX harm or confusion, but not a directive violation. Fix soon.
- **P2** — Polish, consistency, minor copy. Fix when convenient.

## Headline conclusions

1. **No P0 found.** Every honesty invariant in the 9 protected rules holds in the
   current source, and all 32 static guards pass. Scene-mode drag stays disabled,
   the feed never claims eating, Shield never claims blocking, relapse is scoped to
   one counter, no delete path exists, no real adult URLs/terms are present, and the
   planner never asks the user to hunt for risky sites. This is the product's
   strongest asset — protect it.
2. **Two P1 issues stand out:**
   - The **5-minute crisis pause (잠깐 멈춤)** — the single highest-urgency action in
     a self-control app — is **not in the persistent bottom nav**. It is only
     reachable by first returning Home. In a real urge, on the Calendar/Recovery/Pet
     screens, there is no one-tap panic button.
   - The **pet-room sound toggle (소리/무음)** is an operable control for audio that
     never plays (the .mp3s are not committed and `play()` is a silent no-op). This
     is the same "dead switch" anti-pattern the Shield screen *deliberately removed*.
     It is the one element that risks crossing from P1 into P0 territory; the safe fix
     is to hide it until a real audio asset is wired.
3. **The rest is P2 polish** — mostly accessibility parity (a few selectable controls
   expose state via `data-selected` but not `aria-pressed`), sheet/dialog consistency,
   and a couple of silent-clamp inputs that change a value without telling the user.

---

## 1. Home (`src/screens/HomeScreen.jsx`)

**Purpose & user state.** The daily landing surface. The user may arrive calm
(checking progress), shaky (pre-urge), or post-slip. Its job: show the live
abstinence timer first, keep the crisis tools one tap away, and let the user switch
between counters.

**Elements reviewed.** Timer hero (eyebrow/name/days/clock/progress/meta/help),
crisis CTA pair (못 참을 것 같아요 / 오늘 상태 남기기), restart card (무너졌어요·다시
시작 / 오늘 복기하기), counter list cards, linked-rules card, edit-counter button,
secondary cards (규율 점검 / 최근 기록 / 고양이의 방 / 차단 설정), restart confirm
sheet, AddCounterSheet, EditCounterSheet.

**Findings.**

- **[P1] Crisis pause not persistent.** The 못 참을 것 같아요 → `urge` CTA exists only
  in the Home hero (HomeScreen.jsx:145–151). Aspects: 1, 5, 10, 20. Impact: from any
  other screen, the user must navigate Home before they can reach the 5-minute pause —
  exactly the moment friction hurts most. Fix: covered in the cross-cutting section;
  the fix lives in `BottomNav`/`App`, not Home. Scope: small (nav), see §13.
- **[P2] `warmthBand()` is placeholder logic dressed as three states.**
  HomeScreen.jsx:23–27 returns `'잔잔함'` for both the relapse/missed branch *and* the
  default, so `'안정'` only appears when `keeping > 0` with nothing missed. The comment
  admits "the full warmth index lands with the domains/ refactor." Aspects: 4, 7, 19.
  Impact: the "방 온기 · {band}" line (HomeScreen.jsx:351) reads as a real signal but is
  effectively binary. Not dishonest (it is a word, derived from real summary data), but
  thin. Fix: either make the band a real 3+ level derivation or soften the copy so it
  does not imply a measured index. Scope: small.
- **[P2] Counter sheets put `role="dialog"` on the backdrop and don't close on
  backdrop tap.** AddCounterSheet (HomeScreen.jsx:464) and EditCounterSheet
  (HomeScreen.jsx:551) set `role`/`aria-modal` on `.sheet-backdrop` and offer no
  click-to-dismiss, whereas the restart sheet (HomeScreen.jsx:383–390) and the pet/
  calendar sheets put the role on the inner `.sheet` and close on backdrop click.
  Aspects: 11, 18, 19. Impact: inconsistent dismissal + slightly off dialog semantics.
  Fix: move `role="dialog"` to the inner `.sheet`, add backdrop `onClick` close. Scope:
  small. (Esc already works via `useDismissOnEscape`.)
- **[P2] No empty state for "zero counters."** The counter list (HomeScreen.jsx:194)
  renders nothing if `counters` is empty, and the linked-rules card + edit button hide.
  Aspects: 12. Impact: today the seed always has 4 and there is no delete, so this is
  unreachable now — but it is latent once archiving lands. Fix: add a one-line empty
  prompt. Scope: tiny; defer until counter removal exists.

**What must not be faked here.** Restart must keep its confirm step and scoped copy
("‘{name}’ 절제 시간만 0으로 돌아가요. 다른 카운터는 그대로") — protects rule 7 (never
reset all counters) and rule 8 (no destructive surprises). The timer hero must stay
the first and largest element (timer-first pillar).

**Regression ideas.** Guards 11, 14, 16, 17, 22, 27 already pin timer-first layout,
restart confirmation, add/edit UI, selectable list, linked-rules, and visual-only
selection. Add: a guard that Home exposes a one-tap crisis entry reachable globally
(see §13) once that fix lands.

---

## 2. Counter list (cards on Home)

**Purpose & user state.** Let the user see every abstinence run at a glance and pick
which one drives the hero/urge context.

**Elements reviewed.** `counter-card` button (name, elapsed, mini progress, meta:
목표/규율/최장), selection treatment.

**Findings.**

- **[P2] No per-counter detail screen.** Tapping a card only selects it
  (HomeScreen.jsx:201–224); there is no drill-in for a counter's history/longest/notes.
  Aspects: 1, 3, 20. Impact: best-in-class streak apps offer a counter detail view;
  power users with 4+ counters get only the summary meta. Fix: a future CounterDetail
  surface. Scope: medium; out of scope this round.

**What must not be faked here.** Selection must stay visual-only (amber border/glow)
plus `aria-pressed`, with no "보는 중/선택됨" text badge — guard 27. Mini progress is
`aria-hidden` decoration; the textual meta carries the real numbers.

**Regression ideas.** Covered by guards 15, 17, 27. Adequate.

---

## 3. Counter detail hero (selected counter on Home)

**Purpose & user state.** The emotional anchor: "how long have I held this?" Read
many times a day, often for reassurance.

**Elements reviewed.** `timer-hero` eyebrow/name/days/clock, progress bar, meta pill
(최장), next-goal note, help line, linked-rules card.

**Findings.**

- **[P2] Progress bar is `aria-hidden` with no text equivalent of percent.**
  HomeScreen.jsx:121–125. Aspects: 11, 18. Impact: screen-reader users get the
  next-goal remaining-days note (good) but not the visual fill; acceptable since the
  note conveys the same intent in words. Fix: none required; noted for completeness.
- **[P2] Clock `aria-label` is good; days block is not labeled as a unit pair.** The
  days number + 일 unit (HomeScreen.jsx:113–116) are two spans; fine visually, and the
  card's `aria-label="현재 절제 경과 시간"` covers the region. No change needed.

**What must not be faked here.** The "최장 {bestDays}일" must remain a real
`Math.max(longestDays, days)` derivation (HomeScreen.jsx:67), and the next goal must
stay an honest milestone target, never a "reward to chase" (comment at :69–71).

**Regression ideas.** Guard 11 pins the hero. Sufficient.

---

## 4. Add / edit counter sheet (`AddCounterSheet`, `EditCounterSheet`)

**Purpose & user state.** Create or correct an abstinence run. Often used right after
install (backdating a real start) or after a mistimed entry.

**Elements reviewed.** Name input, start date, start time, target-days number,
취소/추가(저장) actions, ready-gating.

**Findings.**

- **[P2] Silent clamps with no user feedback.** An empty/invalid target becomes 30 via
  `makeCounter` (App.jsx:175–176), and a future start time on today's date is silently
  pulled back to `now` (App.jsx:171, :240). Aspects: 11, 12. Impact: the user's input
  changes without acknowledgement. Fix: show a tiny note ("미래 시각은 현재로
  맞춰져요" / "목표를 비우면 30일로 시작해요"). Scope: small.
- **[P2] `type="time"` has no max on today.** AddCounterSheet date is capped to today
  (HomeScreen.jsx:490) but time is uncapped, so a future time is possible and then
  clamped (above). Aspects: 11. Impact: minor confusion. Fix: pair with the feedback
  note above. Scope: small.
- **[P2] Dialog role/backdrop-close inconsistency.** Same issue as §1. Aspects: 18, 19.

**What must not be faked here.** No counter delete may be added (rule 8); editing must
stay non-destructive (App.jsx:226–227 documents archive-only future).

**Regression ideas.** Guard 16 pins add/edit field coverage. Add a guard that start
times are clamped to `now` (no future streaks) if that invariant matters commercially.

---

## 5. My Rules (`src/screens/DisciplineScreen.jsx`)

**Purpose & user state.** Author and track secondary commitments ("내가 정한 기준").
Calm, reflective context — not a crisis surface.

**Elements reviewed.** Header + 규율 추가, non-shaming subtitle, 오늘의 요약 card,
counter filter chips, per-counter rule groups, rule cards (label, status button, help,
badges, 복기하기, category), "규율을 다루는 방식" explainer, StatusSheet, AddRuleSheet.

**Findings.**

- **[P2] `status-option` in StatusSheet exposes selection via `data-selected` but not
  `aria-pressed`.** DisciplineScreen.jsx:296–309. Aspects: 11, 18. Impact: assistive
  tech doesn't hear which status is current (the filter chips above *do* use
  `aria-pressed`, so it's inconsistent). Fix: add `aria-pressed={rule.status === status}`.
  Scope: tiny.
- **[P2] Two different controls for the same "set rule status" action.** Discipline
  uses a status pill → StatusSheet (DisciplineScreen.jsx:86–97), while Check-in uses an
  inline 3-tap row. Aspects: 6, 20. Impact: mild inconsistency; defensible because the
  contexts differ (deliberate edit vs. quick daily pass). Fix: none required; document
  the intent. Scope: n/a.

**What must not be faked here.** The "규율을 다루는 방식" list must keep stating that
delete is unsupported and edit/reminders are a later phase (DisciplineScreen.jsx:240–
241) — honest about scope, protects rule 8. A rule slip must never reset the timer
(copy at :238).

**Regression ideas.** Guards 4, 20, 21, 23 cover no-delete, link-to-existing,
create-with-rule, filter/group. Add a small a11y guard that selectable status controls
carry `aria-pressed` (would catch the StatusSheet + check-in gaps).

---

## 6. Rule creation + counter linking (`AddRuleSheet`)

**Purpose & user state.** Turn an intention into a tracked rule and tie it to the
abstinence it supports.

**Elements reviewed.** Label input, category chips + 직접 입력 + custom input, counter
link chips (existing / 연결 안 함 / 새 카운터도 함께 만들기), new-counter sub-form
(name/date/time/target), 취소/추가 with ready-gating.

**Findings.**

- **[P2] Custom-category state can desync from the chip.** Picking a category then
  opening 직접 입력 clears `category` (DisciplineScreen.jsx:407–410), and on submit a
  non-empty custom text wins (DisciplineScreen.jsx:346–348). Behavior is correct but
  there's no visual confirmation the typed tag will be used. Aspects: 11. Impact: minor.
  Fix: reflect the pending custom tag as a selected chip. Scope: small.
- **[P2] New-counter sub-form repeats the AddCounterSheet fields.** Same four fields
  exist in two places. Aspects: 19, 20. Impact: duplication risk if one changes. Fix:
  extract a shared CounterFields component in a later refactor (not this round). Scope:
  medium; deferred.

**What must not be faked here.** The link must remain a *secondary* commitment — the
sheet copy "이 규율이 어떤 절제를 도울까요?" (DisciplineScreen.jsx:427) must never imply
the rule is the timer.

**Regression ideas.** Guards 19, 20, 21 cover the link paths. Sufficient.

---

## 7. Relapse / restart flow (Home confirm sheet → `relapse()` → `RecoveryScreen`)

**Purpose & user state.** The most emotionally loaded moment in the app. The user has
slipped and is likely ashamed. Tone and scope decisions here matter most.

**Elements reviewed.** 무너졌어요·다시 시작 button, confirm sheet (title, scoped help,
this-run/longest summary, reassurance, 취소 / 기록하고 다시 시작), `relapse()` scope,
RecoveryScreen relapse mode (required why, escape hatch).

**Findings.**

- **[P2] Required reflection is bypassable via the escape hatch — by design, but the
  code comment says "required."** `relapse()` resets the timer *before* routing to
  recovery (App.jsx:274–304), and `canFinish` requires `why` for the primary finish
  (RecoveryScreen.jsx:36), but "조금 이따 할게요" (RecoveryScreen.jsx:143–149) leaves to
  Home without a reflection. Aspects: 1, 2, 8. Impact: none harmful — never trapping a
  fragile user is the *right* call — but the §0.6.6 "required before moving on" framing
  is slightly overstated. Fix: align the comment/wording with the (correct) non-coercive
  behavior. Scope: tiny (comment/copy only).

**What must not be faked here.** This is the heart of rule 7: `relapse()` must keep the
`if (c.id !== selectedCounterId) return c;` scope guard (App.jsx:282) so only the
selected counter restarts. The confirm step must never be removed (no instant reset).
Copy must stay non-shaming — no 실패/위반 (the screen already complies).

**Regression ideas.** Guards 14 (confirm required) and 18 (scoped relapse) are the
critical pins. Both pass. Strong coverage.

---

## 8. Check-in (`src/screens/CheckinScreen.jsx`)

**Purpose & user state.** A 1-minute daily log of mood/triggers/urge plus a light rule
pass. Low-effort, habit-building.

**Elements reviewed.** Step pill, privacy subtitle, mood chips, trigger chips (with
mutually-exclusive 특별히 없음), urge 1–5 scale, step-2 per-rule 3-tap row,
오늘 기록 마치기 + reward hint, 이전으로.

**Findings.**

- **[P2] `checkin-tap` buttons lack `aria-pressed`.** CheckinScreen.jsx:160–170 use
  `data-selected` only. Aspects: 11, 18. Impact: AT users don't hear the chosen status.
  Fix: add `aria-pressed={rule.status === opt.status}`. Scope: tiny. (Same family as the
  StatusSheet gap in §5 — fix together.)
- **[P2] Step 2 can be finished with every rule still untouched, and that's fine — but
  there's no signal of how many were left.** CheckinScreen.jsx:142–176. Aspects: 11, 12.
  Impact: low; the subtitle already says skipping is okay. Fix: optional "n개 그대로
  둠" note. Scope: small.

**What must not be faked here.** The reward hint ("오늘을 기록하면 잔불이 조금 더
따뜻해져요") must stay honest — the grant is real and once-per-day gated
(App.jsx:368–392, guard 3). The privacy line ("밖으로 공유되지 않아요") must remain true
(in-memory only; no network).

**Regression ideas.** Guard 3 pins the once-per-day grant. Add the shared `aria-pressed`
a11y guard from §5.

---

## 9. Recovery / reflection diary (`src/screens/RecoveryScreen.jsx`)

**Purpose & user state.** Gentle post-slip (or post-relapse) reflection. The user is
vulnerable; friction must be minimal and tone forgiving.

**Elements reviewed.** Header (relapse vs slip copy), room scene image (decorative),
subtitle, target-rule card, 왜 그랬을까요? textarea, 무엇이 계기였어요? trigger chips,
다음엔 어떻게? textarea + badge note, finish (gated for relapse) + escape.

**Findings.**

- **[P2] Trigger chips reuse `categories`, which are *rule* categories, not check-in
  triggers.** RecoveryScreen.jsx:104–117 maps `categories`; Check-in has its own richer
  TRIGGERS list (지루함/스트레스/외로움/밤 시간/루틴 무너짐). Aspects: 3, 20. Impact: the
  two "what triggered this?" vocabularies differ across screens, so the recorded data
  isn't directly comparable. Fix: consider a shared trigger taxonomy. Scope: small–medium.
- **[P2] Relapse "required" vs escape hatch.** Same note as §7. Aspects: 2, 8.

**What must not be faked here.** The decorative scene image must keep `alt=""`
(RecoveryScreen.jsx:64) — it's ambiance, not information. No 실패/위반 wording (complies).

**Regression ideas.** No dedicated guard today. Optional: assert the relapse path
requires a non-empty reflection to *earn* (it already does via App.jsx:344–347) and that
no shame vocabulary appears in this screen (mirror the Shield fake-claim guard style).

---

## 10. Pet room (`PetRewardScreen.jsx`, `PetRoomEditor.jsx`, `PetPlacementEditor.jsx`)

**Purpose & user state.** The emotional reward loop — a warm payoff for the work. Must
feel alive without faking motion/sound/eating the engine can't yet deliver.

**Elements reviewed.** Sound toggle, ember-shards pill, room stage (scene mode), tap
feedback live region, 아이템 배치 계획 (준비 중) entry, last-earn note, 보관함/상점 row,
간식 주기 card (message + ember-toss + button), 오늘의 보상 받기 list (reached + locked),
disclaimer, InventorySheet, ShopSheet, CatalogCard.

**Findings.**

- **[P1, borderline P0] Sound toggle is a dead switch.** The 소리/무음 button
  (PetRewardScreen.jsx:198–207) is fully operable and flips `muted`, but no audio ever
  plays — the .mp3s aren't committed and `usePetSound().play()` is a silent no-op (guard
  26 confirms the silent fallback). Aspects: 9, 14, 17(by analogy). Impact: an on/off
  *sound* control strongly implies working audio; this is precisely the dead-switch
  pattern the Shield screen removed (guard 29 forbids a non-functional toggle there). It
  is the single least-honest element in the app. Fix: hide the sound toggle until a real
  audio asset is wired (gate it on `hasPetSound()`), or relabel it so it cannot read as
  "sound is available." Scope: small (conditional render in PetRewardScreen).
- **[P2] Tap messages imply responsiveness a static scene doesn't have.** TAP_MESSAGES
  like "고양이가 가만히 당신을 바라봐요" (PetRewardScreen.jsx:41–46) fire on tap while the
  scene is one composite image with only a CSS glow (`triggerSceneReaction`). Aspects:
  13, 16. Impact: borderline — the messages describe the depicted cat (fair) but
  "바라봐요" implies reaction to the tap. Fix: prefer ambient phrasing ("방이 조금 더
  따뜻해졌어요") over gaze/attention claims while in scene mode. Scope: tiny (copy).
- **[P2] `aria-disabled` feed button still receives clicks.** The 간식 주기 button uses
  `aria-disabled` + `data-empty` (PetRewardScreen.jsx:309–318) but remains clickable;
  `handleFeed` guards the empty case with a message (good). Aspects: 9, 11. Impact: minor
  — relies on the handler, not the disabled attribute. Fix: acceptable as-is (the empty
  state shows guidance); optionally make it truly disabled. Scope: tiny.

**What must not be faked here.** This surface carries the most protected rules at once:
- Rule 1/2 — drag must stay disabled in scene mode; the 배치 계획 mode must remain an
  honest no-overlay placeholder labeled "(준비 중)" (PetRewardScreen.jsx:270–276;
  PetPlacementEditor copy; guards 5, 24).
- Rule 3 — feed must never claim eating: SCENE_FEED_MESSAGE "간식을 고양이 곁에
  놓아두었어요" + ember-particle hand-off (PetRewardScreen.jsx:49, :306; guards 13, 25).
- Reward economy must stay honest: `isMilestoneClaimable` gates every claim (guards 1,
  2); no money/random/streak-recovery (disclaimer at :369).
- Art honesty: missing sprites render clean pending slots, never emoji/SVG/blob (guard
  6); the scene uses the finished composite cat-room image (guard 28).

**Regression ideas.** Strong already (guards 1, 2, 5, 6, 9, 13, 24, 25, 26, 28). **Gap:**
no guard asserts the sound toggle is hidden/condition-gated when audio is absent — add
one so the dead-switch fix can't silently regress.

---

## 11. Shield in-app surface (`ShieldScreen.jsx`, `SafeBrowserScreen.jsx`)

**Purpose & user state.** Communicate that real blocking is coming without pretending it
exists, and let the user pre-author abstract risk signals safely.

**Elements reviewed.** 준비 중 status card (no toggle), planner (not-enforced banner +
safety note + planning banner, kind chips, template chips, label input, counter link,
신호 더하기), saved-signals groups, roadmap (info only), Safe Browser entry, link cards,
privacy note. Safe Browser: safety note, input + 열어 보기, matched interstitial → 잠깐
멈춤, no-match result.

**Findings.**

- **[P2] Disclaimer stacking is heavy.** Three consecutive notes render before the
  planner: PLANNER_NOT_ENFORCED + REAL_BLOCK_WHERE, then SAFETY_NOTE, then PLANNING_BANNER
  (ShieldScreen.jsx:118–122). Aspects: 4, 7, 19. Impact: honesty is correctly prioritized,
  but the wall of caveats is dense. Fix: consolidate into one banner + one safety line
  without dropping any claim. Scope: small (copy/layout). **Do not** reduce honesty to
  gain polish.
- **[P2] Roadmap "(Chrome 등)" mildly over-promises.** PLANNED_LAYERS names "브라우저 확장
  (Chrome 등)" (ShieldScreen.jsx:29). Aspects: 7, 17. Impact: "등/etc." hints at browsers
  beyond Chrome, but only a Chrome PoC exists. Fix: say "Chrome" (or "Chrome 데스크톱")
  until others are real. Scope: tiny.

**What must not be faked here.** Rules 4/5/6 live here:
- No present-tense blocking claim; 준비 중 + "아직 실제 차단은 제공하지 않아요" must stay
  (guards 29, 30, 31).
- No domain/URL vocabulary; SAFETY_NOTE "위험한 사이트를 직접 찾아 적지 마세요" must stay
  (ShieldScreen.jsx:46; guard 30).
- Safe Browser must open nothing (no http/iframe/window.open/href) and route a match to
  잠깐 멈춤 (SafeBrowserScreen; guard 31).
- No functional toggle/switch (guards 29, 30).

**Regression ideas.** Excellent coverage (guards 29, 30, 31). No new guard needed; if the
disclaimers are consolidated, update the exact-string asserts in guards 30/31 to match.

---

## 12. Chrome extension (`extensions/chrome-shield/` — popup / options / blocked)

**Purpose & user state.** The first *real* blocking, kept to the lowest possible risk: a
single harmless test token. The user is installing a desktop tool and needs honest scope.

**Elements reviewed.** `manifest.json` (MV3, DNR, WAR), `rules.json` (test-token →
blocked.html, main_frame), `signals.js` (TEST_SIGNAL, buildDynamicRules),
`service_worker.js` (updateDynamicRules + app-message hook), `blocked.html`/`blocked.js`
(pause page, hidden target, 5-min timer, friction disclaimer), `popup.html`/`popup.js`
(status + test token + 설정 열기), `options.html`/`options.js` (signal list).

**Findings.**

- **[P2] Edge is implied by "브라우저 확장 (Chrome 등)" but untested.** The in-app roadmap
  hints at non-Chrome browsers; the extension and README are correctly Chrome-only. Aspects:
  17, 20. Impact: minor expectation gap. Fix: align the in-app wording (see §11) and don't
  claim Edge until verified. Scope: tiny.
- **[P2] Blocked page is dark-themed while the app is warm ember.** blocked.html uses
  `color-scheme: dark` / ink background (blocked.html:8–30) with ember accents. Aspects:
  19. Impact: cosmetic cross-surface inconsistency; the ember accent keeps it on-brand.
  Fix: optional theme alignment later. Scope: small.
- **[P2] Popup/options have no app-sync yet (by design).** The signal-sync path is
  documented as the next phase in the README and `service_worker.js`. Aspects: 3. Impact:
  none — honestly disclaimed. Fix: none this round.

**What must not be faked here.** Rule 4/5: the extension may block *only* the harmless
`nof-test-risk-signal`, never claim to block real adult sites, carry no adult terms, pull
in no remote code/CDN/network, and never reveal the visited target (blocked.js avoids
referrer/URLSearchParams/document.URL). README must keep the Chrome-desktop-only scope and
the "NOT mobile/SNS/mosaic" disclaimer. All pinned by guard 32.

**Regression ideas.** Guard 32 is comprehensive (MV3 shape, redirect rule, no-remote-code,
no-adult-terms, target-hiding, README scope). No gap.

---

## 13. Cross-cutting: navigation & global reachability

**Finding — [P1] The crisis pause is not in the persistent nav.** `BottomNav`
(BottomNav.jsx:1–6) has four tabs: 홈 / 기록 / 체크인 / 복기. The four most safety-relevant
or frequent secondary surfaces — 잠깐 멈춤 (urge), 나의 규율 (discipline), 고양이 방
(reward), 차단 설정 (shield) — are reachable only via in-screen buttons (mostly Home) or
the dev-only `ScreenSwitcher`. For a self-control app, the **5-minute pause is the panic
button** and should be reachable in one tap from everywhere. Today, a user mid-urge on the
Calendar/Recovery/Pet/Shield screens must first go Home.
- Aspects: 1, 2, 5, 10, 20. Impact: highest-urgency action gated behind navigation.
- Fix options (pick one, small scope): (a) swap a bottom-nav slot so 잠깐 멈춤 is always
  present; (b) add a small persistent floating "멈춤" affordance outside the per-screen
  body. Recommend (a) with care not to bury 복기/체크인.
- Scope: small (BottomNav + App routing). **Must not** become a fake/dead entry — wire it
  to the real `urge` route.

**Finding — [P2] Faux device chrome ships in the viewport.** `App.jsx:482–486` renders a
static "9:41 ● ● ●" status bar + notch. Aspects: 19. Impact: fine for a prototype frame,
but it is non-functional chrome that must not reach a real device build. Fix: strip/replace
for production packaging. Scope: tiny; track for the build-out round.

**Finding — [P2] Debug switcher is correctly gated.** `debugNavEnabled()` (App.jsx:76–89)
shows `ScreenSwitcher` only under `import.meta.env.DEV` or `?dev=1`. No leak in a plain
production load. No action — noted as a positive to preserve.

---

## Recommended implementation order

Severity first, then dependency and blast radius. Honesty fixes lead.

1. **[P1] Hide the pet-room sound toggle until real audio exists.** Gate the 소리/무음
   control on `hasPetSound()` (or remove it). Highest honesty priority — it is the one
   element flirting with a P0 directive breach. Add a regression guard that the toggle is
   condition-gated. (PetRewardScreen.jsx:198–207.)
2. **[P1] Make the 5-minute crisis pause globally reachable.** Add 잠깐 멈춤 to the
   persistent nav (or a floating affordance) wired to the real `urge` route, plus a guard.
   (BottomNav.jsx, App.jsx.)
3. **[P2] Accessibility parity pass (batch).** Add `aria-pressed` to `checkin-tap`
   (CheckinScreen.jsx:160–170) and `status-option` (DisciplineScreen.jsx:296–309); add one
   small guard asserting selectable status controls expose `aria-pressed`.
4. **[P2] Dialog/sheet consistency (batch).** Move `role="dialog"` to the inner `.sheet`
   and add backdrop click-to-close for AddCounterSheet/EditCounterSheet (HomeScreen.jsx).
5. **[P2] Honest input feedback.** Surface the silent clamps in the counter sheets (future
   start → now; empty target → 30). (HomeScreen.jsx + App.jsx.)
6. **[P2] Copy tightening (batch, honesty-preserving).** Consolidate Shield disclaimers
   without dropping any claim (ShieldScreen.jsx:118–122); fix "(Chrome 등)" → "Chrome"
   (ShieldScreen.jsx:29); soften scene-mode tap copy that implies a gaze/reaction
   (PetRewardScreen.jsx:41–46); align the relapse "required" comment with the non-coercive
   escape hatch (RecoveryScreen.jsx / App.jsx).
7. **[P2] Warmth band.** Either make it a real multi-level index or soften the "방 온기"
   copy so it doesn't imply a measured value. (HomeScreen.jsx:23–27, :351.)
8. **[P2] Deferred / larger.** Per-counter detail screen (§2/§3); shared trigger taxonomy
   across Check-in and Recovery (§8/§9); extract shared CounterFields (§6); production
   removal of the faux status bar (§13). None this round.

## Update for a stale policy doc (not a UI change)

`docs/REVIEW_CHECKLIST.md` §B still describes discipline as a **5-state** model, but the
code, memory, and `docs/UX_RULES.md` confirm the live model is **3-state**
(`kept`/`held`/`missed` + `unrecorded` default — see `src/constants/discipline.js`). The
checklist is stale and should be corrected so future reviews don't grade against the wrong
model. Flagged here per the skill's "trust source over docs" rule; no code touched.

## Verification gate (always run before any "done" claim)

```
npm run build          # must PASS
npm run check:nof      # must be 32/32 PASS (and any new guards added)
git status --short --branch
git diff --stat
```

No surface may be marked "working" without build + check:nof evidence and a real diff
review. Do not change product UI to satisfy a review finding without re-running this gate.
