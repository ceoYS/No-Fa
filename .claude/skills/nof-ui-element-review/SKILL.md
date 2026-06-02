---
name: nof-ui-element-review
description: >
  Contextual, screen-by-screen, element-by-element UI/UX review for NoF (No-Fa),
  a premium Korean self-control / abstinence app. Use this BEFORE writing or
  changing any NoF UI, and whenever asked to audit a NoF screen, component, copy
  string, the pet room, the Shield surfaces, or the Chrome/Edge extension. Forces
  reviewing each element against 22 fixed aspects and 9 non-negotiable honesty
  rules so the product never fakes functionality and never shames the user.
---

# NoF UI Element Review

A discipline for reviewing NoF's interface the way the product itself asks users
to behave: slowly, honestly, one thing at a time, without pretending.

NoF is a premium Korean app for people practicing self-control (절제 / 자기통제 /
NoFap). Its users open it at their most vulnerable moments. A fake button, an
over-promised feature, or a single shaming word does real harm here. This skill
exists so that no UI change ships until every visible element has been judged in
the full context of the person looking at it.

## When to use this skill

Invoke this review **before** you write or edit any NoF UI, and any time you are
asked to:

- add, change, or remove a screen, component, sheet, card, button, or copy string;
- audit or critique an existing NoF surface;
- touch the pet room / cat reward loop, the Shield planner or Safe Browser, or the
  Chrome/Edge extension (popup, options, blocked page);
- decide whether something is "done" or "good enough to claim as working."

If you are about to change UI and you have **not** run this review for the
affected surface, stop and run it first.

## The prime directive (verbatim, non-negotiable)

> Do not fake functionality. Do not claim blocking, motion, sound, dragging,
> placement, safety, iOS/Android/SNS blocking, image/video mosaic, or pet eating
> unless it actually works.

Every other rule in this skill is a specific application of that one sentence. If
a finding ever conflicts with the prime directive, the prime directive wins.

## The 9 protected NoF rules (verbatim — never violate)

These are hard constraints. A review is incomplete until you have explicitly
checked the surface against every one of them that could apply.

1. Do not claim real drag if only preview/planning exists.
2. If drag is not truly supported, call it "배치 계획" or "배치 미리보기," not real placement.
3. Do not claim cat ate a snack unless there is real animation/sound/state support.
4. Do not claim Shield blocks real adult sites yet.
5. Do not add real adult URLs or explicit adult terms to the repo.
6. Do not ask the user to search risky sites.
7. Do not reset all counters when only one counter relapses.
8. Do not delete rules/discipline unless explicitly requested.
9. Keep copy Korean, premium, warm, and non-shaming.

When you write a review, restate which of these rules each surface is exposed to,
and confirm pass/fail with evidence from the actual source — not from docs, which
can be stale.

## How to run the review

Work **screen by screen**, and within each screen, **element by element**. Do not
review a screen as a vibe; enumerate its actual elements (each card, label,
chip, input, primary button, secondary button, empty state, sheet) and judge each
one. A screen passes only when every element passes.

For each element, walk all 22 aspects below in order. Most elements only trigger a
few aspects — that is fine. The point is that you *considered* all 22 and can say
why the others do not apply.

Ground every judgment in the real code. Read the component source, the constants
it pulls from, and the regression script (`scripts/nof-regression-check.mjs`)
before asserting that something works or is honest. If a policy doc and the code
disagree, trust the code and flag the doc as stale.

### The 22 review aspects

For each element, ask the question, then record a finding only if there is
something to fix or protect.

1. **User goal** — What is the person actually trying to accomplish on this
   element right now? Does the element move them toward it, or sideways?
2. **User emotional state** — Who is looking at this? Often someone mid-urge,
   post-relapse, ashamed, or exhausted. Does the element meet that state with
   calm, or does it add pressure?
3. **Screen purpose** — What is this screen's single job? Does this element serve
   that job, or is it noise that belongs elsewhere?
4. **Information hierarchy** — Is the most important thing the most prominent? Does
   the eye land where the user's goal is, not on decoration?
5. **Primary CTA clarity** — Is there exactly one obvious primary action, and is it
   unmistakable in label, weight, and position?
6. **Secondary action clarity** — Are secondary/escape actions present but visually
   subordinate, never competing with the primary?
7. **Copy tone** — Korean, premium, warm, plain. No jargon, no stage labels
   (P0/MVP/프로토타입) leaking into user-facing copy, no cold system voice.
8. **Non-shaming language** — No 위반/벌점/실패자/강등/랭킹/점수 or any word that
   blames. Relapse and missed days are framed as 다시 시작, not failure. 규율 means
   "the standard I set," never punishment.
