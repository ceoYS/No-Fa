# NOF_KITTEN_PHASE_D3_HOME_TO_COMPANY_HANDOFF.md

집 PC → 회사 PC로 canonical kitten 자동화 작업을 이어가기 위한 checkpoint 문서.
작성일 2026-07-14 (집 작업 종료 시점).

## 1. 기준 branch / baseline

- Branch: `wip/pet-room-scene-mode`
- 이 checkpoint의 부모 commit: `665b957a9226a15b8329508893b19c3105a06c52`
  (`feat: add procedural 3D cat prototype`)
- 이 문서가 포함된 commit: `feat: prepare canonical kitten 3D pipeline`

## 2. 이 checkpoint의 목적

canonical 흰 아기고양이(2D 승인 원본)를 실제 3D GLB로 만드는 자동화 파이프라인의
**KEEP-only 상태**를 원격 브랜치에 봉인해서, 다른 PC에서 같은 지점부터 이어가게 한다.
제품 기능 추가 커밋이 아니라 파이프라인 준비 커밋이다.

## 3. KEEP된 코드 계약 (`src/components/pet-room-3d/`)

이 커밋의 제품 코드 3파일(ASSET_CONTRACT.md / PetRoom3D.jsx / catRig.js)에는
Phase D에서 검증된 **구조만** 들어 있다:

- canonical asset/provider 계약 + 승인 gate (manifest, approved-GLB 승격 인터페이스)
- tap / pet / nuzzle reaction state machine + cooldown
- raycast 접촉 방향 전달 (nuzzle = 포인터 접촉 기울임, 손 추적 아님)
- edit mode interaction 차단, reduced-motion 대응
- sound hook 구조 (승인 음원 없음 → silent)
- 정직한 카피 (procedural cat을 최종 디자인이라 주장하지 않음)

## 4. HOLD — 커밋되지 않은 것

반려된 **procedural 외형 변경**(얼굴·눈·귀·muzzle·body geometry, material/palette)은
이 커밋에 **포함되지 않았다**. 보존본은 집 PC
`Downloads/NoF-phase-d3-home-handoff-backup/nof-phase-d-hold-procedural-visual.patch`에만 있다.
제품에 적용하거나 커밋하지 않는다. procedural cat은 debug/fallback 전용이다.

## 5. Canonical source (repo 내)

- 주: `public/assets/pets/white_kitten_main.webp` — 단일 canonical identity
- 보조: `public/assets/pets/white_kitten_wave.webp` — 참조용, main보다 우선하지 않음

## 6. 생성된 문서

- `docs/NOF_CANONICAL_KITTEN_ART_DIRECTION.md` — identity 정의/아트 디렉션
- `docs/NOF_CANONICAL_KITTEN_MEASURED_REFERENCE.md` — 픽셀 실측 기준표 (비율/색)
- `docs/NOF_KITTEN_MULTIVIEW_IDENTITY_GATE.md` — 13항 사람 검수 gate (전항 통과제)
- `docs/NOF_KITTEN_IMAGE_TO_3D_HANDOFF.md` — Meshy/Tripo image-to-3D 절차 + 결제 경계
- `docs/prompts/NOF_KITTEN_MULTIVIEW_GENERATION_PROMPT.md` — 8-view 프롬프트 최종판
- 이 문서

## 7. 자동화 스크립트 (`scripts/asset-pipeline/kitten/`)

- `measure_canonical.py` — canonical 픽셀 측정 (pure stdlib, 입력은 argv로 받은 PPM)
- `generate-multiview.mjs` — Gemini image API 8-view 후보 생성기 (zero-dep Node)
- `README.md` — 단계 지도 + 실행 예시 + 경계

## 8. 집 PC에만 있고 Git에 없는 것

- `Downloads/NoF-kitten-production/` 산출물 (분석 PPM/PNG, rembg 결과, 후보 폴더)
- `Downloads/NoF-phase-d3-home-handoff-backup/` (patch 백업)
- rembg venv: `~/.venvs/nof-kitten/`
- u2net 모델 캐시: `~/.u2net/` (176MB)
- API key (어디에도 저장 안 됨 — 환경변수로만 주입)

회사 PC에서 멀티뷰 생성만 할 거면 위 항목 없이 스크립트만으로 충분하다.
rembg 단계는 이미 완료됐고 결과는 identity 참조용일 뿐이라 회사에서 재실행 불필요.

## 9. 회사 PC repo 경로

`/mnt/d/Projects/No-Fa`

## 10. 회사 output 경로

`/mnt/c/Users/HDEC/Downloads/NoF-kitten-production`

## 11. 회사에서 실행할 명령

```bash
cd /mnt/d/Projects/No-Fa
git fetch origin
git switch wip/pet-room-scene-mode
git pull --ff-only origin wip/pet-room-scene-mode

# 상태 확인 (API 호출 없음)
node scripts/asset-pipeline/kitten/generate-multiview.mjs --views 01 --dry-run
```

## 12. Gemini API key 주입 방법

환경변수로만. 파일/.env/repo에 저장 금지:

```bash
GEMINI_API_KEY=<key> node scripts/asset-pipeline/kitten/generate-multiview.mjs ...
```

key는 https://aistudio.google.com/apikey 에서 발급 (무료 티어 가능).
스크립트는 key를 출력하지 않고 어떤 파일에도 쓰지 않는다.

## 13. 정면 후보 3장만 생성하는 명령

```bash
GEMINI_API_KEY=<key> node scripts/asset-pipeline/kitten/generate-multiview.mjs \
  --views 01 --candidates 3 \
  --output-dir /mnt/c/Users/HDEC/Downloads/NoF-kitten-production/multiview-candidates
```

## 14. 순서 규칙

정면(view 01)이 identity gate를 통과해 **사용자 승인**을 받기 전에는
나머지 7 view(02–08)를 생성하지 않는다. 자동 승격 없음.

## 15. 다음 작업의 시작 상태

이 checkpoint push 이후에도 **commit / push / deploy 금지** 상태로 시작한다.
다음 커밋은 사용자가 명시적으로 지시할 때만 만든다. main/Vercel/production 무접촉.

## 16. 회사 네트워크에서 Gemini API가 차단될 경우

- 반복 설치·프록시/우회 시도 금지.
- 실패한 요청의 에러(HTTP status, 응답 본문)만 증거로 보고.
- 개인 네트워크(테더링) 또는 집 PC 실행으로 전환한다.
