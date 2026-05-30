# Pet Room Prototype — Mobile Browser Review Checklist

Manual QA pass for the `wip/pet-room-scene-mode` prototype. Source QA is already
done (eligibility guards, no delete affordance, scene-mode honesty); this list is
the **human browser pass** that source review cannot fully cover — real layout,
spacing, touch targets, and motion feel on a phone-width viewport.

Run with: `npm run dev`, then open in a mobile viewport (~390 px wide, e.g.
iPhone 12/13 in device toolbar). The app renders inside a fixed device frame, so
also confirm nothing overflows that frame.

How to read this doc: each row is `[ ] check — expected`. A check passes only if
the expected behavior is exactly what you see. Anything else is a finding.

---

## Global / shell

- [ ] App boots to **홈** with no console errors.
- [ ] BottomNav shows 4 tabs: 홈 · 기록 · 체크인 · 복기. Active tab is highlighted.
- [ ] BottomNav icons are line SVGs (no emoji), and tapping each switches screen.
- [ ] Nothing overflows the device frame horizontally on any screen.
- [ ] No black-background kitten portrait appears anywhere.

## Home (홈)

- [ ] Timer hero shows elapsed days + `HH:MM:SS` ticking every second, and is the
      visually dominant element on first paint.
- [ ] Directly under the timer: **지금 충동 멈추기** (primary → 잠깐 멈춤) and
      **오늘 상태 남기기** (→ 1분 기록) hero CTAs. No card sits between them and the timer.
- [ ] 최장 N일 pill reads a sensible value (≥ current run).
- [ ] 규율 점검 card: counts match Discipline screen (지키는 중 / 못 지킴 / 안 고름);
      it is an at-a-glance card now (no duplicate check-in button on it).
- [ ] **No 동행 / social card** and **no live-user number** anywhere on Home.
- [ ] 고양이의 방 preview is the **finished room scene image** — no pasted cat
      overlay, no dashed decor slots, no emoji furniture.
- [ ] Pet preview after a relapse (다시 시작) reads the dimmed tone + gentle copy
      ("잔불이 잠깐 약해졌어요…"), never shame copy.
- [ ] 고양이 방 꾸미기 button navigates to Pet Room.

## Checkin (체크인)

- [ ] Step 1: mood chips, trigger chips (multi-select), urge 1–5 scale all toggle.
- [ ] 다음 button is disabled until a mood + urge are chosen (dimmed, no tap).
- [ ] Step 2: each rule shows the 3-state tap row; selecting writes status (verify
      it reflects on Home/Discipline).
- [ ] 체크인 완료 button grants shards and lands on Pet Room.
- [ ] **Persistence:** after 체크인 완료, open 기록 → tap **today** → the detail
      sheet shows an **오늘의 체크인** block with the mood + 충동 N/5 (and trigger
      chips if any were picked), matching exactly what you selected. Nothing vanishes.
- [ ] **No shard farm:** note the 잔불 조각 balance right after 체크인 완료. Re-enter
      체크인, change a mood/urge, press 체크인 완료 again — the saved record updates,
      but the 잔불 조각 balance does **not** rise a second time today.

## Urge / 잠깐 멈춤

- [ ] 홈 → **지금 충동 멈추기** → **5분 같이 버티기** starts a 00:00 timer that ticks.
- [ ] Subtitle/hint read calmly (`5분만 지나도 강도는 조금 내려갈 수 있어요`) — **no `파도처럼`** copy.
- [ ] **No crisis farm:** note the 잔불 조각 balance. Tap **5분 같이 버티기** then immediately
      **오늘도 함께 버텼어요 · 마치기** → on 고양이 방 the balance rises once. Repeat the loop
      (홈 → 멈춤 → 마치기): the balance does **not** rise again today.
- [ ] **대체 활동 해보기** opens an in-screen panel of 4 actions (물 한 잔 마시기 / 휴대폰
      내려놓기 / 10번 천천히 숨쉬기 / 자리에서 일어나기) — it does **not** jump to 홈. Tapping
      one returns to the breath timer with a calm note and grants **no** shards.

## Calendar / 최근 기록

- [ ] Range chips (7d / etc.) switch the strip; selected day updates.
- [ ] Tapping a day opens the detail sheet with 절제 상태 / 규율 counts / 복기.
- [ ] Relapse days render in a warm tone — **no red "fail" styling**.
- [ ] Legend dots match the strip tones.
- [ ] Today's detail sheet shows the **오늘의 체크인** block when a check-in was
      completed today (기분 · 충동 N/5 · trigger chips). A day with **no** check-in
      shows no such block — no empty "오늘의 체크인" header.

## Discipline (나의 규율)

- [ ] Each rule row has a status pill that opens the status sheet on tap.
- [ ] **No delete button, no swipe-to-delete, no delete confirmation sheet.**
- [ ] A `못 지켰어요` rule shows an optional 복기하기 CTA (not punitive).
- [ ] 규율 추가 sheet adds a rule; custom category input works.
- [ ] Copy frames rules as self-promises, never as punishment.

