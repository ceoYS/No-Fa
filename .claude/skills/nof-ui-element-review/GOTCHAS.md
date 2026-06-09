# NoF Gotchas — traps learned the hard way

Things that have bitten this project. Read before you trust a doc, commit a file,
or test the extension.

## 1. Trust source code over stale docs
Docs (PRD, review notes, even this skill) can lag the code. When a doc and the
component disagree, the **code is authoritative** — verify the behavior in the
source and `scripts/nof-regression-check.mjs`, then flag the stale doc. Never
assert "it works" from a doc alone.

## 2. A company-managed Chrome may block the extension by policy
`extensions/chrome-shield` is a normal unpacked MV3 PoC. On a managed/work Chrome,
enterprise policy can block loading unpacked extensions entirely. That is
**expected**, not a bug — do not try to bypass or "work around" managed-browser
policy (it is also out of scope per the company-PC safety rules). State the
boundary honestly; recommend a personal machine for the real block test.

## 3. The Chrome extension `_metadata/` is generated drift — never commit it
Chrome writes `extensions/chrome-shield/_metadata/` (e.g. `verified_contents.json`)
when the unpacked extension is loaded. It is **generated**, machine-specific, and
must never be staged or committed. If it appears in `git status`, treat it as
pre-existing drift and exclude it.

## 4. The pet room is ONE composite image — placement stays blocked
The room is a single finished composite image (cat always visible), **not** a
background plus draggable item sprites. Item placement remains honestly disabled
until transparent item sprites exist and are approved (`spriteReady` stays false).
Any "drag to place" claim before then is an overclaim — use 배치 계획.

## 5. Snack feeding is an honest hand-off, not an eating animation
Feeding shows "간식을 고양이 곁에 놓아두었어요" and animates a small ember particle
travelling — it does **not** show the cat eating, and must never claim it did.
Eating / motion tokens are banned in source (guard #6).

## 6. localStorage is local-only but still writes to disk
NoF persists MVP state to `localStorage`: no server, no sync — but it does write to
the browser profile on disk. On a **shared or company PC, use dummy data only**.
Never type real personal abstinence data into a build on a machine you do not
control.

## 7. The v3/v4 Excel tooling matrix drift must not be staged
`references/tooling/claude_code_github_tools_project_matrix_kr_v3.xlsx` shows up as
modified in `git status` as pre-existing drift. Do **not** stage, commit, or "clean
up" the Excel matrix as a side effect of unrelated work. Exclude it.

## 8. Manual QA is still required for visual / mobile checks
`npm run build` and `npm run check:nof` are static guards — they prove invariants,
not that the screen *looks* right. Layout wrap, CTA overlap, overflow, thumb reach,
and mobile rendering still need a real browser pass. The sandbox browser has failed
to launch before (missing chromium); when it does, say visual QA is **unverified**
rather than claiming success.
