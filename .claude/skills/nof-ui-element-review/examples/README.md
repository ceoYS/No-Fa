# NoF Review — example output formats

Templates for the artifacts a NoF UI honesty review produces. Copy a shape, fill it
with real findings grounded in source. Procedure: [RUNBOOK.md](../RUNBOOK.md).
Rules: [KNOWLEDGE.md](../KNOWLEDGE.md).

These examples use **abstract, safe placeholders only** — no real adult URLs and no
explicit terms ever appear in a review artifact.

## Example 1 — Screen claim audit

> **Surface & purpose** — Pet room (`src/screens/PetRewardScreen.jsx`). A calm
> reward space after a streak milestone; the user arrives proud but fragile.
>
> **Elements reviewed** — room scene image · snack/feed button · inventory sheet ·
> "배치 계획" mode entry · shop sheet · sound toggle.
>
> | Element | Claim it implies | Class | Evidence | Verdict |
> |---------|------------------|-------|----------|---------|
> | Room scene | "your cat's room" | real | composite image, guard #28 | OK |
> | Feed button | hands snack to cat | real (hand-off) | guards #13, #25 | OK |
> | 배치 계획 entry | "plan item placement" | placeholder | guards #5, #24 | OK |
> | Sound toggle | sound on/off | gated | hidden until `hasSound`, guard #33 | OK |

## Example 2 — Protected-rule violation finding

> **[P0] Pet room — feed button implies the cat ate**
> - **Element:** feed confirmation toast, `PetRewardScreen.jsx`.
> - **Claim class:** unsafe overclaim.
> - **Issue:** toast claims an eating action with no animation / sound / state
>   behind it.
> - **Rule violated:** protected rule 3 / prime directive (no pet eating claim).
> - **Triggering aspect:** 16 (pet interaction honesty).
> - **Guard:** would fail #6 (banned eating token) and #13 (honest hand-off copy).
> - **User impact:** breaks trust at a fragile moment; the product lied.
> - **Fix:** revert to the hand-off copy "간식을 고양이 곁에 놓아두었어요."
> - **Scope:** one string in `PetRewardScreen.jsx`.

## Example 3 — PASS / CAUTION / FAIL summary

> **Review summary — Shield surfaces (3 screens)**
>
> | Surface | Result | Note |
> |---------|--------|------|
> | Shield planner | **PASS** | non-enforcing banner present; abstract signals only |
> | Safe Browser PoC | **PASS** | opens nothing; a match routes to 잠깐 멈춤 |
> | Extension boundary screen | **CAUTION** | honest, but add managed-Chrome policy caveat |
> | (hypothetical) "사이트를 차단하고 있어요" badge | **FAIL** | P0 fake blocking claim — remove |
>
> **Gate:** `npm run build` PASS · `npm run check:nof` PASS (all guards green) ·
> `git status` reviewed. Visual / mobile QA: **unverified** (manual pass needed).
>
> **Recommended order:** fix the one FAIL (remove the fake badge) → address the
> CAUTION caveat → re-run the gate.
