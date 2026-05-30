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

- [ ] Timer hero shows elapsed days + `HH:MM:SS` ticking every second.
- [ ] 최장 N일 pill reads a sensible value (≥ current run).
- [ ] 규율 점검 card: counts match Discipline screen (지키는 중 / 못 지킴 / 안 고름).
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

## Calendar / 최근 기록

- [ ] Range chips (7d / etc.) switch the strip; selected day updates.
- [ ] Tapping a day opens the detail sheet with 절제 상태 / 규율 counts / 복기.
- [ ] Relapse days render in a warm tone — **no red "fail" styling**.
- [ ] Legend dots match the strip tones.

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
- [ ] No drag-to-place is active while scene mode is on.
- [ ] No discipline rule deletion path exists.

---

_Source-level invariants behind these checks live in_
`docs/NOF_SCENE_MODE_GUARDRAILS.md`.
