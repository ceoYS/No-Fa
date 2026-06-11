# NoF Loop Failure Log (오답노트)

Compact record of real defects / repeated mistakes / domain-boundary issues hit
during the Fast Modular One-Day MVP Loop. One entry per finding. No filler — only
things that actually cost a loop iteration and are worth not repeating.

---

## 2026-06-11 — English banned-token ("eating") in a code comment trips global guard #6
- Domain: Pet / Character Growth (but root cause is repo-wide).
- What failed: `npm run check:nof` failed (`forbidden token(s): src/App.jsx:563 (eating)`)
  after adding a feedSnack comment that read "…never an eating/live-reaction claim."
  The honesty word was in a *comment*, not user-facing copy.
- Why it matters: check 6 ("no fake-motion / emoji-furniture / blob tokens in source")
  bans a token list — incl. the English `eating` and Korean `먹었`/`먹는`/`움직였`/`기지개`/`꼬리`
  — across the WHOLE source string, comments included. Describing what you are *not*
  doing with the banned word still fails the gate. Easy to burn a loop on.
- Detection: `npm run check:nof` → `[FAIL] no fake-motion … forbidden token(s): … (eating)`.
- Fix: reworded the comment to "never a consume or live-reaction claim" (the original
  feedSnack comment already used "consume", which is allowed). 49/49 after.
- Skill candidate: YES — add to `nof-ui-element-review` GOTCHAS: "When writing honesty
  disclaimers in code/comments, name the banned behaviour in Korean product-safe terms
  or neutral English (consume / hand-off / delivery), never the literal banned tokens
  from check 6 (eating / 먹었 / 먹는 / 움직였 / 기지개 / 꼬리 / 파도처럼). The guard scans the
  full source string, so even a negated mention fails." (Record only — do not create
  `.claude/skills` without explicit approval.)
