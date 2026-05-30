# NoF Pet Room — Scene Mode Guardrails

Regression guard for the `wip/pet-room-scene-mode` prototype. Read this before
touching `petAssets.js`, the room components, or the reward/feed loop. The pet
room is deliberately **honest about what is and isn't finished** — these rules
are what keep it that way. Breaking one turns a calm, truthful prototype into one
that fakes unfinished features.

## Why scene mode exists

The approved pet-room art currently ships as **finished, opaque WebP
illustrations** (a complete room-with-cat scene, full-frame cat poses, full decor
art). They are not transparent overlay sprites. You cannot paste an opaque cat
PNG onto an opaque room image and get a believable composited scene — you get a
rectangle on a rectangle.

So instead of faking composition, the room renders as **one finished scene
image** (`ember_room_with_white_kitten.webp`) and all interaction feedback is
text + a subtle scene pulse. This is "scene mode."

Source of truth: `shouldUsePetSceneMode()` in `src/constants/petAssets.js`. It
returns `true` when a scene-ready room asset exists **or** the cat isn't a ready
sprite — i.e. whenever overlay composition would be dishonest.

```
hasSceneRoomAsset() === true  (ember_room_with_white_kitten: sceneReady: true)
=> scene mode is ON for the whole pet room today.
```

## Why drag placement is disabled

Dragging a decor item onto the room only makes sense if that item is a
**transparent sprite** that can sit believably over the background. Every entry
in `ITEM_ASSETS` is currently `spriteReady: false`. Until that flips to `true`
for an item with real alpha art:

- `isItemSpriteReady(assetId)` returns `false`.
- `beginPlaceDrag` / `beginDrag` short-circuit (no drag starts).
- Inventory items render as **collection cards** marked `배치 준비 중`, not
  draggable tokens.
- The stage never paints decor overlays (`PetRoomEditor` / `PetRoomPreview`
  filter placements by `isItemSpriteReady`).

Do **not** enable drag by loosening these checks. Enable it only by shipping real
transparent sprite assets and flipping the per-item `spriteReady` flag.

## Required assets before un-gating features

| Feature to un-gate | Required asset | Flag to flip |
| --- | --- | --- |
| Draggable decor placement | Transparent (alpha) decor sprite per item | `ITEM_ASSETS[id].spriteReady: true` |
| Independent cat in the room (overlay, not baked scene) | Transparent (alpha) cat sprite frames | `CAT_ASSETS[state].spriteReady: true` |
| Feeding animation | Real animation asset (sprite sheet / Lottie / frames) | New, do not fake with CSS-only motion claims |
| stretch / wave / eating / tail states | Real per-state animation assets | New, per-state; never claim without the asset |
| Theme switching in scene mode | Per-theme finished scene images | `ROOM_ASSETS[theme].sceneReady: true` |

Until each row's asset exists, the corresponding affordance stays in its honest
pending state (collection card, scene-only render, text feedback).

## Required audio assets

`src/hooks/usePetSound.js` expects, but does **not** require:

- `public/assets/sounds/cat_meow_soft.mp3`
- `public/assets/sounds/cat_purr_soft.mp3`

These files are **not committed**. The hook keeps a **silent fallback**: it
HEAD-probes each path once, caches "missing," and every `play()` short-circuits
to a no-op. No autoplay, local paths only, gesture-gated (tap / 간식 주기). When
real soft audio lands at those exact paths, playback starts automatically — no
code change needed.

Do not: create placeholder/fake audio, download external audio, add autoplay, or
make the UI error/block when a file is missing.

## What must NOT be faked (hard invariants)

- **No fake cat motion claims.** No copy may say the cat stretched, ate, moved
  its tail, waved, or walked unless a real animation asset for that state exists.
  Feed/tap copy stays in honest, ambiguous terms ("가까이 온 것 같아요",
  "기분 좋아 보여요"), never "고양이가 먹었어요 / 기지개를 켰어요 / 꼬리를 흔들었어요".
- **No placeholder art.** No emoji furniture/cat/mascot, no SVG cat, no CSS blob
  furniture, no dashed slots painted as if they were items. A missing asset shows
  a clean neutral pending slot, nothing more.
- **No `방에 있음` in scene mode.** That badge implies a placed overlay that does
  not exist in scene mode; it only renders when an item is actually placeable.
- **Reward eligibility cannot be bypassed.** A reward changes snack/shard balance
  ONLY when `isMilestoneClaimable(milestone, streakDays, claimedRewardIds)` is
  true — guarded in both `PetRewardScreen.handleClaim` and `App.claimReward`.
  Keep both guards; they are intentional defense-in-depth.
- **No discipline rule deletion.** Rules are self-promises. No delete button,
  sheet, handler, or `onDeleteRule` prop. Editing/archiving is a later
  non-destructive phase.
- **No shame/punishment copy.** Slips and relapses stay gentle; no 실패/위반/벌
  framing, no red "fail" styling.

## Tripwire greps (should stay clean)

```
grep -RInE "기지개|꼬리|먹었|먹는|움직였|eating|stretch|spriteReady: true|pet-cat-svg|room-token-glow|🐱|🪑|🧺|🛏️|🪔|💡|🛋️|🟫|🐟" src
grep -RInE "onDeleteRule|handleDelete|removeRule|삭제하기|규율 삭제 확인" src/screens src/components src/constants src/App.jsx
```

Hits are allowed only for: explanatory comments (e.g. the App note that there is
*no* `onDeleteRule`), the removed-states list in `discipline.js`, emotional copy
that reuses a word like "흔들려도" (wavered, about the person — not the cat), and
CSS `align-items: stretch`. Any new hit on actual behavior is a regression.

_Manual browser pass: see `docs/PET_ROOM_REVIEW_CHECKLIST.md`._
