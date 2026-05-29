# ACQUISITION_POSITIONING_BENCHMARK.md

NoF — Acquisition / Positioning / Onboarding / Blocker / Urge / Gamification / Monetization 벤치마크

작성일: 2026-05-29
조사 도구: Mobbin MCP (iOS, `mcp__mobbin__search_screens`) + 공개 App Store 텍스트(보조)
범위: NoF 다음 PRD 패치 직전, 포지셔닝/카피/UX 패턴 검증
상위 문서: `docs/COPY_POLICY.md`, `docs/UX_RULES.md`, `docs/DESIGN_DIRECTION.md`, `docs/MONETIZATION_POLICY.md`, `docs/DIRECT_COMPETITOR_VISUAL_AUDIT.md`
선행 라운드: `docs/MOBBIN_MCP_CAPABILITY_CHECK.md`, `docs/DIRECT_COMPETITOR_VISUAL_AUDIT.md`

> **수집/저장 제약 (준수 확인)**
> - 성인 사이트명/URL/노골적 검색어 수집·기록 안 함.
> - 경쟁사 스크린샷·바이너리 다운로드/커밋 안 함.
> - Mobbin 링크와 텍스트 관찰만 보관. 이미지는 응답 컨텍스트에서만 참고 후 폐기.
> - App Store/Play 공개 포지셔닝은 일반 지식 수준 텍스트 메모만.
> - 본 문서는 **연구 보고서**이며 PRD/Spec/소스 수정은 **포함하지 않는다.**

---

## 1. Executive summary

1. **Quit-porn 카테고리에서 폴리시드 모바일 네이티브 표준을 만든 직접 경쟁사는 사실상 QUITTR 하나다.** Mobbin에 다수 화면이 등록되어 있고, 포지셔닝·온보딩·차단·위기·페이월의 라이브 표본을 모두 볼 수 있다. Brainbuddy/Fortify/BlockerX/Covenant Eyes/Ever Accountable/Reboot/NoBeep/Pledge AI/Unshaken/ZenAI/RezenIt/Transform/MDF는 Mobbin에 없음. → **카테고리 비주얼·UX 표준이 비어 있는 상태**이며 NoF는 비주얼 리더가 될 공간이 크다.
2. QUITTR는 **노골적 직설("quit porn", "porn-free for…")** + **남성성 약속(증가된 테스토스테론·발기부전 예방 등)** + **공포·약속배신 카피(Panic Button)** + **80% off 일회성 한정 페이월(타이머)** 의 4단 공세로 묶여 있다. 강한 단기 전환이 목표인 미국 시장형 포지셔닝.
3. Opal은 **"폰을 통제한다 / 6+년을 되찾는다"** 같은 **숫자 약속 + 보석 마스코트 + 비처벌 차단/스누즈** 라인을 들고 동일 시장(차단·포커스)에서 프리미엄 톤을 점유. Adult Blocking 토글이 존재하지만 1차 메시지는 절대 직설 카피가 아니다.
4. Finch는 **펫 결과 모델의 비처벌 표준**이다. "It's okay to miss a day. The important thing is you're here today, cheep!" + "Repair streak (1st time FREE)" — 죽음·질병·죄책감 없이도 **펫이 사용자 행동에 반응**하는 라인이 살아있다. NoF 펫 결과 모델 강화는 **Finch의 결과 패턴 + Opal의 절제된 톤**을 합성해야 함.
5. Opal의 **App Lock = 6/6 unlocks left today + Unlock for 5m + Wait for 6s** 패턴이 **"보호 모드 일시정지"** P1/P2 후보의 가장 가까운 실측 레퍼런스다. "차단 풀기"가 아니라 **일일 쿼터 + 짧은 대기 + 명확 재잠금** 구조.
6. **카피 분할 전략이 필요하다.** App Store/온보딩 본문은 **소프트 카피(절제·자기통제·유해 디지털 환경)**, 검색 광고·SEO·커뮤니티/SNS 유입은 **직설 어휘(금딸/NoFap/Quit Porn/porn blocker)**, 인앱은 **NoF 톤 유지**. COPY_POLICY §3·§5 와 정합.

---

## 2. Apps found on Mobbin (실측 가능)

