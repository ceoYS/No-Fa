# NoF ChatGPT Packet — C2 Recovery Read-back

## Goal
Add a focused post-routine "today recovery reflection" read-back after the C1 crisis routine.
Domain-scoped to the crisis flow only.

## Commits
- Starting commit: 882138d
- Final product commit: a52f82b — feat: add NoF recovery readback
- Push range: 882138d..a52f82b  (wip/pet-room-scene-mode only)

## Changed files (3 — C2 product commit a52f82b, +112 / -29)
- src/screens/UrgeScreen.jsx        — step-5 of the routine is now the recovery read-back
- src/styles/components.css         — `.recap-list` (ember-dot summary list)
- scripts/nof-regression-check.mjs  — guard #52 disclosure assertion updated + new guard #53

## Product behavior added
- Completing the 5-step crisis routine now lands on a "위기 루틴 완료" read-back:
  - "방금 해낸 것" summary of the real actions: 5분 위기 루틴을 끝냈어요 / 자극에서 한 걸음
    떨어졌어요 / 안전한 대체 행동을 골랐어요 — <the replacement the user actually picked>.
  - Honest disclosure: "세부 단계 진행은 저장하지 않아요. 마치기를 누르면 오늘 완료로 기록돼요."
  - Real next actions: 완료했어요·마치기 → reward (records once/day via existing onCrisisHeld);
    체크인으로 이어가기 → check-in screen; 다시 하루로 돌아가기 → home.
- Korean copy only; self-control tone; 절제 vocabulary; no 금욕.

## Honest limitations (no overclaim)
- Crisis-routine STEP progress is NOT persisted (in-memory only) — disclosed on screen.
- The only durable signal is the existing once-per-day crisis completion (crisisRewardDay),
  recorded when the user presses 마치기 (onCrisisHeld). Exiting via 체크인/홈 does not record it,
  and the copy does not claim it does.
- No new persistence model, no new dependency, no fake analysis/AI/medical/video/audio.
- No record-dot label work (R-14) and no font work (R-9).

## Build result
- `npm run build` (vite) — PASS, exit 0 (fresh, immediately before commit).

## check:nof result
- PASS — 53/53 (was 52; +1 = new guard #53 for read-back honesty; guard #52's disclosure
  assertion was updated to the new C2 copy, count unchanged by that edit).
- Red-green verified: breaking the shared disclosure → #52 AND #53 fail (51/53); breaking the
  read-back next-action route → #53 fails (52/53); restored → 53/53.

## Browser QA method/result
- PASS (visually verified). WSL Chromium libnss-blocked / Playwright MCP cannot launch Linux
  Chrome, so QA used Windows Chrome (headless=new) over raw CDP from Windows node
  (--experimental-websocket), mobile 390x844, against the fresh `vite preview` build.
- Verified end-to-end: Home → 잠깐 멈춤 → routine steps 1–5 (step-4 pick gating intact) →
  read-back shows summary + picked replacement (물 한 잔 마시기) + both disclosures + all three
  next actions; 완료했어요·마치기 → reward (잔불 조각 visible); 체크인으로 이어가기 → check-in
  (오늘 기분 visible). Rendered-DOM 금욕 scan across these routes: false (none).
- Screenshots (Windows temp): nof-qa-c2-1-readback.png, nof-qa-c2-2-after-marchigi-reward.png,
  nof-qa-c2-3-after-checkin-route.png (C:\Users\HDEC\AppData\Local\Temp). Korean rendered via
  Windows Malgun fallback, no tofu.

## Residual vocabulary result
- No new user-facing 금욕. "금욕 카운터" remains only in docs (refocus memo / shield spec /
  benchmark review). Product source 금욕 = only the pre-existing comment src/App.jsx:372.

## R-9 / R-14 untouched
- R-9 font self-host: untouched (HOLD). R-14 record-dot label: untouched (frozen). Diff confirms
  no tokens.css / recentDays / CalendarScreen / NOF_R14 changes.

## Final git status
```text
## wip/pet-room-scene-mode...origin/wip/pet-room-scene-mode
?? docs/run-logs/NOF_CHATGPT_PACKET_C2_RECOVERY_READBACK_20260611_153808.md
```

This packet is intentionally left UNTRACKED. Do NOT create a second docs commit in this run —
seal it separately next turn (docs-only run-log commit).

## Next recommended GOAL
Seal this C2 packet as a docs-only run-log commit, then pick the next domain-scoped product
slice. R-9 (font self-host) stays HOLD and R-14 (record-dot label) stays frozen until the
product-owner decision; prefer a slice that needs no external input.
