# NoF — Commercial Readiness Backlog (broad pass)

Branch: `wip/pet-room-scene-mode`. A wider companion to
`NOF_COMMERCIAL_QA_BACKLOG.md`: a single board of everything between the current
in-memory prototype and a commercially reviewable build, across **every** surface
and cross-cutting concern. Source-level audit only — no asset generation, no
guardrail loosening.

## Keys

- **Pri** — `P0` blocks a commercial review · `P1` a reviewer would flag · `P2`
  polish / pre-production.
- **Track** — `source` (fixable in code now) · `browser` (needs a human device
  pass) · `asset` (needs an approved art/audio file first) · `HOLD` (risky / out
  of scope this pass).
- **Status** — `FIXED✓` (this pass) · `FIXED` (earlier pass) · `VERIFIED` (audited,
  already correct) · `MANUAL` (browser checklist) · `OPEN` (safe, deferred) ·
  `HOLD-asset` (gated until an asset lands).

## Implemented this pass (safe source-fixable P0/P1) — 11

1. **ER1** crisis-held (잠깐 멈춤 마치기) shard grant gated once-per-calendar-day.
2. **ER3 / VR1** slip-reflection (오늘 복기하기) shard grant gated once-per-day.
3. **PR3 / RR2 / AR2** modal sheets Esc-dismissible; 보관함·상점 are real dialogs.
4. **CX1** top-level `ErrorBoundary` (no white-screen on a render throw).
5. **AR1 / CR4 / VR2 / DR3** toggle controls expose `aria-pressed`.
6. **AR5** urge scale cells get accessible labels (`충동 강도 N`).
7. **CR3** check-in `특별히 없음` trigger is now mutually exclusive.
8. **RR1** calendar strip `aria-label` is range-accurate (not always "최근 7일").
9. **QR1** regression script expanded 6 → 10 checks.
10. **DOR1** this readiness backlog created; QA backlog + checklist updated.
11. **(model)** all three repeatable earn paths (check-in / crisis / slip) now
    share the same once-per-day anti-farm shape; relapse-reflection stays ungated
    by design (self-limited by its timer reset).

## Product refocus pass (timer-first core) — 5

Re-centre the app on the real no-fap loop (live abstinence timer + 5-minute crisis
delay) without loosening any guardrail.

1. **Home timer-first.** Two hero CTAs sit directly under the abstinence timer —
   primary `지금 충동 멈추기` (→ urge) and `오늘 상태 남기기` (→ 1분 기록). The buried
   standalone 잠깐 멈춤 card and the generic 동행 social card are removed; the 규율
   card drops its duplicate check-in button. Hero + 4 compact cards, not hero + 6.
2. **Urge real alternative panel.** `대체 활동 해보기` no longer routes home; it opens
   an in-screen panel of 4 concrete actions (물 한 잔 / 휴대폰 내려놓기 / 10번 숨쉬기 /
   자리에서 일어나기). Completing one returns to the breath timer with a calm note and
   grants nothing — only the once-per-day `crisisHeld` 마치기 earns.
3. **Calmer urge copy.** The forbidden `파도처럼 약해질 수 있어요` is gone from Home and
   Urge, replaced with `5분만 지나도 강도는 조금 내려갈 수 있어요`. `파도처럼` is now a
   banned token in `check:nof`.
4. **Check-in as secondary logging.** Reframed to `1분 기록` / `오늘 상태를 남겨요` with
   `패턴을 보기 위한 개인 기록이에요. 밖으로 공유되지 않아요.` Persistence + once-per-day
   reward guard untouched.
5. **Honest snack hand-off.** Feed shows an emoji-free ember token rising from the
   button toward the scene + `간식을 건넸어요. 고양이가 기분 좋아 보여요.` No eating /
   motion claim; drag stays disabled (`spriteReady:false`). `check:nof` 10 → 13.

---

## Home (홈)

| Pri | Track | Item | Status |
|---|---|---|---|
| P1 | source | Timer-first: abstinence timer hero + `지금 충동 멈추기` / `오늘 상태 남기기` hero CTAs above secondary cards; standalone crisis card + 동행 filler removed (hero + 4 cards). | FIXED✓ |
| P1 | source | `warmthBand()` only ever returns 잔잔함/안정; copy implies a spectrum that never reaches a warm high even on a clean streak. | OPEN |
| P1 | source | Generic 동행/social card removed entirely (no backend to honor it); no fabricated metric remains. | FIXED✓ |
| P1 | browser | Relapse preview tone + copy stay dim/gentle, never a motion claim. | MANUAL |
| P2 | browser | 규율 편집 / 전체 보기 text buttons likely <44px touch. | MANUAL |
| P2 | source | Timer clock updates each 1s but is not a live region (no SR spam). | VERIFIED |