| 앱 | 카테고리 | 본 라운드 관찰 범위 | Mobbin 링크(샘플) |
|---|---|---|---|
| **QUITTR** | 직접 경쟁 (quit porn) | 온보딩 9+장, 홈 대시보드, Panic Button, Don't Relapse, 28-Day Challenge, 페이월 5+장(80% lifetime, 5분 타이머, 연간/월간/해지 옵션), Internet Filter, life-tree | `mobbin.com/screens/06bcb6df-b2f9-4d1d-99af-09f4fcd292a6`, `…fca28dae-…`, `…035d99cb-…`, `…6fa3cddf-…`, `…e788be9f-…`, `…09ef2499-…`, `…9832a2fc-…`, `…13128215-…` |
| **Opal** | 인접 (앱 차단/포커스) | 온보딩(숫자 약속 6년/8년, 보석 마스코트, "Houston…", "Take control of your phone"), Screen Time 권한 요청, App Lock(unlock quota + relock), Almost there(6s wait), Adult Blocking 토글(자체 경고 카피), Focus Session character | `…d0e1b80e-…`, `…540370cc-…`, `…97813852-…`, `…fff66acd-…`, `…a118d7f3-…`, `…3ad2ad02-…`, `…6c1ee010-…`, `…4aaa3151-…` |
| **Finch** | 인접 (펫 동반 셀프케어) | 펫 홈(Lee/cheep), 무드 체크인 5종 이모지, "Repair streak FREE 1st time", "It's okay to miss a day", 퀘스트/Adventure/Shop/Friends/Bag 탭, "Gain energy so Lee can go discover…" | `…da33ee36-…`, `…99094ecd-…`, `…682146ab-…`, `…d6e7a7b1-…` |
| **stoic.** | 인접 (저널/마음챙김) | "stoic shield." 모닝/이브닝 차단 스케줄, "Do you really need to open Email at 2:00 AM?" 마인드풀 인터셉트 | `…bcfd547f-…`, `…ac173b8b-…`, `…caad9f7b-…` |
| **Atoms** (Atomic Habits) | 인접 (습관) | accountability 파트너 동의 흐름("Send invite — they accepted — You won't see their progress unless they invite you") | `…78ff192f-…` |
| **Streaks** | 인접 (습관) | COMPLETED / MISSED / SKIPPED 3상태 명시, SKIPPED는 streak 유지, MISSED만 0, "Shake to Undo Completion" | `…fb4eb03d-…`, `…8d28fcaf-…` |
| **Forest** | 인접 (포커스 게임화) | "If you use your phone, your tree will wither" — 가벼운 시각적 페널티(완전 죽음 아님) | `…b49cb9d9-…` |
| **Duolingo** | 인접 (학습 게임화) | "0 day streak! Miss a day, and it resets to 0" — 가혹한 리셋 카피 표준 | `…1274e1c1-…` |
| **Done** | 인접 (습관) | "DON'T BREAK THE STREAK! IF YOU MISS YOUR GOAL, STREAK GOES TO '0'" — 명령형 가혹 카피 | `…a1296c87-…` |
| **Paired** | 인접 (커플 대화) | "Streak Freeze 1 available — automatically applied when you lose your streak. You get one new Streak Freeze per month!" — 자동 보호 패턴 | `…b27cfee7-…` |
| **Tangerine / Habitify / Fabulous / Headway / Headspace** | 인접 (각 카테고리) | 펫·일정·습관·페이월 트라이얼 가이드 UI 톤 비교 보조 | (검색 결과 내) |

> 주의: Mobbin 메타데이터에 화면 제목·플로우·태그는 반환되지 않으므로(§ MOBBIN_MCP_CAPABILITY_CHECK §4) 화면명은 사람이 화면을 직접 보고 부여한 라벨이다. 링크는 영구 screen UUID 기준.

---

## 3. Apps NOT found on Mobbin (App Store/Play 포지셔닝 텍스트로만 참고 — 시각 단정 금지)

