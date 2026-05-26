# CLAUDE_DESIGN_PATTERN_BRIEF_EMBER_CAT.md

NoF — Claude Design 3화면 high-fidelity 업데이트용 패턴 브리프 (Ink & Ember / Ember Cat)

- 작성일: 2026-05-27
- 상태: 패턴 정리 문서 / 화면·코드·에셋 생성 아님 / 최종 색·UI 확정 아님 (사람 승인 전)
- 상위/입력 문서:
  - `docs/DESIGN_RESET_BRIEF.md` (Baseline B reject, 후보 A/B/C, 가드레일)
  - `docs/DIRECT_COMPETITOR_VISUAL_AUDIT.md` (경쟁사 anti-pattern, positioning gap)
  - `docs/CHARACTER_SYSTEM_SPEC.md` §13 (Ember Cat 후보)
  - `docs/handoff/COMPANY_PC_HANDOFF_20260526_EMBER_CAT.md` (사람 판단·캐릭터 방향)
  - `docs/UX_RULES.md`, `docs/COPY_POLICY.md`, `docs/SCREEN_INVENTORY.md`
  - `docs/MOBBIN_VISUAL_CURATION_REPORT.md`, `references/mobbin_visual_curated/CURATED_REFERENCE_INDEX.md`
  - `handoff/claude-design-nof-visual-v2/` (DESIGN_DIRECTION / MOBBIN_PATTERN_ANALYSIS / USE 67장)

> 이 문서는 Claude Design에 화면을 만들게 하기 **직전 단계**다. 위 문서들의 제약을 압축해
> "쓸 패턴 / 금지 패턴 / 화면별 매핑 / 최종 프롬프트"를 한 장으로 묶는다.
> 이 문서 자체는 화면·이미지·코드를 만들지 않는다.

---

## 1. 이번 브리프의 목적

- Claude Design에 **바로 화면을 만들게 하기 전에**, 사용할 패턴과 금지 패턴을 압축한다. 빈 입력으로 던지면 또 촌스럽거나 generic wellness diary로 흐른다(Baseline B 실패 반복).
- Mobbin / OPAL / 직접 경쟁사 화면은 **복제용이 아니라 구조 참고용**이다. 색·레이아웃·카피·브랜드는 NoF 톤으로 재해석한다(DESIGN_DIRECTION §11).
- 산출 목표: **3화면(Home / Urge / Blocking Event)만 high-fidelity로** 먼저 검증한다. P0 8화면 전체로 바로 가지 않는다.
- 이 라운드 산출물은 **최종 확정이 아니라 방향 검증용**이다. 색·hex·전체 화면 확정은 사람 승인 후.

---

## 2. 현재 확정/후보 방향

| 항목 | 결정 | 출처 |
|---|---|---|
| Main visual direction | **Ink & Ember** (= DESIGN_RESET_BRIEF 후보 A "Quiet Shield" 다크 계열) | handoff §8, RESET_BRIEF §5A |
| Structure support | **Slate & Moss** (정보 구조·카드 위계 보정) | handoff §8 |
| Character | **Ember Cat / 잉크 고양이 / 잔불 수호자 / 조용한 동료** | CHARACTER_SYSTEM_SPEC §13 |
| 보류/폐기 | **Cool Paper** (= Baseline B "따뜻한 종이" 계열, generic beige) | handoff §8, RESET_BRIEF §1 |

