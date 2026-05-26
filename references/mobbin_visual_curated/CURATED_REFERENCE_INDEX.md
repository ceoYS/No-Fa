# CURATED_REFERENCE_INDEX

Mobbin visual evidence pack — quality-audited for **NoF** (Korean 절제/자기통제/회복 app).
Generated 2026-05-26. **Revision: strict re-audit round 2.** Internal reference only. No redistribution.

상위 기준: `docs/UX_RULES.md`, `docs/COPY_POLICY.md`, `docs/MOBBIN_PATTERN_ANALYSIS.md`.
원본 81장은 `references/mobbin_visual/`에 **그대로 보존**(삭제·이동 없음).

> **이번 라운드(round 2):** USE 폴더를 이미지 단위로 전수 재검수. 파일명/메타데이터가 아니라 **실제 화면을 열어** 판단.
> 위험 신호가 보이면 핵심 카테고리 5장 기준을 깨더라도 CAUTION/AVOID로 강등(안전성 우선). **8장을 USE→CAUTION로 이동.**

---

## Totals

| Bucket | Count | Goes to Claude Design? |
|---|---|---|
| **USE** | 67 | ✅ Yes (`USE/` folder, handoff는 footer crop) |
| **CAUTION** | 30 | ❌ No image. 구조만 문서로 참고 |
| **AVOID** | 3 | ❌ No image. 목록만 문서로 전달 |
| **Total curated** | 100 | — |
| Originals preserved | 81 | (untouched, uncropped) |

## Classification legend

- **USE** — NoF의 회복/자기통제/동료/멈춤/체크인/홈 구조에 긍정적으로 참고 가능. 시각 레퍼런스로 전달.
- **CAUTION** — 정보 구조만 참고. 카피·과금·게임화·톤 리스크 있어 톤/문구는 복제 금지. 이미지 미전달.
- **AVOID** — anti-pattern. 디자인 추천으로 절대 주지 않음. 대조용으로 문서에만 기록.

---

## 이번 라운드 USE→CAUTION 이동 (8장, 실제 이미지 확인)

| File | 이전 | 현재 | 사유 (이미지 근거) |
|---|---|---|---|
| 10 slowly · invite-copy-link | USE | CAUTION | "Invite Friends. **Get Free Coins** … Referral Reward **0/100 Coins**" — 코인 인센티브 추천 경제. 회복앱 톤에 부적합 |
| 12 calm · mental-note-add-tags | USE | CAUTION | 하단 **"Add a Note…" 자유서술 영역이 화면 절반 지배** + "Spirituality" 태그. 1분 enum 체크인이 아닌 자유 저널링으로 오학습 위험 |
| 14 epsy · count-logging-trend | USE | CAUTION | "**Seizure count / Medication not taken or logged**" — 의학적 질환 추적 라벨. NoF는 의학/치료 단정 금지 |
| 17 finch · gentle-restart-confirm | USE | CAUTION | 모달에 **"No, back to repair"**(streak repair 기능) + 우상단 재화 **5,918**. 카피는 양호하나 streak-repair 메커닉 노출 |
| 18 bloom · daily-self-care-home | USE | CAUTION | 베이지 웰니스 톤 + "59 words"/entries 탭 = **일기장형 generic wellness** drift 위험 |
| 18 finch · character-goals-nav | USE | CAUTION | 하단 네비에 **Shop / Bag(인벤토리) + ⚡XP + "9th Adventure"** 게임 경제 노출. 캐릭터+홈 아이디어만 참고, 상점/XP 복제 금지 |
| 20 alan · trust-safety-q | USE | CAUTION | "**shares more details than a doctor**", "video consultation", "safe for my health" — 의료 권위/치료 단정 포지셔닝 |
| 20 thefork · introducing-feature | USE | CAUTION | "**Public profiles**"(공개 프로필·팔로워·공개 피드) 홍보 — NoF 비공개 기본 원칙과 충돌 |

---

## USE by category (✅ = 핵심 카테고리)

