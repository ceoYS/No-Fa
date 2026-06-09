# NoF — Skill / Review Log

Running log of structured reviews and refactor decisions. Newest first. Each
entry records what was examined, what was found, and what was decided — so a
later session can recover the reasoning without re-deriving it.

---

## 2026-06-09 — Round 1-A: promote nof-ui-element-review to a folder-style skill package

**Trigger:** promote the single-file `nof-ui-element-review` skill note into a real
folder-style skill package, reflecting the v4 Excel tooling matrix and the "skills
are the moat" lesson (knowledge/procedure split, gotchas, eval seed). Docs / skill /
check-wiring only — no runtime feature change, no commit, no push.

**What changed (skill package only):**
- `SKILL.md` — slimmed to an entry point: overview, prime directive, when-to-use, a
  routing table to the new sub-files, the severity scale, and the working ethos. The
  description was refocused on triggering conditions (per skill-authoring guidance:
  describe *when to use*, not the workflow). No useful content was destroyed — the
  heavy reference moved into the sub-files below.
- `KNOWLEDGE.md` (new) — declarative knowledge: prime directive, the 9 protected
  rules verbatim, and each protected honesty rule (fake blocking · fake pet
  eating/motion/sound · adult URL/token collection · browser-policy bypass ·
  whole-counter reset · item placement before sprites · external data/API leak ·
  no-delete/non-shaming) mapped to its honest current behavior and its guard in
  `scripts/nof-regression-check.mjs`. Plus the localStorage privacy caveat, the
  Shield extension boundary, and the 8 product pillars.
- `RUNBOOK.md` (new) — the repeatable review procedure (identify → list claims →
  classify real/mock/placeholder/overclaim → compare to impl → check rules → check
  guards → severity findings → build/check evidence), the 22 review aspects, the
  output format, and the verification gate.
- `GOTCHAS.md` (new) — trust source over stale docs · managed-Chrome may block the
  unpacked extension by policy · `_metadata/` is generated drift (never commit) · pet
  room is one composite image (placement blocked until sprites) · feeding is an
  honest hand-off · localStorage writes to disk (dummy data on shared PC) · v3/v4
  Excel matrix drift must not be staged · manual visual/mobile QA still required.
- `examples/README.md` (new) — three output templates (screen claim audit,
  protected-rule violation finding, PASS/CAUTION/FAIL summary). Abstract placeholders
  only; no real adult URLs or explicit terms.
- `evals/honesty_fixtures.json` (new) — 8 abstract anti-pattern fixtures a future
  check should catch (fake pet eating · fake real blocking · fake audio · adult URL
  placeholder · whole-counter reset · placement without sprites · browser policy
  bypass · external data/API leak). Each fixture maps to the protected rule and the
  guard ids; safe placeholder tokens only — no real URLs, terms, or live endpoints.

**Knowledge / procedure split:** declarative "what is true / never fake" (KNOWLEDGE)
is now separate from procedural "how to run a review" (RUNBOOK), with SKILL.md as a
thin router — so a future session loads only the part it needs.

**Verification:** `npm run build` **PASS** (60 modules) · `npm run check:nof`
**39/39 PASS** (all guards green). This round adds no source change, so the guards
are unaffected; the JSON fixtures parse clean (8 fixtures).

**Deliberately NOT done this round (proposed Round 1-B):**
- Wire `check:nof` to load `evals/honesty_fixtures.json` and assert each fixture's
  anti-pattern is absent from source. `scripts/nof-regression-check.mjs` was left
  untouched on purpose; the fixtures are a seed, not yet an enforced gate.
- **Track the 5 new package files.** `.gitignore:2` ignores the whole `.claude/`
  tree, so `KNOWLEDGE.md`, `RUNBOOK.md`, `GOTCHAS.md`, `examples/README.md`, and
  `evals/honesty_fixtures.json` are currently git-ignored (`!!`) — only the
  already-tracked `SKILL.md` shows as modified. To version the package, force-add
  them next round (`git add -f …`), matching the precedent by which `SKILL.md` was
  first committed. Not done now: this round does not stage.

**Untouched / excluded:** no source/runtime change; `scripts/nof-regression-check.mjs`
unchanged; the v3 Excel tooling matrix drift and any
`extensions/chrome-shield/_metadata/` drift were treated as pre-existing and
excluded. No stage, no commit, no push.

---

## 2026-06-02 — Shield security, tooling-matrix, and UI-honesty reconcile

Four commits landed since the P0.1 review; each was verified with `npm run build`
(PASS) and `npm run check:nof` before commit. Newest first.

- **`ed39f09` fix: harden NoF Shield extension scope.** Removed the unused `storage`
  permission from the Chrome extension manifest and added guard **#35** (manifest
  least-privilege: permission allow-list = `declarativeNetRequest` only, no dangerous
  keys, no remote code / CDN / analytics, no adult terms, no blocked-target leak). Also
  fixed Shield copy `(Chrome 등)` → `(Chrome)`. A read-first security pass had found
  no P0/P1; the two P2 items (unused perm, copy over-hint) were fixed here. Evidence:
  build PASS, `check:nof` **35/35**.
