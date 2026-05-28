# claude-design-nof-visual-v3 — README

NoF 다음 Claude Design 브리프 (v3) — 펫 기반 회복 캘린더 방향 P0 비주얼 탐색

작성일: 2026-05-28
상태: Claude Design 핸드오프 README / 방향 탐색용 / 최종 프로덕션 UI 아님 (사람 승인 전)

---

## 0. 이 핸드오프의 목적 (Purpose)

이 README는 **다음 Claude Design 라운드(v3)** 의 입력이다. v2(`handoff/claude-design-nof-visual-v2/`)의 Ink & Ember 3화면 패턴을 이어받되, **새로 확정된 펫 + 회복 캘린더 방향**으로 디자인을 진행하게 한다.

- 이번 산출물은 **P0 비주얼 탐색(exploration)** 이다. **최종 프로덕션 UI가 아니다.** 색·hex·전체 화면 확정은 사람 시각 승인 후.
- 빈 입력으로 던지지 않는다. 아래 입력 문서·이미지 앵커를 함께 사용한다.
- 실제 고양이 이미지는 **Claude Design 안에서 사용자가 직접 업로드**한다. **Git에는 저장하지 않는다.** 이 핸드오프에는 이미지 파일이 없다(텍스트 브리프만).

---

## 1. 무엇이 바뀌었나 (What's new in v3)

| 항목 | v2 | v3 (이번) |
|---|---|---|
| 코어 정서 엔진 | 캐릭터(보조 존재감) | **펫(고양이) 돌봄이 매일 여는 이유** |
| 구조 입력 | Mobbin 패턴 | **Failendar 적응 구조**(잔불 캘린더·절제 일수·트리거·보호 리마인더·패턴 인사이트) |
| 캘린더 | 없음(스트릭 위주) | **잔불 캘린더(Ember Calendar)** — 홈 미니 스트립 P0, 월/주 뷰 P1 |
| 펫 | Ember Cat 단일 후보 | **펫 4종 + 다크 잔불 방** 비주얼 앵커 |
| 캐릭터 이미지 | 텍스트 묘사 | **사용자가 Claude Design에 업로드**(Git 미저장) |

근거 문서: `docs/FAILENDAR_TO_NOF_ADAPTATION.md`, `docs/PET_CUSTOMIZATION_SPEC.md`, `docs/CHARACTER_SYSTEM_SPEC.md` §13.

---

## 2. 확정/유력 방향 (Direction)

- **Main visual direction:** Ink & Ember (딥 잉크/차콜 베이스 + 따뜻한 앰버 소량 액센트). 다크 = 프리미엄·집중(음침·공포 아님). 빨강 경고색 금지.
- **구조 보정:** Slate & Moss (카드 위계·정보 구조).
- **보류/폐기:** Cool Paper (generic beige / wellness diary) — 회귀 금지.
- **펫 세계관:** 어두운 잉크 방에서 작은 고양이가 사용자의 절제 공간을 함께 지킨다. 앰버는 눈·꼬리 끝·숨결·주변 잔불에만 소량. 귀엽지만 유치하지 않게(큰 눈/볼터치/과한 표정 금지). 조용한 동료 — 감시자·판단자 아님.
- **톤 좌표:** 차분한 프리미엄 + 따뜻한 인간미 + 비감시 자기통제. 따뜻함은 색(베이지)이 아니라 카피·펫·여백·동료성으로.
- **언어:** 한국어 카피 · 한글 타이포(Pretendard 계열) 전제.

---

## 3. 펫 캐릭터 방향 (Pet character)

`PET_CUSTOMIZATION_SPEC.md` §10 MVP 4종. **귀엽되 refined.** anime/chibi/sticker 금지, 펫게임화 금지.

1. **흰색 암컷 새끼고양이** — 앰버 눈, 분홍 발바닥, 귀엽고 사랑스러움 (메인 펫)
2. **검은색 수컷 수호 고양이** — 차분하고 보호적
3. **회색 영리한 고양이** — 작고 동그란 안경
4. **갈색 암컷 loaf 고양이** — 포근하고 예쁨

펫 커스터마이징(이름·눈색·털색·성별 표현·방 꾸미기)은 후속이다. **이번 라운드에서 커스터마이징을 과설계하지 않는다.**

펫 상태 가드레일: 굶주림·병듦·죽음·울음·처벌 연출 **0**. 흔들림/재발 시 단계 강등 없음 → 잠깐 조용해지거나 잔불이 약해질 뿐, 회복 행동을 하면 다시 잔불이 켜진다.

---

## 4. 사용자가 업로드할 이미지 앵커 (Image anchors)

> **이 이미지들은 Git에 없다. 사용자가 Claude Design 안에서 직접 업로드한다.** Claude Design은 업로드된 이미지를 펫·방의 시각 기준으로 삼아 P0 화면을 탐색한다. 이미지가 없는 앵커는 텍스트 묘사(§3, §2)로 대체한다.

기대 앵커:
1. **흰색 새끼고양이 — 메인 펫** (white kitten main pet)
2. **검은색 수호 고양이** (black guardian cat)
3. **회색 안경 고양이** (gray glasses cat)
4. **갈색 loaf 고양이** (brown loaf cat)
5. **프리미엄 다크 잔불 펫 방** (premium dark ember pet room)
6. **(선택) 상태 시트** (optional state sheet — 제공 시: default / content / taking_a_break / ember_low 등 허용 상태만. 금지 상태 미포함)

