# NOF_CANONICAL_KITTEN_ART_DIRECTION.md

NoF 고양이 캐릭터의 단일 canonical visual identity 정의 — 모든 신규 고양이 비주얼(2D 추가 프레임, multi-view reference pack, image-to-3D 생성물, GLB 후보, procedural fallback)의 승인 기준 문서.

- 결정일: 2026-07-13 (사용자 직접 결정)
- 결정 내용: 기존 승인 2D 흰색 아기 고양이가 NoF 고양이의 canonical character다. 새로운 3D 고양이는 이 캐릭터와 **같은 인물**이어야 한다. "그냥 고양이처럼 보이는 모델"은 불합격.
- 관련: `CHARACTER_SYSTEM_SPEC.md §13`의 Ember Cat(검은 잉크 실루엣)은 **사람 확정 전 후보**였다. 시각 identity에 한해 본 문서가 우선한다. 성격·성장·금지 규칙(§3–§6: 차분한 동료, 비난 금지, 죽음/퇴화 금지)은 계속 유효하다.

---

## 1. Canonical reference 이미지

| 역할 | 파일 | 해상도 | 비고 |
|---|---|---|---|
| **주 identity reference** | `public/assets/pets/white_kitten_main.webp` | 1122×1402 | 정면 앉은 자세, 한 발 든 포즈. 어두운 중립 배경 + 따뜻한 rim light |
| 3/4 + 발바닥 | `public/assets/pets/white_kitten_wave.webp` | 1024×1536 | 정면 3/4, 분홍 발바닥 패드 |
| 표정 세트 | `white_kitten_blink / happy / sleep / sad_soft.webp` | 1086×1448 | 표정 변화의 허용 범위 |
| 포즈 어휘 | `public/assets/pets/state_sheet_cats.webp` 상단 흰 고양이 행 | 1402×1122 (셀당 약 230×280) | 앉기·인사·조르기·놀이 crouch(측면에 근접)·수면·시무룩 |
| 방 합성 장면 | `public/assets/rooms/ember_room_with_white_kitten.webp` | 1448×1086 | **identity 참고용만** — 방 배경이 합쳐져 있어 3D 생성기 입력 금지 |

주의: 모든 원본은 lossy WebP, **alpha 없음**(배경 분리 레이어 없음, `petAssets.js`의 `spriteReady:false`가 이를 기록). 따라서 3D 생성 전에 **배경 제거된 multi-view character reference pack 제작이 선행**되어야 한다 (`docs/prompts/NOF_KITTEN_MULTIVIEW_GENERATION_PROMPT.md`).

## 2. 고정 특징 (모든 신규 비주얼이 계승)

### FACE
- 아기 고양이의 둥글고 짧은 얼굴. 볼이 넓고 부드럽게 둥글다.
- 주둥이 돌출이 거의 없는 짧은 muzzle — 옆에서 봐도 개처럼 튀어나오지 않는다.
- 작고 연한 분홍색 삼각 코. 콧등은 짧다.
- 입 주변에 검은 마스크·검은 콧수염 형태 금지. 수염은 가늘고 흰색, 절제된 길이.
- 밝고 부드러운 흰색 볼. 무섭거나 사람 같은 표정 금지.

### EYES
- 크고 둥글며 맑은 눈. 얼굴 폭 대비 뚜렷하게 크지만 스티커처럼 과장되지 않는다.
- 따뜻한 dark amber / deep brown iris + 큰 검은 동공.
- 작고 자연스러운 catchlight 1–2개.
- 검은 구슬을 붙인 장난감 눈 금지 (iris 없는 단색 검은 반구 금지).
- 서로 너무 붙거나 벌어지지 않음 — canonical 이미지의 간격 유지.
- 눈썹처럼 보이는 검은 구조물 금지.

### EARS
- 적당히 큰 삼각 귀, 끝이 부드럽게 둥글다.
- 안쪽은 연한 분홍 (deep-pink inner fur).
- 지나치게 뾰족하거나 뿔처럼 보이면 안 됨. 얼굴보다 과도하게 길면 안 됨.
- 머리 위 약간 바깥쪽에 위치 — 수직으로 곧추서지 않는다.

