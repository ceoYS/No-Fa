# SPEC_KIT_INDEX.md

Korean NoFap App — Spec Kit 지도 (Spec Kit Index)

문서 상태: Baseline
상위 source of truth: `korean_no_fap_app_prd_v_0_3_lock_candidate.md` (이하 PRD)

---

## 1. Spec Kit 목적 (Spec Kit purpose)

이 Spec Kit은 PRD v0.3 Lock Candidate를 실행 가능한 하위 문서로 분해한 것이다.

- PRD를 계속 비대하게 확장하지 않고, 목적별 하위 문서로 분리한다.
- 디자인·하니스·프로토타입·구현 라운드에서 AI와 사람이 **같은 기준**으로 판단하게 한다.
- 기능 구현 전에 무엇을 검증해야 하는지 명확히 한다.
- NoFap/절제 앱 특유의 민감성·윤리·카피·개인정보·앱스토어 리스크를 고정한다.

이 Spec Kit은 **구현 지시서가 아니다.** 추론과 검수의 기준이다.

---

## 2. Source-of-truth 계층 (Source-of-truth hierarchy)

판단이 충돌할 경우 위에서 아래 순서로 우선한다.

1. `PRD.md` (= `korean_no_fap_app_prd_v_0_3_lock_candidate.md`)
2. `UX_RULES.md`
3. `SCREEN_INVENTORY.md`
4. `COPY_POLICY.md`
5. `BLOCKING_TECH_POC_PLAN.md`
6. `CHARACTER_SYSTEM_SPEC.md`
7. `MONETIZATION_POLICY.md`
8. `MOBBIN_BENCHMARK_PLAN.md`
9. `DESIGN_DIRECTION.md`

추가 검증 문서:
- `PREBUILD_DEMAND_VALIDATION_PLAN.md` (구현 전 수요 검증 게이트. PRD §22 실행 문서)

방향 정렬 문서 (v0.3.1, PRD §0.5 기반 — 충돌 시 PRD가 우선):
- `PET_CUSTOMIZATION_SPEC.md` (펫 모듈·상태·성장·간식·MVP 범위. CHARACTER_SYSTEM_SPEC §13 상속)
- `FAILENDAR_TO_NOF_ADAPTATION.md` (Failendar 구조 → Ember Calendar/회복-우선 변환)
- `CLAUDE_DESIGN_PATTERN_BRIEF_EMBER_CAT.md` (Ink & Ember 패턴·3화면 매핑)
- `../handoff/claude-design-nof-visual-v3/README.md` (Claude Design v3 핸드오프. P0 비주얼 탐색)
- PRD §0.5.8 제품 명료성 (자기통제/충동 보호/회복 앱으로 명료화. 펫·잔불은 보조 메타포)
- PRD §0.5.9 My Discipline / 나의 규율 (사용자 정의 사적 자기통제 규율 — 비공개·비처벌·비감시·회복 우선)

코어 리포커스 문서 (v0.3.2, PRD §0.6 기반 — 충돌 시 §0.6 > §0.5 > 본문):
- `NOF_CORE_PRODUCT_REFOCUS_MEMO.md` (제품 오너 코어 재정렬 근거 — 타이머·복기·규율·기능적 기록·동행, Discipline 3-state)
- PRD §0.6.1 코어 루프 v2(timer-first) / §0.6.3 두 가지 실패 범위 (재발=타이머 리셋, 규율 슬립=리셋 없음)
- PRD §0.6.2 Discipline 3-state + 배지 (§0.5.9.1·§0.5.10 A·B 대체)
- PRD §0.6.5 DayRecord 기능적 일 원장 + 기간 선택 / §0.6.6 복기 다이어리 / §0.6.7 편집 가능 카테고리
- PRD §0.6.8 사회적 동행 단계 도입(어휘 금지 유지) / §0.6.9 펫 모델