업로드 이미지는 **시각 기준**이지 최종 에셋이 아니다. Claude Design은 이를 NoF 톤(Ink & Ember)으로 배치·탐색한다. 색/형태 임의 확정 금지.

---

## 5. 이번에 탐색할 P0 화면 (P0 exploration targets)

새 화면을 추가하지 않는다(`SCREEN_INVENTORY.md`). 기존 P0 화면 안에서 펫 + Failendar 구조를 흡수한다.

1. **홈 대시보드** — 펫 + 잔불 상태 중앙 포커스 + **잔불 캘린더 미니 7일 스트립** + 중립 스트릭(현재/최고) + 1차 CTA "1분 체크인", 2차 "잠깐 멈춤".
2. **1분 체크인** — mood / trigger enum / urge level. 1분 이내, 자유서술 비강제. 완료 시 펫 케어 보상(간식/잔불).
3. **잠깐 멈춤(위기)** — 저자극 풀스크린 호흡/타이머. 펫이 곁에서 함께 호흡. 1차 "5분 같이 버티기".
4. **캐릭터(펫) 홈** — 절제 일수·체크인·회복 행동이 펫 절제 공간 안정으로 시각화. 강등 없음. 케어 보상.

> 잔불 캘린더 **월/주 전체 뷰**, 패턴 인사이트/회복 리포트 화면은 **P1** 이다. 이번 P0 탐색에서 만들지 않는다(`FAILENDAR_TO_NOF_ADAPTATION.md` §4).

이번 라운드는 **방향 검증용 P0 탐색**이다. P0 전체 화면 production UI로 바로 가지 않는다.

---

## 6. 반드시 차별화 (금지, 전 화면 0건)

- QUITTR식: 빨강 경고·즉시 0 리셋·하강 연출, 공포/수치/약속배신/신체위협 카피, Brain Rewiring %/Recovery %/치료 단정, 우주·네온·회전 구체 spectacle, 부정 감정 소셜 프루프.
- Failendar식: 실패-우선 프레이밍, 빨강 실패일/초록 성공일 이진, "오늘 실패했나요?" 카피, 실패 Level 1/2/3 판정, 리셋 광고, 재발 직후 즉시 과금, 민감 맥락 사진 첨부.
- Covenant류: 감시형 accountability, 종교·도덕 심판, 자동 공유, "감시" 프레임.
- 남성성 과다·전사·의지·슬랭, 게임 경제(코인/뽑기/랭킹 강등/Shop/XP 노출).
- generic beige / wellness diary drift(Calm/Finch/Bloom 류 무드·일기장 톤 차용 금지).
- 노골적 표현·성인 사이트명/URL/검색어.
- OPAL·경쟁사 화면 색/형태/레이아웃/문구 직접 복제.
- 펫 굶주림·병듦·죽음·처벌 연출.

OPAL은 **구조만** 참고(복제 아님): 하나의 상징 오브제 = 앱 기억점(→ NoF는 펫 고양이), 다크 = 프리미엄·집중, 차단/집중을 단일 CTA + 의식처럼. gem 캐릭터·색·레이아웃·"block together" 문구 복제 금지.

---

## 7. Claude Design에 함께 입력할 문서 (Input set)

- **본 README (1순위)**
- `docs/FAILENDAR_TO_NOF_ADAPTATION.md` (구조 적응 — 이번 라운드 핵심 입력)
- `docs/PET_CUSTOMIZATION_SPEC.md`, `docs/CHARACTER_SYSTEM_SPEC.md`
- `docs/CLAUDE_DESIGN_PATTERN_BRIEF_EMBER_CAT.md`, `docs/DESIGN_RESET_BRIEF.md`
- `docs/SCREEN_INVENTORY.md`, `docs/UX_RULES.md`, `docs/COPY_POLICY.md`
- `docs/DIRECT_COMPETITOR_VISUAL_AUDIT.md`
- 사용자가 Claude Design에 직접 업로드하는 펫/방 이미지(§4) — **Git 미포함**
- (보조) `handoff/claude-design-nof-visual-v2/` 의 시각 레퍼런스

---

## 8. 검수 통과 기준 (Review gate)

- [ ] 펫(고양이)이 화면의 정서 중심이고, 캘린더·스트릭·구조가 그 뒤를 받치는가?
- [ ] 잔불 캘린더가 홈 미니 스트립으로만 들어오고 월/주 뷰·통계는 P1로 미뤄졌는가?
- [ ] 펫 4종이 유치하지 않고(큰 눈/볼터치/펫게임화 0) 조용한 동료로 유지되는가?
- [ ] 펫이 굶주림·병듦·처벌 없이 "조용해졌다 회복 시 잔불이 켜지는" 동선인가?
- [ ] Failendar식 실패-우선/이진/판정/리셋광고와 QUITTR·Covenant anti-pattern이 0인가?
- [ ] generic beige / wellness diary로 회귀하지 않았는가?
- [ ] 빨강 경고색·즉시 0 리셋·하강 연출이 없는가?
- [ ] 업로드 이미지를 시각 기준으로 쓰되 색/형태를 임의 확정하지 않았는가?
- [ ] P0 탐색용이며 production UI를 임의 확정하지 않았는가?
- [ ] 이미지·에셋을 Git에 저장하지 않았는가(이 핸드오프는 텍스트만)?

---

STOP — v3 Claude Design handoff README complete. Awaiting human review.