## Recovery / 복기 다이어리

- [ ] Top of screen shows the **room scene thumbnail card** (or neutral text card),
      never the black-background kitten portrait.
- [ ] relapse scope: 왜 그랬을까요? is effectively required (finish disabled until
      a why is written).
- [ ] slip scope: finish is allowed with empty fields (light, optional).
- [ ] **No reflection farm:** note the 잔불 조각 balance, then from 홈 tap **오늘 복기하기**
      → **복기 마치기** (empty is allowed) twice. The balance rises at most **once** today —
      the second finish records the reflection but grants no extra shards.
- [ ] Esc (hardware keyboard) dismisses the open day-detail / 규율 / 보관함 / 상점 sheet.
- [ ] All copy is gentle — no 실패/위반/벌 wording.

## Pet Room (고양이 방) — primary scene-mode surface

- [ ] Header is not crowded: greeting + title on the left, 소리/무음 toggle +
      잔불 조각 balance on the right, all on one line without wrapping awkwardly.
- [ ] 소리/무음 toggle flips label on tap and persists across reloads
      (localStorage). With no mp3 files present, **no audio plays and no console
      error** is thrown.
- [ ] Room stage shows the **single finished scene image**. No pasted cat overlay,
      no draggable tokens, no dashed slots.
- [ ] Tapping the room shows a calm message and a **subtle** scene pulse (brief,
      not a bounce). It must NOT claim the cat stretched / ate / waved / moved.
- [ ] 간식 주기:
  - [ ] With snacks > 0: count decreases by exactly 1 per tap; warm message shows.
  - [ ] On a successful feed a small ember token rises from the button toward the
        scene and fades; copy reads `간식을 건넸어요. 고양이가 기분 좋아 보여요.` — it must
        NOT claim the cat 먹었/ate or moved. (Token is suppressed under reduced-motion.)
  - [ ] At 0 snacks: button reads empty/disabled state; shows
        "보유한 간식이 없어요…"; count never goes negative.
- [ ] 아이템 보관함 sheet: owned items are **collection cards**, each marked
      `배치 준비 중` (not draggable). Dragging does nothing. No `방에 있음` badge
      appears in scene mode.
- [ ] 상점 sheet: 방 테마 tab is hidden in scene mode; decor cards never show
      `방에 있음`; buying spends shards and never goes below zero.
- [ ] 오늘의 보상 받기 — eligibility (the core guard):
  - [ ] A milestone the streak has reached shows 받기; tapping it once grants the
        reward (shards bump, or snack count +1) and the button becomes 받음.
  - [ ] Re-tapping a claimed reward does **nothing** — no second grant, no warm
        feedback. Copy reads "이미 받은 보상이에요."
  - [ ] The next locked milestone row reads "아직 받을 수 없어요. 오늘을 채우면
        열려요." and its pill is non-interactive.
  - [ ] The unreached reward cannot change snack or shard counts by any tap.
- [ ] 보상 disclaimer is present ("이 보상은 절제를 대신하지 않아요 …").

## Regression tripwires (must stay FALSE)

- [ ] No emoji used as furniture / cat / mascot anywhere.
- [ ] No SVG/CSS-blob cat figure rendered in the room.
- [ ] No copy implies cat motion that has no animation asset (기지개/꼬리/먹는 등).
- [ ] No `파도처럼` over-promise copy anywhere (Home / Urge).
- [ ] **대체 활동 해보기** never silently routes to 홈 (it must open the alt-action panel).
- [ ] No drag-to-place is active while scene mode is on.
- [ ] No discipline rule deletion path exists.

---

## Exact browser steps (do these in order)

1. Terminal: `npm run dev` → open the printed `localhost` URL.
2. DevTools (F12) → toggle device toolbar → set width **390px** (iPhone 12/13).
3. Console tab open the whole time — **any red error is a finding**.
4. Walk the flow in this order, screenshotting where noted:
   1. **홈** loads first. Watch the timer tick once (1s). _Screenshot: full Home._
   2. Tap **오늘 상태 남기기** (home hero) → 1분 기록 step 1 → pick a mood, **≥1 trigger**,
      and an urge level → **다음** → step 2 → **체크인 완료**. Lands on 고양이 방.
      _Screenshot: 고양이 방 top._ **Note the 잔불 조각 balance pill** (top-right).
      (Persistence + no-farm are verified in step 6.)
   3. In 고양이 방: tap the room once (calm message), tap **간식 주기** twice
      (count drops 1 each), tap an already-**받음** reward (must do nothing).
      _Screenshot: 보상 받기 section showing 받기 / 받음 / N일째 states._
   4. Open **상점** → confirm 방 테마 tab absent; open **아이템 보관함** →
      confirm cards read 배치 준비 중, no 방에 있음. _Screenshot: each sheet._
   5. Back 홈 → **무너졌어요 · 다시 시작** → relapse reflection (required) →
      try **복기 마치고…** while 왜 그랬을까요 empty (must stay blocked) → type
      one line → finish. _Screenshot: relapse reflection with blocked button._
   6. **기록** tab → tap **today's** cell → detail sheet shows the **오늘의 체크인**
      block matching step 2 (기분 · 충동 N/5 · trigger chips) → 닫기.
      _Screenshot: day detail with 오늘의 체크인._ Then **체크인** tab → change the
      urge → **체크인 완료** → on 고양이 방 confirm the 잔불 조각 balance is **unchanged**
      from step 2 (no second grant), while re-opening 기록 shows the **updated** urge.
   7. **나의 규율** → confirm there is **no delete control** of any kind.

