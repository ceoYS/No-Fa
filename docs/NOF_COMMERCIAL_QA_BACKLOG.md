# NoF — Commercial QA Backlog

Scope: make the `wip/pet-room-scene-mode` prototype **commercially reviewable**,
not merely "build passes". Source-level audit of every screen/component against
the PRD invariants, copy policy, scene-mode guardrails, and basic mobile/a11y
expectations.

Priority key:
- **P0** — blocks a commercial review (honesty, broken invariant, data risk).
- **P1** — a reviewer would flag it; fix before showing externally.
- **P2** — polish / pre-production hardening; safe to defer.

Status key: `FIXED` (this pass) · `HOLD` (risky — see note) · `MANUAL`
(needs human browser pass) · `OPEN` (safe, deferred).

---

## Home (홈)

| # | Pri | Issue | Status |
|---|-----|-------|--------|
| H1 | P1 | Fabricated live-user metric "지금 1,240명이 같이 버티고 있어요." — a hardcoded count reads as a real social-proof number with no backend. Honesty risk in a commercial review. | FIXED — reframed to honest, count-free copy. |
| H2 | P2 | Home stacks 7 cards (timer, 규율, 무너졌다면, 멈춤, 최근 기록, 동행, 고양이 방). Long scroll; visual hierarchy flattens toward the bottom. Consider grouping or collapsing secondary cards. | OPEN (layout change — defer to avoid churn). |
| H3 | P2 | "규율 편집" / "전체 보기" are `var(--fs-small)` text buttons; touch target likely < 44px on a phone. | MANUAL (measure on device) / OPEN. |
| H4 | P1 | Room warmth line + preview tone must stay consistent with relapse state (`relapsedToday`). Verify dim tone shows the right copy and never a motion claim. | MANUAL. |
| H5 | P2 | `warmthBand()` only ever returns 잔잔함/안정; the band never reaches a "warm" high state even on a clean streak. Copy implies a spectrum that isn't exercised. | OPEN. |

## Checkin (체크인)

| # | Pri | Issue | Status |
|---|-----|-------|--------|
| C1 | P1 | Step-1 captures mood / triggers / urge, but `onCompleteCheckin()` ignored all three — the inputs were dead (not persisted to the day record). A reviewer testing the flow saw data vanish. | FIXED — `CheckinScreen` resolves the selections to labels and passes them up; `App.completeCheckin` writes `todayRecord.checkin = { moodLabel, urge, triggers, completedAt }`; 최근 기록 day-detail shows an 오늘의 체크인 block. Reward eligibility untouched (streak-day gated) and no new grant added. |
| C2 | P2 | Step-1 "다음" disabled state is inline `opacity:0.45; pointer-events:none` plus the `disabled` attr. Accessible, but the visual disabled cue is faint. | OPEN. |
| C3 | P1 | No explicit empty state when `rules.length === 0` is handled (it is) — confirm the 체크인 완료 button still grants sensibly with zero rules. | MANUAL. |
| C4 | P2 | "체크인 완료 · 방이 조금 더 따뜻해져요" — verify this is not a motion claim; it's a warmth metaphor, acceptable, but watch for over-promising visible change. | MANUAL. |
| C5 | P1 | Repeat-checkin shard farm: `completeCheckin` called `earn()` on **every** tap, so re-opening 체크인 and pressing 체크인 완료 again re-granted 잔불 조각 — an unbounded farm of the daily reward. Economy-honesty risk in a commercial review. | FIXED — grant gated to once per calendar day via `checkinRewardDay` + `dayKey()`. The first valid check-in of the day grants the existing 체크인 shards; later same-day re-check-ins still persist 기분/충동/트리거 but never re-grant. Milestone eligibility (streak-day, `isMilestoneClaimable`) and snack feed untouched; copy unchanged. Guarded by `npm run check:nof`. |

## Calendar / Records (최근 기록)