9. **Button affordance** — Does a thing that looks tappable actually do something?
   Are disabled states visibly disabled, not just inert? No dead switches.
10. **Touch ergonomics / mobile thumb usability** — Are targets reachable and large
    enough for a one-handed thumb? Are destructive or escape actions out of the
    accidental-tap zone?
11. **State feedback** — When the user acts, does the UI acknowledge it (selection,
    pressed, added, saved)? Is selection state both visual and accessible
    (`data-selected` + `aria-pressed`)?
12. **Empty / loading / error states** — Does the element have a calm, written-out
    empty state? Loading and error states that don't pretend success?
13. **Motion honesty** — If something appears to animate, does real motion exist? No
    fake motion tokens, no implied animation that isn't there.
14. **Audio honesty** — If sound is implied, does it actually play, and is the
    fallback silent (never a fake "playing" state)? Audio is gesture-gated.
15. **Drag / placement honesty** — If the UI implies dragging or placing items, is
    drag truly wired? If not, it must be called **배치 계획** or **배치 미리보기**,
    never presented as real placement. (Rules 1 & 2.)
16. **Pet interaction honesty** — No claim the cat ate, moved, or reacted unless real
    animation/sound/state backs it. Feeding is "간식을 곁에 놓아두었어요," never
    "고양이가 먹었어요," until eating truly exists. (Rule 3.)
17. **Shield safety honesty** — Shield must not claim it blocks real adult sites yet
    (Rule 4). No real adult URLs or explicit terms in the repo (Rule 5). Never ask
    the user to search for or paste risky sites (Rule 6). The in-app planner must
    carry its not-enforced banner; the extension may only block the harmless test
    token.
18. **Accessibility** — Real semantics: roles, `aria-label`/`aria-pressed`, dialog
    semantics + Esc for sheets, meaningful or intentionally-empty `alt`, focus
    order, contrast. Selection conveyed by more than color.
19. **Commercial polish** — Does this feel like a paid premium product: spacing,
    alignment, consistent components, no debug affordances or placeholder cruft in
    the user path?
20. **Benchmark alignment** — Does it match the bar set by best-in-class calm/health
    apps (one clear job per screen, generous whitespace, restrained color), and the
    product's own 8 pillars (timer-first, multi-counter, rules linked to counters,
    non-shaming restart, 5-minute pause, recovery log, pet loop, Shield)?
21. **Regression check coverage** — Is the honest behavior of this element protected
    by a check in `scripts/nof-regression-check.mjs`? If a finding is about honesty
    (no fake motion, scoped relapse, no-delete, honest feed/placement/shield), note
    whether a guard exists and propose one if it does not.
22. **Build / check evidence before success claims** — Never call a change done
    without: `npm run build` passing, `npm run check:nof` passing, and a real look
    at `git status` / `git diff`. Claims of "working" require evidence, not intent.

## Severity scale

Tag every finding:

- **P0** — Breaks the prime directive or a protected rule (fakes functionality,
  shames the user, resets all counters on one relapse, deletes rules unbidden,
  adds risky URLs/terms, asks the user to find risky sites). Must fix before ship.
- **P1** — Real UX harm or confusion (unclear primary action, missing state
  feedback, broken hierarchy, inaccessible control, copy that reads cold) but not a
  directive violation. Fix soon.
- **P2** — Polish, consistency, minor copy, or nice-to-have. Fix when convenient.

## Output format for a review

When this skill produces a review document, structure each surface as:

- **Surface & purpose** — what the screen is for, and the user's emotional state on
  arrival.
- **Elements reviewed** — the enumerated list of elements judged.
- **Findings** — one row per finding: element, the issue, the triggering
  aspect(s), severity, user impact, suggested fix, implementation scope.
- **What must not be faked here** — the protected rules in force on this surface and
  the honest current behavior to preserve.
- **Regression ideas** — checks that would lock the honest behavior in.

Close the whole document with a **recommended implementation order** that
sequences fixes by severity and dependency, and a reminder of the verification
gate (build + check:nof + git evidence) before any "done" claim.

## Working rules while using this skill

- Review before you build. Reading is free; a shipped lie is not.
- Trust source over docs. Verify against the actual component and the regression
  script. Flag stale docs instead of believing them.
- Change nothing you were not asked to change. This skill is for review; do not
  refactor or restyle in passing. A tiny copy fix is the only edit acceptable
  during a pure-review round, and only if absolutely necessary.
- Honesty beats polish. If you cannot make a feature real this round, make its
  label honest (준비 중 / 배치 계획 / 잠깐 멈춤) rather than impressive.
- No shame, ever. When in doubt about a word, choose the warmer, plainer one.