## What to screenshot (attach to the review)

- Home (timer hero dominant + 지금 충동 멈추기 / 오늘 상태 남기기 hero CTAs; no 동행 card).
- 고양이 방 stage (single finished scene image, no pasted cat/tokens).
- 보상 받기 with all three reward states visible.
- 보관함 + 상점 sheets (scene-mode honesty).
- Relapse reflection with the finish button visibly disabled.
- BottomNav with the active tab highlighted.

## Fail examples (if you see any of these, it FAILS)

- Any 동행 / social card or a live-user number (e.g. "1,240명") on Home — that card
  was removed entirely; Home is timer hero + two hero CTAs + compact cards.
- **대체 활동 해보기** jumping straight to 홈 instead of opening the alternative-action
  panel, or any `파도처럼` copy on Home / Urge.
- 간식 주기 claiming the cat 먹었/ate, or showing a snack token but no honest
  `간식을 건넸어요…` copy.
- Tapping a **받음** reward bumps shards/snacks a second time, or shows a warm
  message.
- 간식 주기 at 0 snacks decrements below zero, or throws.
- Any `방에 있음` badge or draggable token while the scene image is showing.
- Copy claiming the cat 기지개/꼬리/먹었/움직였 with no animation.
- A 방 테마 tab visible inside 상점 while in scene mode.
- A delete/삭제 affordance on 나의 규율.
- The **오늘의 체크인** block missing from today's detail after 체크인 완료, or
  showing a mood / urge / trigger that does not match what was selected (data dropped).
- Re-pressing **체크인 완료** a second time the same day raises the 잔불 조각 balance
  again (the daily check-in reward must grant once per day only).
- The prototype **화면 전환** panel ("NoF · P0 prototype") visible on a plain
  production build (built `dist/` previewed without `?dev=1`).
- Red console error on any screen, or layout overflowing the device frame.

## P0 blockers — must ALL pass before any merge to `main`

- [ ] `npm run build` succeeds.
- [ ] Forbidden-token scan clean (only the benign CSS `stretch` / comment hits).
- [ ] No discipline delete path (no button, sheet, handler, or prop).
- [ ] Reward eligibility holds: ineligible/claimed reward never moves balances.
- [ ] Scene mode: no drag, no token overlays, no `방에 있음`, no motion claim.
- [ ] No fabricated live-user / social-proof number on Home.
- [ ] Check-in step-1 inputs persist into today's record (오늘의 체크인 block in 기록).
- [ ] Check-in / crisis / reflection shard grants are each once-per-day: re-pressing
      체크인 완료 · 잠깐 멈춤 마치기 · 복기 마치기 the same day updates the record but
      never re-grants 잔불 조각.
- [ ] Debug 화면 전환 switcher hidden on a production build (renders only in dev or
      with `?dev=1`).
- [ ] Home is timer-first: abstinence timer hero + `지금 충동 멈추기` / `오늘 상태 남기기`
      hero CTAs above the secondary cards; `대체 활동 해보기` opens a real panel, not 홈.
- [ ] `npm run check:nof` passes (13 source-level reward / scene-mode / a11y /
      product-priority invariants).
- [ ] A forced render error shows the calm **잠시 문제가 생겼어요** fallback with a
      다시 불러오기 button — never a blank white device frame.
- [ ] No red console error and no horizontal overflow on any screen at 390px.

---

## Debug switcher gating (review tooling)

The left **화면 전환** panel (`ScreenSwitcher`, titled "NoF · P0 prototype") is
debug-only — it jumps straight to any of the 7 screens for review. It must **not**
appear on a plain production load. Gating lives in `App.jsx` (`debugNavEnabled()`).
BottomNav is the real navigation and is always present.

How to verify and how to drive it during review:

- `npm run dev` → panel **is** visible (dev mode, `import.meta.env.DEV`). This is the
  normal review setup; nothing extra to do.
- `npm run build` then `npm run preview` (serves the built `dist/`) → open the URL
  with **no params** → panel is **hidden**. Confirm BottomNav still switches screens.
- Same preview URL with **`?dev=1`** appended → panel **reappears**, and the choice
  is remembered for later in-app navigation (stored as `localStorage.nof_debug_nav`).
- To turn it back off on a build: in the console run
  `localStorage.removeItem('nof_debug_nav')`, then reload without `?dev=1`
  (or clear site data).

---

_Source-level invariants behind these checks live in_
`docs/NOF_SCENE_MODE_GUARDRAILS.md`. _Full issue list:_
`docs/NOF_COMMERCIAL_QA_BACKLOG.md`.
