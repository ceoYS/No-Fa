# MOBBIN_BENCHMARK_PLAN.md

Mobbin 벤치마크 계획 — UX 패턴 수집 (복제 아님)

상위 문서: PRD §15 / 같은 라운드: SCREEN_INVENTORY.md, DESIGN_DIRECTION.md
이 문서는 수집 **기준**이다. 스크린샷·에셋을 이 라운드에서 생성/저장하지 않는다.

---

## 1. 목적 (Purpose)

Mobbin 레퍼런스를 **UX 패턴 분류용**으로 수집한다. 앱 복제용이 아니다 (PRD §15.2).
색상·레이아웃·카피·아이콘·브랜드 에셋을 베끼지 않는다.

---

## 2. 수집 구조 (Collection structure)

- Collection 이름을 먼저 정하고, 화면은 해당 Collection에만 넣는다.
- 앱 기준이 아니라 **화면 패턴 기준**으로 저장.
- 각 Collection: 최소 5개, 최대 20개 화면.
- 중복·단순 스플래시·광고성 Paywall 반복 화면 제외.

---

## 3. Collection별 앱 후보 (App candidates by collection)

PRD §15.1. 후보는 패턴 참고용. 미존재 시 §7 적용.

| Collection | 카테고리 | 앱 후보 | 배울 패턴 |
|---|---|---|---|
| `01_Onboarding` | 온보딩 | Duolingo, Fabulous, Headspace, Finch, Calm | 짧은 질문, 목표 설정 |
| `02_Permissions` | 권한 요청 | Opal, One Sec, Freedom, Forest, ScreenZen | 권한 전 설명 |
| `03_Blocking` | 차단/보호 | Opal, Freedom, One Sec, ScreenZen, BlockSite | 차단 목록, 예외 정책 |
| `04_Habit` | 습관 | Streaks, Habitify, Done, Productive | 완료 체크 |
| `05_Streak` | 스트릭 | Duolingo, Strava, Nike Run Club | 연속 기록 |
| `06_Character` | 캐릭터 | Finch, Duolingo, Habitica, Pokémon Sleep | 성장, 애착 |
| `07_Rewards` | 보상 | Duolingo, Finch, Pokémon Sleep | 보상 수령 |
| `08_Shop_Gacha` | 상점 | Duolingo Shop, Finch Shop, 캐주얼 게임 | 상점 구조 (참고만, 뽑기 미도입) |
| `09_Leaderboard` | 리더보드 | Strava, Duolingo League | 그룹 목표 |
| `10_Social_Invite` | 초대 | Strava, Finch, Discord | 초대 링크 |
| `11_Accountability` | 책임 파트너 | HabitShare, StickK, Coach.me | 목표 공유 |
| `12_Checkin_Journal` | 체크인 | Daylio, Reflectly, Finch, Stoic | 짧은 기록 |
| `13_Crisis` | 위기 대응 | Calm, Headspace, Breathwrk, One Sec | 즉시 멈춤 |
| `14_Stats` | 통계 | Strava, Fitbit, Apple Fitness | 추세 리포트 |
| `15_Paywall` | 구독 | Calm, Headspace, Duolingo | 기능 비교 |
| `16_Privacy` | 개인정보 | Signal, Telegram, Discord | 공유 범위 |

---

## 4. 검색 키워드 (Search keywords)

Collection별 패턴 키워드 (예시, 패턴 중심):
- onboarding question / goal setup / streak counter / habit check / permission priming
- app blocker / focus block / screen time limit / urge timer / breathing pause
- character growth / pet care / reward claim / shop items
- leaderboard league / invite friend / accountability partner / mood check-in / journal
- stats trend / paywall comparison / privacy sharing scope

키워드는 패턴을 찾기 위한 것이며, 성인 콘텐츠 관련 키워드는 사용하지 않는다.

---

## 5. 수집할 것 (What to capture)

- 화면이 보여주는 **UX 패턴**(흐름·구조·정보 위계).
- 권한/차단/위기/체크인/공유범위의 **구성 방식**.
- 패턴이 PRD 어느 섹션과 연결되는지.

---

## 6. 수집하지 말 것 (What not to capture)

- 색상·레이아웃·카피·아이콘·브랜드 에셋 복제.
- 성인 콘텐츠/사이트명/URL 포함 화면.
- 중복·단순 스플래시·광고성 Paywall 반복.
- "이걸 그대로 베끼자"식 노트.

---

## 7. Missing App Rule

PRD §15.2.
- 후보 앱이 Mobbin에 없으면 억지로 찾지 않는다.
- 같은 Collection 안에서 같은 UX 패턴을 가진 대체 앱 2~3개를 찾는다.
- 앱이 아니라 화면 패턴 기준으로 저장.

---

## 8. 스크린샷 명명 규칙 (Screenshot naming convention)

형식: `NN_Collection / app-name / screen-name`
예: `03_Blocking / one-sec / pause-before-open`
- 번호는 Collection 번호. 소문자-하이픈. 브랜드 에셋 파일 포함 금지.
- (이 라운드에서는 실제 파일을 만들지 않는다. 명명 규칙만 정의.)

---

## 9. 추출 템플릿 (Extraction template)

각 캡처 화면당 기록:
- collection
- app
- screen name
- pattern observed (관찰된 패턴)
- why it matters (왜 중요한가)
- what to adapt (무엇을 응용할까 — 패턴 차원)
- what not to copy (무엇을 베끼면 안 되나 — 색/카피/브랜드)
- relevance to PRD section (연결 PRD 섹션)

---

## 10. 사람 검수 체크리스트 (Human review checklist)

- [ ] 패턴 분류용인가, 복제용은 아닌가?
- [ ] 색/레이아웃/카피/아이콘/브랜드 복제 노트가 없는가?
- [ ] 각 Collection 5~20개 범위인가?
- [ ] 중복·스플래시·광고 Paywall이 제외됐는가?
- [ ] Missing App Rule이 적용됐는가?
- [ ] 성인 콘텐츠/사이트명 포함 화면이 0인가?
- [ ] 각 화면이 PRD 섹션과 연결됐는가?
