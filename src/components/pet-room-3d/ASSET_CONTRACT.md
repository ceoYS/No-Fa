# Pet Room 3D — Asset Contract (v2)

이 문서는 `?room3d=1` 3D 슬라이스가 승인 아트로 완성되기 위해 필요한 에셋의
계약이다. 승인 아트가 없는 동안 코드는 **정직한 임시 3D 모형**만 사용한다 —
아이템은 프록시(`itemProxies.js`), 고양이는 프리미티브 기반 절차 리그
(`catRig.js`, Phase C). 임시 모형은 "임시 3D 모형"으로만 소개하고, 완성
캐릭터 아트라고 주장하지 않는다. **임시 그림(이미지)을 생성해 제품 UI에 넣는
것은 여전히 금지** — 모형은 지오메트리이고, 2D 이미지/빌보드/스프라이트로
고양이를 흉내 내지 않는다.

관련 코드: `roomDomain.js` (좌표·anchor·2D 프레임 상태 인터페이스·mood 파생),
`PetRoom3D.jsx` (`cat-anchor` mount + contact shadow + 리그 구동),
`catRig.js` (절차 고양이 리그 — 승인 리그 에셋의 단일 교체 지점),
`../../constants/petAssets.js` (등록소 — `spriteReady`/`frameSetReady`는
사람이 승인할 때만 올린다).

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
4. 그때까지 2.5D UI 카피는 "자리 표시" 이상을 약속하지 않는다.

## 6. Cat adapter — 절차 리그(fallback) ⇄ 승인 GLB(목표)

고양이 시각 자산은 **하나의 어댑터 계약** 뒤에 있다. `catRig.js`의
`buildCatRig()`가 현재(그리고 fallback) 구현이고, 승인된 GLB가 오면 같은
계약을 만족하는 구현으로 `buildCatRig()` 내부만 교체한다 — 상위의
상호작용·mood·사운드·reduced-motion 경로는 계약이 같으므로 그대로 남는다.
자산이 없어도 이 어댑터 구조와 fallback은 이미 코드에 존재한다.

### 6.1 어댑터 계약 (두 구현이 모두 지켜야 하는 인터페이스)

`buildCatRig(THREE, opts)` → 다음을 노출한다:

| 멤버 | 책임 (Phase 3 분리) |
| --- | --- |
| `group` | 씬에 mount할 Object3D (cat-anchor에 붙음). dispose는 상위 unmount 패스가 담당 |
| `update(dt, { camAzimuth })` | 프레임당 idle + reaction 진행 (motion 허용 세션에서만 호출) |
| `setMood(mood)` | idle 파라미터 preset만 조정 (감정 아님, 로컬 파생) |
| `triggerReaction(kind, { yaw })` | `'tap'` / `'pet'` / `'nuzzle'` 단일 reaction 시작. `yaw`(rad)은 접촉 지점 방향 head-turn 목표 — 실제 손 추적이 아니라 포인터 좌표 기반 화면 연출 |
| `isReacting()` | reaction 진행 여부 |
| `applyStaticPose()` | reduced-motion 정적 자세 (loop 없이 1회) |
| `getPose()` / `state` | QA/dataset용 포즈·모드 스냅샷 |