## Check-in (체크인)

| Pri | Track | Item | Status |
|---|---|---|---|
| P1 | source | Reframed as secondary logging (`1분 기록` / `오늘 상태를 남겨요`) with `패턴을 보기 위한 개인 기록이에요. 밖으로 공유되지 않아요.` — no longer reads as the main mechanic. | FIXED✓ |
| P1 | source | Step-1 mood/urge/triggers persist into today's record. | FIXED |
| P1 | source | Repeat 체크인 완료 grants shards once-per-calendar-day (`checkinRewardDay`). | FIXED |
| P1 | source | `특별히 없음` trigger is mutually exclusive — no "없음 + 스트레스" lands in the record. | FIXED✓ |
| P1 | source | mood / trigger / urge controls expose `aria-pressed`. | FIXED✓ |
| P2 | source | Re-entry does not prefill the saved mood/urge; re-check-in starts blank. | OPEN |
| P2 | browser | Disabled 다음 visual cue is faint. | MANUAL |

## Urge / 잠깐 멈춤 (crisis loop)

| Pri | Track | Item | Status |
|---|---|---|---|
| P0 | source | `대체 활동 해보기` opens a real in-screen alternative-action panel (4 concrete actions), not a silent home route under a misleading label. | FIXED✓ |
| P1 | source | Completing an alternative returns to the breath timer with a calm note and grants no shards (only once-per-day `crisisHeld` 마치기 earns). | FIXED✓ |
| P1 | source | Calm copy: forbidden `파도처럼` removed; `5분만 지나도 강도는 조금 내려갈 수 있어요`. Pinned by `check:nof`. | FIXED✓ |
| P1 | browser | Breath ring + 5-minute count-up read calmly; no shame copy. | MANUAL |

## Calendar / Records (최근 기록)

| Pri | Track | Item | Status |
|---|---|---|---|
| P1 | source | Range chips expose `aria-pressed`; strip `aria-label` is range-accurate. | FIXED✓ |
| P1 | source | Day-detail sheet is Esc-dismissible (was pointer-only). | FIXED✓ |
| P1 | browser | Full focus-trap + focus-return on the day-detail dialog (Esc added; trap deferred). | OPEN |
| P1 | browser | Relapse cells render warm, never red/alarm. | MANUAL |
| P2 | source | Legend relies on tone + text label (text present). | VERIFIED |

## Discipline (나의 규율)

| Pri | Track | Item | Status |
|---|---|---|---|
| P0 | source | No delete affordance (no handler/button/sheet; orphan `.btn-delete` CSS removed). | VERIFIED |
| P1 | source | Copy stays non-punitive (no 벌/실패/위반 framing). | VERIFIED |
| P1 | source | Add-rule category chips expose `aria-pressed`; sheets Esc-dismissible. | FIXED✓ |
| P2 | browser | Long custom category tag overflow in chips. | MANUAL |
| P2 | source | "Tap to edit" cue on the status pill is faint beyond `aria-label`. | OPEN |

## Recovery / Reflection (복기 다이어리)

| Pri | Track | Item | Status |
|---|---|---|---|
| P1 | source | Slip-reflection shard grant is once-per-day (`slipReflectionDay`) — closes the 오늘 복기하기 farm. | FIXED✓ |
| P1 | source | Trigger chips expose `aria-pressed`. | FIXED✓ |
| P1 | source | Scene image caption-less, `alt=""` decorative (no duplicate caption). | VERIFIED |
| P1 | browser | Relapse reflection required (why non-empty); disabled finish clearly blocked. | MANUAL |
| P2 | source | 200-char textarea cap has no counter. | OPEN |

## Pet Room (고양이 방)

| Pri | Track | Item | Status |
|---|---|---|---|
| P0 | source | Reward eligibility guard (`isMilestoneClaimable`) in both screen + App. | VERIFIED |
| P0 | source | sceneMode honesty: no drag, no overlay, no `방에 있음`, no motion claim. | VERIFIED |
| P1 | source | 보관함 / 상점 are real dialogs (`role`/`aria-modal`/`aria-label`) + Esc-dismissible. | FIXED✓ |
| P1 | source | Snack feed shows an emoji-free ember hand-off token rising toward the scene + `간식을 건넸어요. 고양이가 기분 좋아 보여요.` — no eating/motion claim; reduced-motion respected. | FIXED✓ |
| P1 | source | Feed decrements, never negative; sound silent fallback, gesture-gated. | VERIFIED |
| P1 | browser | Three reward states (받기 / 받음 / N일째) visually distinct on device. | MANUAL |
| P1 | browser | Feed at 0 snacks: `aria-disabled` but clickable (intentional feedback). | OPEN |
| P1 | asset | Drag placement + independent cat motion gated until transparent sprites (`spriteReady`). | HOLD-asset |
| P1 | asset | Feeding / stretch / wave animation needs a real animation asset (no CSS-fake). | HOLD-asset |

