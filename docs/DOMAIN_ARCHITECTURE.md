# NoF — Domain Architecture

Status: **proposal (P0.1 review).** No source has been moved. This document
records the domain boundaries we want to converge on so that future code lands
in the right place from the start — and so the P0.1 catch-up diff can be judged
against an explicit target, not an implicit one.

Driving concern (from review brief): we develop by **product/domain**, not by
"whatever screen the code first appeared in." Concretely:

- Future **payment / billing** code must never live inside an image or pet folder.
- **Pet** logic must not be hidden inside `CalendarScreen`.
- **Discipline** status logic must not be duplicated across screens.
- **Records / calendar** logic must not be mixed with **reward** or **protection** logic.

---

## 1. Domain glossary

| Domain | Owns | User surface |
|---|---|---|
| **discipline** | the 5-state rule model, status transitions, rule summary | 나의 규율, 규율 점검 step |
| **records** | the calendar/recent-days model, day-dot 4-state, day summaries | 최근 기록 tab, 최근 7일 strip |
| **recovery** | the "shaken → recovery action → recovered" flow | 회복 화면 |
| **pet** | Ember Cat presentation + warmth/tone state | 잔불 고양이, 방 온기 |
| **protection** | blocked-stimulus counters, protect-mode surface | 오늘 보호한 자극 |
| **rewards** | claimable items, claim state, reward messaging | 펫 보상 화면 |
| **shared** | design-system primitives, nav, layout chrome | BottomNav, pills, sheets, tokens |
| **app** | screen routing, state orchestration, wiring domains together | App.jsx, ScreenSwitcher |

A domain owns its **rules and vocabulary**. A screen is a *view* that composes
one or more domains; it should not be the home of a domain's business rules.

---

## 2. Question 1 — which domain does each changed file belong to?

Eight tracked files changed in the P0.1 diff, plus one new untracked constants
directory.

| File | Primary domain | Notes |
|---|---|---|
| `src/App.jsx` | **app** (orchestration) | Holds rule state + recovery transition logic — see §4 flag A. |
| `src/constants/discipline.js` *(new)* | **discipline** | Single source for the 5-state labels/pills/help, `summarizeRules`. Correct domain, wrong folder (see §5). |
| `src/constants/recentDays.js` *(new)* | **records** | Calendar 4-state model, `buildRecentDays`, `daySummary`. Imports discipline's `summarizeRules` — see §4 flag D. |
| `src/components/EmberCalendarStrip.jsx` | **records** (rendered as shared component) | Lives in `components/` but is a records view; imports `CALENDAR_LABEL` — see §4 flag C. |
| `src/screens/CalendarScreen.jsx` | **records** | Pure records view. Clean after cleanup. |
| `src/screens/DisciplineScreen.jsx` | **discipline** | View over discipline domain; one stray pet string — see §4 flag B. |
| `src/screens/CheckinScreen.jsx` | **discipline** (+ check-in mood/trigger capture) | Step 2 uses `CHECKIN_TAP`; writes discipline status via `onSetRuleStatus`. |
| `src/screens/HomeScreen.jsx` | **app** (dashboard) | Composes discipline + records + pet; one hardcoded pet-warmth block — see §4 flag B. |
| `src/screens/RecoveryScreen.jsx` | **recovery** | View; transition itself is decided in App.jsx — see §4 flag A. |
| `src/styles/components.css` | **shared** | Design-system styles for all of the above. |

Unchanged files relevant to the map: `EmberCat.jsx` (**pet**, correct),
`BottomNav.jsx` / `ScreenSwitcher.jsx` (**shared/app**), `UrgeScreen.jsx`
(**recovery**-adjacent urge interruption, clean), `PetRewardScreen.jsx`
(**rewards**, with trapped state — see §4 flag E).

---

## 3. Question 4 — proposed target architecture

```
src/
  app/                      # routing + cross-domain orchestration only
    App.jsx
    ScreenSwitcher.jsx
    screenRegistry.js       # the SCREENS list

  domains/
    discipline/
      model.js              # 5-state enum, STATUS_LABEL/PILL/HELP/ORDER, CHECKIN_TAP
      summarize.js          # summarizeRules + consistency weights (§0.5.10)
      useDiscipline.js      # (P1) status transition hook — owns setRuleStatus
      DisciplineScreen.jsx
      CheckinScreen.jsx
    records/
      calendarModel.js      # CALENDAR_LABEL, CALENDAR_LEGEND, buildRecentDays, daySummary
      EmberCalendarStrip.jsx
      CalendarScreen.jsx
    recovery/
      recoveryFlow.js       # startRecovery/completeRecovery transition (lifted out of App)
      RecoveryScreen.jsx
      UrgeScreen.jsx
    pet/
      EmberCat.jsx
      warmth.js             # warmth index derivation (§0.5.10) — single source for 방 온기
    protection/
      protectionModel.js    # blocked-stimulus counters (today static seed)
    rewards/
      rewardsModel.js       # INITIAL_ITEMS, claim transition
      PetRewardScreen.jsx

  shared/
    ui/                     # pills, sheets, chips, buttons (currently all in components.css)
    nav/BottomNav.jsx
    styles/{tokens.css,components.css}
```

### Dependency-direction rules (the part that actually matters)

1. `app/` may import from any `domains/*` and `shared/*`. Nothing imports from `app/`.
2. `domains/*` may import from `shared/*` freely.
3. **Cross-domain imports between `domains/*` are allowed only in one direction
   and must be explicit.** Today there is exactly one such edge:
   `records → discipline` (records derives today's dot from the discipline
   summary). That edge is acceptable and intentional, but it must stay
   one-way: **discipline must never import records.**