| # | Pri | Issue | Status |
|---|-----|-------|--------|
| R1 | P1 | Day-detail sheet: confirm `role="dialog"` + `aria-modal` traps focus and 닫기 returns focus. Currently no focus management. | MANUAL / OPEN. |
| R2 | P2 | Legend dots rely on `data-tone` color only — color-blind users can't distinguish states without the text label. Text label is present, so acceptable. | OPEN. |
| R3 | P1 | "다시 시작한 날도 빨강 없이 따뜻한 톤" — verify no red/alarm tone leaks into any relapse cell (copy-policy honesty). | MANUAL. |
| R4 | P2 | Range chips (7d/…): confirm selected state is visible and the strip re-anchors to the latest day on range change. | MANUAL. |

## Discipline (나의 규율)

| # | Pri | Issue | Status |
|---|-----|-------|--------|
| D1 | P0 | No-delete invariant: no `onDeleteRule` / delete affordance must exist. Verified — only an explanatory comment references it; no handler/button/sheet. | FIXED/VERIFIED — also removed orphan `.btn-delete` CSS so a delete control can't be trivially styled in. |
| D2 | P1 | Copy must stay non-punitive (self-contract framing, no 벌/실패/위반). Verified in STATUS_HELP and screen subtitle. | VERIFIED. |
| D3 | P2 | Status pill is the only way to change a rule's state; the affordance ("누르면 바꿀 수 있어요") is explained in the 규율 다루는 방식 card, but the pill itself has no obvious "tap to edit" affordance beyond `aria-label`. | OPEN. |
| D4 | P2 | Add-rule sheet: 추가하기 disabled until label non-empty (good). Custom category input max 20 — confirm long tags don't overflow chips. | MANUAL. |

## Recovery / Reflection (복기 다이어리)

| # | Pri | Issue | Status |
|---|-----|-------|--------|
| V1 | P1 | Relapse reflection is required (`canFinish = why non-empty`); slip is optional. Verify the disabled finish button is clearly blocked on relapse. | MANUAL. |
| V2 | P1 | Scene image is intentionally caption-less (header carries tone). Confirm no duplicate caption and `alt=""` (decorative). Verified in source. | VERIFIED. |
| V3 | P2 | Free-text fields cap at 200 chars with no counter; a reviewer hitting the cap gets no feedback. | OPEN. |
| V4 | P1 | "조금 이따 할게요" on a *required* relapse reflection still navigates home — confirm the timer was already reset so skipping doesn't dodge the record. | MANUAL (logic: timer reset happens in `relapse()` before this screen — OK). |
| V5 | P1 | Slip-reflection shard farm: `completeReflection` granted `slipReflection` on **every** finish, and the Home **오늘 복기하기** (ruleId null, empty finish allowed) had no `reflected` gate — so it could be looped to farm 잔불 조각. Economy-honesty risk. | FIXED — slip grant gated to once per calendar day via `slipReflectionDay` + `dayKey()`; relapse-reflection grant stays ungated (self-limited by the timer reset in `relapse()`). Badges still record every reflection; only the shard grant is rate-limited. Pinned by `check:nof`. |

## Urge / 잠깐 멈춤

| # | Pri | Issue | Status |
|---|-----|-------|--------|
| U1 | P1 | Crisis-held shard farm: `crisisHeld` granted `EARN.crisisHeld` (4) on **every** 마치기 press, and the 마치기 button appears the instant the timer starts — so start→immediately-finish could be looped to farm 잔불 조각 with no real 5-minute hold. Economy-honesty risk. | FIXED — grant gated to once per calendar day via `crisisRewardDay` + `dayKey()`. A genuine second crisis the same day still shows the calm flow + message, just no re-grant. Snack feed / milestone eligibility untouched; copy unchanged. Pinned by `check:nof`. |

## Pet Room (고양이 방)