- "확정"이 아니라 **현 시점 유력 방향**이다. 캐릭터 세계관은 여전히 NEEDS DECISION (#12, #13).
- 톤 좌표: **차분한 프리미엄 + 따뜻한 인간미 + 비감시 자기통제**. 따뜻함은 색 온도(베이지)가 아니라 **카피·캐릭터·여백·동료성**으로 확보한다.

---

## 3. OPAL에서 가져올 패턴 / 가져오면 안 되는 것

OPAL은 quit-porn 앱이 아니라 차단·포커스 카테고리의 비주얼 리더다(AUDIT §2.2). **구조만** 참고한다.

### 가져올 것 (구조·원리)
- **하나의 상징 오브제가 앱 전체의 기억점이 되는 구조.** OPAL은 gem 마스코트로 "이 앱 = 그 보석"을 만들었다. NoF는 같은 *구조*를 Ember Cat으로 가져온다(오브제 자체는 고양이).
- **다크 톤 = 프리미엄·집중 공간.** "어두운 배경 = 음침·경고"가 아니라 "어두운 배경 = 고급·몰입"으로 쓸 수 있음을 OPAL이 입증. Ink 베이스의 근거.
- **차단/집중 행동을 단일 CTA + 의식(ritual)처럼 구성.** "Block Now" 같은 큰 단일 진입점, 세션을 의식처럼 시작/종료하는 흐름.
- **해제 딜레이 = 자기 설정**으로 표현(벌 아님), "Take a break"처럼 유예를 정상 옵션으로.

### 가져오면 안 되는 것 (복제 금지)
- OPAL **보석(gem) 캐릭터** 형태·메타포 복제 — NoF는 잉크 고양이다.
- OPAL의 **색/그라데이션/레이아웃 직접 복제.**
- **"block ... together" 문구·구조 그대로 복제** — 동료 초대는 NoF 톤으로 재작성(동의 기반·기본 비공개).
- **게임/보석/젬 컬렉션 느낌으로 흐르는 것** — "성장 = 보석 수집" 게임화 금지(NoF는 "절제 공간 안정").
- 차단 화면에 **노출 앱명/사이트명 표시** (OPAL은 Instagram 등 표시 — NoF는 미표시, COPY_POLICY §7).

---

## 4. Direct competitor anti-pattern (전 화면 0건)

AUDIT §4 기준. 직접 경쟁사가 실제로 쓰지만 NoF가 따라 하면 안 되는 것.

- 🚫 **QUITTR식 공포/수치 카피** — "DON'T BREAK THAT PROMISE… FOR A FEW SECONDS OF PLEASURE", "Side effects of Relapsing: REDUCED PERFORMANCE" 류. 약속 배신·신체 위협·죄책감 프레이밍.
- 🚫 **빨강 리셋 / 즉시 0 리셋 / 하강·X 연출** — QUITTR "Reset Counter" 빨강, Duolingo "resets to 0" 가혹 시각화.
- 🚫 **우주/네온 + 회전 구체 spectacle** — 게임 스킨처럼 보이는 과한 연출.
- 🚫 **Covenant류 감시/종교/도덕 심판** — 파트너가 활동 리포트를 받는 구조, "죄/타락", 신앙·도덕 심판 톤.
- 🚫 **Brain Rewiring %, Recovery %, 회복 레벨** — 의사과학 정량화, "치료/완치" 단정 인접.
- 🚫 **남성성 과다 / 전사 / 의지 / 슬랭** — "의지로 이겨라", "goons", 승부·랭킹 강등.
- 🚫 **실패를 처벌처럼 보이게 하는 UI** — 벌점·강등·캐릭터 처벌·부정 감정 소셜 프루프("X명이 슬퍼함 😔").
- 🚫 **게임 경제** — 코인/재화/상점/XP 뽑기/랭킹 강등(USE→CAUTION 강등 사례: finch Shop/XP, slowly coin 등).

✅ 대신: 위기는 "지금은 선택을 늦추는 시간" 톤, 회복은 "여정이 끝난 건 아니에요" 톤, 차단은 "내가 정한 환경" 톤.

---

## 5. Ember Cat 캐릭터 패턴

CHARACTER_SYSTEM_SPEC §13 + handoff §4~6 기준.

### 시각 원칙
- **검은 잉크 실루엣의 작은 고양이.** 면적 대부분은 잉크(어두운 실루엣).
- **앰버(ember) 포인트는 눈·꼬리 끝·숨결·주변 잔불에만 소량.** 액센트는 점(point)이지 면(plane)이 아니다.
- **귀엽지만 유치하지 않게.** 절제된 실루엣·미니멀.
- 큰 눈 / 볼터치 / 과한 표정 **금지.**

### 역할·성격
- **감시자·판단자가 아니라 조용한 동료.** 사용자를 평가·훈계하지 않는다.
- 위기 순간엔 짧고 따뜻하게, 성취 순간엔 담담히 인정.
- 화면을 점유하기보다 **곁에 머무는 존재감**(특히 Home·Urge에서 보조 위치).

### 실패/성장 처리
- 실패·재발 시 **울거나 죽거나 퇴화 금지.** "함께 쉬어가는 상태"일 뿐, 강등 없음.
- 성장 = **고양이가 강해지는 게 아니라 사용자의 절제 공간이 안정되는 것.**
- 성장 단계 후보(시각화):
  1. 작은 잉크 고양이 — 눈빛만 작게 켜짐
  2. 곁에 작은 잔불이 생김
  3. 고양이 주변 공간이 안정됨
  4. 꼬리 끝 빛이 길어짐
  5. 절제 공간/방/결계가 완성됨
- 성장 입력은 스트릭 단독이 아니다: 체크인 누적·위기 버튼 사용 후 버틴 횟수·차단 세션 설정·회복 루프 완료·연속일+총 기록일.

### 절대 금지
동글동글 아기고양이 펫게임화 · 큰 눈/볼터치/과한 표정 · 실패 시 울기/죽음/퇴화 · 전투력/레벨업/랭킹 강등 · 확률형 뽑기 · 스트릭 복구권/실패 삭제권/차단 해제권 · 감시·판단 톤.

---

## 6. 화면별 패턴 매핑 (3화면)

이번 라운드 대상 3화면. 각 화면은 SCREEN_INVENTORY 정의·금지 카피를 상속한다.

### A. Home Dashboard (홈 대시보드)

- **화면 목적:** 오늘 상태 요약 + 오늘 할 행동(체크인)을 한눈에. 정보 과밀 회피.
- **핵심 감정:** "내 절제 공간에 돌아왔다" — 안정·집중. 불안·압박 아님.
- **layout pattern:** 어두운 캔버스 중앙에 캐릭터/절제 공간 포커스, 그 위/아래로 ① 오늘 상태(중립 스트릭: 현재/최고) ② 체크인 CTA(1차) ③ 차단 상태 카드(PoC 범위). 카드 기반 위계(Slate & Moss 구조 보정). 참고 구조: cal-ai 지표카드+날짜스트립, withings 오늘의 미션, alan-mind 플랜 이어가기.
- **visual pattern:** Ink 다크 베이스, 캐릭터/잔불의 은은한 앰버 발광이 시선 중심. 정보는 카드로 정돈, 굵기 대비 절제. 빨강 0.
- **Ember Cat 위치·상태:** 화면 정서 중심(중앙~중상단). 현재 절제 공간 성장 단계 반영(예: 곁에 작은 잔불). 정적이고 차분한 존재감. 전투·능력치·울기 없음.
- **primary CTA:** "오늘 체크인하기"
- **secondary CTA:** "잠깐 멈춤"(위기 진입) · "내 공간 보기"(캐릭터 홈)
- **한국어 카피 초안:**
  - 상단: "오늘도 함께 있어요."
  - 스트릭 라벨: "이어온 날 / 가장 길게 이어온 날" (중립 표기)
  - CTA: "1분 체크인" / "잠깐 멈춤"
- **반드시 피할 요소:** "참아라" 명령형, Brain Rewiring %/Recovery % 게이지, 빨강 경고, 초 단위 카운트다운 공포, Shop/XP/재화 노출, 베이지 일색 평면.
- **참고할 Mobbin/curated 유형:** `18_Home_Dashboard`(alan-mind·cal-ai·noom·withings — USE), `05_Streak`(habitify skip-gentle, macrofactor 중립 캘린더 — USE), `06_Character`(finch companion-dialogue, tolan 3d-companion-home — USE). ※ bloom·finch character-goals-nav는 CAUTION(웰니스/Shop·XP) — 구조도 차용 금지.

### B. Urge / 잠깐 멈춤 (위기 버튼)

- **화면 목적:** 즉시 대응·충동 지연. 1탭 진입, 진입 장벽 최소.
- **핵심 감정:** "지금은 선택을 늦추는 시간" — 진정·여유. 공포·죄책감 아님.
- **layout pattern:** 저자극 풀스크린. 큰 단일 요소(호흡 원/타이머) 중앙, 최소 텍스트, 큰 버튼. 인지 부하 최소. 참고 구조: opal breathe-pause-delay(1순위), calm breathe-circle, alan-mind breathing-timer, stoic inhale-countdown.
- **visual pattern:** 가장 어둡고 차분한 화면. 호흡에 맞춘 앰버 발광의 느린 확장/수축. 자극적 모션·빨강·경고등 0.
- **Ember Cat 위치·상태:** 곁에서 함께 호흡하는 보조 위치(화면 점유 최소). 숨결의 잔불만 은은히. "함께 버티는" 존재감.
- **primary CTA:** "5분 같이 버티기"(타이머 시작)
- **secondary CTA:** "대체 활동 해보기"
- **한국어 카피 초안:**
  - "잠깐 멈춰도 괜찮아요."
  - "지금은 선택을 늦추는 시간이에요."
  - 타이머 후: "오늘도 함께 버텼어요." (위기 사용 = 성취로 인정, 깎지 않음)
- **반드시 피할 요소:** "약속을 깨지 마", "참아야 한다" 명령형, "Side effects"·신체 위협, 빨강 Panic 미감, 즉시 0 리셋, "I Relapsed"식 실패 버튼 강조.
- **참고할 Mobbin/curated 유형:** `13_Crisis`(opal breathe-pause-delay / heads-up-take-break, calm breathe-circle, alan-mind breathing-timer, insight-timer breathing-paused, stoic inhale-countdown — 전부 USE).

### C. Blocking Event / 내가 정한 환경 (차단 이벤트/경고 컨셉)

- **화면 목적:** 차단 도달 시 멈춤 화면. 비난 없이 멈춤 → 대체 활동 전환. **실제 차단 구현 아님(PoC 컨셉).**
- **핵심 감정:** "내가 정한 환경이 나를 지켜준다" — 통제감·차분. 처벌·수치 아님.
- **layout pattern:** 차분한 멈춤 화면. 상단에 "내가 정한 환경" 안내(자기 설정 프레임), 중앙에 멈춤 메시지 + 대체 활동 CTA. 해제 딜레이는 자기 설정으로 표시. 참고 구조: opal blocked-state-intro / active-session-stop / self-set-delay-timer, stoic shield-schedule.
- **visual pattern:** Ink 베이스 + 차분한 차단 상태 표현. 경고등·빨강·하강 연출 금지. 차단 상태는 "방어막/결계가 켜진" 차분한 앰버 톤으로.
- **Ember Cat 위치·상태:** 멈춤 화면에서 곁을 지키는 위치. "내 공간을 함께 지킨다"는 정서. 꾸짖는 표정 절대 금지.
- **primary CTA:** "대체 활동 하기"
- **secondary CTA:** "닫기" (또는 "잠깐 멈춤"으로 연결)
- **한국어 카피 초안:**
  - "여기는 내가 정한 환경이에요."
  - "차단은 벌이 아니라, 내가 정한 환경을 지키는 장치예요."
  - 한계 고지: "모든 경로를 막을 수는 없어요." (정직 고지, "완벽 차단" 금지)
- **반드시 피할 요소:** "부끄럽지 않나요" 훈계, "완벽 차단/절대 우회 불가" 보장, 빨강 경고등, **사이트명/URL/검색어 표시**, 감시 리포트 톤, "해제하면 당신 책임" 류.
- **참고할 Mobbin/curated 유형:** `03_Blocking`(opal 세션·자기설정 딜레이·멈춤, stoic shield-schedule — USE), `13_Crisis`(멈춤→대체 전환 연결). ※ 노출 앱명은 참고 화면에만 있고 NoF에는 미표시.

---

## 7. 색 / 타이포 / 컴포넌트 방향

> 색은 **방향**이며 hex 확정이 아니다. 최종 색은 사람 승인 후(RESET_BRIEF §5·§10).

### 색 (Ink & Ember + Slate & Moss)
- **Ink dark base** — 딥 잉크/차콜(순검정 아님 — 음침 회피). 기본 캔버스.
- **Ember accent** — 따뜻한 앰버 1점을 **소량**(spectacle 아닌 온기). 캐릭터 눈/잔불/CTA 강조에 한정.
- **Slate / Moss structure support** — 카드·구획·보조 텍스트의 차분한 슬레이트/세이지 톤. 정보 위계 보정.
- **빨강 경고색 금지 또는 최소화** — 실패/위기/리셋/차단에 빨강 사용 금지. 경고가 꼭 필요하면 채도 낮은 중립 톤으로, 하강·X·경고등 연출 0.

### 타이포
- **Pretendard 계열** 한글 모던 산세리프 — 한글 가독성 최우선.
- 숫자(스트릭/타이머)는 또렷하되 **카운트다운 공포 연출 없음.**
- 위계는 여백으로, 굵기 대비는 절제.

### 컴포넌트 방향
- **카드:** 둥근 모서리, 넉넉한 여백, 다크 위에 한 단계 밝은 표면. 정보 1카드 1목적.
- **버튼(CTA):** 1차 = 앰버 강조 단일 큰 버튼, 2차 = 저강도 아웃라인/고스트. 명확한 1탭.
- **상태 pill:** 중립 스트릭/체크인 여부/차단 상태를 비난 없는 라벨 pill로(현재/최고, "이어온 날").
- **위기 CTA:** 항상 도달 가능한 큰 단일 진입점. 저자극, 짧은 카피, 즉시 호흡/타이머/대체활동 연결.
- **차단 상태 컴포넌트:** "내가 정한 환경"의 켜짐/꺼짐을 차분히. 사이트명/URL 미표시, 측정은 count/level만.

---

## 8. Claude Design에 넘길 최종 프롬프트 초안

> 아래 블록을 **새 Claude Design 채널**에 그대로 붙여넣는다. 아래 첨부 파일 목록을 함께 입력한다.

```
역할: NoF(한국 모바일 네이티브 자기통제·절제·회복 앱)의 high-fidelity 화면 3개를 만든다.
이번 산출물은 방향 검증용이다. 최종 확정/최종 색이 아니다. 사람 시각 승인 전이다.

확정 방향:
- Main visual direction: Ink & Ember (딥 잉크/차콜 베이스 + 따뜻한 앰버 소량 액센트).
  다크 = 프리미엄·집중(음침·공포 아님). 빨강 경고색 금지.
- 구조 보정: Slate & Moss (카드 위계·정보 구조).
- 보류/폐기: Cool Paper(따뜻한 종이 / generic beige) — 회귀 금지.
- 캐릭터: Ember Cat / 잉크 고양이 / 잔불 수호자.
  검은 잉크 실루엣의 작은 고양이. 앰버는 눈·꼬리 끝·숨결·주변 잔불에만 소량.
  귀엽지만 유치하지 않게. 큰 눈/볼터치/과한 표정 금지. 조용한 동료(감시자·판단자 아님).
- 톤 좌표: 차분한 프리미엄 + 따뜻한 인간미 + 비감시 자기통제.
  따뜻함은 색(베이지)이 아니라 카피·캐릭터·여백·동료성으로.
- 한국어 카피·한글 타이포(Pretendard 계열) 전제.

먼저 만들 화면 (3화면만, P0 전체로 가지 말 것):
1. Home Dashboard — 오늘 상태 + 체크인 CTA + Ember Cat 절제 공간. 1차 CTA "1분 체크인", 2차 "잠깐 멈춤".
2. Urge / 잠깐 멈춤 — 저자극 풀스크린 호흡/타이머. 1차 "5분 같이 버티기", 2차 "대체 활동".
3. Blocking Event / 내가 정한 환경 — 비난 없는 멈춤 → 대체 활동. "차단은 벌이 아니라 내가 정한 환경".

반드시 차별화(금지, 전 화면 0건):
- QUITTR식: 빨강 경고·즉시 0 리셋·하강 연출, 공포/수치/약속배신/신체위협 카피,
  Brain Rewiring %/Recovery %/치료 단정, 우주·네온·회전 구체 spectacle, 부정 감정 소셜 프루프.
- Covenant류: 감시형 accountability, 종교·도덕 심판, 자동 공유, "감시" 프레임.
- 남성성 과다·전사·의지·슬랭, 게임 경제(코인/뽑기/랭킹 강등/Shop/XP 노출).
- generic beige / wellness diary drift(Calm/Finch/Bloom 류 무드·일기장 톤 차용 금지).
- 노골적 표현·성인 사이트명/URL/검색어.
- OPAL·경쟁사 화면 색/형태/레이아웃/문구 직접 복제.

OPAL은 구조만 참고(복제 아님):
- 하나의 상징 오브제가 앱 전체 기억점이 되는 구조(→ NoF는 Ember Cat).
- 다크 = 프리미엄·집중 공간.
- 차단/집중을 단일 CTA + 의식처럼. 해제 딜레이 = 자기 설정.
- 단, gem 캐릭터·색·레이아웃·"block together" 문구는 복제 금지. 게임/젬 컬렉션 느낌 금지.

Ember Cat 성장 = 고양이가 강해지는 게 아니라 사용자 절제 공간이 안정되는 것.
실패/재발 시 울기·죽음·퇴화 금지. 강등 없음.

색·컴포넌트:
- Ink dark base + Ember accent(소량) + Slate/Moss 구조 보정. 빨강 금지 또는 최소.
- 카드/큰 단일 CTA/중립 스트릭 pill/저자극 위기 CTA/차단 상태(사이트명 미표시) 컴포넌트.
- 타이머·숫자는 또렷하되 카운트다운 공포 연출 없음.

검수 통과 기준:
- 명상 앱 스크린샷 옆에 뒀을 때 "자기통제 앱"으로 구분되는가?
- 공포·수치·빨강·감시·종교·남성성·게임경제가 0인가?
- 베이지/wellness diary로 회귀하지 않았는가?
- OPAL을 참고했지만 복제하지 않았는가?
- Ember Cat이 유치하지 않고 조용한 동료로 유지되는가?
- 3화면만 봐도 NoF 정체성이 보이는가?
- 최종 색/UI를 임의 확정하지 않았는가(검증용)?
```

**Claude Design에 첨부할 파일 목록:**
- 본 문서 `docs/CLAUDE_DESIGN_PATTERN_BRIEF_EMBER_CAT.md` (1순위)
- `docs/DESIGN_RESET_BRIEF.md`
- `docs/DIRECT_COMPETITOR_VISUAL_AUDIT.md`
- `docs/CHARACTER_SYSTEM_SPEC.md`
- `docs/UX_RULES.md`, `docs/COPY_POLICY.md`, `docs/SCREEN_INVENTORY.md`
- `handoff/claude-design-nof-visual-v2/` 의 USE 67장 (footer crop) — **시각 레퍼런스(보조)**. 직접 경쟁사 차별화가 1순위 기준, 인접 wellness 입력은 보조.

---

## 9. 사람 검수 체크리스트

3화면 high-fidelity 산출물 수령 후 사람이 확인한다.

- [ ] 촌스럽지 않은가? (앱스토어에서 경쟁력 있는 얼굴인가)
- [ ] generic beige / wellness diary(Cool Paper / Baseline B)로 돌아가지 않았는가?
- [ ] OPAL을 **참고**했지만 색/형태/레이아웃/문구를 **복제하지 않았는가**?
- [ ] Ember Cat이 유치하지 않은가? (큰 눈/볼터치/과한 표정/펫게임화 없음)
- [ ] Ember Cat이 감시자·판단자가 아니라 조용한 동료로 유지되는가?
- [ ] NoF의 민감한 문제를 수치스럽게 만들지 않았는가? (공포·수치·빨강·약속배신 0)
- [ ] QUITTR식 spectacle / Covenant류 감시·종교 / 남성성 과다 / 게임 경제가 0인가?
- [ ] 빨강 경고색·즉시 0 리셋·하강 연출이 없는가?
- [ ] 차단 화면에 사이트명/URL/검색어가 없고 "완벽 차단" 보장이 없는가?
- [ ] 3화면만 봐도 앱 정체성("수치·공포 없이 진지한 비감시 자기통제 앱")이 보이는가?
- [ ] 최종 색/UI를 임의 확정하지 않았는가? (이번은 검증용)

---

STOP — Claude Design pattern brief complete. Awaiting human review.
