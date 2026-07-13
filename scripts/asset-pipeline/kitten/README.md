# NoF Kitten Asset Pipeline (scripts/asset-pipeline/kitten/)

Canonical 2D 흰 아기고양이(`public/assets/pets/white_kitten_main.webp`)를
승인 GLB 3D 모델로 만드는 자동화 파이프라인의 스크립트 모음.
제품 코드와 분리되어 있고, 어떤 스크립트도 앱 번들에 포함되지 않는다.

## 단계 지도

| 단계 | 도구 | 상태 |
|---|---|---|
| 1. canonical 수치 분석 | `measure_canonical.py` (pure stdlib) | ✅ 실행 완료 — `docs/NOF_CANONICAL_KITTEN_MEASURED_REFERENCE.md` |
| 2. 배경 제거 작업 사본 | rembg (venv `~/.venvs/nof-kitten`, u2net) | 결과는 `Downloads/NoF-kitten-production/source-clean/` — 원본 무수정 |
| 3. 8-view 멀티뷰 생성 | `generate-multiview.mjs` (Gemini image API) | ⏸ `GEMINI_API_KEY` 대기 |
| 4. identity gate | 사람 검수 — `docs/NOF_KITTEN_MULTIVIEW_IDENTITY_GATE.md` 13항 | 자동 승인 없음 |
| 5. image-to-3D | Meshy/Tripo — `docs/NOF_KITTEN_IMAGE_TO_3D_HANDOFF.md` | ⏸ 사용자 결제 승인 대기 |
| 6. Blender 보정 | headless Python (Blender 미설치 — 설치 승인 대기) | ⏸ |
| 7. 최적화/검증 | `npx @gltf-transform/cli` + glTF-Validator | npx로 실행 가능 (미설치) |

## generate-multiview.mjs

```bash
# 프롬프트·비용 미리보기 (API 호출 없음)
node scripts/asset-pipeline/kitten/generate-multiview.mjs --views 01 --dry-run

# 정면 3후보 생성 (front 승인 후 나머지 view 진행)
GEMINI_API_KEY=... node scripts/asset-pipeline/kitten/generate-multiview.mjs --views 01 \
  --output-dir /mnt/c/Users/<user>/Downloads/NoF-kitten-production/multiview-candidates

# front 승인 후 나머지 7 view
GEMINI_API_KEY=... node scripts/asset-pipeline/kitten/generate-multiview.mjs --views 02,03,04,05,06,07,08 \
  --output-dir /mnt/c/Users/<user>/Downloads/NoF-kitten-production/multiview-candidates

# view별 후보 contact sheet (ffmpeg)
node scripts/asset-pipeline/kitten/generate-multiview.mjs --views 01 --sheet \
  --output-dir /mnt/c/Users/<user>/Downloads/NoF-kitten-production/multiview-candidates
```

출력 경로 결정 순서 (machine별 사용자명이 달라 하드코딩 없음):
1. `--output-dir <path>` (alias `--out`)
2. 환경변수 `NOF_KITTEN_OUTPUT_DIR`
3. 기본값 `~/NoF-kitten-production/multiview-candidates` (WSL home — Windows Downloads를 자동 추측하지 않음)

- 집 PC 예: `--output-dir /mnt/c/Users/Sinabro/Downloads/NoF-kitten-production/multiview-candidates`
- 회사 PC 예: `--output-dir /mnt/c/Users/HDEC/Downloads/NoF-kitten-production/multiview-candidates`

- 프롬프트는 `docs/prompts/NOF_KITTEN_MULTIVIEW_GENERATION_PROMPT.md` 최종판을 그대로 내장.
- reference로 `white_kitten_main.webp`(주) + `white_kitten_wave.webp`(보조)를 함께 첨부.
- 출력: `Downloads/NoF-kitten-production/multiview-candidates/<view>/…__candN.png` + run-log JSON.
- 비용: gemini-2.5-flash-image 유료 티어 ≈ $0.039/장 (8 view × 3후보 = 24장 ≈ $0.94).
  AI Studio 무료 티어 key면 $0 (rate limit만 있음, 스크립트가 8초 간격 + 429 backoff 처리).

## 경계 (변경 금지)

- API key는 환경변수로만 — 파일/repo 저장 금지.
- 생성물은 repo 밖(`Downloads/NoF-kitten-production/`) — repo 반입은 사용자 승인 후.
- 어떤 단계도 identity gate(사람 검수)를 건너뛰고 다음 단계로 자동 진행하지 않는다.
- 결제·계정 생성·3D 업로드는 전부 사용자 승인 후 (`docs/NOF_KITTEN_IMAGE_TO_3D_HANDOFF.md`).
- procedural cat(`catRig.js`)은 debug/fallback 전용 — 최종 자산 아님.
