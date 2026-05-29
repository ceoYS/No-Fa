# NoF — Review Checklist

A pre-commit boundary guard. Run through this before any commit that touches
`src/`. It exists to keep domains separated (see [DOMAIN_ARCHITECTURE.md](./DOMAIN_ARCHITECTURE.md))
and to keep user-facing copy inside policy (see COPY_POLICY.md, UX_RULES.md).

Treat a ✗ as "stop and fix or consciously defer with a note" — not a hard block,
but never a silent pass.

---

## A. Domain boundaries

- [ ] **No payment/billing code under `pet/`, `rewards/`, or any image/asset folder.**
      Payment is its own domain, wired only through `app/`.
- [ ] **No pet logic inside `CalendarScreen`** (or any records file). Pet warmth/tone
      belongs to the pet domain.
- [ ] **No duplicated discipline status logic.** The 5-state enum, labels, pills,
      and `summarizeRules` have exactly one source (`discipline.js`). Screens
      consume it; they never re-declare it.
- [ ] **Records/calendar logic is not mixed with reward or protection logic.**
      A file owns one domain's rules.
- [ ] **Cross-domain imports go one way only.** The only sanctioned edge is
      `records → discipline`. Discipline must not import records; leaf domains
      (pet, protection, rewards, payment) import neither.
- [ ] **"Shared" components import no domain constants.** If it imports a domain
      model, it is not shared — file it under that domain.
- [ ] **Business rules are not stranded in component `useState`.** Transition
      logic (status change, recovery, claim) has a domain home, even if a screen
      currently calls it.

## B. Discipline 5-state integrity

- [ ] Internal enum is `kept / needs_check / shaken / recovered / not_applicable`.
- [ ] The enum string is **never rendered**; UI shows only the Korean label via
      `STATUS_LABEL`.
- [ ] New rules default to `needs_check`.
- [ ] `흔들렸어요` (shaken) routes to the recovery flow.
- [ ] Completing a recovery action transitions the target rule to `recovered`.
- [ ] `not_applicable` is excluded from the summary denominator.

## C. Records / calendar integrity

- [ ] Calendar dot uses its own 4-state (`kept / recovered / needs_check / untracked`),
      not the discipline 5-state.
- [ ] Tone is a warmth spectrum — **never red, never binary green, never a
      failure marker.**
- [ ] Today's dot is derived from live discipline state; past days may be seed.

## D. Forbidden user-facing vocabulary (§0.5.8.1)

Reject if any of these appear in **rendered UI text** (JSX strings, labels,
aria-labels, button text). Code comments and internal enums are exempt.

- [ ] No: 위반 · 규율 위반 · 위반 횟수 · 실패(as a status) · 실패자 · 벌점 ·
      점수 차감 · 강등 · 등급 · 랭킹 · 점수 · 포기
- [ ] No: 잔불 캘린더(as a title) · 이어온 날 · 조용해진 날 · 아직(as a shaming filler)
- [ ] No build-stage jargon in UI: P0 · P1 · 프로토타입 · 보기 전용 · MVP · 데모 ·
      mock · enum
- [ ] No score-frame echoes, e.g. "깎이는 점수는 없어요".
- [ ] Room Warmth shows 약함/잔잔함/안정/따뜻함 — never a number.

## E. Tone & safety (UX_RULES.md, COPY_POLICY.md)

- [ ] No shame, religious guilt, or moralizing.
- [ ] No medical claims or perfect-blocking promises.
- [ ] No explicit content.
- [ ] Pet is never punished: no death/sickness/demotion/pay-to-rescue. Shaken →
      dimmed ember only, recoverable.

## F. Build & scope hygiene

- [ ] `npm run build` passes.
- [ ] No `dist/`, `node_modules/`, or binaries staged.
- [ ] `design_outputs/claude_design_v3/*.html` untouched.
- [ ] `docs/PRD` + Spec Kit untouched (locked).
- [ ] `docs/ACQUISITION_POSITIONING_BENCHMARK.md` kept separate from feature diffs.
- [ ] Diff is single-purpose: behaviour **or** structure, not both interleaved.

## G. Layout (manual / visual)

- [ ] No line-wrap breakage on long titles or rule labels.
- [ ] CTAs are not clipped; primary action reachable.
- [ ] No bottom-nav overlap with screen content.
- [ ] Long titles overflow gracefully (ellipsis/wrap, not push).

> Note: §G requires a browser. In environments where the browser is unavailable,
> mark these **unverified** in the report rather than claiming a pass.
