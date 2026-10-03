# NoF — decor / cat-motion asset blockers (recorded, not solvable in code)

Status date: 2026-08-23
Recorded from: Founder real-device video QA of commit `20f8861`
Owner of the fix: company-side art pipeline, NOT this repo

```
DECOR_CLEAN_ROOM_REQUIRED       = YES
TRANSPARENT_DECOR_SPRITES_REQUIRED = YES
```

## Why this file exists

Three passes have now tried to make placed decor read as real objects in the room
using code alone — bigger crops, softer feathering, contact shadows, safer default
coordinates, a shared edit/view representation. Each pass made the surface *less*
wrong and none of them fixed the actual problem, because the actual problem is the
art, not the rendering. This is the written record so no further pass is spent on it.

## Blocker 1 — the room plate is already decorated

`public/assets/rooms/ember_room_canonical_clean.png` (the canonical clean plate, and
the composite authored to the same framing) already contains a pet bed, a rug, a
paper lamp, a cat house, a plant in a pot, a wall shelf, a cabinet and a feeding
tray with two bowls.

Consequence: every decor item the shop sells is a **duplicate of furniture already in
the room**. Placing 러그 puts a second rug on the rug. Placing 화분 puts a second plant
beside the plant. No amount of masking, scaling or shadow work changes that — the
room is full before the user places anything.

**What is required:** a clean-room plate authored as an EMPTY room (walls, floor,
light, no furniture), so purchased decor is what furnishes it. Same framing, same
1448×1086 frame, so the canonical kitten cutouts and
`CANONICAL_POSE_PLACEMENT` continue to line up unchanged.

## Blocker 2 — the decor assets are opaque photo crops

Every entry in `ITEM_ASSETS` (`src/constants/petAssets.js`) carries
`spriteReady: false`, and that flag is honest: the files are rectangular, fully
opaque crops taken out of a rendered room photo. They carry their own background
pixels — floor, shadow, neighbouring objects.

Observed on device, and reproducible:

- 잔불 램프 reads as a **floating circular photo crop**, because the feather mask turns
  an opaque rectangle into an opaque disc — it is still a disc of photo.
- 고양이집 / 포근한 쿠션 include unrelated background pixels from the source photo.
- Any crop placed over the finished room reads as a sticker, at any size.

The feathering in `PlacedDecorLayer.jsx` is the best available representation of
"that object is in the room" given opaque crops. It is not, and cannot be made into,
a composite. Nothing in the product claims otherwise.

**What is required:** transparent (alpha) sprite art per decor item, authored to the
room's lighting and camera, at the plate's framing. On arrival, flip the per-item
`spriteReady` to `true` — that flag is the fail-closed gate the whole decor path
already reads (`isItemSpriteReady`), so the pipeline is waiting, not missing.

## Blocker 3 — the cat cannot walk (added 2026-08-23)

```
CAT_WALK_CYCLE_ART_REQUIRED = YES
```

An earlier pass translated the whole cat cutout between fixed waypoints so an
untouched room would not read as a still image. On real-device video it read as an
image **sliding across the floor**: a still PNG has no gait, no weight shift and no
foot contact, so moving it announces locomotion the art cannot deliver.

That wander was **removed** (not tuned) in the follow-up pass. What remains is what
the art honestly supports:

- the canonical blink loop (`CANONICAL_BLINK_MOTION`)
- the A5 breathing scale
- the slow 휴식 idle beat
- the 기쁨 / 휴식 poses the user's own 간식 / 쓰다듬기 actions earn

**What is required for real locomotion:** authored walk-cycle frames for the
canonical kitten (or the rigged 3D cat path reaching production readiness). Until one
of those exists, no code in this repo may translate the cutout and no copy may say
the cat walks, strolls or plays by itself.

## What this repo DID fix in the meantime

These are code-level and shipped in the follow-up pass:

