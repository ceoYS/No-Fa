# DIRECT_COMPETITOR_VISUAL_AUDIT.md

직접 경쟁사 비주얼 감사 — NoF 디자인 방향 재설정 라운드

작성일: 2026-05-26
상태: 감사 보고서 / Baseline B 시각 방향 reject 후 재설정 입력
조사 도구: Mobbin MCP (iOS, 공개 화면), 공개 앱스토어 포지셔닝
상위 문서: `docs/DESIGN_DIRECTION.md`, `docs/COPY_POLICY.md`, `docs/UX_RULES.md`
관련 산출물: `references/direct_competitors/README.md`

> **수집 제약 (준수 확인)**
> - 성인 사이트명/URL/노골적 표현 **검색·수집 안 함**.
> - Mobbin/앱스토어 **공개 화면만** 참고. 화면 **복제 안 함** — 패턴·톤만 텍스트로 기술.
> - 경쟁사 이미지 파일 **다운로드 안 함**. `references/direct_competitors/README.md`는 Mobbin 공개 링크만 보관.
> - 경쟁사의 촌스러운 UI를 그대로 따라 하지 않는다. "피해야 할 것"까지 분석한다.

---

## 0. 배경 (왜 이 라운드인가)

Baseline B(따뜻한 종이)는 시각적으로 reject됐다. 이유:

1. **generic beige / wellness diary** 느낌이 강함.
2. 직접 경쟁사보다 **인접 wellness/명상/일기 앱**(Calm, Finch, Bloom, breeze 류)의 영향이 과도함.
3. 결과적으로 "NoF가 무슨 문제를 푸는 앱인지"가 비주얼에서 사라짐.

이전 `MOBBIN_VISUAL_CURATION_REPORT.md`는 **인접 앱 패턴**(습관·명상·체크인) 중심이었다. 이번 라운드는 **직접 경쟁사가 같은 문제를 어떻게 시각화하는가**를 먼저 보고, 거기서 차별화 좌표를 다시 잡는다.

---

## 1. 조사 범위와 Mobbin 수록 현황

직접 경쟁사를 두 그룹으로 나눈다. **Mobbin에 화면이 있는 앱만 실제 비주얼 감사가 가능**하다. 나머지는 공개 포지셔닝 기반 추정으로만 다룬다(시각 단정 금지).

| 앱 | 분류 | Mobbin 수록 | 감사 가능 범위 |
|---|---|---|---|
| **QUITTR** | 직접 경쟁 (quit-porn) | ✅ 다수 | 홈/온보딩/위기/회복/분석/페이월 전체 |
| **Opal** | 인접 (앱 차단/포커스 리더) | ✅ 다수 | 홈/차단세션/포커스스코어/초대 |
| **LIVESTRONG MyQuit Coach** | 인접 (금연 = 같은 quit 루프) | ✅ 일부 | 트래킹/로깅/히스토리 |
| Fortify | 직접 경쟁 (science-based recovery) | ❌ | 포지셔닝만 |
| Brainbuddy | 직접 경쟁 (brain rewiring/게임화) | ❌ | 포지셔닝만 |
| Reboot / rebooting 계열 | 직접 경쟁 (커뮤니티/포럼) | ❌ | 포지셔닝만 |
| NoFap (브랜드/포럼) | 직접 경쟁 (커뮤니티 원류) | ❌ | 포지셔닝만 |
| BlockerX | 직접 경쟁 (차단+accountability) | ❌ | 포지셔닝만 |
| Covenant Eyes | 직접 경쟁 (신앙 기반 accountability/모니터링) | ❌ | 포지셔닝만 |
| Accountable2You | 직접 경쟁 (모니터링/리포트) | ❌ | 포지셔닝만 |
| Ever Accountable | 직접 경쟁 (모니터링/리포트) | ❌ | 포지셔닝만 |
| Victory / Iron Will / MDF 계열 | 직접 경쟁 (남성성/의지 프레이밍) | ❌ | 포지셔닝만 |

> **핵심 발견 1:** 폴리시드한 모바일 네이티브 비주얼을 가진 quit-porn 직접 경쟁사 중 Mobbin에서 확인되는 건 사실상 **QUITTR 하나**다. 나머지 직접 경쟁사 대부분은 (a) 신앙/모니터링 도구거나 (b) 포럼/커뮤니티거나 (c) 오래된 UI라서 비주얼 벤치마크 대상이 못 된다. → **이 카테고리의 시각 기준선이 사실상 비어 있다. NoF가 비주얼 리더가 될 공간이 크다.**