| # | Pri | Issue | Status |
|---|-----|-------|--------|
| P1a | P0 | Reward eligibility: an ineligible/already-claimed reward must never change snack/shards. Single guard `isMilestoneClaimable` consulted by both screen and App action. Verified. | VERIFIED. |
| P1b | P0 | sceneMode honesty: while sprites aren't alpha-ready, no drag, no item overlays, no "방에 있음" badge, no motion claim. `shouldUsePetSceneMode` gates drag, inventory placement, theme tab, and the "방에 있음" badge. Verified. | VERIFIED. |
| P1c | P1 | 간식 주기 button when `snackCount<=0`: `aria-disabled` true but still clickable (intentional — shows "보유한 간식이 없어요"). Slightly inconsistent a11y; acceptable as it gives feedback, but a SR announces "disabled" then the button acts. | OPEN. |
| P1d | P1 | Feed decreases snack count (`feedSnack` guards `>0`, decrements). Verified. | VERIFIED. |
| P1e | P1 | Sound: `usePetSound` HEAD-probes and stays silent if mp3 missing; play() only on gesture, never autoplay. Verified. | VERIFIED. |
| P1f | P2 | Locked-milestone row shows the day pill; reached-but-claimed shows "받음" disabled. Confirm the three states (받기 / 받음 / N일째) are visually distinct on device. | MANUAL. |
| P1g | P1 | `room-instruction` is a kept-mounted live region (empty when idle) so feedback doesn't stack with the scene note. Confirm SR doesn't read an empty region noisily. | MANUAL. |

## BottomNav

| # | Pri | Issue | Status |
|---|-----|-------|--------|
| N1 | P1 | Active tab conveyed by `data-active` → color only (`text-ember`). No `aria-current`, and color-only state fails WCAG 1.4.1. | FIXED — added `aria-current="page"` to the active tab. |
| N2 | P2 | Nav has 4 tabs but the app has 7 screens (urge/discipline/reward reachable only via in-screen buttons). A reviewer may not discover 고양이 방 / 나의 규율 from the nav. Intentional, but note for IA review. | OPEN. |
| N3 | P2 | Tab buttons: confirm ≥44px touch height on device. | MANUAL. |

## Cross-cutting

| # | Pri | Issue | Status |
|---|-----|-------|--------|
| X1 | P2 | `ScreenSwitcher` debug aside shipped visible in every build. Clearly labeled "프로토타입 · 최종 아님", fine for review, but must not render on a plain production load. | FIXED — gated behind `debugNavEnabled()`: shown in dev (`import.meta.env.DEV`) and, on a built/review deploy, only with `?dev=1` (persisted to `localStorage.nof_debug_nav`). A plain production load hides it; BottomNav stays the real nav. Enable/disable steps in the review checklist. |
| X2 | P1 | Scene-mode forbidden-token scan (기지개/꼬리/먹는/움직임/SVG cat/emoji furniture) must stay clean. Only benign hits are a CSS `align-items: stretch` and an explanatory `onDeleteRule` comment. | VERIFIED. |
| X3 | P2 | No global error boundary — a render throw blanks the device frame. Acceptable for prototype; note for production. | OPEN. |
| X4 | P2 | Empty states exist for rules (Home/Checkin/Discipline) and inventory; confirm each reads calmly with zero data. | MANUAL. |
| X5 | P1 | Source-level regression guard (`npm run check:nof` → `scripts/nof-regression-check.mjs`): pins the commercial invariants a passing build won't catch — reward claim guard present in App **and** screen, `isMilestoneClaimable` gating, check-in once-per-day grant, no discipline delete affordance, scene-mode drag disabled until `spriteReady`, no fake-motion/emoji-furniture/blob tokens, plus crisis-held once-per-day, slip-reflection once-per-day, pet-room sheets are dialogs, and a top-level ErrorBoundary. | EXPANDED — 10/10 checks pass; dependency-free node script wired as an npm script for a pre-review run. |
| X6 | P1 | Keyboard / SR a11y gaps: modal sheets were pointer-dismiss only, and toggle controls (mood/trigger/urge, calendar range, recovery triggers, add-rule categories) signalled selection by `data-selected` colour only. | FIXED — `useDismissOnEscape` makes pet-room/calendar/discipline sheets Esc-dismissible; toggle controls now carry `aria-pressed`; urge cells carry `aria-label`. Full focus-trap/return on dialogs remains a later pass (browser-manual). |
| X7 | P1 | No error boundary — a render throw blanks the device frame to white. | FIXED — top-level `ErrorBoundary` wraps `<App/>` in `main.jsx` with a calm, honest fallback (no false "records survive" claim; dev-only console log) + a 다시 불러오기 action. |