## BottomNav

| Pri | Track | Item | Status |
|---|---|---|---|
| P1 | source | Active tab carries `aria-current="page"` (not color-only). | FIXED |
| P2 | browser | 4 tabs / 7 screens; 고양이 방·나의 규율 only via in-screen buttons (IA note). | OPEN |
| P2 | browser | ≥44px tab touch height. | MANUAL |

## Debug tooling

| Pri | Track | Item | Status |
|---|---|---|---|
| P1 | source | `ScreenSwitcher` gated behind `debugNavEnabled()` (dev or `?dev=1`); hidden on plain prod. | VERIFIED |
| P2 | browser | `?dev=1` persistence + removal flow on a built preview. | MANUAL |

## Reward economy

| Pri | Track | Item | Status |
|---|---|---|---|
| P1 | source | crisis-held (`crisisRewardDay`) once-per-day — closes the start→finish farm. | FIXED✓ |
| P1 | source | check-in (`checkinRewardDay`) once-per-day. | FIXED |
| P1 | source | slip-reflection (`slipReflectionDay`) once-per-day. | FIXED✓ |
| P0 | source | No real-money / gacha / random / streak-recovery; single earned 잔불 조각, deterministic grants. | VERIFIED |
| P0 | source | Milestone claim once-only + eligibility guard; ineligible/claimed never moves balance. | VERIFIED |
| P1 | source | `buyItem` guards affordability + ownership; balance never negative. | VERIFIED |
| P2 | source | Relapse-reflection grant intentionally ungated (self-limited by streak reset); documented. | VERIFIED |

## Accessibility

| Pri | Track | Item | Status |
|---|---|---|---|
| P1 | source | Toggle controls expose `aria-pressed` (check-in, calendar range, recovery, add-rule). | FIXED✓ |
| P1 | source | Modal sheets Esc-dismissible across pet-room / calendar / discipline (`useDismissOnEscape`). | FIXED✓ |
| P1 | source | Urge scale cells labelled (`충동 강도 N`). | FIXED✓ |
| P1 | browser | Full focus-trap + focus-return on all dialogs (Esc added; trap deferred). | OPEN |
| P2 | browser | Pill / hairline-note contrast on warm bg at small sizes. | MANUAL |

## Mobile layout

| Pri | Track | Item | Status |
|---|---|---|---|
| P1 | browser | Nothing overflows the device frame horizontally at 390px on any screen. | MANUAL |
| P2 | browser | Pet Room header crowding (greeting+title / 소리+balance). | MANUAL |
| P2 | browser | Long Korean labels wrap gracefully in chips / pills. | MANUAL |

## Empty states

| Pri | Track | Item | Status |
|---|---|---|---|
| P1 | source | Zero-rule empty states (Home / Check-in / Discipline) read calmly. | VERIFIED |
| P1 | source | Inventory empty + 0-snack states honest, non-negative. | VERIFIED |
| P2 | browser | Reward section with no reached milestone reads calmly. | MANUAL |

## Regression checks

| Pri | Track | Item | Status |
|---|---|---|---|
| P1 | source | `check:nof` expanded 6 → 13 (crisis/slip once-per-day, pet-room dialogs, ErrorBoundary, home timer-first, urge alt-panel, feed hand-off + `파도처럼` ban). | FIXED✓ |
| P1 | source | Tripwire greps clean (only benign CSS `stretch` + `onDeleteRule` comment). | VERIFIED |
| P2 | source | No unit/e2e runner; static checks only (acceptable for prototype). | OPEN |

## Docs

| Pri | Track | Item | Status |
|---|---|---|---|
| P1 | source | This readiness backlog created; QA backlog + review checklist updated. | FIXED✓ |
| P2 | source | Add Esc / ErrorBoundary note to scene-mode guardrails if behaviour expands. | OPEN |
| P2 | source | Overlapping docs (SCREEN_INVENTORY, PRD audits) — consolidate later. | OPEN |

## Cross-cutting

| Pri | Track | Item | Status |
|---|---|---|---|
| P1 | source | Top-level `ErrorBoundary` — gentle, honest fallback; no false persistence claim. | FIXED✓ |
| P1 | source | Forbidden-token scan clean across `src`. | VERIFIED |

---

_Manual device pass: `PET_ROOM_REVIEW_CHECKLIST.md`. Source invariants:_
`NOF_SCENE_MODE_GUARDRAILS.md`. _This-pass QA detail:_ `NOF_COMMERCIAL_QA_BACKLOG.md`.