| Category | USE | Core | Note |
|---|---:|:--:|---|
| 01_Onboarding | 7 | ✅ | OK |
| 02_Permissions | 4 | | OK |
| 03_Blocking | 7 | ✅ | OK |
| 04_Habit | 2 | | XP 2장 CAUTION |
| 05_Streak | 2 | ✅ | repair/freeze/pause-preserve 전량 CAUTION(이전 라운드). 중립 스트릭만 USE |
| 06_Character | 5 | ✅ | OK |
| 07_Rewards | 2 | | chest/bonus 2장 CAUTION |
| 08_Shop_Gacha | 0 | | 전량 CAUTION/AVOID |
| 09_Leaderboard | 0 | | 전량 CAUTION/AVOID |
| 10_Social_Invite | 2 | | slowly(coin) CAUTION |
| 11_Accountability | 3 | | OK |
| 12_Checkin_Journal | 3 | ✅ | enum 한정. 자유서술형 2장 CAUTION |
| 13_Crisis | 6 | ✅ | OK |
| 14_Stats | 3 | | epsy(의학) CAUTION |
| 15_Paywall | 4 | | honest-paywall 한정 |
| 16_Privacy | 4 | | OK |
| 17_Relapse_Recovery | 4 | ✅ | finch repair CAUTION |
| 18_Home_Dashboard | 4 | ✅ | bloom·finch CAUTION |
| 19_Notification_Reminder | 3 | | OK |
| 20_AppStore_Positioning | 2 | | alan·thefork CAUTION |
| **USE total** | **67** | | 안전성 우선 — 일부 핵심 카테고리는 5장 미만 |

> 핵심 카테고리 중 05(2)·12(3)·17(4)·18(4)는 5장 기준 미달이나, 위험 화면을 억지로 USE에 두지 않는다는 원칙에 따라 의도적으로 부족하게 둠.

---

## USE detail — 핵심 카테고리 (최종 USE 이미지)

### 01_Onboarding (7)
- canva · welcome-carousel — 담담한 환영 캐러셀
- citizen · get-started-checklist — 진행률 링 + 체크리스트(다크 톤 주의·구조만)
- liven · narrative-welcome — 서사형 환영, 동료 톤
- headway · value-bullets — 가치 불릿 레이아웃
- calm · welcome-breathing-practice — 차분한 호흡 인트로
- calm · breathwork-daily-habit — 루틴 연결 온보딩
- alan-mind · calm-confident-you — 깔끔한 가치 제안

### 03_Blocking (7)
- opal · blocked-state-intro / session-setup / self-set-delay-timer / active-session-stop — 세션·자기설정 딜레이·멈춤(비난 없음). 노출 앱명은 메인스트림(Instagram 등), 성인 사이트명 없음
- stoic · shield-schedule-toggle / select-apps-days / start-at-hour — 차단 스케줄 자기설정

### 05_Streak (2)
- habitify · skip-fail-gentle-streak — skip 옵션 있는 부드러운 스트릭
- macrofactor · longest-current-streak — 중립적 스트릭 캘린더
> repair/freeze/protection/pause-preserve 계열은 전량 CAUTION.

### 06_Character (5)
- finch · companion-dialogue — 동료형 대화(비난 없음)
- finch · earned-star-encourage — "한 번에 하나씩" 격려(별=획득형)
- meplus · deep-breath-mascot — 마스코트 + 호흡 권유
- meplus · journey-companion — "내일 함께 가볼까요" 동료 톤 *(주의: "keep streak alive"+gem 토큰, 톤 복제 금지)*
- tolan · 3d-companion-home — 차분한 3D 동료 *(브랜드 인접성은 수동 확인 권장)*

### 12_Checkin_Journal (3)
- fitbit · mood-5point-enum — 5점 enum 기분(이상적)
- breeze · emotion-positive-negative — 긍/부정 감정 enum 그리드
- breeze · mood-slider-feelings-tags — 슬라이더+감정/활동 enum *(자유 메모·사진 필드는 NoF에서 제외, enum만 차용)*

### 13_Crisis (6)
- opal · breathe-pause-delay — 앱 진입 전 호흡+지연(1순위)
- opal · heads-up-take-break — 멈춤/유예 안내, 부드러운 톤
- alan-mind · breathing-timer — 호흡 타이머
- calm · breathe-circle — 호흡 원
- insight-timer · breathing-paused — 호흡 일시정지/종료
- stoic · inhale-countdown — 들숨 카운트다운

### 17_Relapse_Recovery (4)
- duolingo · okay-start-fresh — 마스코트의 부드러운 새 출발
- fabulous · rome-wasnt-built-restart — 자기연민 재시작
- how-we-feel · new-story-reframe — "새 이야기를 쓰자" 리프레이밍
- ynab · make-fresh-start-archive — 누적 데이터 **보존**하며 새 출발(NoF 핵심)
> finch · gentle-restart-confirm 는 repair 메커닉+재화 노출로 CAUTION 이동.

### 18_Home_Dashboard (4)
- alan-mind · continue-day1-tracker — 플랜 이어가기 홈
- cal-ai · metric-cards-daystrip — 지표 카드 + 날짜 스트립
- noom · todays-course-progress — 오늘 코스 + 진척 홈
- withings-health-mate · todays-missions — 오늘의 미션 홈
> finch · character-goals-nav(Shop/XP), bloom · daily-self-care-home(웰니스/일기) 는 CAUTION 이동.

