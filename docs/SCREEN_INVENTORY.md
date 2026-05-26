# SCREEN_INVENTORY.md

Korean NoFap 앱 — 화면 목록 (디자인·구현 전 범위 고정)

상위 문서: PRD §7, §8.1, §13, §14 / 같은 라운드: UX_RULES.md, COPY_POLICY.md
이 문서는 화면 **범위**를 고정한다. 화면 디자인·와이어프레임 생성은 하지 않는다.

---

## 1. 화면 목록 목적 (Screen inventory purpose)

- 디자인·프로토타입·구현 전에 MVP 화면 범위를 고정한다.
- 화면별 목적·CTA·금지 카피·수락 기준을 명시해 AI 임의 해석을 막는다.
- P0 / P0.5 / P1 / P2 경계를 명확히 한다. **새 화면 추가 금지** (PRD 변경 요청 선행).

화면 정의 항목: 화면명 / 우선순위 / 목적 / 사용자 상태 / 핵심 컴포넌트 / 주요 CTA / 보조 CTA / 표시 데이터 / 금지 카피 / 수락 기준 / Mobbin 벤치마크 수집.

---

## 2. P0 화면 (P0 screens — MVP Core Loop)

### Splash
- 우선순위: P0 / 사용자 상태: 첫 진입
- 목적: 브랜드 첫인상, 무겁지 않은 톤
- 핵심 컴포넌트: 로고, 짧은 문구 / 주요 CTA: 시작하기 / 보조 CTA: 없음
- 표시 데이터: 없음
- 금지 카피: "중독 치료", 치료/완치 단정
- 수락 기준: 무겁지 않은 톤, 3초 내 다음 진입 가능
- Mobbin 수집: `01_Onboarding`

### 온보딩 (Onboarding)
- 우선순위: P0 / 사용자 상태: 기대·민망함
- 목적: 문제·목표 파악, 수치심 최소화
- 핵심 컴포넌트: 3~5개 질문(enum 선택), "내가 무너지는 경로" 선택 / 주요 CTA: 다음 / 보조 CTA: 건너뛰기
- 표시 데이터: 선택지(enum)
- 금지 카피: "얼마나 심각한가요", 성적 고백 강요
- 수락 기준: 완료율 가설 70%, 자유서술 비강제
- Mobbin 수집: `01_Onboarding`

### 목표 설정 (Goal Setup)
- 우선순위: P0 / 사용자 상태: 결심
- 목적: 현실적 목표 설정
- 핵심 컴포넌트: 기간(7/14/30/커스텀), 이유, 알림 설정 / 주요 CTA: 목표 만들기 / 보조 CTA: 나중에
- 표시 데이터: goal_days bucket
- 금지 카피: "실패 금지", 압박형
- 수락 기준: 설정률 가설 80%
- Mobbin 수집: `01_Onboarding`, `04_Habit`

### 홈 대시보드 (Home Dashboard)
- 우선순위: P0 / 사용자 상태: 일상 진입
- 목적: 오늘 상태 요약, 명확한 오늘 행동
- 핵심 컴포넌트: 스트릭, 캐릭터, 체크인 진입, (차단 상태 표시는 PoC 범위 내) / 주요 CTA: 체크인 / 보조 CTA: 위기 버튼·캐릭터 홈
- 표시 데이터: 현재 스트릭, character_stage, 오늘 체크인 여부
- 금지 카피: "참아라", 명령형
- 수락 기준: 오늘 할 행동 CTA 명확
- Mobbin 수집: `04_Habit`, `05_Streak`

### 스트릭 카드 (Streak Card)
- 우선순위: P0 / 사용자 상태: 동기 확인
- 목적: 지속 동기, 회복 링크 제공
- 핵심 컴포넌트: 현재/최고 기록, 회복 링크 / 주요 CTA: 기록 보기 / 보조 CTA: 회복으로
- 표시 데이터: 현재/최고 스트릭
- 금지 카피: "리셋되면 끝"
- 수락 기준: 리셋 시에도 회복 경로 노출
- Mobbin 수집: `05_Streak`

