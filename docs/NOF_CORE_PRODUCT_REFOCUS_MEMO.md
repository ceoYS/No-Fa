# NoF — Core Product Refocus Memo

Status: **product-owner refocus, pre-source.** No source edited, no PRD edited, no
commit. This memo exists to realign the build with the real product core *before*
any further code lands, and to decide the fate of the uncommitted P0.1 diff.

Driving decision (product owner, 2026-05-29): **NoF is not primarily a generic
discipline checker, a pet-room app, or a soft recovery calendar.** Those are
support layers. The real core is an **abstinence timer + failure reflection +
supporting discipline rules + functional records + social accountability**, with
the pet as a *responsibility/reward layer that serves that loop* — never the
headline.

This memo is grounded in the actual current code (file:line evidence inline), not
on the prototype's self-description.

---

## 0. State-model decision (overrides earlier 5-state)

The earlier internal 5-state (`kept / needs_check / shaken / recovered /
not_applicable`, `discipline.js:15–21`) is **superseded** for the user-facing
layer.

**Approved user-selectable Discipline states — exactly three:**

| # | Label (UI) | Meaning | Routes to |
|---|---|---|---|
| 1 | **지켰어요** | Kept the rule that day. | nothing — quiet success |
| 2 | **못 지켰어요** | Failed this rule. | **failure reflection** (why / trigger / next time) |
| 3 | **위기였지만 버텼어요** | Had an urge/risk but did *not* fail. | optional trigger + coping log |

**Post-action badges (not selectable; appear only after the user does the action):**

- **복기 완료** — shown only after a reflection or next-action is written.
- **회복 루틴 완료** — shown after a recovery routine is completed.
- **다음 행동 작성 완료** — shown after a next-action commitment is written.

**Removed from the primary model:** `상황 없음` **and** `해당 없음`. Reason: the
meaning is unclear — a user cannot tell whether it means kept, not kept, skipped,
irrelevant, or unchecked. If a skip concept is ever needed, it is a **secondary
`오늘 기록 건너뛰기` action**, never a primary status.

**Proposed internal enum** (replaces the old one):

```
kept        지켰어요              success
missed      못 지켰어요           failure → reflection
held        위기였지만 버텼어요    urge survived (a win)
unrecorded  (no rendered label)  not yet recorded today (default; shows a prompt, not a status)
```

Plus a separate per-rule **badge set**: `{ reflected, routineDone, nextActionWritten }`.

`recovered` and `not_applicable` are **deleted** as base states. `recovered`
becomes the `복기/회복 루틴` badge layered on top of a `missed` (or `held`) rule.
`unrecorded` replaces `needs_check` as the pre-selection default and is **never
rendered as a label** — an unrecorded rule shows the three option buttons
unselected, not a "확인 필요" pill.

---

## 1. What is the real primary loop of NoF?

**Two failure scopes — this is the central clarification the prototype was missing.**

NoF tracks two different things, and conflating them is the root of the "unclear
meaning" complaints:

- **Core abstinence (the timer).** The headline streak: how long the user has
  stayed abstinent (days / hours / minutes / seconds). A **relapse** breaks it →
  the timer resets to 0, the finished run is archived as a past streak, the pet
  dims (recoverable), and a **mandatory deep reflection** is invited. This is *the*
  failure the timer measures.
- **Supporting discipline rules.** User-created habits that *lower the probability
  of relapse* (e.g., "no phone in bed after 11pm"). A rule slip (`못 지켰어요`)
  **does not reset the core timer** — it is a risk signal that invites a *lighter*
  reflection. Repeated slips raise relapse risk; that is *why* rules exist.

A rule failure ≠ a relapse. `위기였지만 버텼어요` is a **win** (resisted), not a
negative.

**Primary loop:**

1. **Timer runs** continuously (hero of Home).
2. **Daily check:** for each rule, user taps `지켰어요 / 못 지켰어요 / 위기였지만 버텼어요`.
3. **On `못 지켰어요`** → guided **failure reflection** (why / trigger / next time) →
   earns `복기 완료`. On `위기였지만 버텼어요` → optional trigger + coping log.
4. **On relapse** (a distinct, explicit event) → timer resets, **mandatory reflection**,
   run archived.
5. **Records:** every day stores its own row (status, streak-at-that-day, kept/failed
   counts, reason, reflection, next action) and is **tappable**.
6. **Social presence:** the user feels others are fighting the same battle.
7. **Pet** reflects the streak/consistency and rewards the loop — support, not headline.

---

## 2. What should Home prioritize?

Current Home (`HomeScreen.jsx`) already has the right hero (`절제 시간` timer,
lines 47–60) but it is **seed-only** (`SEED_OFFSET_MS`, line 7–8), **not connected
to a relapse/reset**, and **duplicated** by a hardcoded `12 / 27` streak card
(lines 71–81). Priority order should be:

1. **Abstinence timer (hero)** — real elapsed time since last relapse; days +
   hh:mm:ss. Fold "최장 기록" into this card, derived (not the hardcoded 27).
2. **Today's discipline check** — quick entry into the 3-state daily check.
3. **Relapse + reflection entry** — a calm, non-shaming `무너졌어요 / 다시 시작`
   action and a `복기하기` shortcut. **Currently absent.**
4. **`충동 멈추기` (urge interrupt)** — feeds `위기였지만 버텼어요`. Keep prominent.
5. **Functional records preview** — tap a day → its detail. (Today it is a
   decorative strip + one summary line, `HomeScreen.jsx:154–174`.)
6. **Social presence teaser** — "함께 버티는 중" (P0, non-functional). Currently absent.
7. **Pet + warmth + protection** — demoted to a support strip. (Room warmth is
   still a hardcoded string, `HomeScreen.jsx:145–148`, flag B from the domain review.)

**Demote/remove:** the static `12 / 27` streak card (duplicates and contradicts the
live timer); the hardcoded `안정` warmth pill (route through `pet/warmth.js`).

---

## 3. What should Calendar/Records actually store and display?

Today the calendar is **decorative** (4-state dot + one `daySummary` line,
`recentDays.js`). It must become a **functional day ledger.**

**Per-day record schema (proposed):**

```
DayRecord {
  date
  abstinenceState   clean | relapse | unknown     // core timer status that day
  streakDay         number                         // streak count at that day
  keptCount, missedCount, heldCount                // discipline tallies
  failureReason?    text                           // why (relapse or rule miss)
  triggers?         tag[]                          // what triggered (editable tags)
  reflection?       text                           // reflection diary
  nextAction?       text                           // next-time commitment
  badges            [reflected, routineDone, nextActionWritten]
}
```

**Tap a date → detail sheet** showing all of the above (not just a dot).

**Range selector (Q6):** `최근 7일 / 최근 14일 / 최근 30일 / 이번 달`. The strip stays
the 7-day default on Home; the full Records screen offers the selector.

Tone constraint stays: dots are a warmth spectrum — never red, never binary green,
never a failure marker (relapse days render as a dimmed/“다시 시작한 날”, not a red X).

---

## 4. Difference between the states

| State / badge | Selectable? | Means | Consequence |
|---|---|---|---|
| **지켰어요** (`kept`) | yes | Rule kept today. | Counts toward consistency. |
| **못 지켰어요** (`missed`) | yes | Rule failed today. | Opens failure reflection. Does **not** reset the abstinence timer. |
| **위기였지만 버텼어요** (`held`) | yes | Urge/risk moment, did **not** fail. | A win. Optional trigger + coping log. |
| **(unrecorded)** | — (default) | Not yet recorded today. | No rendered label; shows the 3 buttons unselected. |
| **복기 완료** (`reflected`) | no — badge | A reflection/next-action was written. | Earned, layered on `missed`/`held`. |
| **회복 루틴 완료** (`routineDone`) | no — badge | A recovery routine was completed. | Earned. |
| **다음 행동 작성 완료** (`nextActionWritten`) | no — badge | A next-action commitment was written. | Earned. |

This removes the prototype's three confusions: (a) `지켰어요` vs `해당 없음`
overlap — `해당 없음` is gone; (b) `흔들렸어요` ambiguity — split into a *failure*
(`못 지켰어요`) and a *win* (`위기였지만 버텼어요`); (c) `회복 완료` being directly
pickable — it is now an earned badge, not a state you can assert without doing the work.

---

## 5. Should `해당 없음` be renamed to `상황 없음`, or removed?

**Removed.** Neither `해당 없음` nor `상황 없음` appears in the primary user-facing
status model. They are semantically unclear and overlap with "kept" and "unrecorded."
A skip concept, if ever required, becomes a **secondary `오늘 기록 건너뛰기` action**,
not a status. (Currently `not_applicable` / `오늘은 해당 없음` lives at
`discipline.js:20,39,55` and in `CHECKIN_TAP` — all to be deleted.)

---

## 6. How should the failure reflection diary work?

Triggered in two places, same form, different weight:

- **Rule slip (`못 지켰어요`)** → *light* reflection (optional but nudged).
- **Relapse (timer reset)** → *mandatory* reflection before continuing.

Form is low-friction (≤ 3 short prompts, mostly taps + short text), writes to that
day's `DayRecord`, and earns `복기 완료`. The existing **Recovery screen is
repurposed into this reflection flow** (it is currently a generic recovery action,
which duplicates the idea without capturing the data).

---

## 7. How should the user write why / trigger / next-time?