### FUR
- 따뜻한 ivory-white 단색. 짧고 부드러운 복슬 털 (short fluffy).
- 플라스틱·도자기·고무 재질처럼 보이면 안 됨 — 표면에 잔털 느낌이 필요.
- 과도한 회색/갈색 point pattern 금지 (귀끝·꼬리끝 어두운 포인트 금지).
- 얼룩·줄무늬·마킹 금지. 목걸이·리본 등 액세서리 금지.

### BODY
- 작고 통통한 아기 고양이 체형. 머리가 몸에 비해 약간 큰 비율(대략 머리:전신 = 1:2.5 미만의 아기 비율).
- 짧고 단정한 다리, 분홍 발바닥 패드.
- 자연스러운 앉은 자세가 기본 포즈.
- 지나치게 긴 몸통, 개 체형, 족제비 체형 금지.
- 꼬리는 부드럽고 자연스럽게 몸 옆에 놓임 — 과장된 S자 흔들기 금지.

### EXPRESSION
- 순하고 호기심 있는 표정. 편안함과 애착을 유도.
- 허용 범위 = 기존 표정 세트: 기본 / 눈 깜빡임 / 기뻐함(눈웃음) / 잠 / 시무룩(sad_soft) / 인사.
- 과도한 웃음, 사람 이빨, 찡그림, 우는 얼굴 금지 (실패 시에도 sad_soft가 하한 — CHARACTER_SYSTEM_SPEC §6).

### 렌더 톤
- 세미리얼(soft-fur semi-realistic) — 사진도 아니고 스티커 만화도 아니다.
- NoF ember 조명(따뜻한 앰버 rim light)과 어울리는 따뜻한 화이트 밸런스.

## 3. 금지 목록 (하나라도 해당하면 불합격)

1. canonical 이미지와 다른 인물로 보이는 얼굴 (정면 비교에서 동일 캐릭터로 인식 불가)
2. 개·강아지·족제비·인형(봉제/도자기)으로 읽히는 실루엣 또는 재질
3. 검은 muzzle 마스크, 돌출된 개 주둥이
4. 구슬형 장난감 눈, iris 없는 눈, 사람 눈
5. 뿔형/과대 귀, 분홍 inner 없는 귀
6. 회색·갈색 포인트, 얼룩, 줄무늬, 목걸이, 액세서리
7. 성체 비율(작은 머리, 긴 몸통, 긴 다리)
8. 사람 이빨·과장 표정·위협/슬픔 과잉 표정
9. 2D billboard를 3D로 위장, 스크린샷 texture plane (nof-pet-honesty 위반)

## 4. 최종 승인 체크리스트 (3D 후보 평가용)

IDENTITY — 모두 PASS 필요
- [ ] 정면 렌더를 `white_kitten_main.webp` 옆에 놓았을 때 같은 캐릭터로 보인다
- [ ] 눈 크기·간격·iris 색이 canonical 범위
- [ ] 코가 작은 분홍 삼각형, muzzle이 짧다
- [ ] 귀 크기·위치·분홍 inner 일치
- [ ] ivory-white 무마킹 털 + 잔털 질감
- [ ] 아기 체형 비율 (머리 큼, 다리 짧음, 통통)
- [ ] 옆면·후면에서도 고양이다움 유지 (개/족제비 실루엣 아님)
- [ ] 기본 표정이 순하고 편안하다

TECHNICAL — `pet-room-3d/ASSET_CONTRACT.md §6.2` + Phase D-2 acceptance contract 참조
- [ ] GLB(glTF 2.0), Y-up, meter, 발바닥 중앙 origin, 외부 texture URL 없음
- [ ] mesh 찢어짐/겹침 없음, 눈·입이 mesh에 묻히지 않음
- [ ] 모바일 poly/texture budget 내

PROCESS
- [ ] 라이선스/소유권 기록 완료 (nof-asset-license-review)
- [ ] 사용자 육안 승인 완료 — **identity 승인 전 일반 사용자 노출 금지**

## 5. 운영 규칙

- procedural geometry(`catRig.js`)는 개발 fallback 전용. 최종 사용자 화면에는 승인 GLB 또는 최신 2.5D만 노출한다.
- reference와 닮지 않은 모델은 기능(터치 반응·성능·honesty copy)이 완벽해도 승인하지 않는다.
- 승인 판단의 1차 질문은 항상: **"이것은 그 고양이인가?"**