명확화:
- **PRD는 "무엇을, 왜"를 정의한다.**
- **Spec Kit은 "어떻게 추론하고 어떻게 검수하는가"를 정의한다.**
- **구현은 PRD 단독으로 시작하면 안 된다.** 반드시 관련 하위 Spec을 함께 읽는다.

---

## 3. 문서 지도 (Document map)

| 문서 | 역할 | PRD 연결 |
|---|---|---|
| PRD.md | 제품 목적·범위·우선순위·핵심 원칙 (최상위) | 전체 |
| UX_RULES.md | UX 톤, 실패/회복, 차단 화면 태도, 파트너·캐릭터 UX 판단 기준 | §5, §13, §16 |
| SCREEN_INVENTORY.md | MVP/프로토타입 화면 목록, CTA, 금지 카피, 수락 기준 | §7, §8.1, §14 |
| COPY_POLICY.md | 권장/제한/금지 어휘, 앱스토어·차단·실패·결제 문구 정책 | §1.2, §16 |
| BLOCKING_TECH_POC_PLAN.md | iOS/Android 차단 기술 검증, 권한 UX, 스토어·로그 리스크 | §7.3, §9, §10 |
| CHARACTER_SYSTEM_SPEC.md | 캐릭터 세계관·성장·보상·실패 처리·꾸미기·과금 경계 | §11 |
| MONETIZATION_POLICY.md | 무료/프로/단품/뽑기 금지선/미성년자·과소비 보호 | §12, §21 |
| MOBBIN_BENCHMARK_PLAN.md | Collection 구조, 앱 후보, Missing App Rule, 수집 기준 | §15 |
| DESIGN_DIRECTION.md | 시각 톤·브랜드 무드·캐릭터 방향·UI 분위기 | §5, §6 + UX_RULES |
| PREBUILD_DEMAND_VALIDATION_PLAN.md | 구현 전 수요·차단·캐릭터·파트너 검증 | §22, §23, §27 |
| PET_CUSTOMIZATION_SPEC.md | 펫(고양이) 커스터마이징·상태·성장·간식·방·MVP 범위 | §0.5, §11 |
| FAILENDAR_TO_NOF_ADAPTATION.md | Failendar 구조 차용/변환/거부 → 펫 기반 회복 캘린더 | §0.5, §7 |
| CLAUDE_DESIGN_PATTERN_BRIEF_EMBER_CAT.md | Ink & Ember 패턴·금지 패턴·화면별 매핑 | §0.5, §5, §11 |
| handoff/claude-design-nof-visual-v3/README.md | Claude Design v3 핸드오프 (펫 + Ember Calendar P0 탐색) | §0.5 |
| NOF_CORE_PRODUCT_REFOCUS_MEMO.md | 코어 재정렬 근거: 타이머·복기·규율·기능적 기록·동행, Discipline 3-state + 배지, DayRecord | §0.6 |

---

## 3.1 v0.3.1·v0.3.2 방향 정렬 의존 순서 (Direction-alignment dependency order)

자기통제·충동 보호·회복(코어) + 펫·잔불(보상 층) 방향(PRD §0.5)과 코어 리포커스(PRD §0.6)를 다룰 때는 **PRD 결정이 먼저 Spec Kit으로 흐른 뒤 구현이 시작**된다. 다음 순서로 읽고, 위 단계가 갱신되면 아래 단계를 동기화한다.

