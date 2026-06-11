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
- Recurrence (same day, while writing the Records ledger): the SAME principle bit a
  second time from the other side — a NEW negative guard `!/…XMLHttpRequest…/` false-
  failed because `src/utils/storage.js`'s privacy comment NAMES "fetch / XMLHttpRequest
  / WebSocket" to promise it makes none. Generalized rule: when a guard asserts the
  ABSENCE of an API, match CALL-form (`fetch(`, `new WebSocket(`, `sendBeacon(`), never
  the bare word — honest disclaimers mention the very thing they forswear. Both halves
  of the lesson (writing copy AND writing guards) share one root: these checks scan raw
  source, comments included.

---

## 2026-06-11 — Vite dev server served STALE code during visual QA (drvfs watcher miss)
- Domain: QA / tooling (Records History Depth visual QA).
- What failed: the Records-history CDP QA reported the past-day check-in block missing
  (past=false, note=false) even though source + `check:nof` were correct. A localStorage
  probe showed the reloaded bundle had NO `checkinLedger` key at all — i.e. the dev
  server was still serving the pre-ledger App.jsx. Vite's file watcher on the Windows
  drive (`/mnt/d`, drvfs) had silently missed a later edit to an already-hot module, so
  HMR never applied it.
- Why it matters: this is the exact shape of a FALSE QA result — the gate "fails" (or
  worse, could "pass") against code that isn't what you committed. On this repo's
  `/mnt/d` mount, inotify/HMR is not trustworthy across multiple rapid edits to the same
  file.
- Detection: a 6-line localStorage probe driver (read `nof.mvp.state.v1` after reload,
  dump `checkinLedger` keys) — `hasLedger:false` proved the served code was stale.
- Fix: kill the vite listener by PID (`ss -tlnp | grep :PORT`) and restart `npm run dev`
  before re-running QA. After restart: past=true, note/mood/urge all true.
- Skill candidate: YES — QA runbook rule: "Before trusting a visual-QA run on this repo,
  RESTART the vite dev server (or hard-confirm the served bundle reflects HEAD via a
  localStorage/DOM probe). Never trust HMR freshness on `/mnt/d` (drvfs) — the watcher
  misses edits. A QA pass/fail against stale code is not a real result." Pairs with the
  prime directive: do not claim visual QA passed without evidence it ran on current code.

