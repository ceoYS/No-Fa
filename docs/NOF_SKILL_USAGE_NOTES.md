# NoF — Skill Usage Notes (commercial-review QA pass)

Branch: `wip/pet-room-scene-mode`. This file records which assistant skills /
tools were considered for the commercial-readiness QA pass and why, per the safe
skill-discovery rule (repo-local only, no global installs, no hooks that mutate
git/credentials/network/system, no secrets).

## Discovery result

No repo-local custom QA/design skill exists under `.claude/skills` (only an
unrelated `harness` meta-skill and `settings.local.json`). No `impeccable`,
`find-skills`, `skills-search`, or visual-regression skill is installed in this
repo. No external skill was installed — network/global install was intentionally
avoided.

## Skills / tools considered

| Skill / tool | Considered for | Decision |
|---|---|---|
| `code-review` (built-in) | Diff-level correctness + reuse review of safe fixes | Available; used as a manual mental model for the invariant checks (Phase 4). Not auto-run to avoid scope creep / cosmetic churn. |
| `simplify` (built-in) | Quality-only cleanup of changed code | Held — risk of cosmetic churn the goal forbids. Not used. |
| `verify` / `run` (built-in) | Launch app + observe behavior | Held — needs a browser session; the manual browser pass is delegated to `docs/PET_ROOM_REVIEW_CHECKLIST.md` instead. |
| `mcp__mobbin__search_screens` | Reference patterns for mobile UI hierarchy | Considered as read-only reference; not invoked — no new assets/designs are being generated this pass (hard rule: no image asset changes). |
| Figma / Canva MCP | Design generation | Rejected — would create/replace visual assets, forbidden by hard rules. |
| `caveman:cavecrew-reviewer` | Compressed diff review | Available; inline review used instead for a small, well-scoped diff. |

## How QA was actually done

Manual source audit of every screen/component/constant in `src/`, cross-checked
against `docs/NOF_SCENE_MODE_GUARDRAILS.md`, `docs/COPY_POLICY.md`, and the PRD
invariants. Findings recorded in `docs/NOF_COMMERCIAL_QA_BACKLOG.md`. Safe P0/P1
fixes applied directly; risky items marked HOLD with a reason.

No external skill was installed. No global config, git, credential, or network
mutation was performed by any skill.