```
1) PRD.md
   §0.6 코어 리포커스 (timer-first, 3-state+배지, DayRecord, 복기, 동행) — §0.5·본문 충돌 시 우선
   §0.5.1 코어 루프 / §0.5.3 Recovery Calendar / §0.5.3.1 Calendar P0 행동
   §0.5.3.2 Calendar 점 enum / §0.5.7 P0 범위
   §0.5.8 제품 명료성 / §0.5.8.1 사용자 화면 노출 금지 어휘표
   §0.5.9 My Discipline / §0.5.9.1 5-state(→§0.6.2 3-state로 대체) / §0.5.9.2 확인 입력 흐름
   §0.5.10 정량 모델 (A·B는 §0.6.2가 대체, C·D·E·F 유지)
        ↓
2) SCREEN_INVENTORY.md (화면 범위 + 화면별 5-state·캘린더 라벨·금지 카피)
        ↓
3) UX_RULES.md (확인 입력 모달리티 §10.5.1 / 캘린더 §10.7 / placeholder §10.8 / 정량 §10.6)
        ↓
4) COPY_POLICY.md (5-state·캘린더 라벨 §10.5·§10.6 / 단계·운영 어휘 금지 §4.1)
        ↓
5) PET_CUSTOMIZATION_SPEC.md (보상 층으로서의 펫 모듈·상태·MVP 범위)
        ↓
6) FAILENDAR_TO_NOF_ADAPTATION.md (구조 차용/변환/거부 — Calendar P0 결정과 동기화)
        ↓
7) handoff/claude-design-nof-visual-v3/README.md (비주얼 탐색)
        ↓
8) 구현 (P0 프로토타입·hardness·UI)
```

규칙:

- **PRD가 source-of-truth다.** PRD 결정 없이 하위 문서·구현이 단독으로 새 규칙을 만들지 않는다.
- **Spec Kit이 갱신되면 구현은 동기화 전까지 시작하지 않는다.**
- 펫·잔불은 §0.5.8 보조 메타포 — 제품 1차 카피로 단독 사용 금지.
- **§0.6(v0.3.2)이 §0.5(v0.3.1)·본문과 충돌하면 §0.6이 우선한다.** Discipline은 5-state가 아니라 3-state+배지로(§0.6.2), 캘린더는 장식 점이 아니라 DayRecord 기능 원장으로(§0.6.5) 읽는다. 코어 히어로는 절제 타이머이며, 재발만 타이머를 리셋한다(§0.6.1·§0.6.3).

> **이미지 정책:** 실제 고양이 이미지는 **Git에 커밋하지 않는다.** Claude Design 안에서 사용자가 직접 업로드해 제공한다(v3 README §4). 이 Spec Kit과 핸드오프에는 이미지 파일이 없다(텍스트 브리프만).

> **My Discipline 정책(§0.6.2 — §0.5.9.1·§0.5.10 A·B 대체):** 규율을 **비공개·자기정의·비처벌·비감시·회복 우선**으로 다룬다(§0.5.9 상속). 사용자 **선택 상태는 3개**: `지켰어요` / `못 지켰어요` / `위기였지만 버텼어요`. 행동 후 자동 배지(선택 불가): `복기 완료` / `회복 루틴 완료` / `다음 행동 작성 완료`. `해당 없음`·`상황 없음`·`확인 필요`·직접 선택 `회복 완료`는 **제거**(스킵이 필요하면 보조 액션 `오늘 기록 건너뛰기`만). `못 지켰어요`는 복기를 유도하되 **절제 타이머를 리셋하지 않는다**(재발만 리셋, §0.6.3). 확인 입력은 P0에서 사용자 수동만. 규율을 점수·랭킹·공개 약속·자동 공유로 환산하지 않는다.

> **Calendar 정책(§0.6.5 — §0.5.3.1 확장):** 캘린더는 장식 점이 아니라 **기능적 일 원장(DayRecord)**이다. 각 날짜는 탭 가능하며, 탭 시 그 날 상세(절제 상태·스트릭 일수·지킴/미지킴/버팀 집계·사유·트리거·복기·다음 행동·배지)를 보여준다. **기간 선택** `최근 7일 / 14일 / 30일 / 이번 달`(홈 스트립은 7일 기본). 사용자 라벨은 `지킨 날` / `회복한 날` / `확인 필요` / `기록 전`(§0.5.3.2 유지). 빨강·이진·실패 마커 금지, 재발일은 dimmed / `다시 시작한 날`. 메타포 단독 라벨·단계 어휘 노출 금지.