4. **pet, protection, rewards, and a future `payment/` domain are leaf domains** —
   nothing else should reach into them, and they should not reach into discipline
   or records. Payment, when it arrives, gets its own `domains/payment/` and is
   wired only through `app/`. It must never appear under `pet/`, `rewards/`, or any
   image/asset folder.
5. `shared/` imports nothing from `domains/` or `app/`. If a "shared" component
   needs a domain constant, that component is not actually shared — it belongs to
   the domain (this is the `EmberCalendarStrip` case, §4 flag C).

---

## 4. Question 2 — business rules currently in the wrong layer

These are the boundary smells in the P0.1 diff. **All are acceptable for P0.1**
(in-memory prototype, no persistence) and are documented here rather than fixed,
per the "move nothing now" decision in §6. Each has a target home in §3.

- **Flag A — recovery transition logic lives in `app/App.jsx`.**
  `startRecovery` (App.jsx:94) and `completeRecovery` (App.jsx:103) encode the
  recovery domain's core rule: *shaken → remember rule → on completion, set
  recovered.* This is recovery-domain logic sitting in the orchestration layer.
  Target: `domains/recovery/recoveryFlow.js`. App.jsx should call it, not embody it.

- **Flag B — pet "방 온기 / 온기" is hardcoded and scattered, with no pet domain owner.**
  `HomeScreen.jsx:145` ("오늘의 방 온기" + static "안정") and
  `DisciplineScreen.jsx:68` ("방 온기: 안정") both assert warmth as a literal
  string in a screen. The Room Warmth Index is a real domain concept (§0.5.10,
  shown as 약함/잔잔함/안정/따뜻함). It should be derived once in
  `domains/pet/warmth.js`, not retyped per screen. This is the highest-risk
  duplication because two screens already disagree on phrasing.

- **Flag C — `EmberCalendarStrip` is filed as a shared component but is a records view.**
  It imports `CALENDAR_LABEL` from the records model
  (`EmberCalendarStrip.jsx:1`). A genuinely shared primitive imports no domain
  constants. Target: move under `domains/records/`.

- **Flag D — `records → discipline` import edge.**
  `recentDays.js:10` imports `summarizeRules` from discipline. This is the one
  sanctioned cross-domain edge (rule 3 above). Not a violation — recorded so it
  stays one-way and doesn't multiply.

- **Flag E — reward claim state is trapped inside `PetRewardScreen`.**
  `INITIAL_ITEMS` + `claim` (PetRewardScreen.jsx:9–31) live in component state.
  Rewards business logic should sit in `domains/rewards/rewardsModel.js` so it
  can later connect to discipline/streak signals without rewriting the screen.
  Not in the P0.1 diff's critical path, but flagged for the same reason as the
  others: a screen should not be the sole owner of a domain's rules.

No discipline status logic is **duplicated** across screens — that risk was
avoided by centralizing the 5-state in `discipline.js`. Screens call
`summarizeRules` / `STATUS_*`; none re-implement the enum. ✓

---

## 5. Question 3 — should the new constants files move now?

`src/constants/discipline.js` and `src/constants/recentDays.js` are in the right
*domain* (discipline, records) but the wrong *folder* under the target
architecture — they should eventually be `domains/discipline/` and
`domains/records/`.

**Decision: keep them in `src/constants/` for the P0.1 diff. Do not move now.**

Reasoning:
- Moving them now would rewrite the import path in 4 screens + 1 component inside
  the same diff that introduces them, inflating the reviewable surface for zero
  behavioural gain.
- The files are already correctly *scoped* (one domain each, no cross-leak except
  the sanctioned records→discipline edge). The folder is cosmetic until the full
  `domains/` tree exists.
- The physical move is a clean, mechanical, separately-reviewable refactor. It
  should happen as its own commit *after* P0.1 is reviewed and merged, when the
  whole `domains/` tree is created at once (see §6).

---

## 6. Question 5 — safe migration plan

**Move now (in this P0.1 diff): nothing.** The diff stays a behaviour catch-up.
No file relocations, no import-path churn.

**Defer to a dedicated post-merge refactor commit ("chore: adopt domains/ tree"):**
1. Create `src/domains/{discipline,records,recovery,pet,protection,rewards}/`,
   `src/app/`, `src/shared/`.
2. Move the two constants files → `domains/discipline/`, `domains/records/`;
   update 5 import sites.
3. Move screens to their domain folders; move `EmberCalendarStrip` → `domains/records/`
   (fixes flag C); move `EmberCat` → `domains/pet/`.
4. Lift recovery transition out of App.jsx → `domains/recovery/recoveryFlow.js` (flag A).
5. Introduce `domains/pet/warmth.js` and route both warmth strings through it (flag B).
6. Lift reward claim model → `domains/rewards/rewardsModel.js` (flag E).
   Each step is independently verifiable with `npm run build`.

**Do not touch in P0.1 at all:**
- `docs/ACQUISITION_POSITIONING_BENCHMARK.md` — kept out of this diff entirely.
- `design_outputs/claude_design_v3/*.html` — frozen.
- `docs/PRD` + Spec Kit — locked source of truth.
- Any binary / `dist` / `node_modules`.

The ordering guarantee: **behaviour first (P0.1, done), structure second
(refactor commit), never interleaved.** That keeps every diff single-purpose and
reviewable.