- **`ea4c5a1` chore: add Claude Code tools matrix reference.** Committed only
  `references/tooling/claude_code_github_tools_project_matrix_kr_v3.xlsx` (11 sheets,
  59 tools / 14 projects). Read-only reference; no code touched. Company-PC holds in the
  matrix stand: agentmemory · Odysseus · claude-video · Remotion (held / banned).
- **`44da424` fix: make pet sound and crisis pause UI honest.** Resolved the two P1s
  from the UI element review: hid the pet-room 소리/무음 toggle until real audio is
  probed present (`usePetSound.hasSound`, guard #33), and moved the 5-minute 잠깐 멈춤
  crisis pause into the persistent bottom nav, routed to the real UrgeScreen (guard #34).
- **`06a2792` docs: add NoF UI element review skill and audit.** Added the git-tracked
  `.claude/skills/nof-ui-element-review/SKILL.md` plus `docs/NOF_UI_ELEMENT_REVIEW.md`
  (screen-by-screen honesty review — no P0, two P1 since fixed).

**Guard count:** `check:nof` moved 32 → 34 (sound toggle + crisis pause) → **35**
(Shield manifest least-privilege).

---

## 2026-05-29 — Domain-boundary review of the P0.1 catch-up diff

**Trigger:** before committing the P0.1 code catch-up, audit whether the diff
respects product/domain boundaries (vs. dumping code wherever a screen happened
to be). Docs-only review; no source edits, no commit, no push.

**Scope examined:** 8 tracked modified files + 1 new untracked constants dir.
Build state: 45 modules, clean. Diff: 553 insertions / 289 deletions.
Method: full import graph + business-logic grep (`setRuleStatus`, `startRecovery`,
`completeRecovery`, `claim`, `summarizeRules`, `calendarStateFromRules`, warmth
strings), cross-checked against the locked PRD §0.5 model.

**Verified dependency graph:**
- `App.jsx` → all screens + BottomNav + ScreenSwitcher (orchestration).
- `discipline.js` → no deps (leaf model). Consumed by HomeScreen, DisciplineScreen,
  CheckinScreen, and `recentDays.js`.
- `recentDays.js` → imports `summarizeRules` from `discipline.js` (the one
  sanctioned cross-domain edge: records → discipline).
- `EmberCalendarStrip.jsx` → imports `CALENDAR_LABEL` from `recentDays.js`
  (records constant inside a "shared" component).
- `EmberCat.jsx` → no domain deps (pet, clean). Its `tone` prop is a separate
  pet enum, not the calendar tone.

**Findings (5 boundary flags, all acceptable for P0.1, none blocking):**
1. **A —** recovery transition logic (`startRecovery`/`completeRecovery`) lives in
   `App.jsx:94–107`, i.e. recovery-domain rules in the orchestration layer.
2. **B —** Room Warmth ("방 온기") hardcoded as literal strings in two screens
   (`HomeScreen.jsx:145`, `DisciplineScreen.jsx:68`) with no pet-domain owner;
   highest-risk duplication (phrasings already diverge).
3. **C —** `EmberCalendarStrip` filed under `components/` but is a records view
   (imports a records constant).
4. **D —** `records → discipline` import edge — sanctioned, recorded so it stays
   one-way.
5. **E —** reward claim model trapped in `PetRewardScreen` component state.

**Positive finding:** discipline status logic is **not** duplicated — the 5-state
was centralized in `discipline.js`; every screen consumes it. The primary risk
the review was guarding against was already avoided.

**Decisions:**
- **Move nothing in the P0.1 diff.** Keep it a pure behaviour catch-up. The two
  new constants files stay in `src/constants/` for now (correct domain, cosmetic
  folder).
- **Defer structure to a dedicated post-merge refactor commit** that creates the
  full `src/{app,domains/*,shared}` tree at once and fixes flags A–C, E in one
  reviewable pass. Behaviour first, structure second, never interleaved.
- Documented the target architecture + dependency rules in
  [DOMAIN_ARCHITECTURE.md](./DOMAIN_ARCHITECTURE.md) and a reusable boundary
  guard in [REVIEW_CHECKLIST.md](./REVIEW_CHECKLIST.md).

**Out of scope / untouched:** `docs/ACQUISITION_POSITIONING_BENCHMARK.md`,
`design_outputs/claude_design_v3/*.html`, locked PRD + Spec Kit, binaries.

**Open follow-ups:**
- Approve + run the deferred `domains/` refactor after P0.1 merges.
- `ScreenSwitcher` still carries dev-harness labels ("NoF · P0 prototype",
  "시각 탐색 전용 프로토타입") — out of P0.1 scope, flagged for cleanup.
- Requirement-8 layout checks (wrap/CTA/overlap/overflow) remain **unverified**:
  the sandbox browser failed to launch (chromium executable missing), so visual
  QA could not run. Needs a manual pass in a real browser.