- placed decor can no longer be dropped onto the cat or the feeder
  (`src/constants/roomZones.js`, derived from the approved canonical pose rects)
- the cat's fake positional wander is gone; honest motion retained
- the 상점 sheet is readable on the v13 light shell
  (`src/styles/c2a-polish.css`, since `components.css` is a pinned authority)
- the placement tray's empty state describes the TRAY, not the room

None of those touch the two YES flags at the top of this file.

---

## V2 update (2026-08-31) — the Companion Asset Pack resolves blockers 1–3

Status date: 2026-08-31
Recorded from: company HOME-parity reconstruction (Slice 3 living pet room)
Asset authority: `NoF_Cat_Pack_1..4` → `public/assets/v2/` (37 transparent cat sprites,
9 transparent props, one clean 4:3 room plate). Verified by direct image inspection.

```
V2_CLEAN_ROOM_PLATE            = PRESENT   (public/assets/v2/room-clean.webp, 1200×900, RGB, no baked feeder/decor/cat)
V2_TRANSPARENT_DECOR_SPRITES   = PRESENT   (bed/rug/lamp/plant/mouse/yarn/house, 512² RGBA)
V2_TRANSPARENT_FEEDER_SPRITES  = PRESENT   (feeder-empty + feeder-full, 512² RGBA)
V2_WALK_CYCLE_ART              = PRESENT   (walk-1..6, 512² RGBA — candidate key poses, D-5)
```

The V2 living room (`PetRoomV2` + `useCompanion`) is a SEPARATE path from the pinned
still-composite `PetRoomEditor`; it uses the V2 pack, so blockers 1–3 above do NOT apply to
it:

- **Feeder empty→full is HONEST here (not blocked).** `room-clean.webp` has NO baked feeder
  (confirmed by inspection); the feeder is a separate transparent prop, and `feeder-empty` ↔
  `feeder-full` are two real sprites. Feeding swaps them — a genuine empty→full→empty cycle,
  not a fake claim. (This is the opposite of the HOME finding, where the plate had a baked
  full feeder; that finding was for the OLD plates, not the V2 plate.)
- **Real placement is honest here.** Transparent decor sprites exist, so `PetRoomV2` places
  them at normalized floor points (never over the cat/feeder — `SAFE_ZONES`), persisted in
  `nof.roomv2.v1`. No `spriteReady:true` was raised on the OLD `petAssets` items; the V2 path
  simply uses a different, genuinely-transparent registry (`companionAssets`).
- **Real locomotion is honest here.** The kitten walks with multiple approved gait frames
  (`WALK_GAIT`) while its foot point really translates across the 4:3 floor; left-facing is a
  scaleX mirror of the right-facing frames. The pinned `PetRoomEditor` still never translates.

### V2 Blocker A — only ONE approved room PLATE exists

The V2 authority ships exactly one room background: `room-clean.webp` (warm walnut, 4:3).
There is NO separate 새벽 창가 or 백염 눈밤 plate, and art must not be generated. So the theme
picker applies a REAL, persistent lighting/atmosphere treatment over the one approved plate
(a genuine, durable rendered change — see `.pet-room-grade--dawn/snow`), NOT a claim of a
different photograph. Honest maximum given the authority. **What is required to make themes
distinct photographs:** approved dawn / snow room plates at the same 1200×900 4:3 framing.

### V2 Blocker B — no standalone accessory sprites

The unlocked decorations (리본 @ 씩씩한 탐험가 / 하트 참 @ 잔불 수호자) are baked INTO the
evolution art (`evo-4`, `evo-5`); the pack has no separate ribbon / heart-charm overlay
sprites. So the hub's accessory equip is a stored, visibly-toggling preference (착용 / 착용 중
chip state) — it is NOT presented as a live cat-sprite costume swap, which would need overlay
art that does not exist. Unlock stays monotonic; equip is separate; nothing fakes a visual the
art can't deliver.