### 매일 1분 체크인 (Daily Check-in)
- 우선순위: P0 / 사용자 상태: 어색함
- 목적: 감정·트리거·난이도 기록
- 핵심 컴포넌트: mood(enum), trigger_type(enum), urge_level(1~5) / 주요 CTA: 완료 / 보조 CTA: 나중에
- 표시 데이터: enum 선택지
- 금지 카피: "왜 또", 질문 과다
- 수락 기준: 1분 이내 완료, 완료율 가설 40%
- Mobbin 수집: `12_Checkin_Journal`

### 위기 버튼 (Urge Button)
- 우선순위: P0 / 사용자 상태: 급함
- 목적: 즉시 대응, 충동 지연
- 핵심 컴포넌트: 큰 버튼, 타이머 / 주요 CTA: 5분 버티기 / 보조 CTA: 대체 활동
- 표시 데이터: 타이머
- 금지 카피: "참아야 한다"
- 수락 기준: 1탭 진입, 사용 후 이탈 방지 가설 30%
- Mobbin 수집: `13_Crisis`

### 5분 대체 활동 (5-minute Alternative Activity)
- 우선순위: P0 / 사용자 상태: 충동 지연 중
- 목적: 대체 행동으로 시간 지연
- 핵심 컴포넌트: 활동 선택(enum), 타이머, 완료 / 주요 CTA: 활동 시작 / 보조 CTA: 다른 활동
- 표시 데이터: activity_type(enum)
- 금지 카피: 훈계형
- 수락 기준: 완료율 가설 35%
- Mobbin 수집: `13_Crisis`, `04_Habit`

### 실패/리셋 후 회복 (Relapse/Reset Recovery)
- 우선순위: P0 / 사용자 상태: 수치심
- 목적: 회복 루프, 재방문 유도
- 핵심 컴포넌트: 원인(enum), 감정(enum), 다음 행동, 회복 플랜 / 주요 CTA: 다시 시작 / 보조 CTA: 회복 플랜 보기
- 표시 데이터: enum 기록(비공개 기본)
- 금지 카피: "실패자", "또 실패했네요"
- 수락 기준: 24h 재방문 가설 40%, 비난 0
- Mobbin 수집: `12_Checkin_Journal`, `13_Crisis`

### 캐릭터 홈 (Character Home)
- 우선순위: P0 / 사용자 상태: 호기심
- 목적: 성장 몰입, 처벌 없음
- 핵심 컴포넌트: 캐릭터, 상태, XP, 절제 공간 / 주요 CTA: 돌보기 / 보조 CTA: 홈으로
- 표시 데이터: character_stage, XP
- 금지 카피: "벌받음", 캐릭터 비난
- 수락 기준: 처벌 없음, 동료/수호자 톤
- Mobbin 수집: `06_Character`

### 캐릭터 보상 (Character Reward)
- 우선순위: P0 / 사용자 상태: 성취
- 목적: 행동 보상 수령
- 핵심 컴포넌트: 보상(XP/배지/스킨) / 주요 CTA: 받기 / 보조 CTA: 닫기
- 표시 데이터: 보상 내역
- 금지 카피: "한 번 더 뽑기", 과금 압박
- 수락 기준: 보상=행동 결과, 수령률 가설 50%
- Mobbin 수집: `07_Rewards`

### 알림 권한 (Notification Permission)
- 우선순위: P0 / 사용자 상태: 설정
- 목적: 재방문 트리거 동의
- 핵심 컴포넌트: 권한 이유 설명 / 주요 CTA: 허용 / 보조 CTA: 나중에
- 표시 데이터: 없음
- 금지 카피: "필수 허용", 압박
- 수락 기준: 이유 먼저 설명, 허용률 가설 45%
- Mobbin 수집: `02_Permissions`

