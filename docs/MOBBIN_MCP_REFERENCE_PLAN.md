# MOBBIN_MCP_REFERENCE_PLAN.md

Mobbin MCP 레퍼런스 수집 결과 (UX 패턴 분류 — 복제 아님) — 2026-05-26

상위: MOBBIN_BENCHMARK_PLAN.md, SCREEN_INVENTORY.md / 교차: UX_RULES.md, COPY_POLICY.md, DESIGN_DIRECTION.md
연결 점검: docs/MOBBIN_MCP_CAPABILITY_CHECK.md · 인덱스: references/mobbin/_mobbin_reference_index.json

> 스크린샷 파일은 저장되지 않았다. Mobbin MCP는 inline 이미지+메타데이터만 반환(로컬 export 도구 없음).
> 각 카테고리는 메타데이터 인덱스 + 수동 캡처 큐로만 기록한다.
> 색/레이아웃/카피/아이콘/브랜드 복제 금지. 성인 키워드/사이트명/URL 미사용·미저장.

---

## 카테고리별 분석 (12-point template)

### 01_Onboarding (P0)
1. 목적: 무겁지 않게 첫인상·문제·목표 파악(Splash/Onboarding/Goal Setup).
2. 쿼리: "onboarding flow welcome screens", "onboarding feature intro value proposition welcome carousel benefits".
3. 후보 앱: Canva, Citizen, Liven, Headway (대체: Babbel).
4. 선정 화면: Canva `9202c4c3`, Citizen `ecbb3004`, Liven `1ffc94db`, Headway `7fd82923`.
5. 볼 곳: 인트로 캐러셀, 목표/체크리스트 진입, 진행 표시, Skip 경로.
6. 관찰 패턴: dot pager + Skip/Next, 진행 링/바, 따뜻한 서사형 카피, 가치 불릿.
7. NoF 중요성: 완료율 70% 가설, 수치심 최소·자유서술 비강제.
8. NoF 응용(패턴): 3~5 enum 질문 + "무너지는 경로" 선택, 진행 표시, 건너뛰기 항상 노출.
9. 복제 금지: Canva confetti 미감, 경쟁사 카피/색.
10. 우선순위: P0.
11. 저장: 메타데이터만.
12. 갭: NoFap 특화 온보딩 직접 사례 없음 → wellness/habit 온보딩 패턴으로 대체(정상).

### 02_Permissions (P0 / P0.5)
1. 목적: 권한 이유 먼저 설명 후 요청, 거부 시 대안.
2. 쿼리: "permission priming explanation before notification access request".
3. 후보: Any Distance, Babbel, DailyArt, Airbnb (후보 Opal/one sec 미노출 → 대체 적용).
4. 선정: Any Distance `e100aefa`, Babbel `6822290a`, DailyArt `3012670d`, Airbnb `c1ad73f4`.
5. 볼 곳: pre-permission 프라이밍 카드, "Maybe later/Skip", 이유 문구.
6. 관찰 패턴: OS 다이얼로그 앞 이유 설명, 강제 없는 보조 CTA.
7. NoF 중요성: 허용률 45% 가설, 압박 금지(UX_RULES §5).
8. NoF 응용: "왜 알림이 필요한지" 먼저 → 허용/나중에. 차단 권한도 동일 구조.
9. 복제 금지: 특정 앱 카피·아이콘.
10. 우선순위: P0(알림), P0.5(차단 권한 컨셉).
11. 저장: 메타데이터만.
12. 갭: 차단(Screen Time 류) 권한 프라이밍 직접 사례 부족 → blocking 카테고리 Opal/stoic로 보완.