| 앱 | 공개 포지셔닝 (텍스트 메모 수준) | NoF 의의 |
|---|---|---|
| **Brainbuddy** | "Brain rewiring", 게임화 진척, "neural fitness" 표현. 의사과학 정량화 라인의 원조 중 하나. | NoF는 "치료/완치/뇌 재배선 %" 단정 카피 금지(COPY_POLICY §4) — 반면교사. |
| **Fortify** | "Science-based recovery", 임상·교육 톤(저널/심리교육). 차분하고 진중. | 차분한 데이터·교육 톤은 참고 가능. "임상 보고서" 무게는 회피. |
| **BlockerX** | "Block adult content + accountability partner". 차단 우회 방지 강조. | NoF는 "절대 차단/우회 불가" 보장 표현 금지(COPY_POLICY §4·§7). 정직 고지 톤 유지. |
| **Covenant Eyes** | 신앙 기반 accountability + 활동 모니터링/리포트 발송. 파트너가 사용자 활동 보고서를 받음. | NoF의 비감시·동의 기반·기본 비공개와 정면 충돌. **명확한 반면교사.** |
| **Ever Accountable** | Covenant Eyes 계열의 모니터링/리포트 패턴. | 동일. |
| **Reboot / NoFap** | 커뮤니티·포럼 원류. "reboot/hard mode/streak" 어휘. | NoF는 커뮤니티 의존을 핵심 UX로 삼지 않음. 어휘는 유입 채널 한정으로 차용 가능(§ 5). |
| **NoBeep / Pledge AI / Unshaken / ZenAI / RezenIt / Transform** | 신규/소규모. App Store에서 "quit porn / NoFap" 직설 카피 일반. UX 표본 부족. | 직접 경쟁 좌표만 인지. 비주얼 표준 부재. |
| **MDF (Man Don't Fap) / Victory / Iron Will 계열** | 남성성/의지/전사 프레이밍. 강한 남성 코드. | NoF 금지(모욕·과도한 남성성). |
| **Jomo / ScreenZen / Freedom** | 차단·포커스 인접. Mobbin 결과 빈약. | UX 표본은 Opal로 대체. |

> **갭 기록:** 위 표에서 Mobbin 미수록 12+개 앱은 본 라운드에서 화면 단위 검증이 불가능했다. 시각·UX는 단정하지 않는다. 향후 사람 손으로 App Store 영상/스크린샷 수동 캡처 큐(§ MOBBIN_MCP_CAPABILITY_CHECK §5) 진행 시 본 표를 입력으로 사용.

---

## 4. Competitor positioning table

> 가독성을 위해 두 표로 분리. 모든 인용은 **실측 화면 텍스트 그대로**. NoF에 옮길 때는 **카피 그대로 사용 금지**.

### 4.1 직접 경쟁 / 차단·포커스 (실측)

| 항목 | QUITTR | Opal | Finch | Forest |
|---|---|---|---|---|
| 카테고리 | Quit porn (직접) | Screen time / Focus (인접) | Self-care + pet (인접) | Focus + tree game (인접) |
| 1차 promise | "Become the best of yourself with QUITTR — Stronger. Healthier. Happier." / "Welcome to QUITTR — over 1,000,000 users, class-leading and based on years of research" | "Take control of your phone" / "Opal can help you get back 6 years+ of your life free from distractions" / "30% less screen time, 20% productivity boost, 30 days back this year" | "Let's do one thing at a time, cheep!" / "Gain energy so Lee can go discover new things today" | "Plant a tree. Stay focused. Save the planet." (앱스토어 일반) |
| 언어 직설도 | **매우 직설**: "porn-free for…", "Finally Quit Porn", "Pledge daily to not relapse" | **소프트**: "distractions / screen time / focus / fist bump" | **소프트**: "cheep / energy / adventure" | **소프트**: focus / wither |
| 타깃 신호 | 남성 회복(증가된 테스토스테론·발기부전 예방·동기·자신감 칩, "Willpower alone is not enough") | 분주한 폰 중독 일반(연령·성별 중립, 미래적 톤) | 외로운/우울감 셀프케어 일반(부드러운 톤) | 학생/집중 작업자 |
| 핵심 메트릭 | porn-free 일수+초카운터, Brain Rewiring %, Recovery %, Level N, 28-Day Challenge 노드, weekly ✓/✗ row | Screen Time 시간/분, Focus Score %, Pickups, 5 Day Streak, Focus Hours, 타이틀(Steadfast/Determined), 보석 컬렉션 | 무드 5종 이모지, Adventure n/15, weekly milestones, 골 횟수 ("Completed 4x in a row") | tree count, total minutes |
| 차단/보호 카피 | "Internet Filter — QUITTR protects you by managing content restrictions and disabling private browsing" / "Use QUITTR's content blocking filter" | "Houston, We Have a Distraction Problem / Instagram is temporarily out of reach" / "shield apps", "snooze to unshield temporarily" / Adult Blocking 토글 + 자체 경고 "If Adult is selected, private browsing mode on your browser will be disabled" | 차단 없음 | 자체 세션 락 (앱 사용 시 tree wither) |
| 위기/긴급 흐름 | **Red Panic Button(홈 하단 상시)** → "DON'T BREAK THAT PROMISE TO YOURSELF FOR A FEW SECONDS OF PLEASURE" + "Side effects of Relapsing: REDUCED PERFORMANCE" + 2개 버튼 "I Relapsed" / "I'm thinking of relapsing" / "Don't Relapse" 페이지 "Porn can erode personal values and ethics regarding sexuality" 빨강 → "Talk in Chat" or "Start Breathing Exercise" / 개인화 "YOU GOT THIS, SAM" | "Almost there — Wait for 6s — Nevermind" 6초 마찰 / Focus Session 중 "Skip Work"는 정상 옵션 | 무드 체크인 모달, "It's okay to miss a day" 비처벌 카피 | "If you use your phone, your tree will wither" 시각 페널티 |
| 스트릭/회복 카피 | "You've been porn-free for 6 days / 2hr 40m 16s" / "RECOVERY 82% — 74 D STREAK" / 빨강 Reset Counter / 28일 챌린지 "I Relapsed, Reset Challenge" / life-tree "Your life tree grows with your sobriety streak" | "5 Day Streak" 불꽃 + "24 Focus Hours" + 칭호 + 보석 컬렉션. 패배 강조 없음. | "Completed 2x in a row" 중립 / "It's okay to miss a day" / "Repair your 2 day streak? Repair for 2000 (1ST TIME OFFER FREE!) / Start over" | streak 별도 카피 약함, 시각으로만 |
| 게임화/보상 | Level N(레벨업), "Brain Rewiring %" 진행 바, 28-Day Challenge 노드, life-tree 성장, weekly ✓/✗, 28일 챌린지 task("Journal why you want to quit") | 보석 마스코트가 단계마다 변형/색 변화, 타이틀 칭호, Focus Score, 함께-차단 초대(비감시) | 펫 외형 성장, Adventure 퀘스트, Shop/Bag(코스메틱·재화), Friends, 무드 캘린더, 1st time FREE 복구권 | 나무 종류 컬렉션, 숲 누적 |
| 페이월 압박 | **매우 강함**: "Lifetime Deal 80% OFF — Once you close the offer, it's gone!" / "ONE TIME OFFER — You will never see this again. 4:59" 타이머 / "9 spots remaining" / 리뷰 5개·140K users · 4.8★ 사회적 증명 / "Cancel anytime · Money back guarantee · Restore Purchase" / 본 가격 $19.98/mo → 연 $3.33/mo → lifetime $39.98 → "Lowest Price Ever Yearly $2.50/mo" 단계적 다운셀 | **중간**: "Design Your Trial Experience" + "Not ready for a year? Try monthly $19.99/mo" 다운셀 + "Redeem 7 days for $0.00" + "No thanks →" | **약함**: 코스메틱·재화 IAP, "Repair for 2000 — 1st time FREE" 첫 회 무료, 강한 한정 타이머 없음 | 약함 (Premium IAP, 위협적이지 않음) |
| Take for NoF | **남성성 약속 + 의사과학 % + 공포 위기 + 5분 타이머 80%** 4단 스택은 **명확한 반면교사.** 다만: **(a)** 노골적 카테고리 정의("Quit Porn") 자체가 App Store 검색 노출에 효과적이라는 신호, **(b)** 28일 챌린지 노드처럼 **퀘스트 구조**는 P2/P3 게임 방향과 정합, **(c)** "Reset Challenge"는 NoF "다시 시작" 카피와 정합(비난 없이). | **(a)** 숫자 약속 카피("X시간/년을 되찾는다")는 강력하고 비공격적이라 NoF App Store 카피에 흡수 가능, **(b)** App Lock의 unlock-quota + 짧은 대기 = **보호 모드 일시정지** 패턴의 직접 레퍼런스, **(c)** "Adult Blocking 토글 + 정직한 사이드이펙트 경고" 카피는 NoF "정직 고지"(§7) 그대로 가능, **(d)** 절제된 보석 마스코트 — NoF 펫·앰버 캐릭터 톤의 상한. | **(a)** "It's okay to miss a day" 정확히 NoF가 써야 하는 회복 톤, **(b)** "Repair streak 1st time FREE"는 **회복 행동 1개 = 회복 완료** 의 게임화 변형이지만 NoF에서는 **유료 복구권 금지**(MONETIZATION_POLICY) → 무료 회복만, **(c)** 펫 결과 = 죽음·질병 0, **에너지·기분·발견**으로 표현 — NoF 펫 강화의 정확한 모범, **(d)** 무드 체크인 5종은 NoF 무드 enum과 호환. | **(a)** 시각적 가벼운 페널티(시들기) ≈ NoF 펫 룸 톤다운, 단 "죽음" 단계는 절대 도입 금지. |

### 4.2 인접 습관/포커스 (실측)

| 항목 | Streaks | Duolingo | Done | Paired | stoic. | Atoms |
|---|---|---|---|---|---|---|
| 1차 promise | 단순 습관 추적 | 언어 학습 게임화 | 습관 추적 | 커플 관계 | 마음챙김 저널 | 습관 형성 |
| 스트릭 카피 | "COMPLETED / MISSED / SKIPPED" **3상태 명시**, SKIPPED는 streak 유지, MISSED만 0 | "0 day streak! Miss a day, and it resets to 0." 가혹 직설 | "DON'T BREAK THE STREAK! IF YOU MISS YOUR GOAL, STREAK GOES TO '0'" 가혹 명령형 | "Streak Freeze 1 available — automatically applied when you lose your streak. You get one new Streak Freeze per month!" 자동 보호 | — | "Completed 4x in a row" 중립 |
| 위기/마찰 | — | — | — | — | "Do you really need to open Email at 2:00 AM?" 마인드풀 인터셉트 | — |
| 차단/일시정지 | UNDO COMPLETION via shake — 가역성 | — | — | Streak Freeze 자동 적용 | "stoic shield." 모닝/이브닝 스케줄 차단 | — |
| accountability | — | — | — | — | — | "Send invite, they download, **you won't be able to see their progress unless they invite you**" 양방향 동의 |
| Take for NoF | **3상태(완료/놓침/스킵) 명시 = NoF 5상태(지켰어요/확인필요/흔들렸어요/회복완료/해당없음, §10.5)와 정합.** 스킵을 정상 옵션으로 두는 패턴 그대로 차용. UNDO 패턴도 — 가역적 기록 보장. | **반면교사** — 가혹 직설 리셋 카피 금지(COPY_POLICY §4 "또 실패", "꼴찌"). | **반면교사** — 명령형 강제 카피 금지. NoF는 제안형(§6). | **자동 보호 패턴**(월 1개 자동 적용)은 NoF "회복 완료" 무료 흐름과 정합. **단 보호는 결제 게이트 없이 무료.** | 시간·맥락 기반 마인드풀 인터셉트 — NoF 야간/위기 시간대 충동 인터셉트와 정합. | **양방향 동의·기본 비공개·감시 0** — NoF 파트너 공유 P2 정책(§10)과 거의 동일. 그대로 참고. |

---

## 5. Key findings for NoF acquisition

### 5.1 어디서 직설 어휘(금딸 / NoFap / Quit Porn / porn blocker)를 써야 하는가

- **유효한 채널 (직설 어휘 OK, COPY_POLICY §3 제한적 허용 범위 안에서):**
  - **검색 광고 / SEO 키워드 / ASO 부키워드**: 사용자가 직접 검색하는 어휘는 "금딸 앱", "노팹", "포르노 차단", "성인 콘텐츠 차단", "quit porn", "NoFap app", "porn blocker", "adult content blocker"가 압도적. QUITTR가 이 채널을 점유 중. NoF는 **키워드는 직설, 카피 본문은 소프트** 으로 분리.
  - **커뮤니티/SNS 유입(레딧·X·디씨 등)**: 해당 커뮤니티의 자기-명명("NoFap", "금딸", "리부트")을 NoF가 거부하면 유입이 끊김. **커뮤니티 톤은 그들의 어휘로 진입**, 앱은 절제 어휘로 환승.
  - **랜딩/홍보용 long-form 콘텐츠**: 부제·내부 H2·FAQ에서 "What is NoFap?", "금딸이란?" 등 검색 의도 매칭 카피 사용. 단 본문 결론은 **자기통제·회복·환경 설계** 프레임으로 환승.

- **무효한 채널 (직설 어휘 금지 / 소프트 카피 강제):**
  - **App Store 1차 타이틀/서브타이틀/스크린샷 1**: Apple/Google 심사 리스크 + "성인 콘텐츠 제공 앱"으로 오인 + 미성년자 대상 제한. COPY_POLICY §5 그대로 유지. "절제 / 자기통제 / 유해 디지털 환경" 본문.
  - **앱 내 홈/온보딩 본문/대시보드 메트릭**: NoF의 비난 없는 회복 톤 정체성. 노골 어휘 노출 시 사용자가 외부에 폰 화면을 보이기 부담. **사용자 경험 자체가 카피의 일부.**
  - **푸시 알림/위젯/잠금화면**: 타인이 볼 수 있는 표면. 직설 어휘 금지.

### 5.2 권장 카피 분할 (3-track)

> 어휘 분할은 채널별 정합성. 본문 양산은 사람 검수 후 진행.

**A. 랜딩 / 커뮤니티 / SNS (직설 OK)**
- 키워드 의도 매칭이 1차. 검색·SEO 페이지 메타 타이틀에 "금딸 앱 추천", "NoFap 한국", "Quit Porn for Korean men", "Porn blocker app Korea" 등 직설.
- 본문 도입은 검색 의도 매칭, 결론은 **NoF 프레임(절제·환경·회복)** 환승.
- 톤: 정직·정보형. 공포·약속배신·남성성 과다 금지(QUITTR 반면교사).

**B. App Store / Play Store (소프트, COPY_POLICY §5 유지)**
- 타이틀: "절제 루틴 · 자기통제 앱 NoF" 류 (직설 단어 금지).
- 서브타이틀/홍보문: "유해한 디지털 환경에서 잠깐 멈추고, 다시 시작하는 회복 루틴" 류.
- 스크린샷 카피: 캐릭터·루틴·차단·회복 — "porn-free", "NoFap", "금딸" 직설 단어는 스크린샷 1차 카피에 노출 금지. 단 부키워드 메타데이터로는 사용.
- 효과 단정 금지: "치료된다", "발기부전 예방", "테스토스테론 증가"(QUITTR 사용) 금지 — 심사 리스크 + COPY_POLICY §4.

**C. 인앱 UI (NoF 톤 유지)**
- COPY_POLICY §2 승인 어휘만. 직설 어휘는 인앱 1차 노출 0.
- 위기 화면: "잠깐 멈춰볼까요?" + 5분 호흡/대체 활동. 공포·약속배신 카피 0.
- 회복 화면: "다시 시작은 회복의 시작점" 톤.

### 5.3 포지셔닝 1줄 후보 (Direction, 사람 승인 전)

> 임의 확정 금지. 다음 카피는 **방향 후보**이며 사람 카피 검수가 본 양산을 한다.

- "내가 정한 디지털 환경을 지킨다."
- "자극이 흔들 때, 잠깐 멈추고 다시 시작한다."
- "절제 루틴을 위한 비처벌·비공개 회복 앱."

### 5.4 QUITTR 대비 우리가 점유할 좌표 (positioning gap)

`DIRECT_COMPETITOR_VISUAL_AUDIT §5` 상속·확장:

1. **공포·수치 없는 진지한 회복.** 직접 경쟁 1위가 공포·약속배신·남성성 과다. NoF는 그 반대편을 차지한다.
2. **한국어 모바일 네이티브.** 한국어 카피·카카오 맥락·한국 ASO. QUITTR 직역체 회피.
3. **비감시·동의 기반·기본 비공개.** Covenant Eyes 계열의 반대.
4. **결제 게이트 없는 회복.** "Repair for 2000(Finch)" / "Lifetime Deal 80%(QUITTR)" 와 반대로, **회복 행동 1개는 항상 무료** (MONETIZATION_POLICY §결제 없는 회복 상속).
5. **정직 고지된 차단.** "완벽 차단/우회 불가" 표현 금지(COPY_POLICY §7). BlockerX 계열 반면교사.
6. **펫·캐릭터 결과 = 비처벌, 회복 가능, 죽음 0.** Finch 톤을 NoF 책임 감각으로 깊게.

---

## 6. Pet consequence benchmark (펫 결과 모델)

### 6.1 경쟁사가 실제로 쓰는 펫·아바타 결과 패턴

| 패턴 | 출처(실측) | 강도 | 설명 |
|---|---|---|---|
| 펫이 사용자 행동에 반응하는 무드/에너지 게이지 | Finch ("Gain energy so Lee can go discover new things today") | 약·중 | 에너지/모험이라는 긍정 프레이밍. 페널티가 직접 표현되지 않고 **"더 못 한다"** 로 표현 |
| "It's okay to miss a day" 비처벌 카피 + 회복권 | Finch ("Repair your 2 day streak? Repair for 2000 — 1st time FREE!") | 약 | 첫 회 무료, 이후 코스메틱 재화로 복구. NoF는 **유료 복구 금지** |
| 아바타 위축/시들기 시각화 | Forest ("If you use your phone, your tree will wither") | 중 | 죽음·질병 아님. 시각만 약화. NoF가 차용 가능한 상한 |
| 아바타 0 리셋 + 가혹 카피 | Duolingo, Done | 강 | 명령형 + 공포. **NoF 금지** |
| 자동 보호(Streak Freeze) | Paired (월 1개 자동) | 약 | 사용자 부담 0. NoF "회복 완료" 무료 흐름과 정합 |
| Brain Rewiring % / Recovery % 의사과학 | QUITTR | 강 | 치료·완치 단정 인접. **NoF 금지**(COPY_POLICY §4) |

### 6.2 죄책감·수치·죽음 사용 여부

| 경쟁사 | 죄책감/수치 유도 | 죽음·질병·심각 부상 | 결과 카피 |
|---|---|---|---|
| QUITTR | 강함 (Panic Button "DON'T BREAK THAT PROMISE…", "Side effects: REDUCED PERFORMANCE") | 없음 | 빨강·공포 |
| Opal | 없음 | 없음 | "fist bump", "shield" 중립 |
| Finch | 없음 | 없음 | "It's okay to miss a day, cheep" |
| Forest | 약함 (시들기) | 없음 (시각 위축만) | "wither" 단일 단어 |
| Duolingo | 중 (Owl meme 별도) | 없음 | "resets to 0" 가혹 |
| Done | 강 (대문자 명령) | 없음 | "DON'T BREAK" |

### 6.3 NoF가 차용/회피해야 할 것

**차용 (NoF 펫 결과 강화):**
- 펫이 사용자 행동에 반응한다는 **신호는 분명히 시각화**(에너지·기분·룸 정돈도 등). Finch처럼 **부정 상태가 아니라 "할 수 있는 것이 줄어든다"** 로 표현. (PRD/Spec 후속 패치에서 정의)
- "It's okay to miss a day" 회복 톤. 흔들림 → 회복 행동 1개 → 회복 완료 흐름 정합.
- 자동 보호(월 1회 자동 회복 인정 등)는 **무료 기본**으로 검토.
- 펫·룸·케어 자원이 행동에 따라 가시적으로 변화(에너지 ↓, 룸 어두워짐, 케어 자원 보충 필요 등) — **책임 감각**을 만들되 **죽음·질병·고통·비난·돌이킬 수 없는 손상·결제 구원은 절대 금지** (사용자가 명시한 4가지 금지 제약 그대로).

**회피 (반면교사):**
- 죽음·질병·울음·고통·"펫이 떠났습니다" — **절대 금지**.
- "유료 복구권" / "유료 회복 행동 1개" — MONETIZATION_POLICY 위반.
- 의사과학 정량화("Brain Rewiring %", "Recovery 0%") — 의료 단정 금지.
- 명령형 가혹 카피("DON'T BREAK", "0 days").

---

## 7. Protection pause / unblock benchmark

### 7.1 경쟁사가 실제로 허용하는 우회/일시정지/긴급 해제 패턴

| 패턴 | 출처(실측) | 강도 | 특징 |
|---|---|---|---|
| **App Lock 일일 unlock 쿼터** | Opal — "Locked · 6/6 Unlocks left today · Unlock for 5m" | 중 | **일일 한도 + 짧은 윈도우(5m)** + 자동 재잠금. NoF "보호 모드 일시정지" 최적 레퍼런스 |
| **"Almost there" 마찰 대기** | Opal — "Wait for 6s — Nevermind" | 약 | 해제 직전 6초 대기 + 취소 옵션(Nevermind). 호흡 인터셉트 |
| **Skip Work / Take a break 명시 옵션** | Opal Focus Session "Skip Work" 버튼 | 약 | 우회를 정상 옵션으로 정상화. 비처벌 |
| **Pledge / 약속 페이지 게이트** | QUITTR "Pledge daily to not relapse" | 중 | 매일 약속 확인. 약속 위반 시 공포 카피로 묶임 |
| **Internet Filter ON/OFF + 사이드이펙트 경고** | Opal Adult Blocking 토글 — "If Adult is selected, private browsing mode on your browser will be disabled" / QUITTR Internet Filter — "QUITTR protects you by managing content restrictions and disabling private browsing" | 약/중 | 정직 고지: Adult ON 시 무엇이 비활성되는지 사용자에게 명시 |
| **Streak Freeze 자동 적용** | Paired (월 1개 자동) | 약 | 결제 게이트 없음. 사용자 부담 0 |
| **마인드풀 인터셉트** | stoic. "Do you really need to open Email at 2:00 AM?" | 약 | 새벽/맥락 기반 부드러운 질문 |

### 7.2 쿨다운 / 이유 선택 / 충동 인터셉트 패턴

- **쿨다운 패턴**: Opal "6/6 unlocks left today" — 일일 쿼터. "Unlock for 5m" — 짧은 윈도우 + 자동 재잠금. "Wait for 6s" — 해제 직전 마찰. → NoF에서는 **(a) 일일 쿼터 + (b) 짧은 윈도우 + (c) 호흡 인터셉트** 3중 구조 권장.
- **이유 선택 패턴**: QUITTR "Why are you relapsing?" enum(Boredom/Strong urges/I'm Sad/Loneliness/Other). enum 자체는 NoF와 정합(자유서술 강요 금지, §6). 단 "relapsing" 카피는 비난 톤이므로 NoF는 "지금 흔들리는 이유"로 환승. **"enum"이라는 단어 노출 금지** — "선택지로만 기록돼요"(COPY_POLICY §4.1).
- **충동 우선 멈춤 패턴**: QUITTR Don't Relapse → "Talk in Chat or Start Breathing Exercise". NoF는 "5분 호흡 / 대체 활동 / 멈춤" 우선 진입 정합. 단 QUITTR의 공포 카피("Porn can erode personal values…")는 카피 전면 교체.

### 7.3 "차단 풀기"가 아니라 "보호 모드 일시정지" / "긴급 해제 요청" / "잠깐 멈추고 결정하기"

> 사용자 결정 어휘 준수. 이하 권장은 PRD 패치 직전 방향이며 본 양산은 사람 검수.

**권장 P1/P2 흐름 (Opal + stoic. 합성, NoF 톤):**

1. 사용자가 차단된 환경에 접근 → 진입 차단 화면에 "**잠깐 멈추고 결정하기**" CTA.
2. 탭하면 충동 인터셉트 모달: **호흡 30초 또는 5분 대체 활동 우선 제안**. 무시 가능.
3. 그 후에도 해제하려면 "**보호 모드 일시정지**" 화면:
   - **사유 선택**(선택지로만 기록, 자유서술 강요 금지): "갑작스러운 업무", "가족·돌봄 긴급", "기타".
   - "**긴급 해제 요청**" 버튼은 **일일 쿼터(예: 1~2회)** 표기 + **짧은 윈도우(예: 5분)** + **호흡 마찰(6초 대기)** 후 진입.
   - 해제 후 자동 재잠금 + 회복 행동 1개 알림(부드러움).
4. 카피 어휘:
   - 권장: "보호 모드 일시정지", "긴급 해제 요청", "잠깐 멈추고 결정하기", "오늘 남은 일시정지 횟수".
   - 금지: "차단 풀기", "차단 우회", "우회 불가", "약속 배신", "또 실패".
5. 정직 고지: "이 일시정지는 OS 한계 안에서 동작해요. 완벽한 차단은 어디에도 없어요." (COPY_POLICY §7).
6. **즉시 재발 경로 방지**: 해제 직후 호흡 30초 + 대체 활동 카드를 **자동 노출**. "방금 멈추셨어요. 다음 행동 한 가지를 골라볼까요?"
7. **결제 게이트 0**: 일시정지·해제·회복은 모두 무료 (MONETIZATION_POLICY 상속).

---

## 8. Game / gamification benchmark

### 8.1 경쟁사 패턴 실측

| 요소 | 사용 앱(실측) | 강도 | NoF 차용/회피 판단 |
|---|---|---|---|
| Streak (연속일) | QUITTR, Opal, Streaks, Duolingo, Done, Paired, Finch | 보편 | NoF는 **5상태(§10.5)** + skip 정상화 + 자동 회복 보호. Duolingo/Done 가혹 카피 회피. |
| Badges / 칭호 | Opal ("Steadfast/Determined"), 일반적 | 보편 | P1 후보. 비교·랭킹·등급 환산 금지(§4.1). |
| Quests / Adventure | Finch ("2nd Adventure 0/15"), QUITTR 28-Day Challenge | 중 | **P2 후보**(사용자 명시). 비처벌 퀘스트 — 실패 = "다시 시작". |
| Dungeon / Map exploration | (Mobbin 표본 빈약 — Finch Adventure가 가장 가까움) | 약 | **P2/P3 후보**. 펫이 발견·탐험하는 톤(Finch "Lee can go discover"). 전투·승패·전사 어휘 금지. |
| Companion / Pet | Finch (Lee), Opal (보석 마스코트), QUITTR (구체) | 보편 | NoF 기본축. 펫 결과 강화는 § 6. |
| Levels | QUITTR ("Level 0 / Level 9 90%") | 강 | NoF는 "회복 단계" 어휘로 환승 가능. 단 "Level"이 캐릭터 강함·약함을 의미하면 안 됨. 비교·우위 0. |
| Duels / PvP | (Mobbin 표본 0) | — | **사용자 명시 P3 후보(비동기 펫 듀얼)**. **승패 강한 표현·강등·랭킹 환산·과한 PvP 압박 금지**(사용자 제약). 결제 우위(pay-to-win) 금지. |
| Leaderboards / Rankings | Duolingo (별도) | — | **NoF 금지**(수치 망신 우려, COPY_POLICY §4.1). |
| Coins / Currency / Shop | Finch (Adventure energy, Shop), QUITTR (없음) | 중 | 사용자에게 **재화 = 실패 복구권** 가 되면 안 됨. 코스메틱·케어 보상 한정(MONETIZATION_POLICY 상속). |
| Loot box / 뽑기 | (Mobbin 표본 0) | — | **금지** (사용자 명시 + MONETIZATION). |
| Shame ranking | Duolingo Owl meme, QUITTR Panic "REDUCED PERFORMANCE" | 강 | **금지**. |

### 8.2 P2/P3 한정으로 열 후보 vs. 영구 금지

**P2/P3 한정 후보 (사용자 승인 범위 안에서):**
- **퀘스트 / Adventure** (Finch 패턴) — 비처벌, 실패 = 다시 시작, 회복 보상 코스메틱만.
- **던전 탐험** — 펫·동료가 함께 발견. 전투 표현 약함, 발견·관찰·수집 중심.
- **비동기 펫 듀얼** — 사용자 친구의 펫 상태 스냅샷과 비교하는 **소셜 비교**가 아니라, 각자의 펫이 같은 미션을 다른 순간에 수행하는 **비동기 협업**으로 재정의 권장. 1대1 승패 강조 카피 회피.

**영구 금지 (사용자 제약 + NoF 정책):**
- Pay-to-win (결제 = 게임 내 우위).
- Loot box / 확률 보상.
- Shame ranking / 강등 / 등급.
- Harsh PvP — 압박·망신·시간 압박 카운트다운.
- 죽음·질병 펫 후속(§6).
- 의사과학 정량화(§4.1).

### 8.3 P0/P1 변경 권고

- **P0/P1에 게임화 깊이를 추가하지 않는다.** 사용자가 명시한 "no P0/P1 implementation" 그대로.
- 단 P0/P1의 **스트릭 5상태(§10.5)** + skip 정상화 + 자동 회복 보호(Paired Streak Freeze 패턴) 는 **카피·UX 정합**이므로 PRD 패치 1회 정리 권장.
- 펫 결과 강도 변경(§6) 만 P0/P1에 들어옴 — 펫 책임 감각 강화, 죽음·질병·고통·결제 구원 금지.

---

## 9. Product decisions recommended (PRD/Spec 후속 패치 권고)

> 본 문서는 PRD/Spec를 **수정하지 않는다.** 다음은 **다음 라운드에 사람 검수 후 반영 권고**.

### 9.1 PRD 변경 권고

1. **§1.2 (포지셔닝/카피 정책 연결)** — 본 문서 §5 카피 3-track(랜딩/스토어/인앱)을 명시 인용. 직설 어휘 채널 분리 원칙을 PRD 카피 미션 옆에 한 단락으로 추가.
2. **§8 (파트너 공유)** — Atoms 양방향 동의 패턴을 P2 기준선으로 명시. 동의 없는 진행 상태 노출 금지를 한 줄로 강화.
3. **§ 게임화 섹션 (P2/P3 범위)** — §8.2 P2/P3 후보 / 영구 금지 표 그대로 인용. "비동기 펫 듀얼"의 정의를 "비동기 협업"으로 재정의(승패 약화).
4. **§ 보호 모드 일시정지 (신규 P1/P2 항목)** — 본 문서 §7.3 흐름을 P1/P2 사양 후보로 명시. "차단 풀기" 어휘 PRD 전역 금지 명시.
5. **§ 펫 결과 모델** — §6.3 차용/회피 표를 PRD 펫 섹션에 인용. 4가지 금지(죽음·질병·부상·돌이킬 수 없는 손상)와 **결제 구원 금지**를 한 묶음으로 명시.

### 9.2 Spec 변경 권고

1. **COPY_POLICY.md**
   - §3 제한 어휘에 채널별 매트릭스 추가: 검색/SEO/SNS 허용 / App Store 본문·인앱 금지.
   - §7 차단 카피 정책에 "보호 모드 일시정지", "긴급 해제 요청", "잠깐 멈추고 결정하기" 승인 어휘 추가. "차단 풀기" 금지 어휘 추가.
   - §4.1에 "Brain Rewiring %", "Recovery %", "Reset Counter" 직역 금지 어휘 추가.

2. **UX_RULES.md**
   - 위기 흐름: Opal 6초 대기 + Skip 옵션 패턴을 호흡 인터셉트의 표준 마찰로 정합.
   - 차단 흐름: Opal Adult Blocking 사이드이펙트 카피 패턴을 NoF 정직 고지 예시로 추가.

3. **MONETIZATION_POLICY.md**
   - "회복 행동 1개 = 무료" 원칙을 Finch "Repair for 2000" 반면교사로 한 단락 보강.
   - Paired Streak Freeze 자동 보호(월 1회) 패턴을 무료 자동 회복 후보로 검토.

4. **CHARACTER_SYSTEM_SPEC.md (혹은 펫 SPEC)**
   - 펫 에너지·기분·룸 상태가 **사용자 행동에 가시적으로 반응**하는 표준을 추가. 단 "할 수 없게 되는 것"으로 표현하고 "고통·죽음"은 표현 0.
   - 회복은 무료. 회복 행동 1개로 즉시 회복.

### 9.3 구현 변경 권고 (P0/P1 직접 코드 변경 없음, 추후 라운드)

- 차단 UI 라이브러리에 **일일 쿼터 카운터 + 짧은 윈도우 + 호흡 마찰** 컴포넌트 추가 후보(P1/P2).
- 펫 상태기에 **에너지·기분·룸 정돈도** 3축 상태 게이지 후보(P1/P2). 죽음·질병 상태 노드 절대 없음.
- 무드/이유 선택 enum을 **선택지 카피**로 사람이 양산 후 코드 enum과 매핑(코드 enum 어휘는 UI 노출 금지).

---

## 10. Do-not-copy / 법적·윤리적 노트

1. **경쟁사 화면 카피·문구 그대로 사용 금지.** QUITTR/Opal/Finch의 카피는 **방향 신호**일 뿐, 직역 사용은 트레이드드레스 리스크 + NoF 톤 위반.
2. **App Store 심사 리스크 (Apple Guidelines):**
   - 1.1.4 / 1.1.6: 노골적 성적 어휘 1차 노출 시 거절 가능. App Store 본문은 소프트 어휘 강제(§5.2-B).
   - 5.4: 의료 효과 단정 ("발기부전 예방", "테스토스테론 증가", "치료") 금지.
   - 미성년자 대상 마케팅 금지.
3. **Play Store**도 유사. 성인 콘텐츠 관련 키워드 광고 정책 별도 — ASO 부키워드는 가능하지만 광고는 거절 가능 영역. 광고 채널 운영 시 사전 검토 필요.
4. **Mobbin 화면 이미지 라이선스:** 본 라운드에서 다운로드/저장/커밋 안 함(§ 수집 제약 준수). Mobbin 링크만 보관.
5. **성인 사이트명/URL/노골적 검색어 저장 금지** (PRD/COPY_POLICY 상속). 본 문서에 포함되지 않음(검증 완료).
6. **사용자 활동 모니터링/리포트 패턴(Covenant Eyes 계열) 절대 차용 금지.** 동의 없는 감시는 NoF 정체성·법적·심리적 모두 정면 충돌.
7. **사용자 인용·테스티모니얼 위조 금지.** QUITTR의 "Loved by 140K+ users, 4.8★" 사회적 증명은 실측 수치 확보 전 사용 금지(NoF는 신규 앱).
8. **Pay-to-win·loot box·shame ranking** 어디에서도 금지(사용자 명시 + NoF 정책).

---

## 11. 사람 검수 체크리스트

- [ ] 본 문서가 PRD·Spec·소스를 **수정하지 않는가**? (수정 권고만 §9에 명시)
- [ ] 성인 사이트명·URL·노골적 검색어가 포함되지 않았는가?
- [ ] 경쟁사 스크린샷·이미지가 리포지터리에 추가되지 않았는가? (`git status` 확인)
- [ ] 직설 어휘(금딸/NoFap/Quit Porn/porn blocker)가 **채널별 분리**로 다뤄졌는가? (§5)
- [ ] 펫 결과 강화 권고에 죽음·질병·부상·고통·결제 구원이 포함되지 않았는가? (§6)
- [ ] 보호 모드 일시정지 권고에 "차단 풀기" 어휘가 없는가? (§7)
- [ ] P0/P1 게임화 추가가 권고되지 않았는가? (§8)
- [ ] Pay-to-win·loot box·shame ranking·harsh PvP가 어디에도 차용 권고되지 않았는가?
- [ ] Mobbin 링크는 영구 screen UUID 기준인가? (§2)
- [ ] App Store 심사 리스크가 정리되었는가? (§10)
