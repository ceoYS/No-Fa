# NOF_KITTEN_IMAGE_TO_3D_HANDOFF.md

Identity gate를 통과한 8-view pack을 image-to-3D 생성기에 넘기는 절차서.
**이 문서는 준비서다 — 실제 결제·계정 생성·업로드·다운로드는 전부 사용자 승인 후에만 한다.**

## 0. 입력 조건 (선행)

- `docs/NOF_KITTEN_MULTIVIEW_IDENTITY_GATE.md` 13항 × 8장 전부 통과.
- 도구 비교·권장: `Downloads/NoF-canonical-kitten-3d-plan/08_tool_comparison.md`
  (Meshy 6 Pro $20/1mo 권장, Tripo Pro 대안, Hunyuan3D 한국 라이선스 제외로 탈락).

## 1. 입력 파일 규칙

| 항목 | 값 |
|---|---|
| 파일명 | `nof_kitten_ref_01_front.png` … `nof_kitten_ref_08_neutral_pose.png` |
| 해상도 | ≥1024×1024 (생성 원본 그대로, 업스케일 금지) |
| 배경 | 제거(transparent PNG) 또는 균일 light-gray — 도구가 배경 제거를 지원하면 도구 쪽 사용 |
| 배경 제거 방식 | 생성물이 neutral gray 단색 배경이므로 단순 키잉으로 충분. 수동 도구(예: GIMP/Photopea) 또는 생성기 내장 remove-background. 털 가장자리 반투명은 과하게 깎지 말 것 |
| view 매핑 | Meshy Multi-View: main=01_front, +03_left, +04_right, +05_back. Tripo(2–4 views): 01/03/04/05 우선, 나머지는 검수·비교용 |

## 2. 생성기 설정 (Meshy 6 기준, Tripo 유사)

| 설정 | 값 | 이유 |
|---|---|---|
| 모드 | Image-to-3D, **Multi-View** | 단일 이미지 모드는 안 보이는 각도를 환각함 |
| Texture 생성 | ON (PBR) | baseColor 필요; unlit 금지 (`ASSET_CONTRACT.md §6.2`) |
| Geometry detail | 중간 — 최종 목표 ≤15k tris (상한 30k)이므로 과밀 생성 불필요 | 모바일 poly budget |
| Symmetry | **ON (좌우 대칭)** | canonical kitten은 대칭 개체 — 비대칭 identity는 불합격 항목이기도 함 |
| 자동 리깅 | 이번 단계에서는 **OFF** | 정적 mesh 승인(GATE 2)과 리깅(GATE 3)은 별도 checkpoint |
| 출력 | **glTF 2.0 `.glb`, 텍스처 임베드** | §6.2 요구 포맷 |

## 3. 후보 생성·비교 (최소 3개)

- 같은 입력으로 **후보 ≥3개** 생성 (seed/variation 다르게).
- 비교 방법: 각 후보를 같은 각도 4방(front/left/back/top)으로 캡처 →
  `01_front` 원본과 나란히 격자로 놓고 GATE 1 (identity) 항목으로 채점.
- 판정 기준 (하나라도 미달이면 그 후보 탈락):
  - canonical identity ("그 고양이인가?")
  - 정면·측면·후면 형태가 8-view pack과 일치
  - 눈·입 geometry가 mesh에 살아 있음 (텍스처로만 그려진 눈 = 탈락)
  - 발가락·꼬리·귀 mesh 분리·완결
  - 찢어진 면/구멍/뒤집힌 normal 없음
  - texture seam이 눈·얼굴을 가로지르지 않음
  - 리깅 가능한 topology (극단적 비均一 밀도·비-manifold 없음)

## 4. 생성 직후 확인할 실패 유형 (알려진 image-to-3D 실패 모드)

- 측면 주둥이 돌출 (입력이 좋아도 융합 중 재발 가능)
- 귀 융합(머리에 붙어버림)·귀 내부 구멍
- 꼬리가 몸통과 한 덩어리로 붙음
- 다리 사이 막(webbing) / 발 뭉개짐
- 눈이 파이거나 볼록 렌즈처럼 튀어나옴
- 텍스처가 몸 아래쪽에서 어두운 얼룩(가짜 그림자 bake)
- 좌우 비대칭 (symmetry OFF였거나 입력 불일치)

## 5. Blender로 넘길 파일

- 선택된 후보의 `.glb` (텍스처 임베드 원본)
- 가능하면 생성기의 고해상 texture 원본 (재-bake 대비)
- 8-view pack (identity 대조용)
- `docs/NOF_CANONICAL_KITTEN_ART_DIRECTION.md` + `3d_asset_acceptance_checklist.md`
- Blender 작업 목록: 스케일(m, Y-up, 원점=발바닥, +z 정면) → 리토포/decimate(≤15k tris) →
  눈·입 표면 분리 → Blink shape key → (별도 checkpoint) Rigify 리깅 →
  glTF 2.0 export → `gltf-transform` 압축(≤1.5MB) → glTF-Validator 에러 0

## 6. 라이선스 증빙 저장 위치

- 결제 영수증·플랜 화면·이용약관 캡처: `Downloads/NoF-kitten-multiview-input/license/`
  (파일명 `meshy_pro_receipt_<날짜>.png` 식)
- repo 반입 시(승격 커밋): `src/components/pet-room-3d/licenses/` 에 사본 +
  `ASSET_CONTRACT.md §6.5` manifest의 `licensePath` 기입.
- 무료 tier 산출물은 반입 금지 (Meshy free=CC-BY 크레딧 의무, Tripo free=비상업).

## 7. 이 단계에서 하지 않는 것

- GLTFLoader/AnimationMixer 코드 선반입 (guard #110h — 승격 커밋에서만 교체)
- procedural cat 외형 수정 (최종 반려 확정)
- repo에 GLB/이미지 추가, commit/push/deploy
