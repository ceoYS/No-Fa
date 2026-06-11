# NoF ChatGPT Packet — C1 Crisis Routine Flow

## Goal
Ship C1 as one domain-scoped product sprint: a Crisis Button 5-minute alternative-activity
vertical slice — an honest guided routine inside the existing 잠깐 멈춤 (UrgeScreen).

## Commits this run
- Run baseline HEAD/origin: 78eab8f
- Phase-0 docs seal (leftover packet, docs-only): 77cc672  (push 78eab8f..77cc672)
- C1 product sprint: edc305d  (push 77cc672..edc305d)
- Starting commit for C1: 77cc672
- Final commit: edc305d

## Changed files (C1 product commit edc305d — 3 files, +217 / -30)
- src/screens/UrgeScreen.jsx   — guided 5-step routine view added (breath + alt views preserved)
- src/styles/components.css     — `.btn:disabled` style (gates step-4 "다음" until a pick)
- scripts/nof-regression-check.mjs — guard #52 protecting C1 honesty invariants

## Product behavior added
- New entry "5분 루틴 따라가기" on the crisis screen (잠깐 멈춤, already in bottom nav + Home CTA).
- A guided 5-step routine, one step at a time, with a step counter + progress bar:
  1. 숨 고르기 (breathe / reset)
  2. 자극에서 한 걸음 떨어지기 (leave the trigger context)
  3. 몸을 짧게 움직이기 (short physical action)
  4. 짧은 대체 행동 하나 고르기 (choose one safe replacement — reuses the 4 real ALT_ACTIONS;
     "다음" is disabled until a choice is made)
  5. 여기까지 잘 왔어요 (modest honest confirmation) → "완료했어요 · 마치기"
- Completion delegates to the EXISTING once-per-day onCrisisHeld grant → routes to the reward
  screen. No new reward path; cannot farm 잔불 조각.
- Korean copy only; tone is self-control recovery (no shame / punishment / religious / medical).
- Vocabulary policy kept: 절제 카운터, no user-facing 금욕.

## Honest limitations (no overclaim)
- The routine is honest text/action guidance only — NO video, NO audio, no fake media.
- Routine step progress is NOT persisted. The screen explicitly discloses this:
  "이 화면을 벗어나면 단계 기록은 남지 않아요." The only thing that persists is the existing
  once-per-day crisis-held marker (via onCrisisHeld) — unchanged by this slice.
- No new dependency added. No change to R-9 (font self-host, still HOLD) or R-14 (record-dot
  label, still frozen).

## Build result
- `npm run build` (vite) — PASS, exit 0 (verified fresh immediately before commit).

## check:nof result
- PASS — 52/52 checks passed (was 51; +1 = new guard #52 for C1).
- Guard #52 red-green verified: removing the no-durable-history disclosure → 51/52 FAIL;
  restored → 52/52 PASS (file restored, diff confirmed identical).

## Browser QA result
- PASS (visually verified). WSL Chromium is libnss-blocked and Playwright MCP could not launch
  a Linux Chrome, so QA used the proven path: Windows Chrome (headless=new) driven over raw CDP
  from Windows node (--experimental-websocket), mobile 390x844, against the FRESH production build
  served by `vite preview` (avoids the known drvfs dev-watcher staleness).
- Automated walkthrough verdict: QA_VERDICT PASS. Confirmed: Home → 잠깐 멈춤 → routine entry
  visible → steps 1..5 render → step-4 "다음" disabled before pick / enabled after pick →
  disclosure present on step 5 → "완료했어요 · 마치기" routes off the routine to the reward screen.
- Screenshots (Windows temp, 390x844): nof-qa-1-home.png, nof-qa-2-urge-breath.png,
  nof-qa-3-routine-step1.png, nof-qa-4-routine-step4-replace.png, nof-qa-5-routine-step4-picked.png,
  nof-qa-6-routine-step5-done.png, nof-qa-7-after-complete.png
  (dir: C:\Users\HDEC\AppData\Local\Temp). Korean rendered via Windows Malgun fallback, no tofu.

## Residual vocabulary result
- No new user-facing 금욕. Only match in product source is the pre-existing code COMMENT
  src/App.jsx:372 ("// 재발 (금욕 실패, §0.6.3) ...") — not user-facing, not touched by C1.

## Final git status
```text
## wip/pet-room-scene-mode...origin/wip/pet-room-scene-mode
?? docs/run-logs/NOF_CHATGPT_PACKET_C1_CRISIS_ROUTINE_20260611_151212.md
```

(The only untracked path is this packet itself — it is intentionally left UNTRACKED;
no third commit is created for it in this run.)

## Next recommended GOAL
Pick one domain-scoped slice and run it the same way (implement → build/check/browser QA →
single product commit → push → packet). Candidates: C2 record-dot label is still BLOCKED on the
product-owner R-14 decision; R-9 font self-host still HOLD pending lawful font files / download
permission. A clean next product slice (no external input needed) is preferred over R-9/R-14.
