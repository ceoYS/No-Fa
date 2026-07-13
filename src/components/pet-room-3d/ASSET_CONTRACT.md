# Pet Room 3D — Asset Contract (v1)

이 문서는 `?room3d=1` 3D vertical slice가 "진짜 살아있는 방"이 되기 위해 필요한
아트 에셋의 계약이다. **이 계약이 채워지기 전까지 코드는 어떤 고양이/아이템
비주얼도 지어내지 않는다** — 슬라이스는 자리(anchor)와 그림자, 자리 표시
슬롯만 렌더한다. 임시 그림을 생성해 제품 UI에 넣는 것은 금지.

관련 코드: `roomDomain.js` (좌표·anchor·애니메이션 상태 인터페이스),
`PetRoom3D.jsx` (`cat-anchor` mount + contact shadow), `../../constants/petAssets.js`
(등록소 — `spriteReady`/`frameSetReady`는 사람이 승인할 때만 올린다).

## 1. Room plate / texture set (둘 중 하나)

| 옵션 | 내용 | 파일 |
| --- | --- | --- |
| A. Clean room plate | 고양이·이동 가능 아이템이 **없는** 빈 방 한 장 (현재 `ember_room_empty.webp`는 가구가 박혀 있어 부적합) | `rooms3d/room_plate_clean.webp` |
| B. 3D texture set | floor / back wall / side wall 각각의 tileable 텍스처 + baseboard 톤 | `rooms3d/tex_floor.webp`, `tex_wall_back.webp`, `tex_wall_side.webp` |

- 톤: 현 ember 팔레트 유지 (deep ink brown `#241b15`–`#2b211a`, floor `#4e372a`, amber `#ff8f4a`).
- B 채택 시 각 텍스처 1024×1024 이상, seamless.

## 2. Transparent cat set (필수 — 전부 같은 캔버스/앵커/스케일)

모든 프레임은 **동일 캔버스 크기, 동일 발바닥 기준선(baseline), 동일 스케일**로
정합(frame registration)되어야 한다. 프레임 간 고양이 실루엣이 1px 이상
어긋나면 blink/breath가 "떨림"으로 보인다.

| 키 | 내용 | 최소 프레임 |
| --- | --- | --- |
| `cat_base` | 투명 배경 기본 자세 (현 `white_kitten_main` 구도, alpha 필수) | 1 |
| `cat_blink` | 눈 감김 중간·완전 프레임 | 2 |
| `cat_breath` | 호흡 상하 미세 변화 (base 대비 몸통 1–2% 스케일) | 2 |
| `cat_ear` | 귀 움직임 프레임 | 2 |
| `cat_tail` | (optional) tail sway 프레임 | 2–3 |
| `cat_contact_shadow` | 발 밑 soft radial shadow (별도 레이어, 반경 = `CAT_ANCHOR.shadowRadius`) | 1 |

### Frame registration 규칙

1. 캔버스: 정사각 1024×1024 (모바일 절반 스케일 대응 WebP, 필요시 PNG 원본 보존).
2. 앵커: 캔버스 하단 중앙 (x=512, y=940)이 바닥 접점. `roomDomain.js`의
   `CAT_ANCHOR.position`에 이 점이 놓인다.
3. 스케일: base 프레임에서 고양이 높이 = 캔버스의 62% ±2%. 모든 프레임 동일.
4. 파일명: `cat_<state>_<frameIndex>.webp` (0-base). 예: `cat_blink_0.webp`.
5. 배경: 완전 투명 (alpha). 현재 팩 전부 `alpha=False`라 사용 불가.

## 3. Item sprites (슬롯을 실물로 바꿀 때)

- 아이템별 투명 스프라이트 1장, 바닥 접점 하단-중앙 앵커, `ITEM_FOOTPRINTS`
  비례와 일치하는 실루엣.
- 등록: `petAssets.js`의 해당 항목 교체 후 `spriteReady`를 사람이 직접 올린다
  (가드 #5/#6이 코드만의 선언을 막는다).

## 4. 포맷 공통

- WebP (사진성) 또는 PNG(알파 경계 품질 필요시) — 모바일 우선, 개당 ≤ 150KB 목표.
- sRGB. 프리멀티플라이드 알파 금지(three.js 기본 unpack 기준).

## 5. 연결 절차 (사람 승인 단계)

1. 에셋 드롭 → `identify`로 alpha=True 확인.
2. `petAssets.js` 경로 등록 (`present: true`), 상태별 프레임 매핑 추가.
3. `roomDomain.js` `createCatAnimationState()`의 `frameSetReady`를 올리는
   커밋은 반드시 에셋 커밋과 함께.
4. 그때까지 UI 카피는 "자리 표시" 이상을 약속하지 않는다.