상호작용·사운드는 어댑터 **밖**에 있다: PetRoom3D가 포인터 제스처를 tap /
pet / nuzzle로 분류하고 접촉 방향 yaw를 계산해 `triggerReaction`에 넘기며,
소리는 화면의 gesture-gated `usePetSound`로만 나간다(어댑터는 오디오 채널을
열지 않는다, 가드 #111d).

### 6.2 승인 GLB 요구

| 항목 | 요구 |
| --- | --- |
| 포맷 | glTF 2.0 단일 `.glb` (텍스처 임베드), ≤ 1.5MB |
| 단위/축 | meter, Y-up, 원점 = 바닥 접점 중앙, 정면 = +z |
| 스케일 | 앉은/couched 자세 전고 0.30–0.42m (침대 안착 기준) |
| 재질 | PBR baseColor(+선택 normal) ≤ 1024², unlit 금지, 외부 URL 텍스처 금지 |
| 리그/클립 | 선택. 포함 시 클립 이름 `Idle` / `Blink` / `EarTwitch` / `TailSway` / `Look` / `Nuzzle` / `Meow` / `Rest` |
| 라이선스 | 상용 가능 + 출처 문서화(§License), 사람 승인 커밋과 함께 등록 |

### 6.3 fallback 규칙 (자산 미승인/실패 시)

- 승인 GLB가 **없으면** 절차 리그가 그대로 보인다(현재 상태).
- GLB **로드 실패 / 파싱 실패 / 누락**이면 절차 리그로 되돌아간다 —
  화면이 비거나 던지지 않는다. lazy 3D chunk 자체가 실패하면 상위는 최신
  2.5D로 fallback한다(가드 #110).

### 6.4 GLB 승격 절차 (한 커밋 묶음)

three의 클립 재생기(`AnimationMixer`)는 가드 #110(h)이 pet-room-3d
디렉터리에서 막고 있다. 이는 "승인 에셋 없이 클립 기계부터 들어오는 것"을
막는 장치다. 따라서 GLB 도입은 다음을 **한 커밋 묶음**으로만 한다:

1. 승인 `.glb` 에셋 커밋(+ 라이선스 증빙).
2. `buildCatRig()` 내부를 GLB 구현으로 교체(같은 §6.1 계약 유지) + GLTFLoader
   lazy 로드 + 로드 실패 시 절차 리그 fallback.
3. 클립 재생이 필요하면 가드 #110(h)을 **삭제가 아니라 교체**한다:
   approved-asset 경로 + 클립 allowlist + mixer dispose + reduced-motion 정적
   자세 + QA 를 검사하도록.
4. bundle 증가량(전/후)과 모바일 실기기 성능을 보고.

그 전까지 리그 모션은 `catRig.js`의 transform 애니메이션(호흡·눈꺼풀·귀·
tail 관절 + 접촉 방향 tap/pet/nuzzle reaction)만 사용한다.

### 6.5 Canonical identity + asset manifest (Phase D-2)

§6.2의 기술 요구를 만족해도 **identity가 canonical과 다르면 불합격**이다.
canonical visual identity = 승인 2D 흰색 아기 고양이
(`public/assets/pets/white_kitten_main.webp` 외 표정 세트). 고정 특징·금지
목록·승인 체크리스트는 `docs/NOF_CANONICAL_KITTEN_ART_DIRECTION.md`가 정의한다.
"그냥 고양이처럼 보이는 모델"은 기능이 동작해도 승인하지 않는다.

visual provider는 두 가지뿐이다:

| provider | 역할 | 사용자 노출 |
| --- | --- | --- |
| `procedural` | 개발 fallback + 구조 검증 (`catRig.js`) | debug/실험 flag 하에서만 |
| `approved-glb` | canonical identity를 계승한 승인 GLB | 승인 후 기본 |

승인 GLB가 붙기 전 어떤 코드도 `approved-glb` 경로를 선언하지 않는다
(GLTFLoader/AnimationMixer 선반입 금지 — §6.4, 가드 #110h). 승격 커밋은
아래 manifest를 실제 값으로 채워 에셋과 함께 등록한다:

```json
{
  "id": "nof-canonical-white-kitten-v1",
  "status": "pending-approval",
  "sourceReference": "public/assets/pets/white_kitten_main.webp",
  "modelPath": null,
  "licensePath": null,
  "identityApproved": false,
  "technicalApproved": false,
  "animationApproved": false
}
```

- `identityApproved` — 사용자 육안 승인 (ART_DIRECTION §4 IDENTITY 체크리스트).
- `technicalApproved` — §6.2 + validator 통과.
- `animationApproved` — 리깅/클립 별도 checkpoint (정적 mesh 승인과 분리).
- 세 항목이 모두 true가 되기 전에는 일반 사용자 화면에 노출하지 않는다.

## 7. 사운드 (Phase C-4 — 파일 대기 중)

경로·게이트는 `src/hooks/usePetSound.js` 계약 그대로: 실제 파일이 존재해야
재생되고(HEAD probe + content-type 검사), 사용자 제스처 이후에만 호출되며,
없으면 조용한 no-op이다. 필요한 파일:

| 파일 | 내용 | 스펙 |
| --- | --- | --- |
| `public/assets/sounds/cat_meow_soft.mp3` | 짧고 부드러운 울음 1회 | ≤ 1.2s, ≤ 80KB, 잔잔한 레벨(과도한 피크 금지) |
| `public/assets/sounds/cat_purr_soft.mp3` | 낮고 고른 반응음 | 1.5–2.5s, ≤ 120KB, 페이드 인/아웃 |

라이선스 상용 가능 + 출처 문서화. 파일이 실제로 붙기 전까지 UI는 소리를
약속하지 않는다(무음 fallback + 소리 토글 숨김, 가드 #26/#33).
