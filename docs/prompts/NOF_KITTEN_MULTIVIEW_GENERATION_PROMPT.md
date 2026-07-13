# NOF_KITTEN_MULTIVIEW_GENERATION_PROMPT.md (Phase D-3 최종 확정판)

Canonical NoF 흰색 아기 고양이의 8-view character reference pack 생성 프롬프트.
image-to-3D 파이프라인(Meshy/Tripo multi-view 입력)의 선행 단계다.

- Character identity reference로 **반드시 첨부할 원본**: `public/assets/pets/white_kitten_main.webp` (주 참조) + `white_kitten_wave.webp` (3/4·발바닥 보조 참조).
- `ember_room_with_white_kitten.webp` 같은 방 배경 합성 이미지는 입력 금지.
- 사용 도구: image reference 입력을 지원하는 생성기 (예: GPT-image, Midjourney `--cref`, Gemini image, SD + IP-Adapter). 도구 선택과 실행은 사용자 승인 후.
- 이 문서로 생성된 이미지도 **자동 승인이 아니다** — `docs/NOF_KITTEN_MULTIVIEW_IDENTITY_GATE.md`로 사람이 8장 전부 검수한다. 전부 통과 전에는 3D 생성 단계로 넘어가지 않는다.

---

## 0. 공통 계약 (모든 view에 강제)

**핵심: 8장 전부 같은 고양이, 같은 크기, 같은 neutral standing pose.**

### Master prompt (영어 — 모든 view 프롬프트의 공통 접두)

```
Use the attached NoF white kitten image as the exact character identity
reference. Generate the SAME individual kitten — not a generic white cat and
not a redesigned mascot.

Identity contract (must match the reference in every view):
- very large round dark-amber eyes with a soft catchlight
- small light-pink triangular nose
- extremely short flat muzzle, no snout protrusion
- round soft cheeks and a slightly oversized head (baby-kitten proportions)
- ivory-white short fluffy fur, no markings, no points, no stripes
- short legs, compact chubby body, natural plump tail
- identical ear size, ear placement and eye spacing in every view
- no collar, no pattern, no clothes, no props
- mouth closed, neutral calm expression

Framing contract (identical in every view):
- full body visible, standing on all four legs in the same neutral relaxed
  standing pose, same scale, kitten centered filling ~70% of frame height
- orthographic-like framing / very long focal length, no wide-angle distortion
- plain neutral light-gray studio background, soft even lighting,
  minimal soft floor contact shadow only
- no room, no cushion, no ember, no bed, no furniture, no text
- photorealistic soft-fur render matching the reference image's style
- do not invent or change any feature in side/back views — same one kitten
```

### Negative prompt (도구가 지원할 때)

```
negative: dog-like muzzle, adult cat proportions, long torso, narrow face,
black muzzle, human teeth, smile, exaggerated anime eyes, plastic toy surface,
ceramic surface, orange lighting, dramatic rim lighting, room background, bed,
blanket, accessories, asymmetrical identity, different cat between views
```

> 주의: 원본의 앰버 rim light는 identity가 아니라 조명이다. reference pack은
> 중립광으로 생성한다 (3D 생성기가 조명을 털색으로 오해하지 않도록).

## 1. 8-view 목록 (Master 접두 + 아래 view 문장)

| # | view | 파일명 | View prompt (영어) |
|---|---|---|---|
| 1 | front | `nof_kitten_ref_01_front.png` | `View: perfect straight-on front view at the kitten's eye level (0°). Both eyes fully visible and symmetrical, both ears at equal height, all four legs visible, tail visible beside the body.` |
| 2 | front ¾ left | `nof_kitten_ref_02_front34_left.png` | `View: front three-quarter view from the kitten's left side (camera rotated ~40° toward the kitten's left), eye level. Both eyes still visible, left cheek and left flank visible, same standing pose.` |
| 3 | left profile | `nof_kitten_ref_03_left_profile.png` | `View: exact left side profile (90°), eye level. One eye visible. The muzzle stays short and flat — absolutely no protruding dog-like snout in profile. Belly line, all four legs and tail clearly visible.` |
| 4 | right profile | `nof_kitten_ref_04_right_profile.png` | `View: exact right side profile (90°), the mirror of the left profile — same pose, same proportions, same features.` |
| 5 | back | `nof_kitten_ref_05_back.png` | `View: direct back view (180°), eye level. Back of the head with both ears from behind, rounded back, hips and tail. Still the same chubby baby-kitten build — not an adult cat from behind.` |
| 6 | rear ¾ | `nof_kitten_ref_06_rear34.png` | `View: rear three-quarter view (~135°, from behind and to the kitten's left). Shows the back, the left flank and the edge of the cheek — no full face. Same standing pose and scale.` |
| 7 | top slight angle | `nof_kitten_ref_07_top.png` | `View: elevated camera ~35° above eye level, slightly in front — a gentle top-down view showing the top of the head, how the ears sit on the skull, the back length and the body footprint. Not a straight overhead shot.` |
| 8 | neutral modeling pose | `nof_kitten_ref_08_neutral_pose.png` | `Pose reference for 3D modeling topology: the same neutral standing pose with the four legs clearly separated and vertical under the body, tail relaxed and lifted slightly away from the body so it does not touch the legs or overlap the silhouette, head facing straight forward, mouth closed. Front three-quarter right angle so this sheet also covers the right ¾ that view 2 covers on the left.` |

## 2. 모든 이미지에서 반드시 동일해야 하는 것

얼굴 · 눈 크기와 간격 · iris 색 · 코 · muzzle 길이 · 귀 높이/각도 · 얼굴 폭 ·
머리/몸 비율 · 다리 길이 · 꼬리 두께 · 털색 · 나이 · **동일 개체 identity**.
하나라도 다른 고양이로 보이면 그 이미지는 pack에서 제외하고 재생성한다.

## 3. 기술 사양

- 해상도: 최소 1024×1024 (가능하면 1536+)
- 배경: neutral light gray (흰 털과 구분되는 중간 밝기) 또는 transparent PNG
- 그림자: soft contact shadow까지만
- 왜곡: 망원 화각/orthographic 근사 — 광각 왜곡 금지
- 파일명: 위 표의 `nof_kitten_ref_01_front.png` … `nof_kitten_ref_08_neutral_pose.png`
- 저장 위치(승인 전): repo 밖 검토 폴더 (`Downloads/NoF-kitten-multiview-input/generated/` 권장). **repo에는 사용자 승인 후에만 추가.**

## 4. 승인 게이트

생성된 8장 → `docs/NOF_KITTEN_MULTIVIEW_IDENTITY_GATE.md` 13항 0/1 검수 →
사용자 육안 승인 → **8장 전부 통과 후에만** image-to-3D 입력으로 사용
(`docs/NOF_KITTEN_IMAGE_TO_3D_HANDOFF.md`).
