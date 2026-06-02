# NoF — Skill / Review Log

Running log of structured reviews and refactor decisions. Newest first. Each
entry records what was examined, what was found, and what was decided — so a
later session can recover the reasoning without re-deriving it.

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
