# NOF_CANONICAL_KITTEN_MEASURED_REFERENCE.md

Canonical identity 원본 `public/assets/pets/white_kitten_main.webp`의 **수치 측정 기록**.
멀티뷰 생성 결과 검수(`NOF_KITTEN_MULTIVIEW_IDENTITY_GATE.md`)와 3D 후보 비교 시
"눈이 커/작아 보인다" 같은 인상 판정을 수치로 뒷받침하는 기준표다.

## 측정 방법 (재현 가능)

```bash
ffmpeg -i public/assets/pets/white_kitten_main.webp /tmp/kitten.ppm
python3 scripts/asset-pipeline/kitten/measure_canonical.py /tmp/kitten.ppm
```

- `[A]` = 스크립트 자동 측정 (임계값 기반 영역 검출 + 5×5 픽셀 평균 색 샘플).
- `[V]` = 사람이 이미지를 보고 좌표를 지정한 시각 측정 (±10px 오차 가정).
- 원본 좌표계: 1122×1402px, x→오른쪽, y→아래. "viewer-left" = 화면 왼쪽.
- 측정 원본 JSON: `Downloads/NoF-kitten-production/analysis/measured.json`

## 1. 원본 파일

| 항목 | 값 |
|---|---|
| 해상도 | 1122×1402 (portrait) |
| 포맷 | WebP VP8 lossy, YUV, **alpha 없음**, 배경 포함 |
| 크기 | 148,472 B |
| 포즈 | 앉은 자세, 오른쪽 앞발(viewer 중앙-왼쪽)을 들어 발바닥 노출, 고개 살짝 기울임 |
| 카메라 | 거의 눈높이 정면(약간 3/4), 망원 인물 화각 |

## 2. 기하 측정

| 항목 | 측정값 | 방법 |
|---|---|---|
| 눈 어두운 코어(동공+어두운 iris rim) 등가 지름 | L 99.6px / R 92.7px | [A] |
| 눈 전체(amber ring 포함) 지름 | ~130px (±10) | [V] |
| 눈 중심 좌표 | L (516, 613) / R (726, 554) | [A] |
| 눈 중심 간 거리 | 218px | [A] |
| 눈선 기울기(머리 기울임) | 자동 15.6° (eyelid rim 오염 포함) → 실제 ~10° | [A]+[V] |
| 코(진분홍 코어) bbox | 53×44px, 중심 (652, 667) | [A] |
| 코 아래 입선 위치 | ~(655, 715) | [V] |
| 코 하단→턱 거리 (muzzle 깊이) | ~65px — **극단적으로 짧음, 돌출 없음** | [V] |
| 머리 폭 (볼 기준, y≈620) | ~575px | [V] |
| 머리 높이 (정수리 y≈330 → 턱 y≈760) | ~430px | [V] |
| **얼굴 폭/높이 비** | **≈1.33 — 세로보다 가로가 넓은 둥근 아기 얼굴** | 계산 |
| 귀 끝 좌표 | L ~(280, 355) / R ~(762, 195) | [V] |
| 앉은 전체 높이 (귀 끝 y≈195 → 바닥 y≈1240) | ~1045px | [V] |
| **머리/전체 비** (귀 제외 머리 430px ÷ 1045px) | **≈41% — 머리가 큰 아기 비율** | 계산 |
| 들어올린 앞발 발바닥 중심 | ~(555, 1075) | [V] |
| 꼬리 | 바닥에 감김(viewer-left), 두께 ~90px — 통통함 | [V] |

### 검수용 무차원 비율 (해상도 무관 — 생성물·3D 후보에 그대로 적용)

| 비율 | 값 |
|---|---|
| 눈 전체 지름 ÷ 머리 폭 | ≈0.23 |
| 눈 중심 거리 ÷ 머리 폭 | ≈0.38 |
| 눈 중심 거리 ÷ 눈 전체 지름 | ≈1.7 (눈 사이가 눈 하나보다 조금 넓음) |
| 코 폭 ÷ 머리 폭 | ≈0.09 |
| muzzle 깊이(코→턱) ÷ 머리 높이 | ≈0.15 |
| 얼굴 폭 ÷ 얼굴 높이 | ≈1.33 |
| 머리 높이 ÷ 앉은 전체 높이 | ≈0.41 |

## 3. 색 측정 (5×5 평균, hex)

| 부위 | 샘플 | 판정 |
|---|---|---|
| 동공 | `#000000` / `#0b0a03` | 순흑 |
| iris (조명 받은 면) | `#e6a84e` | **warm amber** — identity 색 |
| iris (어두운 rim) | `#502702` | dark amber-brown |
| 코 (밝은 면 / 그늘 면) | `#d9886b` / `#a04a31` | 중립광 환산 = 연분홍 (주황끼는 조명) |
| 귀 안쪽 (밝은 쪽 / 그늘 쪽) | `#e4c2b3` / `#b87456` | soft pink |
| 발바닥 패드 | `#cf7964` | pink (조명 warm cast 포함) |
| 털 — 이마 (조명 왜곡 최소) | `#eee2db` | **ivory-white — canonical 털색 기준** |
| 털 — 몸통 | `#e2cbb9` | warm cast |
| 털 — 측면 그늘 | `#7b5a41` | **주황 바운스 = 조명이지 털색 아님** |
| 배경 / 바닥 | `#030100` / `#1f1005` | 거의 검정 + warm 입자 |

## 4. 조명 분리 (identity가 아닌 것)

원본의 강한 앰버 rim light·주황 그늘·검정 배경은 전부 **장면 조명**이다.
identity는: ivory-white 털(`#eee2db` 근방) + warm dark amber iris + 연분홍 코/귀/발바닥.
멀티뷰 reference pack은 중립광 light-gray 배경으로 생성한다
(`docs/prompts/NOF_KITTEN_MULTIVIEW_GENERATION_PROMPT.md` master prompt에 이미 강제됨).
3D 생성기가 조명색을 털색으로 굽지 않게 하기 위한 분리다.

## 5. 포즈 주의

원본은 **앉은 포즈**(한 발 든)지만, 멀티뷰 pack은 **neutral standing pose 8장**이다 —
원본은 identity(얼굴·비율·색) 참조로만 쓰고, 포즈는 prompt가 정의한다.

## 6. 한계 (정직 기록)

- 자동 눈 측정은 어두운 eyelid rim을 포함해 bbox가 실제 안구보다 넓다 —
  등가 지름(area 기반)이 더 신뢰할 값이다.
- 오른눈(viewer-right) 자동 기울기 15.6°는 위 눈꺼풀 rim 오염 포함 — 시각 판정 ~10°.
- `[V]` 좌표는 사람 판독이라 ±10px 오차. 비율표는 이 오차 안에서 유효.
- 색은 sRGB 가정, lossy WebP 디코드 값 — 절대색이 아니라 상대 비교용.
