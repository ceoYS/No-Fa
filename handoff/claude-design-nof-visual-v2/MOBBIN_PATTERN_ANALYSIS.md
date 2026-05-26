# MOBBIN_PATTERN_ANALYSIS.md

Mobbin 패턴 종합 (Synthesis) — 2026-05-26

상위: MOBBIN_MCP_REFERENCE_PLAN.md (원자료) / 교차: UX_RULES.md, COPY_POLICY.md, SCREEN_INVENTORY.md, DESIGN_DIRECTION.md
이 문서는 화면을 반복하지 않고 **재사용 가능한 패턴 원칙**으로 압축한다. 복제 아님.

---

## 1. P0 Core Loop 패턴

재사용 원칙:
- **오늘 단일 행동 CTA**: 홈은 캐릭터+스트릭+체크인을 한눈에, 1차 CTA는 항상 체크인. (Finch/Alan/Withings)
- **enum-first 기록**: 감정·트리거·urge_level은 선택지로, 자유서술은 선택·비공개. 1분 완료. (Fitbit/Calm)
- **수치심 없는 회복**: 스트릭이 끊겨도 누적/캐릭터 유지, "오늘 온 게 중요" 톤, 즉시 재시작 링크. (Finch/Numo/Deepstash)
- **충동 지연 개입**: 위기 1탭 → 호흡/타이머 → 대체 활동. 사용을 성취로 인정(XP). (Opal/Calm/Alan)
- **행동 기반 보상**: 보상=행동 결과, 차분한 축하, 과금/뽑기 0. (Duolingo 보상 구조, 단 경제는 비차용)

SCREEN_INVENTORY 함의:
- Home Dashboard·Daily Check-in·Urge Button·Relapse Recovery·Character Home·Streak Card 패턴 근거 확보.
- Character Home은 행동 기반 XP만(강등 없음) — Abode 상태바를 벌점으로 읽히게 하지 말 것.

Claude Design 응용 가능: 위 흐름 구조·정보 위계.
회피: Duolingo gem 경제·강등, Finch 색/캐릭터, Replika 관계형 톤.

## 2. P0 Partner Prototype 패턴

재사용 원칙:
- **응원자 프레임**: "Encourage/Send kudos/Buddy up" 같은 지지 액션. 감시 아님. (Finch)
- **사전 동의 고지**: 초대 전 명시적 동의 문구, 공유 링크 중심, 자동 초대 금지. (Chime)
- **공유 범위 사용자 선택**: 기본 OFF, 실패 여부/원인 기본 비공개. (Privacy 카테고리와 합성)

SCREEN_INVENTORY 함의:
- Partner Intro·Share Scope·Pre-invite·Skip 프로토타입은 "의향만 수집, 거부 시 불이익 0".
- Share Scope UI는 Mobbin 단일 사례 부족 → Privacy 토글 패턴(Rakuten) + Finch 응원 톤 합성.

UX_RULES/COPY_POLICY 리스크:
- Duolingo Nudge가 압박형으로 변질될 여지 → "재촉" 카피 금지.
- 연락처 일괄 수집(Instacart) 금지.

Claude Design 응용: 동의 문구 구조, 응원 액션.
회피: 감시자 톤, 실패 자동 전송, 연락처 그랩.

## 3. P0.5 Blocking PoC 패턴

재사용 원칙:
- **사용자 주도 세션**: 시간·앱·강도·스케줄을 사용자가 구성. (Opal/stoic)
- **해제 딜레이=자기 설정**: "Break available in Ns" 식 딜레이를 벌이 아닌 내 장치로 표현. (Opal)
- **멈춤 → 대체 전환**: 차단 도달 시 비난 없이 대체 활동 제시.
- **정직한 한계 고지**: "완벽 차단" 불가, OS/스토어 제약 명시.

SCREEN_INVENTORY 함의:
- Blocking Intro·Permission Explanation·Level·Delay·Event·Result 컨셉 근거 확보.
- 측정은 enum/bucket/count만(BLOCKING_TECH §8) — Stats 패턴(Epsy count)과 연결.

UX_RULES/COPY_POLICY 리스크:
- **차단 화면 앱/사이트명 노출 금지**(Opal "Instagram blocked" 식 회피).
- scareware·"완벽 차단" 보장 표현 금지.

Claude Design 응용: 세션 구성·딜레이 자기설정 프레임·멈춤 톤.
회피: 사이트명 노출, 공포 연출, 보장성 카피.

## 4. P1 / P2 Deferred 패턴

P1 (게이트 후):
- **리더보드/코호트**: 공동 진척·익명 중심. Strava 그룹 챌린지가 근접 모델. 강등/"danger zone"·실명·꼴찌 강조 금지(Mimo/Duolingo 리그 안티).
- **캐릭터 진화/꾸미기**: 단계적·따뜻. 능력치/전투 미감 금지.

P2 (검증 후):
- **상점/코스메틱**: Forest식 행동 기반 **비랜덤** 코스메틱만. 능력·성공률 무관.
- **Paywall**: Atoms식 정직 고지(자동결제 미동의, 핵심 무료). 위기/회복 페이월화 금지.
- **랜덤 뽑기**: MVP/베타 제외. 재도입은 MONETIZATION §5 7조건 충족 후.

MONETIZATION 리스크(절대 회피):
- 유료 스트릭 복구/실패 삭제(Finch Repair, Mimo "Streak/League Protection").
- pay-to-win(절제 성공·차단 해제·Double XP 판매).

Claude Design 응용: (해당 단계 도달 시) 공동 진척 리더보드·비랜덤 코스메틱·정직 paywall.
회피: 가챠 연출, pay-to-protect, 강등 압박.

---

## 5. 핸드오프 요약 (Claude Design)

응용 가능(패턴 차원만): 위 §1~4의 흐름·정보 위계·동의/딜레이/회복 프레임.
절대 회피: 색/레이아웃/카피/아이콘/브랜드 복제, 성인 단어/사이트명/URL, 수치심·빨강 하강 연출, 손실 강조 스트릭, pay-to-win/가챠, 감시자 파트너, 연락처 그랩, 제네릭 파스텔 드리프트.
미확정(임의 확정 금지): 캐릭터 세계관(NEEDS DECISION #12/#13), 가격(#15), 정식 차단 범위(P0.5 게이트 후).
