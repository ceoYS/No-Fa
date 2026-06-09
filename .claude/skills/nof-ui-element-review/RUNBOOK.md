# NoF Review Runbook — how to run a review

The repeatable procedure for a NoF UI honesty review. For *what is true* and the
protected rules, see [KNOWLEDGE.md](./KNOWLEDGE.md). For output templates, see
[examples/README.md](./examples/README.md).

## The procedure (run in order, per surface)

Work **screen by screen**, and within each screen, **element by element**. A
screen passes only when every element passes.

1. **Identify the screen / route / component.** Name the exact file(s): the screen
   under `src/screens/`, the components it renders, the constants it pulls from. A
   review with no file paths is a vibe, not a review.
2. **List the visible claims.** Enumerate every element (card, label, chip, input,
   primary button, secondary button, empty state, sheet) and write down what each
   one *implies* to the user ("this blocks sites," "the cat ate," "drag to place,"
   "sound is playing").
3. **Classify each claim.** Tag every claim as one of:
   - **real** — backed by working code;
   - **mock** — sample/seed data shown as if real;
   - **placeholder** — honestly labelled 준비 중 / 배치 계획 / 미리보기;
   - **unsafe overclaim** — implies a capability that does not exist (a lie).
4. **Compare each claim against the implementation.** Read the component source,
   its constants, and the regression script. Trust the source, not docs — docs can
   be stale (see [GOTCHAS.md](./GOTCHAS.md)).
5. **Check the protected rules.** For each element, restate which of the protected
   honesty rules in [KNOWLEDGE.md](./KNOWLEDGE.md) it is exposed to, and confirm
   pass/fail with evidence from the source.
6. **Check the regression guards.** For every honesty-relevant element, note
   whether a guard in `scripts/nof-regression-check.mjs` already pins the honest
   behavior. If none does, propose one — do not silently rely on a human noticing.
7. **Produce severity-ranked findings.** One finding per problem, tagged
   P0 / P1 / P2 (scale in [SKILL.md](./SKILL.md)), with element, issue, triggering
   aspect, user impact, suggested fix, and implementation scope.
8. **Require build / check evidence before "done."** No "working" claim ships
   without `npm run build` (PASS), `npm run check:nof` (PASS), and a real look at
   `git status` / `git diff`. Intent is not evidence.

## The 22 review aspects

For each element, walk all 22 in order. Most elements trigger only a few — that is
fine; the point is you *considered* all 22 and can say why the rest do not apply.
Record a finding only when there is something to fix or protect.

1. **User goal** — what is the person trying to accomplish on this element right
   now? Does it move them toward it, or sideways?
2. **User emotional state** — often someone mid-urge, post-relapse, ashamed, or
   exhausted. Does the element meet that with calm, or add pressure?
3. **Screen purpose** — what is this screen's single job? Does this element serve
   it, or is it noise?
4. **Information hierarchy** — is the most important thing the most prominent?
5. **Primary CTA clarity** — exactly one obvious primary action, unmistakable in
   label, weight, and position?
6. **Secondary action clarity** — secondary/escape actions present but visually
   subordinate, never competing with the primary?
7. **Copy tone** — Korean, premium, warm, plain. No jargon, no stage labels
   (P0/MVP/프로토타입) in user-facing copy, no cold system voice.
8. **Non-shaming language** — no 위반/벌점/실패자/강등/랭킹/점수 or any blaming word.
   Relapse is 다시 시작, never failure. 규율 = "the standard I set."
9. **Button affordance** — does a thing that looks tappable do something? Disabled
   states visibly disabled, not just inert? No dead switches.
10. **Touch ergonomics** — targets reachable and large enough for a one-handed
    thumb? Destructive/escape actions out of the accidental-tap zone?
11. **State feedback** — when the user acts, does the UI acknowledge it (selection,
    pressed, added, saved)? Selection both visual and accessible (`data-selected`
    + `aria-pressed`)?
12. **Empty / loading / error states** — calm written-out empty state? Loading and
    error states that do not pretend success?
13. **Motion honesty** — if something appears to animate, does real motion exist?
    No fake motion tokens, no implied animation that is not there.
14. **Audio honesty** — if sound is implied, does it actually play, and is the
    fallback silent (never a fake "playing" state)? Audio is gesture-gated.
15. **Drag / placement honesty** — if the UI implies dragging or placing, is drag
    truly wired? If not, it must read **배치 계획** / **배치 미리보기**, never real
    placement. (Protected rules 1 & 2.)
16. **Pet interaction honesty** — no claim the cat ate, moved, or reacted unless
    real animation/sound/state backs it. Feeding is "간식을 곁에 놓아두었어요," never
    "고양이가 먹었어요." (Protected rule 3.)
17. **Shield safety honesty** — Shield must not claim it blocks real adult sites
    yet (rule 4); no real adult URLs/terms in the repo (rule 5); never ask the user
    to search/paste risky sites (rule 6). The in-app planner carries its
    not-enforced banner; only the extension blocks the harmless test token.
18. **Accessibility** — real semantics: roles, `aria-label`/`aria-pressed`, dialog
    semantics + Esc for sheets, meaningful or intentionally-empty `alt`, focus
    order, contrast. Selection conveyed by more than color.
19. **Commercial polish** — does this feel like a paid premium product: spacing,
    alignment, consistent components, no debug affordances in the user path?
20. **Benchmark alignment** — matches best-in-class calm/health apps (one clear job
    per screen, generous whitespace, restrained color) and the product's 8 pillars
    (see [KNOWLEDGE.md](./KNOWLEDGE.md)).
21. **Regression check coverage** — is the honest behavior protected by a check in
    `scripts/nof-regression-check.mjs`? If a finding is about honesty, note whether
    a guard exists and propose one if not.
22. **Build / check evidence before success** — never call a change done without
    `npm run build`, `npm run check:nof`, and a real `git status` / `git diff`.

## Output format for a review

Structure each surface as:

- **Surface & purpose** — what the screen is for, and the user's emotional state on
  arrival.
- **Elements reviewed** — the enumerated list of elements judged.
- **Findings** — one row per finding: element · issue · triggering aspect(s) ·
  severity · user impact · suggested fix · implementation scope.
- **What must not be faked here** — the protected rules in force on this surface and
  the honest current behavior to preserve.
- **Regression ideas** — checks that would lock the honest behavior in.

Close the whole document with a **recommended implementation order** (sequenced by
severity and dependency) and a reminder of the verification gate
(build + check:nof + git evidence) before any "done" claim.

## The verification gate (non-negotiable)

```
npm run build        # must PASS
npm run check:nof    # must PASS (every guard green)
git status --short   # real look — know exactly what changed
git diff             # read it; do not assume
```

No "done," no "working," no "fixed" before all four. Intent is not evidence.