Three prompts, in order:

1. **왜 그랬을까요?** (why) — short free text. Non-judgmental framing; no
   `실패/위반` vocabulary.
2. **무엇이 계기였어요?** (trigger) — multi-select from the user's **editable tag
   set** (same tags as discipline categories, §8) + optional free text.
3. **다음엔 어떻게 해볼까요?** (next time) — short free text → earns
   `다음 행동 작성 완료`.

All optional individually, but writing any of them earns the relevant badge. Reuses
the `CheckinScreen` mood/trigger/urge capture machinery (`CheckinScreen.jsx:4–20`)
rather than inventing a new one.

---

## 8. How should user-created Discipline categories work?

Today categories are a **fixed const** (`DisciplineScreen.jsx:10`,
`['밤 시간','충동','검색','SNS/숏폼','수면']`) and the Check-in triggers are a
*separate* fixed list (`CheckinScreen.jsx:11–18`). Both should become **one
user-editable tag set:**

- User can **add / rename / delete** their own tags.
- The seed list becomes **suggestions**, not a cage.
- The **same tag set is reused** as failure/near-failure triggers (§7), so "밤 시간"
  means a concrete user-owned category, not an opaque built-in. This resolves the
  "`늦은 밤 시간` is unclear" complaint — it is only meaningful when attached to a
  user event/category.
- P0.1 minimum: free-text custom tag + seed suggestions; full management UI can be P1.

---

## 9. Which screens stay P0.1, which merge or defer?

| Screen | Disposition | Rationale |
|---|---|---|
| **Home** | **Keep, refocus** | Timer hero + entries (§2). |
| **Discipline (나의 규율)** | **Keep** | Becomes the **single** daily 3-state status surface + editable categories. |
| **Check-in** | **Merge / demote** | Its rule-status step (`CHECKIN_TAP`, `CheckinScreen.jsx:122–150`) **duplicates** Discipline with a *different* option set. Kill the duplicate model; keep mood/trigger/urge capture as input to the reflection flow, not a parallel status path. |
| **Recovery** | **Keep, repurpose** | Convert from generic recovery action → the **reflection diary** (§6). Not a duplicate once it captures why/trigger/next. |
| **Urge (충동 멈추기)** | **Keep** | Feeds `위기였지만 버텼어요` + coping log. |
| **Calendar/Records** | **Keep, upgrade** | Make functional: day-detail + range selector (§3). |
| **PetReward** | **Keep, demote** | Support layer; defer claim-model wiring (domain-review flag E). |
| **Ranking/Social** | **New (teaser only)** | P0 visible teaser (§10). |

Net: no screen is deleted; two are **repurposed** (Recovery → reflection; Check-in
status step → merged into Discipline), one is **added** (social teaser), one is
**upgraded** (Records).

---

## 10. How should Ranking/Social be positioned?

**Hard constraint first:** §0.5.8.1 forbids `랭킹 · 등급 · 점수 · 강등 · 순위` in
**user-facing text.** The ranking concept must therefore ship **without those
words** — framed as *companionship / shared battle*, not competition.

- **P0 — visible teaser, non-functional.** "지금 N명이 함께 버티고 있어요" style
  presence; anonymized; no real leaderboard. Builds the "others are fighting too"
  feeling. Copy uses companionship framing only.
- **P1 — functional accountability.** Streak-based, anonymized handles, opt-in.
  Still expressed as "같이 가는 사람들" — never `랭킹/등급/점수`.
- **P2 — league / pet-battle / deeper social.** The competitive/league layer and any
  pet-vs-pet mechanic.

**Action item:** if the product genuinely needs competitive ranking, COPY_POLICY /
§0.5.8.1 must be **explicitly amended** to define which (if any) ranking words are
permitted and how. Until then, treat all four words as forbidden and build the
presence layer with companionship copy.

---

## 11. Which current P0.1 source changes to KEEP

These are sound and should survive the revision:

- **Single-source discipline pattern** (`discipline.js` centralizes labels/summary;
  every screen consumes it). Keep the *architecture* even as the enum changes.
- **Abstinence timer card + `formatElapsed`** (`HomeScreen.jsx:10–60`). Keep the
  component; rewire to a real reset.
- **Calendar cleanup** — forbidden words already removed (`잔불 캘린더 / 조용해진 날 /
  P1 / 보기 전용` gone). Keep.
- **Records scaffold** (`recentDays.js`: `buildRecentDays`, `daySummary`, 4-state).
  Keep; extend to the full `DayRecord` schema (§3).
- **Live Home discipline summary wiring** (`HomeScreen.jsx:116–141`). Keep.
- **Recovery plumbing** (`onStartRecovery / onCompleteRecovery / recoveringRuleId`
  in `App.jsx`). Keep the wiring; refocus the content.
