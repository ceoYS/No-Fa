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

---

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