### 기본 설정 (Basic Settings)
- 우선순위: P0 / 사용자 상태: 관리
- 목적: 계정·알림·개인정보 관리 진입
- 핵심 컴포넌트: 알림, 개인정보(항목별 동의), 데이터 삭제 / 주요 CTA: 저장 / 보조 CTA: 없음
- 표시 데이터: 설정값
- 금지 카피: "자동 공유"
- 수락 기준: 항목별 동의, 삭제 경로 노출
- Mobbin 수집: `16_Privacy`

---

## 3. P0 책임 파트너 검증 프로토타입 화면 (Partner validation prototype)

PRD §8.1. **실제 연결/카카오 초대 구현 금지. 프로토타입만.**

### 파트너 소개 (Partner Intro)
- P0 / 목적: 혼자 버티지 않는 구조 가치 설명 / CTA: 알아보기 / 보조: 나중에 하기
- 금지 카피: "감시자" / 수락: 동의 기반 응원자 프레임 / 이벤트: `partner_intro_viewed` / Mobbin: `11_Accountability`

### 공유 범위 선택 (Share Scope Selection)
- P0 / 목적: 어떤 정보 공유 가능한지 검증 / CTA: 선택 / 보조: 건너뛰기
- 표시: share_scope 후보(스트릭/체크인 여부/위기 사용 여부 등, 기본 비공개)
- 금지 카피: 실패 원인 공유 권유 / 수락: 기본 OFF, 실패 여부/원인 기본 공유 금지
- 이벤트: `partner_share_scope_viewed`, `partner_share_scope_selected` / Mobbin: `16_Privacy`, `11_Accountability`

### 초대 전 확인 (Pre-invite Confirmation)
- P0 / 목적: 초대 직전 불안 요소 확인 / CTA: 초대 의향 제출 / 보조: 취소
- 금지 카피: 자동 초대 암시 / 수락: 실제 초대 미발생, 의향만 / 이벤트: `partner_invite_intent_submitted` / Mobbin: `10_Social_Invite`

### 나중에 하기 / 건너뛰기 (Skip / Later)
- P0 / 목적: 소셜 기능 거부감 측정 / CTA: 나중에 하기 / 보조: 없음
- 수락: 거부 시 불이익 없음 / 이벤트: `partner_invite_skipped` / Mobbin: `10_Social_Invite`

---

## 4. P0.5 차단 PoC 화면 (Blocking PoC screens)

PRD §7.3, §9 / BLOCKING_TECH_POC_PLAN.md. **실제 차단 구현 금지. 가능성·반응 검증 컨셉만. 사이트명/URL 노출 금지.**

### 차단 소개 (Blocking Intro)
- P0.5 / 목적: 차단=내가 정한 환경 지키는 장치 안내 / CTA: 알아보기 / 보조: 나중에
- 금지 카피: "완벽 차단" / 수락: 사용자 주도 프레임 / 이벤트: `blocking_intro_viewed` / Mobbin: `03_Blocking`

### 권한 설명 (Permission Explanation)
- P0.5 / 목적: 권한이 왜 필요한지 먼저 설명 / CTA: 다음 / 보조: 나중에
- 금지 카피: "필수 허용" / 수락: 이유 명확, 압박 없음 / Mobbin: `02_Permissions`

### 차단 권한 요청 (Blocking Permission Request)
- P0.5 / 목적: OS 권한 요청 컨셉 검증 / CTA: 권한 허용 / 보조: 거부
- 금지 카피: 강제 / 수락: 거부 시 대안 안내, 과도한 이탈 없음
- 이벤트: `blocking_permission_requested`, `blocking_permission_granted`, `blocking_permission_denied` / Mobbin: `02_Permissions`