- **Per-rule status mechanism** (pill button + sheet, `DisciplineScreen.jsx`). Keep
  the mechanism; change the options.
- **Domain docs** (`DOMAIN_ARCHITECTURE.md`, `REVIEW_CHECKLIST.md`, `SKILL_LOG.md`).

---

## 12. Which current P0.1 source changes to REVISE before commit

- **Discipline state model** — remove `not_applicable`; replace `shaken` with
  explicit `missed` + `held`; demote `recovered` to a badge set; replace
  `needs_check` with non-rendered `unrecorded`. (`discipline.js:15–56`,
  `DisciplineScreen.jsx` StatusSheet/`STATUS_ORDER`, `CHECKIN_TAP`.)
- **Delete all user-facing `해당 없음 / 오늘은 해당 없음`** (`discipline.js:20,39,55`).
- **Replace `흔들렸어요` copy** with `못 지켰어요` / `위기였지만 버텼어요` per context
  (`discipline.js`, `HomeScreen.jsx:124–128`, `CheckinScreen.jsx:119`,
  `DisciplineScreen.jsx`).
- **Kill Check-in's duplicate status path** (`CHECKIN_TAP`); route the daily check
  through the one Discipline model.
- **Repurpose Recovery → reflection diary** (why/trigger/next + badges).
- **Make Calendar functional** — day-detail sheet + range selector (§3).
- **Wire relapse → timer reset**; remove the hardcoded `12 / 27` streak card
  (`HomeScreen.jsx:71–81`); derive streak from the real run.
- **Editable discipline categories** (`DisciplineScreen.jsx:10`) + unify with
  Check-in triggers (`CheckinScreen.jsx:11–18`).
- **Add social presence teaser** (compliant copy, §10).
- **Room-warmth single source** (flag B) — route both strings through `pet/warmth.js`.
- **`summarizeRules` consistency weights** — rework for the new states (depends on a
  PRD §0.5.10 amendment, §13).

---

## 13. Which docs need patching before source implementation continues

**Prerequisite — PRD is LOCKED and now conflicts with the refocus.** A controlled
PRD amendment must happen **before** the source revision, because the new model
contradicts the locked spec:

- **PRD §0.5.9.1** — state model: 3 selectable states + post-action badges; remove
  `해당 없음`.
- **PRD §0.5.10** — consistency weights: the old `kept 1.0 / recovered 0.8 /
  needs_check 0.6 / shaken 0.4` no longer maps to the new states.
- **PRD** — add the **abstinence relapse-reset event** and the **`DayRecord`
  schema** (likely not yet specified).
- **PRD §0.5.8.1** — confirm/扩 the forbidden-vocab list drives the social copy;
  decide explicitly whether *any* ranking word is ever permitted (§10).
- **Spec Kit** — new/updated specs: timer + relapse, reflection diary, records
  day-detail + range, social teaser, editable categories.

**Project docs (this repo, lower friction):**

- **DOMAIN_ARCHITECTURE.md** — add domains: `abstinence` (timer/streak/relapse),
  `reflection` (복기 diary; absorbs the repurposed Recovery), `social`
  (presence/ranking). Re-map screens accordingly.
- **REVIEW_CHECKLIST.md** — add: no `해당 없음/상황 없음`; 3-state integrity; badges
  are post-action only; timer-reset correctness; `DayRecord` completeness; social
  vocab compliance (no `랭킹/등급/점수/순위/강등`).
- **COPY_POLICY.md / UX_RULES.md** — companionship framing for social; non-shaming
  relapse copy.
- **SKILL_LOG.md** — log this refocus as a dated entry.

> None of these are edited in this round — this memo only **lists** them. Per the
> product owner's instruction: do not edit PRD or other source/docs yet.

---

## 14. Recommendation on the uncommitted P0.1 diff

**Revise before commit. Do not commit as-is. Do not discard.**

- **Not as-is:** the diff still ships `해당 없음`, a `흔들렸어요`-only soft model with
  no real failure state, a directly-selectable `회복 완료`, a duplicate Check-in
  status path, a decorative calendar, a seed timer with no relapse reset, and no
  reflection/social. Committing it would lock in the exact confusions this refocus
  exists to remove.
- **Not discarded:** ~half the diff is keepable scaffolding (§11) — the timer
  component, records model, single-source pattern, calendar cleanup, recovery
  plumbing. Throwing it away would be waste.
- **Path:** (1) amend PRD/spec for the new model (§13 prerequisite); (2) revise the
  source per §12; (3) then commit one coherent P0.1 that matches the locked-again
  spec. Behaviour-vs-structure separation from the domain review still holds: do the
  state-model + reflection + records behaviour first, defer the `domains/` physical
  move to its own commit.