> 비핵심 USE 카테고리(02/04/07/10/11/14/15/16/19/20)는 `USE/<cat>/` 폴더와 JSON 참조.

---

## CAUTION (30) — 구조만 참고, 톤/문구 복제 금지. **이미지 미전달**

| Category | File | Risk |
|---|---|---|
| 04_Habit | finch · goals-xp-character | XP 성장 부스팅 톤 |
| 04_Habit | numo · task-complete-xp | XP 게임화 |
| 05_Streak | deepstash · milestones-freezes | freeze + 하단 할인 배너 |
| 05_Streak | finch · streak-calendar | streak repair UI 인접 |
| 05_Streak | finch · streak-repair-calendar | streak **repair** 기능 |
| 05_Streak | numo · pause-preserve | **pause/preserve** 보존권 인상 |
| 06_Character | abode · pet-bars-care | 빨간 체력바=펫 방치/처벌 |
| 06_Character | replika · avatar-room-note | 사실적 아바타·성인 인접 브랜드 |
| 07_Rewards | drop · bonus-checklist | 캐시백 보너스 유인 |
| 07_Rewards | duolingo · daily-goal-chest | chest=랜덤상자 인접 |
| 08_Shop_Gacha | forest · earned-nonrandom-cosmetic | 획득형(양호)이나 상점 맥락 |
| 08_Shop_Gacha | stadium-live · cosmetic-clothing | 코스메틱 상점 |
| 08_Shop_Gacha | stadium-live · cosmetic-new | 코스메틱 상점 |
| 09_Leaderboard | duolingo · weekly-club | 순위 경쟁 |
| 09_Leaderboard | strava · group-challenge | 그룹 비교 리스크 |
| 09_Leaderboard | tempo · compete-friends | 친구 경쟁 |
| 10_Social_Invite | instacart · referral-give-get | 인센티브 추천 |
| 10_Social_Invite | **slowly · invite-copy-link** | **coin 인센티브 추천(round 2)** |
| 11_Accountability | duolingo · friends-quest-nudge | nudge 압박 톤 |
| 12_Checkin_Journal | 5-minute-journal · short-prompts-toggle | 자유서술 프롬프트 |
| 12_Checkin_Journal | calm · mood-context-tags | 맥락 태그+메모 |
| 12_Checkin_Journal | **calm · mental-note-add-tags** | **자유서술 메모 영역 지배(round 2)** |
| 14_Stats | **epsy · count-logging-trend** | **seizure/medication 의학 라벨(round 2)** |
| 17_Relapse_Recovery | finch · okay-to-miss-startover | 유료 streak repair "1ST TIME OFFER" |
| 17_Relapse_Recovery | **finch · gentle-restart-confirm** | **"back to repair"+재화 5,918(round 2)** |
| 18_Home_Dashboard | **bloom · daily-self-care-home** | **베이지 웰니스/일기 톤(round 2)** |
| 18_Home_Dashboard | **finch · character-goals-nav** | **Shop/Bag/XP 게임 경제(round 2)** |
| 19_Notification_Reminder | coursera · perday-reset-all | "reset all" 문구 리스크 |
| 20_AppStore_Positioning | **alan · trust-safety-q** | **의료 권위/치료 단정(round 2)** |
| 20_AppStore_Positioning | **thefork · introducing-feature** | **public profiles=비공개 원칙 충돌(round 2)** |

## AVOID (3) — anti-pattern. 디자인 추천 금지. **이미지 미전달**

| Category | File | Why anti-pattern |
|---|---|---|
| 08_Shop_Gacha | mimo · RISK-protection-sale | 보호기간 세일=과금 압박/손실 회피 |
| 09_Leaderboard | mimo · league-danger-note | 강등 "danger" 망신/공포 |
| 17_Relapse_Recovery | duolingo · resets-to-zero-contrast | "Miss a day, it resets to 0" 가혹 리셋 |

---

## Notes
- **굵게** = 이번 strict re-audit(round 2)에서 새로 CAUTION 강등된 항목.
- 전체 머신리더블: `CURATED_REFERENCE_INDEX.json`.
- 감사 상세·수동 확인 큐: `docs/MOBBIN_VISUAL_CURATION_REPORT.md`.
- 디자인 핸드오프: `handoff/claude-design-nof-visual-v2/` — **USE 67장만**, Mobbin footer 60px crop(원본은 uncropped 보존).