### 03_Blocking (P0.5)
1. 목적: 차단=내가 정한 환경 장치, 멈춤→대체. 사이트명/URL 미표시. **PoC 컨셉만.**
2. 쿼리: "app blocker focus mode screen time limit blocked app setup", "focus session limit reached blocked screen take a break stop".
3. 후보: Opal, stoic. (Freedom/one sec/ScreenZen 미노출 → 대체 적용, Missing App Rule).
4. 선정: Opal `22aafe8d`,`68bdef62`,`c355b42f`,`b44ac1a0`; stoic. `bcfd547f`,`d0deb0ec`,`4ce1783f`.
5. 볼 곳: 세션 설정(시간/앱/강도), 스케줄, 자기설정 딜레이 타이머, 차단 도달 상태.
6. 관찰 패턴: 사용자 주도 세션, "shield/protection level", **해제 딜레이("Break available in 4s")=자기설정**, 차단 상태 화면.
7. NoF 중요성: 약함/표준/강함 이해, 딜레이=벌 아님, 멈춤 톤 검증.
8. NoF 응용: 강도 선택 + 해제 딜레이를 "내가 건 장치"로 설명. 차단 도달 시 비난 없이 대체 활동 전환.
9. 복제 금지: Opal "Instagram was blocked" 식 **앱/사이트명 노출 금지**, scareware 미감, "완벽 차단" 인상.
10. 우선순위: P0.5.
11. 저장: 메타데이터만.
12. 갭: NoFap 전용 차단은 없음(당연·바람직). 일반 focus blocker 패턴만 차용.

### 04_Habit (P0)
1. 목적: 오늘 행동 체크, 미완료 처리.
2. 쿼리: "habit tracker daily checklist add habit completion".
3. 후보: Habitify, Numo, Tangerine, Finch (Streaks/Done/Productive 대체).
4. 선정: Habitify `3869b105`, Numo `f1161529`, Tangerine `cd8587cf`, Finch `70aafcf7`.
5. 볼 곳: 체크 인터랙션, 완료 진행바, **skip/missed 처리**, +XP 피드백.
6. 관찰 패턴: 데이 스트립, 완료 토글, Tangerine "Ok! ok! + Why?/Undo" 비난 없는 스킵.
7. NoF 중요성: 체크인/대체활동 완료 흐름, 미완료를 벌하지 않음.
8. NoF 응용: 1탭 체크, 미완료=조용한 회복 링크, 완료=캐릭터 XP.
9. 복제 금지: 색/캐릭터/카피.
10. 우선순위: P0.
11. 저장: 메타데이터만.
12. 갭: 없음(풍부).

### 05_Streak (P0)
1. 목적: 지속 동기 + **수치심 없는 회복 링크**.
2. 쿼리: "streak milestone calendar daily streak counter recovery".
3. 후보: Finch, Numo, Deepstash (Duolingo 위젯 보조).
4. 선정: Finch `9d93ef4d`,`5e262abb`, Numo `cae1eb96`, Deepstash `a754fe05`.
5. 볼 곳: 현재/최고 기록, 마일스톤, 캘린더, **freeze/pause/repair** 회복 장치.
6. 관찰 패턴: Numo "Pause & preserve — skip a day without losing", Deepstash freezes, Finch Streak Repair.
7. NoF 중요성: 리셋되어도 누적/캐릭터/여정 유지(UX_RULES §3), 회복 경로 노출.
8. NoF 응용: 끊겨도 데이터 유지 시각화, "다시 시작=회복 시작점" 링크.
9. 복제 금지: **Finch Repair를 유료 통화로 파는 구조(아래 RISK)** 차용 금지.
10. 우선순위: P0.
11. 저장: 메타데이터만.
12. 갭: 없음.