## 4. 단계 게이트 지도 (Stage gate map)

PRD §7, §27 기준.

```
PRD Lock
  → Pre-build Demand Validation (PREBUILD_DEMAND_VALIDATION_PLAN.md)  [완료 또는 명시적 waiver]
  → BLOCKING_TECH_POC_PLAN.md (차단 가능 범위 정의)
  → UX_RULES.md + SCREEN_INVENTORY.md (MVP 범위 준비)
  → COPY_POLICY / CHARACTER / MONETIZATION / MOBBIN / DESIGN
  → MVP wireframe
  → Clickable prototype
  → Implementation harness
  → First vertical slice
  → Beta onboarding
```

우선순위 단계:
- **P0** = 제품 루프 검증 + 차단 PoC
- **P0.5** = Blocking Validation Gate
- **P1** = 실제 차단 정식화, 캐릭터 진화/꾸미기, 코호트/리더보드, 파트너 연결, 기본 통계, 카카오 초대
- **P2** = 아이템/재화, 뽑기, 프로 구독, AI 트리거 분석, 고급 차단

---

## 5. 작업 전 읽기 가이드 (Read-before-work guide)

| 하려는 작업 | 먼저 읽어야 할 문서 |
|---|---|
| 구현 우선순위 판단 | PRD.md §7 |
| UX 톤/실패·회복 흐름 판단 | UX_RULES.md |
| 화면 범위/구성/CTA 판단 | SCREEN_INVENTORY.md |
| 카피 작성/검수 | COPY_POLICY.md |
| 차단 기능 관련 모든 판단 | BLOCKING_TECH_POC_PLAN.md (구현 금지) |
| 캐릭터 성장/보상/실패 처리 | CHARACTER_SYSTEM_SPEC.md |
| 결제/구독/뽑기 판단 | MONETIZATION_POLICY.md |
| 레퍼런스 수집 | MOBBIN_BENCHMARK_PLAN.md |
| 비주얼/무드 방향 | DESIGN_DIRECTION.md |
| 만들기 전 수요 검증 | PREBUILD_DEMAND_VALIDATION_PLAN.md |

원칙: 전체 PRD를 통째로 넣기보다 **목적에 맞는 하위 문서를 우선** 사용한다 (PRD §28.1).

---

## 6. 업데이트 정책 (Update policy)

- PRD와 충돌하는 내용을 하위 문서에 넣지 않는다.
- 하위 문서에서 **새 기능을 추가하지 않는다.** 새 기능 아이디어는 PRD 변경 요청으로 먼저 올린다.
- PRD가 바뀌면 영향받는 하위 문서를 동기화한다. 동기화 전까지 PRD가 우선한다.
- `NEEDS DECISION` 항목(PRD §29)은 사람이 결정하기 전까지 하위 문서에서 임의 확정하지 않는다. 후보·가설로만 표기한다.

---

## 7. 금지된 해석 (Forbidden interpretation)

이 Spec Kit 라운드 및 이를 읽는 후속 AI는 다음을 하지 않는다.

- 기능 구현, 코드 작성, 화면 디자인/와이어프레임 생성
- 패키지 설치, 네트워크 호출
- 실제 차단 기능 구현, 실제 카카오 로그인/초대 구현, 뽑기/결제 구현
- 경쟁사 UI/카피 복제
- 성인 콘텐츠 저장/노출/링크, 성인 사이트명/URL/검색어 저장
- PRD의 우선순위·정책 임의 변경
- `NEEDS DECISION` 항목 임의 확정

---

## 8. STOP marker

STOP — 이 문서는 지도(map)다. 구현 지시서가 아니다.
구현 시작 전제(PRD §28 STOP 블록)가 모두 충족되기 전까지 구현을 시작하지 않는다.