---

## 2. 경쟁사별 요약 (visual + UX)

### 2.1 QUITTR — 직접 경쟁 1순위 (실측)

가장 완성도 높고 가장 공격적인 직접 경쟁사. NoF가 가장 의식해야 할 동시에 가장 분명히 차별화해야 할 대상.

- **앱스토어 포지셔닝:** "quit porn" 명시. 노골적 단어를 전면에 사용("You've been porn-free for…", "quitting porn", "goons too much").
- **온보딩 문제 프레이밍:** 정량화 + 약속. quit-by date("on track to quit porn by Dec 16, 2025"), 목표일 설정, "왜 끊는가" 이유 입력.
- **홈 대시보드:** 우주/딥 퍼플 배경, 중앙에 변하는 구체(streak에 따라 회전·색 변화), "porn-free for 5 days / 2hr 40m 14s" 카운터, 요일 체크 행(✓/✗), 하단 4버튼(Pledge·Meditate·Reset·More), **"Brain Rewiring 6%" 진행 바**, 최하단 큰 빨강 **Panic Button**, 탭바.
- **스트릭/진척 표현:** 초 단위 카운터 + 요일 ✓/✗ 행 + "Brain Rewiring %" + "Recovery 0%" 링/레이더 + "Level 0" 게임형 레벨 + 28-Day Challenge 노드(1~8 초록/회색).
- **relapse/recovery 화면:** "Relapsed"(빨강 헤더) → "Don't worry about it" 카피는 부드러우나 → 큰 빨강 **"Reset Counter"** 버튼으로 스트릭 0 리셋. "Why are you relapsing recently?" enum(Boredom/Strong urges/I'm Sad/Loneliness/Other). 회복 화면에 "QUITTR believes in you… 18,563 others 😊 / 2,653 😐 / 3,784 😔" 소셜 프루프.
- **위기(Panic) 화면:** **"DON'T BREAK THAT PROMISE TO YOURSELF FOR A FEW SECONDS OF PLEASURE."** + "Side effects of Relapsing: REDUCED PERFORMANCE" + "I Relapsed" / "I'm thinking of relapsing" 버튼. → 공포/수치 프레이밍.
- **accountability:** "Save A Friend — Send an anonymous invite to a friend that goons too much." 익명 초대. (감시형 아님, 슬랭 톤.)
- **paywall:** 일반적 공격형(트라이얼 토글, 연간 할인 강조).
- **시각 톤:** 세련됐으나 **남성성 과다 + 게임화 과다 + 공포/수치 유도**. 우주·네온·빨강 경고. "rewiring/level/recovery%" 의사과학(pseudo-science) 정량화.

### 2.2 Opal — 차단/포커스 비주얼 리더 (실측, 인접)

quit-porn 앱은 아니지만 **앱 차단·포커스 카테고리의 비주얼 기준**. NoF의 차단/포커스 화면이 참고할 톤의 상한선.

- **포지셔닝:** "screen time / focus" 디지털 웰빙. 프리미엄·정제.
- **홈:** 딥 블랙 배경 + **오팔(보석) 마스코트**가 상태에 따라 색/형태 변화, "Screen Time Today 50m 24s", Focus Score %, Pickups, 시간대 막대 그래프, 큰 그라데이션 **"Block Now"** 버튼.
- **차단 세션:** "Focus Session / 3 Apps Blocked / Remaining time", "Take a break" / "Edit Session", **"Invite Friends to block distracting apps in this session together"** (함께 차단 = 비감시형 동료성).
- **스트릭/진척:** "5 Day Streak"(불꽃) + "24 Focus Hours" + 칭호("Steadfast/Determined") + 보석 컬렉션(레벨업으로 보석 변화).
- **시각 톤:** 어둡지만 **고급·차분·미래적**. 보석 메타포가 "성장=수집"을 비게임적·미학적으로 표현. 빨강 경고 없음. 공포 없음.
- **NoF 시사점:** "어두운 배경 = 무겁고 음침"이 아니라 **어두운 배경 = 프리미엄·집중**으로 쓸 수 있음을 증명. 캐릭터/마스코트(보석)가 상태를 차분히 시각화하는 좋은 사례.

### 2.3 LIVESTRONG MyQuit Coach — 금연 (실측, 인접 quit 루프)

같은 "끊기" 루프(추적·갈망·기록)를 의료/공포 없이 다루는 사례.

- **홈:** 딥 네이비 + 별 입자. "Day 1 of 21", 중앙 카운트 링, "0 cigarettes left", 통계 3열(smoked/craved/saved $), **"I smoked" / "I'm craving" 이중 로깅 버튼**.
- **시사점:** 실패("I smoked")와 충동("I'm craving")을 **분리**해 비난 없이 로깅. 갈망을 사건으로 기록 → NoF 체크인/충동 로깅에 적용 가능. 단, "cigarettes over"를 빨강으로 표시 → 실패 강조는 피한다.

### 2.4 Mobbin 미수록 직접 경쟁사 (포지셔닝만)

> 시각 단정 금지. 아래는 공개 앱스토어/사이트 포지셔닝 수준의 일반 지식이며 **화면 검증 없음**.

- **Fortify** — science-based recovery. 임상·교육 톤(차트·심리교육·저널). 중립·전문가 포지셔닝. 시각은 진중하고 의료/연구 인상. → NoF는 "임상 보고서" 무게는 피하되, **데이터를 비난 없이 보여주는 차분함**은 참고할 만함.
- **Brainbuddy** — "brain rewiring" + 게임화(레벨·진척·뇌 회복 시각화). QUITTR의 "Brain Rewiring %"와 같은 의사과학 정량화 계열. → NoF는 정량화 자체보다 **"치료/회복 단정"으로 흐르는 표현**(COPY_POLICY §4)을 경계.
- **Reboot / rebooting 계열, NoFap(브랜드/포럼)** — 커뮤니티·포럼 원류. 폴리시드 앱 UX보다 텍스트/게시판 중심. "reboot/hard mode/streak" 용어. → NoF는 커뮤니티 의존을 핵심 UX로 삼지 않음(비공개 기본 원칙).
- **BlockerX** — 차단 + accountability 결합. 차단 우회 방지 강조 경향. → NoF는 "완벽 차단/우회 불가" 보장 표현 금지(COPY_POLICY §7).
- **Covenant Eyes / Accountable2You / Ever Accountable** — 신앙 기반 accountability·**활동 모니터링/리포트**(파트너가 사용자 활동 보고서를 받음). 종교·감시 톤. → NoF의 **동의 기반·기본 비공개·비감시** 원칙(COPY_POLICY §10)과 정면 충돌. **반면교사.**
- **Victory / Iron Will / Man Don't Fap(MDF) 계열** — 남성성·의지력·"전사" 프레이밍. 강한 남성 코드·승부·랭킹. → NoF는 "의지가 약해서" 류 모욕·과도한 남성성·경쟁 망신(랭킹 강등)을 금지.

---

## 3. 따라 할(adapt) UX 패턴

패턴 차원만 가져온다. 색/카피/브랜드/톤은 NoF 기준으로 재해석한다.

| # | 패턴 | 출처(관찰) | NoF 적용 방식 |
|---|---|---|---|
| 1 | 상태 반응형 중앙 오브제(마스코트/구체/보석) | QUITTR 구체, Opal 보석 | 캐릭터(수호자/동료)가 절제 상태를 **차분히** 반영. 단계적·따뜻하게. 회전 네온·전투 미감 금지 |
| 2 | 큰 단일 위기 진입점(항상 도달 가능) | QUITTR Panic Button | "잠깐 멈춤" CTA. **공포·약속배신 카피 없이** 즉시 호흡/유예/대체활동 진입(UX_RULES §위기) |
| 3 | 충동 ≠ 실패 분리 로깅 | LIVESTRONG ("craving" vs "smoked") | "지금 충동이 와요"(예방)와 "다시 시작"(회복)을 분리. 둘 다 비난 없음 |
| 4 | 원인 enum 선택 | QUITTR "Why are you relapsing" | 충동/재시작 시 원인 enum(지루함/스트레스/외로움/기타) — **자유서술 강요 금지, 선택·비공개**(COPY_POLICY §6) |
| 5 | 함께 차단 / 동료 초대 | Opal "Invite Friends to block together", QUITTR "Save A Friend" | 동의 기반 동료 응원. **감시·코인 인센티브·익명 슬랭 금지**. 기본 비공개 |
| 6 | 요일 체크 행 + 현재/최장 스트릭 | QUITTR, Opal | 중립 스트릭 표현. **리셋=0 가혹 연출 금지**, skip/유예 허용 |
| 7 | quit-by 목표일 + "왜 끊는가" 이유 | QUITTR | 목표·동기 입력은 좋음. **"실패 시 약속 배신" 압박으로 되쓰지 않음** |
| 8 | 차단 세션 = 자기 설정 시간 블록 | Opal Focus Session | 차단=내가 정한 환경. "Take a break"처럼 유예를 정상 옵션으로 |
| 9 | 어두운 배경 = 프리미엄·집중 | Opal | 베이지 일색 탈피. 차분한 다크 톤도 NoF 후보. 단 음침·공포 아님 |

---

## 4. 피해야 할(avoid) UI / 카피 / 톤

직접 경쟁사가 실제로 쓰는, NoF가 **따라 하면 안 되는** 것들.

### 4.1 카피/프레이밍 (anti-pattern)
- ❌ **"DON'T BREAK THAT PROMISE… FOR A FEW SECONDS OF PLEASURE"**(QUITTR Panic) — 수치·죄책감 유도. → COPY_POLICY §4 위반.
- ❌ **"Side effects of Relapsing: REDUCED PERFORMANCE"** — 공포·신체 위협 프레이밍.
- ❌ **"Brain Rewiring %", "Recovery 0%", 회복 레벨** 의사과학 정량화 — "치료된다" 단정 인접(COPY_POLICY §4). 정량화하더라도 의학·완치 단정 금지.
- ❌ **남성성/의지 프레이밍**("전사", "의지로 이겨라", "goons") — 모욕·과도한 남성 코드.
- ❌ **노골적 단어 전면 노출**("porn-free for…") — NoF 앱스토어/온보딩 기본 카피는 "절제/자기통제/유해 디지털 환경"(COPY_POLICY §5).
- ❌ **"완벽 차단/우회 불가"** 보장(차단형 경쟁사 경향) — 정직 고지 위반.

### 4.2 UI/연출 (anti-pattern)
- ❌ **빨강 경고색 + 하강/X 연출**로 실패 강조(QUITTR Reset Counter 빨강, "cigarettes over" 빨강).
- ❌ **스트릭 즉시 0 리셋**을 가혹하게 시각화(QUITTR "Reset Counter", Duolingo "resets to 0").
- ❌ **게임 경제 과다** — 코인/재화/상점/XP/뽑기/랭킹 강등.
- ❌ **소셜 프루프로 불안 유도** — "X명이 슬퍼함 😔" 식 부정 감정 카운트.
- ❌ **감시형 accountability** — 파트너가 사용자 활동 리포트를 받는 구조(Covenant Eyes 계열).
- ❌ **우주/네온 + 회전 구체**의 과한 spectacle — 진지함을 넘어 게임 스킨처럼 보임(QUITTR).

### 4.3 톤 종합 진단

| 톤 축 | 직접 경쟁사 경향 | NoF 입장 |
|---|---|---|
| 세련됨 ↔ 촌스러움 | QUITTR·Opal 세련 / 모니터링·포럼 계열 촌스러움 | 세련 유지하되 spectacle 과다는 거름 |
| 종교적 | Covenant Eyes 등 강함 | **배제** |
| 의료적 | Fortify, "brain rewiring" 계열 | 차분한 데이터는 차용, **완치 단정 배제** |
| 남성성 과다 | Victory/Iron Will/MDF, QUITTR 슬랭 | **배제** (지지적 동료 톤) |
| shame 유도 | QUITTR Panic/relapse 강함 | **배제** (비난 없음) |

---

## 5. NoF 차별화 방향 (positioning gap)

직접 경쟁사 지형의 빈 공간 = NoF의 기회:

1. **"수치·공포 없이 진지한" 단 하나의 앱.** 직접 경쟁사는 둘 중 하나다 — (a) 공포·수치·남성성(QUITTR/MDF 계열) 또는 (b) 종교·감시(Covenant Eyes 계열). **둘 다 아닌 차분한 자기통제** 포지션이 비어 있음.
2. **한국 모바일 네이티브.** 거의 모든 직접 경쟁사는 영어권·서구 남성 코드. **한국어 톤·카카오 맥락·한국 UI 관습**이 무주공산.
3. **비감시·동의 기반 동료성.** 경쟁사는 익명 슬랭 초대(QUITTR)거나 감시 리포트(Covenant Eyes). NoF는 **기본 비공개 + 사용자가 공유 범위 결정**.
4. **차단 = 처벌이 아니라 내가 정한 환경.** "완벽 차단/우회 불가" 군비경쟁(BlockerX)에서 빠지고, **정직 고지 + 멈춤→대체활동** 톤으로 차별화.
5. **충동을 사건으로, 실패를 회복 루프 시작으로.** 정량화하되 "rewiring %/치료" 단정 대신 **패턴 학습·자기이해** 프레이밍.
6. **프리미엄하되 따뜻한 비주얼.** Opal의 "다크=프리미엄"과 인접 wellness의 "따뜻함" 사이 — 그러나 generic beige도, 우주 네온 spectacle도 아닌 **제3의 톤**.

---

## 6. Baseline B에서 버릴 요소

`design_outputs/nof_design_direction_baseline_b_v1.md` 기준 폐기/수정:

| 버릴 것 | 이유 |
|---|---|
| **"따뜻한 종이"를 기본 비주얼 기준으로 채택** | generic beige/wellness diary로 읽힘. 직접 경쟁사 대비 "무슨 앱인지" 소실 |
| **인접 wellness/일기 앱(Bloom/breeze/Finch 류) 과다 영향** | 카테고리 정체성 희석. 직접 경쟁사 입력이 부족했던 결과 |
| **베이지 단색 무드 보드** | DESIGN_DIRECTION §4 "베이지 일색 회피"와도 배치. 톤 좌표 재설정 필요 |
| **C안 "호박 등불"을 위기/차단 포인트로 흡수한다는 잠정 결정** | 톤 좌표 자체를 다시 잡으므로 보류. 색 확정은 사람 승인 후 |

유지할 것: P0 핵심 8화면 우선순위(홈/체크인/충동/대체활동/회복/캐릭터홈/차단/파트너공유)는 그대로 유효.

---

## 7. 다음 Claude Design용 revised direction brief

> 이 브리프는 **방향·제약**만 정의한다. 최종 색/고해상도 UI는 사람 승인 후. DESIGN_DIRECTION.md의 금지 미감(§4)을 그대로 상속.

**톤 좌표 (재설정):**
- 베이지 단색도, 우주 네온 spectacle도 아닌 **차분한 프리미엄 + 따뜻한 인간미**.
- 다크/뉴트럴 베이스를 후보로 열어둔다(Opal이 "다크=프리미엄" 가능성을 입증). 단 음침·공포·네온 경고 금지.
- 따뜻함은 **색 온도가 아니라 카피·캐릭터·여백**으로 확보한다(beige에 의존 금지).

**반드시 차별화:**
- 직접 경쟁사의 **공포·수치·약속배신·신체위협 카피**를 0으로(§4.1).
- **빨강 경고·즉시 0 리셋·하강 연출** 금지(§4.2).
- **남성성 과다·종교·감시·게임 경제·의사과학 완치 단정** 배제.

**차용(패턴만):**
- 상태 반응형 캐릭터 오브제(§3-1), 큰 단일 위기 진입점(§3-2, 단 카피 전면 교체), 충동≠실패 분리 로깅(§3-3), 원인 enum(§3-4, 선택·비공개), 함께-차단 동료 초대(§3-5, 비감시·기본비공개), 중립 스트릭(§3-6, 가혹리셋 없음).

**핸드오프 입력 세트:**
- 본 문서 + DESIGN_DIRECTION.md + COPY_POLICY.md + UX_RULES.md + SCREEN_INVENTORY.md.
- `references/direct_competitors/README.md`(경쟁사 패턴 인덱스, **이미지 미포함 — 링크/관찰만**).
- 이전 인접 앱 큐레이션(USE 67)은 **보조 입력으로 격하**. 직접 경쟁사 차별화가 1순위 기준.

**산출 1순위 (다음 라운드):**
- 새 톤 좌표 기반 **무드/방향 비교안 2~3개**(베이지 회귀 금지). 사람 시각 승인 후 P0 8화면 high-fidelity 진행.

---

## 8. 사람 검수 체크리스트

- [ ] QUITTR식 공포·수치·약속배신 카피가 0인가?
- [ ] 빨강 경고·즉시 0 리셋·하강 연출이 없는가?
- [ ] 남성성 과다·종교·감시형 accountability·게임 경제가 없는가?
- [ ] "치료/완치/rewiring %" 의료·의사과학 단정이 없는가?
- [ ] Baseline B의 generic beige/wellness diary로 회귀하지 않았는가?
- [ ] 직접 경쟁사 화면을 복제하지 않고 패턴만 재해석했는가?
- [ ] 성인 사이트명/URL/노골적 표현이 없는가?
- [ ] 동료성이 동의 기반·기본 비공개·비감시인가?
- [ ] 최종 색/UI를 임의 확정하지 않았는가(사람 승인 전)?