### 차단 강도 설명 (Blocking Level Explanation)
- P0.5 / 목적: 약함/표준/강함 이해 검증 / CTA: 강도 선택 / 보조: 나중에
- 표시: blocking_level(weak/standard/strong) / 금지 카피: 벌 프레임 / Mobbin: `03_Blocking`

### 차단 해제 딜레이 설명 (Blocking Delay Explanation)
- P0.5 / 목적: 딜레이=자기 설정 이해 / CTA: 이해했어요 / 보조: 나중에
- 금지 카피: "해제하면 당신 책임" / 수락: 벌이 아닌 자기 설정으로 인지 / Mobbin: `03_Blocking`

### 차단 이벤트/경고 컨셉 (Blocking Event / Warning Concept)
- P0.5 / 목적: 차단 도달 시 멈춤 화면 컨셉 / CTA: 대체 활동 / 보조: 닫기
- 금지 카피: "부끄럽지 않나요" / 수락: 비난 없이 멈춤 → 대체 전환, URL/사이트명 미표시 / Mobbin: `03_Blocking`, `13_Crisis`

### 차단 PoC 결과/피드백 (Blocking PoC Result / Feedback)
- P0.5 / 목적: 가능성/반응 수집 / CTA: 피드백 제출 / 보조: 닫기
- 표시: 측정 지표(원문 없는 count/level) / 수락: raw URL 저장 없이 지표 측정 / Mobbin: `14_Stats`

---

## 5. P1 보류 화면 (P1 deferred)

PRD §7.4 — 별도 게이트 통과 후. 이 라운드에서 정의·구현하지 않는다.
- 실제 차단 (REQ-007B)
- 카카오 친구 초대 (실제 연결)
- 익명 코호트
- 리더보드
- 기본 통계
- 캐릭터 진화 (REQ-012)
- 캐릭터 꾸미기 (REQ-013)

---

## 6. P2 보류 화면 (P2 deferred)

PRD §7.5 — 검증 후. 이 라운드에서 정의·구현하지 않는다.
- 프로 구독 / 프로 업그레이드
- AI 트리거 분석
- 고급 차단
- 유료 아이템
- 상점 (Shop)
- 랜덤 뽑기 (Gacha) — MVP/베타 제외

---

## 7. 화면별 수락 기준 (Screen-level acceptance criteria)

각 화면은 다음을 모두 만족해야 디자인/구현 단계로 넘어간다.
- 목적·사용자 상태·CTA가 위 표와 일치
- 금지 카피 0건 (COPY_POLICY 교차 검수)
- UX_RULES 위반 0건 (수치심·감시·완벽차단·자동공유 등)
- 우선순위 단계 준수 (P1/P2 기능을 P0 화면에 끌어오지 않음)
- 민감 데이터는 기본 비공개, enum/bucket 측정 (PRD §18)

---

## 8. 화면별 금지 카피 (Screen-level forbidden copy)

전 화면 공통 금지: 죄/타락/실패자/중독자, 치료·완치 단정, "완벽 차단/절대 우회 불가", "부끄럽지 않나요", "꼴찌", 성인 사이트명/URL/검색어, 과금 압박("무료는 부족", "한 번 더 뽑기"). 상세는 COPY_POLICY.md.

---

## 9. 사람 시각 검수 체크리스트 (Human visual review checklist)

- [ ] 모든 P0 화면이 목록과 일치하는가?
- [ ] P1/P2 기능이 P0 화면에 섞이지 않았는가?
- [ ] 각 화면 금지 카피 0건인가?
- [ ] 차단 화면이 멈춤 톤인가(꾸짖기 아님)?
- [ ] 파트너 화면이 동의 기반/기본 비공개인가?
- [ ] 권한 화면이 이유 먼저 설명하는가?
- [ ] 성인 콘텐츠/사이트명/URL이 어디에도 없는가?
- [ ] 위기/회복 화면이 무료 경로인가?
- [ ] 각 화면 Mobbin Collection이 지정되었는가?