### 06_Character (P0)
1. 목적: 동료/수호자 성장 몰입, 처벌 없음.
2. 쿼리: "virtual pet companion character growth self-care avatar home".
3. 후보: Finch, Abode, Tolan, Replika (Habitica/Pokémon Sleep 대체).
4. 선정: Finch `076dbd90`, Abode `d450f05c`, Tolan `aa36dd2f`, Replika `48299c2c`.
5. 볼 곳: 캐릭터 홈, 상태 표시, 돌보기 액션, 대화 톤.
6. 관찰 패턴: Finch 지지적 대화, Abode 상태바+케어 액션, Tolan 차분한 앰비언트.
7. NoF 중요성: 평가 아닌 동료, 실패=쉬는 상태(CHARACTER_SYSTEM_SPEC §6).
8. NoF 응용: "내 절제 공간" + 행동 기반 XP, 비난 0.
9. 복제 금지: Abode 체력바=벌점 인상, **Replika 관계형 톤(부적합)**, 능력치/전투 미감.
10. 우선순위: P0(기본 단계). 진화/꾸미기 P1.
11. 저장: 메타데이터만.
12. 갭: 세계관 NEEDS DECISION(#12,#13) — 임의 확정 금지.

### 07_Rewards (P0)
1. 목적: 행동 결과로 보상 수령, 과금 압박 0.
2. 쿼리: "reward claim daily quest completion celebration milestone".
3. 후보: Rocket Money, Drops, Drop, Duolingo.
4. 선정: `44669c9f`, `f004e987`, `51e0cc08`, `28f06e88`.
5. 볼 곳: 수령 버튼, 축하 연출 강도, 다음 보상 안내.
6. 관찰 패턴: "milestone unlocked/Collect", 차분한 축하, 행동 연동.
7. NoF 중요성: 보상=행동 결과, "한 번 더 뽑기" 금지.
8. NoF 응용: 체크인/위기극복/회복 시 XP·배지 수령, 담담한 인정.
9. 복제 금지: Duolingo gem 경제·과금 유도, 사행성 연출.
10. 우선순위: P0.
11. 저장: 메타데이터만.
12. 갭: 비과금 보상 사례 충분.

### 08_Shop_Gacha (P2 — 리스크 분석 전용)
1. 목적: 상점 구조 **리스크 분석만**. 랜덤 뽑기 MVP/베타 제외.
2. 쿼리: "in-app cosmetic shop outfit theme item store inventory".
3. 후보: Forest, Stadium Live, Mimo.
4. 선정: Forest `5026f9ce`(GOOD), Stadium Live `8bb03e64`,`b7fba021`, Mimo `5ebe6ec1`(RISK).
5. 볼 곳: 가격 표기, 랜덤 여부, 능력 영향 여부.
6. 관찰 패턴: Forest=행동으로 번 코인→**비랜덤** 코스메틱(좋은 모델). Mimo=**Streak/League Protection·Double XP 판매**.
7. NoF 중요성: 비랜덤·비능력 코스메틱만 허용(MONETIZATION §4).
8. NoF 응용: (P2) 방 꾸미기·테마 단품만, 미적 한정.
9. 복제 금지: **Mimo식 pay-to-protect/pay-to-win 절대 금지**(MONETIZATION §6,§10), 가챠 연출.
10. 우선순위: P2(검증 후).
11. 저장: 메타데이터만.
12. 갭: 의도적으로 가챠 사례 미수집.

### 09_Leaderboard (P1)
1. 목적: 공동 진척, 공개 망신 금지.
2. 쿼리: "leaderboard league ranking group challenge weekly".
3. 후보: Strava, Duolingo, Tempo, Mimo.
4. 선정: `be87619c`, `0972a757`, `100bdd97`, `1eafd07d`.
5. 볼 곳: 그룹 목표 프레임, 순위 표현, 강등/하위 강조 여부.
6. 관찰 패턴: Strava 그룹 챌린지(공동), Duolingo 리그(경쟁+강등 압박).
7. NoF 중요성: 익명·비교 최소·"꼴찌" 금지(UX_RULES §9).
8. NoF 응용: 익명 코호트 공동 진척 중심, 순위 경쟁 약화.
9. 복제 금지: **Mimo/Duolingo "danger zone·강등" 압박**, 실명·개인식별.
10. 우선순위: P1.
11. 저장: 메타데이터만.
12. 갭: 비경쟁/공동형 리더보드 사례 적음 → Strava 그룹챌린지가 최선 근접.

### 10_Social_Invite (P0 프로토타입)
1. 목적: 초대 의향·거부감 측정. **실제 카카오 초대 미구현.**
2. 쿼리: "invite friends referral share link add friends skip".
3. 후보: Chime, Revolut, Instacart, Slowly.
4. 선정: Chime `9a4fb2e5`(GOOD), Revolut `578615a6`, Instacart `4a55ce4d`, Slowly `49512573`.
5. 볼 곳: 초대 링크, 동의 문구, 건너뛰기, 연락처 수집 여부.
6. 관찰 패턴: Chime **사전 동의 고지 문구**, 공유 링크 중심, 낮은 압박.
7. NoF 중요성: 의향만 수집, 거부 시 불이익 0(SCREEN_INVENTORY §3).
8. NoF 응용: 초대 전 확인 + 나중에 하기, 자동 초대·연락처 전체 수집 금지.
9. 복제 금지: **Instacart식 "invite contacts"(연락처 일괄)**, give/get 과금 유인.
10. 우선순위: P0(프로토타입).
11. 저장: 메타데이터만.
12. 갭: 민감주제 동의 초대 직접 사례 없음 → Chime 동의 문구가 근접 모델.

### 11_Accountability (P0 프로토타입)
1. 목적: 동의 기반 응원자 구조 검증. 감시 금지.
2. 쿼리: "accountability partner shared goal progress with friend coach".
3. 후보: Finch, Duolingo (HabitShare/StickK/Coach.me 대체).
4. 선정: Finch `034526fc`,`66ad7e4f`,`88b0a778`, Duolingo `b0512cc0`.
5. 볼 곳: 공유 범위, 응원 액션, 실패 노출 여부.
6. 관찰 패턴: Finch "Encourage/Send kudos/Buddy up" = 응원자 프레임, 공동 주간 그리드.
7. NoF 중요성: 기본 비공개, 실패 원인 공유 금지(UX_RULES §8).
8. NoF 응용: 공유 범위 사용자 선택(기본 OFF), 위기/실패 자동 알림 금지.
9. 복제 금지: 실패 자동 전송, 감시자 톤, Duolingo Nudge의 압박형 변질.
10. 우선순위: P0(프로토타입).
11. 저장: 메타데이터만.
12. 갭: 공유 범위 세분 선택 UI 직접 사례 부족 → Privacy 카테고리와 합성 필요.

### 12_Checkin_Journal (P0)
1. 목적: 감정·트리거·난이도 1분 기록.
2. 쿼리: "mood check-in journal reflection emotion tags daily log".
3. 후보: Fitbit, Calm, 5 Minute Journal, Breeze.
4. 선정: Fitbit `17d2479f`, Calm `40ba5ad3`, 5MJ `ecc4961e`, Breeze `d3e7d625`(RISK).
5. 볼 곳: mood enum, 태그 선택, 선택적 노트, 캘린더 recap.
6. 관찰 패턴: Fitbit 5점 enum, Calm 컨텍스트 태그, 자유서술은 선택.
7. NoF 중요성: enum 중심·1분 완료·자유서술 비강제·기본 비공개(SCREEN_INVENTORY).
8. NoF 응용: mood/trigger_type/urge_level(1~5) enum, 노트 선택.
9. 복제 금지: **Breeze 감정 태그에 'sexy/aroused' 류 포함 — NoF 금지**(성적 자기보고 강요 회피, COPY_POLICY §6).
10. 우선순위: P0.
11. 저장: 메타데이터만.
12. 갭: 없음.

### 13_Crisis (P0)
1. 목적: 1탭 진입, 충동 지연.
2. 쿼리: "breathing exercise pause timer calm down intervention session".
3. 후보: Opal, Alan Mind, Calm, stoic. (one sec 미노출 → Opal pause가 근접 대체).
4. 선정: Opal `4da4afe3`(GOOD), Alan Mind `cbc07752`, Calm `1fa360b0`, stoic. `c30889ab`.
5. 볼 곳: 진입 장벽, 타이머, 대체활동 연결, 저자극 연출.
6. 관찰 패턴: Opal "Breathe In / Wait for 2s / Nevermind" = **선택 지연 개입**, 호흡 타이머.
7. NoF 중요성: 1탭, "참아라" 금지, 무료 핵심(UX_RULES §6).
8. NoF 응용: 큰 위기 버튼 → 5분 버티기 타이머 → 대체 활동. 사용=성취(XP).
9. 복제 금지: 자극적 색/카운트다운 공포 연출.
10. 우선순위: P0.
11. 저장: 메타데이터만.
12. 갭: 없음.

### 14_Stats (P0.5 / P1)
1. 목적: 추세 리포트(민감 원문 없이).
2. 쿼리: "weekly stats progress report trends insights chart summary".
3. 후보: Epsy, stoic., Oura, Pillow.
4. 선정: `ae3e5f55`, `487f122e`, `f1e3a074`, `89e346e5`.
5. 볼 곳: count/bucket 기반 시각화, 회복형 해석 카피.
6. 관찰 패턴: Epsy count 로깅, Oura "recovery" 지지 해석, 주간 평균.
7. NoF 중요성: raw URL/검색어 저장 금지, enum/bucket/count 측정(BLOCKING_TECH §8).
8. NoF 응용: 차단 이벤트 count·time_of_day bucket·blocking_level만 시각화.
9. 복제 금지: 의료 단정 해석, 민감 raw 데이터 노출.
10. 우선순위: P0.5(차단 PoC 피드백), P1(기본 통계).
11. 저장: 메타데이터만.
12. 갭: 없음.

### 15_Paywall (P2)
1. 목적: 투명 기능 비교. 위기/회복 페이월화 금지.
2. 쿼리: "subscription paywall free trial plan comparison upgrade".
3. 후보: Atoms, Fixtured, Craft, Tolan.
4. 선정: Atoms `5a57b74f`(GOOD), Fixtured `0576cc85`, Craft `951fa4e7`, Tolan `bbd76014`.
5. 볼 곳: Free vs Pro 표, 자동결제 고지, 무료 유지 항목.
6. 관찰 패턴: Atoms **"자동 구독 안 됨·무료로 계속 가능" 정직 고지**, Accountability 무료 유지.
7. NoF 중요성: 핵심 절제 루프·위기·회복 무료(MONETIZATION §2).
8. NoF 응용: 프로=더 세밀한 분석 선택. 비랜덤 단품/구독만.
9. 복제 금지: "무료는 부족" 압박, 위기/회복 유료 묘사, "한 번 더 뽑기".
10. 우선순위: P2.
11. 저장: 메타데이터만.
12. 갭: 가격은 가설/NEEDS DECISION(#15) — 임의 확정 금지.

### 16_Privacy (P0)
1. 목적: 항목별 동의, 삭제/내보내기 경로.
2. 쿼리: "privacy settings sharing visibility controls data delete export".
3. 후보: Rakuten, MacroFactor, Zalando, Klarna (Signal/Telegram 대체).
4. 선정: `e2153191`, `cbf9218c`, `b44aa19b`, `ac5acdce`.
5. 볼 곳: 다운로드/수정/삭제, 최근 활동, 동의 철회.
6. 관찰 패턴: Rakuten 다운로드/삭제 + 활동 로그, MacroFactor 정직한 삭제 범위 고지.
7. NoF 중요성: 기본 비공개, 자동 공유 금지, 삭제 경로 노출(UX_RULES §10).
8. NoF 응용: 항목별 동의 토글 + 데이터 삭제/내보내기, share_scope 기본 OFF.
9. 복제 금지: 카피·레이아웃 복제.
10. 우선순위: P0.
11. 저장: 메타데이터만.
12. 갭: 없음.

### 17_Relapse_Recovery (P0)
1. 목적: 비난 없는 회복, 24h 재방문.
2. 쿼리: "missed day streak reset restart fresh start reflection after miss".
3. 후보: Finch, Duolingo, QUITTR(안티패턴).
4. 선정: Finch `d6e7a7b1`(GOOD copy/RISK monetization), Finch `50df8ab5`, Duolingo `1274e1c1`(대조), QUITTR `b30a6a01`(안티패턴).
5. 볼 곳: 재시작 CTA, 회복 카피 톤, 캐릭터 존재.
6. 관찰 패턴: Finch **"It's okay to miss a day. The important thing is you're here today"** = 회복 우선 톤(좋음).
7. NoF 중요성: "또 실패" 금지, 회복 플랜 즉시 연결(UX_RULES §4).
8. NoF 응용: 원인/감정 enum + 다음 행동 + 다시 시작. 캐릭터 곁에 머묾.
9. 복제 금지: **(a) Finch Repair 유료통화 판매** / **(b) Duolingo "resets to 0" 손실 강조** / **(c) QUITTR 빨강 'Relapsed'·성인 단어·'Reset Counter' 수치심 연출**(COPY_POLICY §4, DESIGN_DIRECTION §4).
10. 우선순위: P0.
11. 저장: 메타데이터만.
12. 갭: 비수치심 회복 사례 적음 → Finch 카피 톤만 모델, 화면구조는 자체 설계.

### 18_Home_Dashboard (P0)
1. 목적: 오늘 상태 + 오늘 행동 CTA 명확.
2. 쿼리: "home dashboard today overview companion progress summary".
3. 후보: Finch, Alan Mind, Withings, Cal AI.
4. 선정: Finch `e7f40efd`, Alan Mind `e8e40216`, Withings `6852bc4c`, Cal AI `38c76d56`.
5. 볼 곳: 오늘 CTA 위계, 캐릭터+스트릭+체크인 동시 노출, 정보 밀도.
6. 관찰 패턴: Finch 캐릭터+오늘 목표, Alan "Continue day 1", Withings "Today's Missions".
7. NoF 중요성: 체크인 CTA 가장 명확, "참아라" 비주얼 금지(DESIGN_DIRECTION §6).
8. NoF 응용: 스트릭·캐릭터·체크인 한눈, 위기 버튼·캐릭터홈 보조 CTA.
9. 복제 금지: 색/캐릭터/레이아웃.
10. 우선순위: P0.
11. 저장: 메타데이터만.
12. 갭: 없음.

### 19_Notification_Reminder (P0)
1. 목적: 재방문 트리거 설정.
2. 쿼리: "reminder time setup notification schedule daily reminder".
3. 후보: Calm, Bears Gratitude, Mindvalley, Coursera.
4. 선정: `6d39ad82`, `c29458a7`, `3cc54c5d`, `35f13a63`.
5. 볼 곳: 시간 선택, 반복 요일, 빈도, Skip.
6. 관찰 패턴: 이유 + 시간 + 반복 요일, 빈도 1~2회, 저압박 Skip.
7. NoF 중요성: 이유 먼저, "필수 허용" 금지(SCREEN_INVENTORY P0).
8. NoF 응용: 알림 이유 설명 후 시간/반복 설정, 나중에 허용.
9. 복제 금지: 카피·아이콘.
10. 우선순위: P0.
11. 저장: 메타데이터만.
12. 갭: 없음.

### 20_AppStore_Positioning (reference only)
1. 목적: 포지셔닝 패턴(카피 클로닝 아님).
2. 쿼리: "onboarding feature intro value proposition welcome carousel benefits".
3. 후보: Alan, Headway, N26, TheFork.
4. 선정: `0c93d2c3`, `7fd82923`, `0d9fc310`, `fcadab42`.
5. 볼 곳: 가치 제안 불릿, 신뢰/안전 문구, 단일 기능 소개.
6. 관찰 패턴: Alan "안전한가?" 신뢰 Q, Headway "self-growth journey", 가치 불릿.
7. NoF 중요성: 성적 표현 최소·치료 단정 금지·"완벽 차단" 금지(COPY_POLICY §5).
8. NoF 응용: "절제/자기통제/유해 디지털 환경" 프레임, 신뢰·안전 고지.
9. 복제 금지: 앱스토어 카피 클로닝, 의료/보장 표현.
10. 우선순위: reference only.
11. 저장: 메타데이터만.
12. 갭: NoFap 직접 포지셔닝 사례 미수집(의도적) — wellness 톤으로 재해석.

---

## Top 20 앱 레퍼런스 (유용도순)

1. **Finch** — 캐릭터·회복·책임파트너·스트릭 회복 톤(다수 P0 패턴의 최선 모델, 단 유료 Repair는 회피).
2. **Opal** — 차단 세션·자기설정 딜레이·위기 pause 개입(P0.5+P0 핵심).
3. **Calm** — 위기 호흡·체크인·알림(저자극 톤).
4. **stoic.** — 차단 스케줄·통계·호흡(차분 미니멀).
5. **Duolingo** — 스트릭/리그/보상/Friends Quest(단 강등·gem 경제는 안티).
6. **Atoms** — 정직한 paywall(자동결제 미동의·무료 유지).
7. **Tangerine** — 비난 없는 skip 처리(Why/Undo).
8. **Numo** — "Pause & preserve" 스트릭 보존.
9. **Deepstash** — 스트릭 freeze·마일스톤.
10. **Fitbit** — 5점 mood enum 체크인.
11. **Forest** — 행동 기반 비랜덤 코스메틱(좋은 상점 모델).
12. **Chime** — 사전 동의 고지 초대.
13. **Strava** — 공동 그룹 챌린지(비망신 리더보드 근접).
14. **Rakuten** — 개인정보 다운로드/삭제 + 활동 로그.
15. **MacroFactor** — 정직한 데이터 삭제/내보내기.
16. **Alan Mind** — 홈 "Continue day 1" + 호흡.
17. **Headway** — 가치 제안 온보딩.
18. **Citizen** — 진행 링 + 셋업 체크리스트 온보딩.
19. **Abode** — 캐릭터 케어 액션(상태바는 주의).
20. **Liven** — 따뜻한 서사형 온보딩.

## Top 10 UX 패턴 → Claude Design 전달

1. 자기설정 차단 + **해제 딜레이=내 장치**(벌 아님) — Opal.
2. **충동 지연 개입**: pause/호흡 → 대체 활동(1탭) — Opal/Calm.
3. **수치심 없는 스트릭 회복**: freeze/pause/"오늘 온 게 중요" — Numo/Finch.
4. enum 중심 1분 체크인(자유서술 선택) — Fitbit/Calm.
5. 이유-먼저 권한 프라이밍 + "나중에" — Babbel/Airbnb.
6. 동의 기반 응원자(Encourage/kudos, 기본 비공개) — Finch.
7. 행동 기반 보상·비랜덤 코스메틱 — Duolingo(보상)/Forest(상점).
8. 오늘 행동 단일 CTA 대시보드(캐릭터+스트릭+체크인) — Finch/Alan.
9. 정직한 paywall(자동결제 미동의, 핵심 무료 유지) — Atoms.
10. 항목별 개인정보 동의 + 삭제/내보내기 경로 — Rakuten/MacroFactor.

## Top 10 디자인 리스크 (Claude Design 회피)

1. 유료 스트릭 복구/실패 삭제(Finch Repair, Mimo Protection) — pay-to-win 금지.
2. 빨강 "Relapsed"·하강 연출·"Reset Counter" 수치심(QUITTR).
3. 성인 단어/사이트명/URL 노출(QUITTR 본문) — 어디에도 금지.
4. 손실 강조 스트릭("Miss a day, resets to 0" Duolingo).
5. 리더보드 강등/"danger zone" 압박(Mimo/Duolingo 리그).
6. 체크인 성적 감정 태그('sexy/aroused' Breeze).
7. 차단 화면에 앱/사이트명 노출(Opal "Instagram blocked").
8. 캐릭터 체력바=벌점 인상·관계형 톤(Abode 바/Replika).
9. 연락처 일괄 수집 초대(Instacart "invite contacts").
10. 제네릭 파스텔/베이지 드리프트·가챠 사행성 연출(DESIGN_DIRECTION §4).

## 수동 캡처 큐 (Manual capture queue)

Mobbin MCP 로컬 export 불가 → 사람이 아래를 수동 캡처. 파일명 규칙: `NN_Collection / app-name / screen-role`.
우선 캡처(P0/P0.5 핵심): references/mobbin/_mobbin_reference_index.json 의 다음 카테고리부터 —
`03_Blocking`(Opal 4장 + stoic 3장), `13_Crisis`(Opal pause, Calm, Alan), `17_Relapse_Recovery`(Finch 2장 — 안티패턴 QUITTR은 캡처 대신 메모만), `11_Accountability`(Finch 3장), `05_Streak`(Numo/Deepstash/Finch).
각 화면 URL은 인덱스 JSON·카테고리 README 참조.

## 사람 검수 체크리스트 (Human review checklist)

- [ ] 패턴 분류용인가, 복제 노트가 없는가? (색/레이아웃/카피/아이콘/브랜드)
- [ ] 각 카테고리 후보 3~7 앱, 화면 5~20 범위 의도 충족(현재 4~7/카테고리, 81 화면)?
- [ ] 성인 키워드/사이트명/URL 0건인가? (QUITTR은 **안티패턴 메모**로만, 복제 아님)
- [ ] Missing App Rule 적용됐는가? (Opal/one sec/Freedom 부재 시 대체)
- [ ] 각 화면이 PRD 섹션/화면과 연결됐는가?
- [ ] pay-to-win·유료 스트릭복구·가챠 사례가 "회피 대상"으로만 표기됐는가?
- [ ] 위기/회복이 무료·비수치심 패턴으로 잡혔는가?
- [ ] 차단 화면이 멈춤 톤·사이트명 미표시로 잡혔는가?
- [ ] NEEDS DECISION(세계관 #12/#13, 가격 #15) 임의 확정 0건인가?
