# NoF Competitive Reference Audit — RC16 Prep

작성일: 2026-06-18
상태: reference research sprint (코드/디자인 변경 없음). Claude Design 투입 전 경쟁 레퍼런스 감사.
조사 도구: 로컬 파일 인벤토리 + Mobbin MCP (iOS 공개 화면, live probe)
기준선: HEAD = origin/wip = nof-rc15 = 2cf4e7b / main = 1e0a994 / working tree clean

상위 문서: `docs/DIRECT_COMPETITOR_VISUAL_AUDIT.md`(2026-05-26 텍스트 감사), `docs/MOBBIN_MCP_CAPABILITY_CHECK.md`
산출(다음): `references/mobbin/nof-competitive-v2/`, `docs/NOF_COMPETITIVE_REFERENCE_PACK_V2.md`

---

## 1. Summary verdict

- **현재 캡처 팩이 NoF 경쟁 구도에 충분히 타겟팅 되어 있는가? → 아니오 (NO).**
- **짧은 답:** 기존 팩은 사실상 **generic wellness/habit/focus 패턴 보드**다. 폴리시드한 직접 경쟁사(quit-porn/NoFap/accountability) **비주얼 캡처가 0장**이고, **현재 NoF 화면 캡처도 0장**이다.
- **왜:**
  - 디스크의 100장 고유 Mobbin webp 중 **직접 경쟁사 = 0** (`grep quittr|fortify|brainbuddy|blockerx|nofap|covenant` → 무결과).
  - 상위 앱이 finch(11)·calm(6)·stoic(5)·duolingo(5)·oura·headway·klarna 등 **명상/습관/금융** 일색 (≈ 88/100 mood·wellness).
  - 진짜 차단(blocker) 앱은 **Opal 6장**이 사실상 전부. stoic(5)은 명상+스케줄, forest(1)은 집중 타이머 — blocker 정체성 약함.
  - 별도로 `references/benchmarks/`에 **quit/금단 앱 PNG 30장**(Quitzilla·Kintimer)이 있으나, 이는 **direct-adjacent**(같은 절제타이머·relapse·quit-onboarding 루프)이며 **광고형 기본 앱**이라 비주얼 리더 레퍼런스로는 약하다.
  - 이 진단은 이미 `docs/DIRECT_COMPETITOR_VISUAL_AUDIT.md`(05-26)와 `DESIGN_RESET_BRIEF`가 경고한 **"Baseline B = generic beige/wellness diary"** 실패 모드와 정확히 일치한다. 그 라운드는 QUITTR를 **텍스트 관찰만** 하고 이미지를 받지 않았다 → 그래서 비주얼 갭이 그대로 남았다.

> 한 줄: **레퍼런스 보드가 "무슨 문제를 푸는 앱인지"를 보여주지 못한다. 직접 경쟁사 비주얼이 비어 있다.**

---

## 2. Existing files inventoried

> 캡처 이미지 인벤토리만. 마크다운/JSON 인덱스 문서는 §하단 별도 표.
> 명명: `app__screen-role__hash.webp`. handoff/* 는 references/* 의 **복사본**(중복) → 별도 카운트하지 않음.

### 2.1 이미지 디렉터리 요약

| path | source/app | bucket | flow types | quality | Claude Design 사용 가능? |
|---|---|---|---|---|---|
| `references/mobbin_visual/**` (84 webp) | Mobbin MCP (2026-05-26) | 대부분 mood/wellness + Opal(blocking) | onboarding·permission·blocking·habit·streak·character·crisis·stats·paywall·privacy·relapse·home | high (정품 webp, magic 검증) | ✅ 단 **polish/패턴용** (직접 경쟁 아님) |
| `references/mobbin_visual_curated/**` (102 webp, USE/CAUTION/AVOID) | 위 84장의 큐레이션 + 소수 추가(calm·breeze·meplus·insight-timer 등) | 동일 | 동일 + AVOID 안티패턴 태깅 | high | ✅ USE/CAUTION/AVOID 라벨 유용 |
| `references/benchmarks/abstinence-timer/` (8 png) | Quitzilla/Kintimer (KakaoTalk 수동) | **direct-adjacent** (quit) | abstinence timer·day counter·rank·empty state | mid (광고형 기본 UI) | ✅ 타이머/카운터 플로우 한정 |
| `references/benchmarks/quit-onboarding/` (14 png) | Quitzilla | **direct-adjacent** (quit) | onboarding·privacy promise·motivation·habit category·cost input·last-use date·soft paywall | mid | ✅ onboarding/paywall 플로우 |
| `references/benchmarks/counter-reset-flow/` (6 png) | Quitzilla | **direct-adjacent** (quit) | relapse report·restart goal·counter edit·action menu | mid | ✅ relapse/restart 플로우 |
| `references/benchmarks/counter-management/` (2 png) | Quitzilla | direct-adjacent | counter add/edit | mid | △ |
| `handoff/claude-design-nof-visual-v1/mobbin_visual/` (81 webp) | references/mobbin_visual 복사본 | — | — | — | ❌ 중복 |
| `handoff/claude-design-nof-visual-v2/.../USE/` (67 webp) | curated USE 복사본 | — | — | — | ❌ 중복 |
| `references/design/nof-app-screens-standalone-v1.html` | NoF 자체 목업 (정적 HTML) | current-nof (mockup) | home·record·pause·protection | n/a | △ 목업(실제 앱 화면 아님) |

### 2.2 인덱스/문서 (이미지 아님)

`references/mobbin/**/README.md`(21), `references/mobbin_visual/_visual_index.json`, `_download_report.md`, `_manual_capture_queue.md`, `references/mobbin_visual_curated/CURATED_REFERENCE_INDEX.{json,md}`, `references/direct_competitors/README.md`(QUITTR/Opal/LIVESTRONG screen UUID 인덱스 — **이미지 미저장, 링크만**), `docs/DIRECT_COMPETITOR_VISUAL_AUDIT.md`, `docs/MOBBIN_*` 6종.

---

## 3. Coverage counts

> 고유 이미지 기준 (handoff 중복 148장 제외).

| bucket | count | 비고 |
|---|---|---|
| **direct competitors** (폴리시드 quit-porn/NoFap/accountability) | **0** | 비주얼 캡처 0장. QUITTR는 05-26에 텍스트 관찰만 함 |
| **direct-adjacent** (generic quit/금단: Quitzilla·Kintimer) | 30 | benchmarks PNG. 플로우는 직접 인접, 비주얼은 기본 |
| **adjacent blocker/focus** | ~7 | Opal 6 (+ forest 1). stoic 5는 명상+스케줄로 별도 셈 |
| **mood/premium/wellness/habit/finance** | ~88 | 100 webp 중 절대다수 (finch·calm·duolingo·oura·klarna…) |
| **current NoF** | **0** | 실제 앱 스크린샷 0장 (HTML 목업 1개만 존재) |
| 총 고유 이미지 | **130** | 100 webp + 30 png |

**실제 비율 vs 목표 (100 webp 기준):** Direct 0% / Adjacent ~10% / Mood ~90% — **목표(50/30/20)와 정확히 반전.**

---

## 4. Missing direct competitors

| app | Mobbin 수록 | missing flow | priority | NoF에 왜 중요한가 |
|---|---|---|---|---|
| **QUITTR** | ✅ **다수** (probe 확인) | 비주얼 **전부** (홈·온보딩·self-assessment·panic·relapse/reset·cause enum·analytics·accountability·paywall·28-day) | **P0** | 유일하게 폴리시드한 quit-porn 직접 경쟁사. NoF가 가장 의식+차별화해야 할 대상. **이미지가 0장이라 비주얼 차별화 좌표를 못 잡음** |
| **LIVESTRONG MyQuit Coach** | ✅ 일부 | 충동≠실패 이중 로깅, Day X/21 트래킹, 히스토리 | P1 | quit 루프(추적·갈망·기록)를 의료/공포 없이. NoF 충동 로깅에 직접 적용 |
| Sober/quit 계열 (I Am Sober, Reframe, Sober Time, Quit Genius, Loosid) | ? (probe 필요) | sobriety counter·milestone·urge·community | P1 | 절제 타이머 + 마일스톤 + 충동 대응의 다른 톤 샘플 |
| Fortify | ❌ 미수록 | science-based recovery·교육·차트 | P2 | 포지셔닝만. 캡처 불가 → **honest blocker** |
| Brainbuddy | ❌ 미수록 | brain rewiring 게임화 | P2 | 포지셔닝만. 캡처 불가 |
| BlockerX | ❌ 미수록 | 차단+accountability·우회방지 | P2 | 포지셔닝만. 캡처 불가 |
| NoFap / Remojo / Covenant Eyes / Ever Accountable / Accountable2You | ❌ 미수록 | community·monitoring·trust | P3 | 포럼/감시형. Mobbin 폴리시드 화면 없음 → 텍스트 안티패턴만 |

> **핵심:** Mobbin에서 **실제로 비주얼을 받을 수 있는 직접 경쟁사는 QUITTR(폴리시드) + LIVESTRONG(인접 quit)**가 사실상 전부. 나머지는 신앙/감시/포럼/구형 UI라 비주얼 벤치마크 대상이 안 됨 → **이 카테고리 비주얼 기준선이 비어 있다 = NoF 기회.** 단, 팩에는 QUITTR를 **깊게** 채워 직접 경쟁 비중을 끌어올린다.

---

## 5. Missing flow types

| flow | 현재 보유 | 부족/필요 | target apps to capture |
|---|---|---|---|
| onboarding value-prop | generic(canva·headway·liven) | **직접 경쟁사** 버전 | QUITTR onboarding, Quitzilla(이미 PNG) |
| self-assessment / quiz | 없음 | 절제 자가진단 | QUITTR self-assessment |
| trust / privacy / safety claim | 인접(klarna·macrofactor·alan) | **직접 경쟁사** 신뢰 카피 | QUITTR, Quitzilla privacy-promise(이미 PNG) |
| daily record / journal | 인접(fitbit·calm·breeze) | quit-loop 맥락 | LIVESTRONG, QUITTR |
| **urge / panic / emergency pause** | 인접(opal·calm·stoic breathe) | **직접 경쟁사 Panic** (NoF 잠깐 멈춤 직접 대응) | **QUITTR Panic Button** |
| blocker setup | Opal 6 | 더 많은 blocker 다양성 | Opal, Freedom, ScreenZen |
| permission setup | 인접(airbnb·babbel·dailyart) | blocker 권한 | Opal, One Sec |
| **Chrome/browser extension / content blocker** | **없음** | NoF Shield 직접 대응 | BlockerX/Covenant Eyes(미수록) → **honest gap**; Opal app-block이 최근접 |
| blocklist / danger signal input | 없음 | 차단 대상 입력 | BlockerX(미수록), Opal app-select |
| blocked-state / interruption | Opal(blocked-state-intro) | 직접 경쟁사 차단 화면 | Opal, QUITTR |
| progress / streak / milestone | 인접(finch·duolingo·macrofactor) | **직접 경쟁사 streak**(초단위·rewiring%) | QUITTR, Quitzilla(이미 PNG) |
| relapse / restart | 인접(finch·duolingo·fabulous) + Quitzilla PNG | **직접 경쟁사 reset** 안티패턴 | QUITTR relapse/reset |
| community / accountability | 인접(finch·duolingo) | 직접 경쟁사 invite | QUITTR "Save A Friend" |
| paywall / pricing | 인접(atoms·craft·fixtured) + Quitzilla PNG | 직접 경쟁사 paywall | QUITTR paywall |
| settings / data handling | 인접(klarna·zalando·rakuten) | — | (인접으로 충분) |
| friction / breathing delay | 인접(opal·calm) | One Sec 류 | One Sec, ScreenZen |

---

## 6. Overrepresented references

| app/category | issue | action |
|---|---|---|
| **wellness/meditation** (calm 6, alan-mind 3, insight-timer, breeze 2, how-we-feel) | mood 과다 → 카테고리 정체성 희석 (Baseline B 실패 원인) | **polish-only로 격하.** 신규 캡처 금지 |
| **habit/streak gamification** (finch 11, duolingo 5, numo 2, habitify 2) | finch 단일 앱 11장 = 과대표집 | 대표 2~3장만 유지, polish-only |
| **finance/commerce** (klarna·revolut·n26·rocket-money·instacart·zalando·rakuten·drop·drops) | NoF와 무관한 도메인 (privacy/referral 패턴 차용용이었음) | privacy 1~2장만, 나머지 격하 |
| **stoic** (5) | blocker로 분류됐으나 실제는 명상+스케줄 | adjacent 아님 → mood로 재분류 |
| generic onboarding (canva·citizen·thefork·coursera) | 직접 경쟁 무관 | polish-only |

---

## 7. Capture plan v2

> Mobbin MCP `search_screens`/`search_flows` → inline 이미지로 내용 판별 → `image_url` 단축토큰 `curl` → 디스크 저장(webp, magic 검증). 토큰은 **세션 한정** → 같은 세션 내 즉시 저장.
> SFW 앱 UI(대시보드/온보딩/streak/paywall)만 저장. 노골적 프레임은 개별 skip.

- **direct competitor targets (목표 18–24):**
  - **QUITTR 깊게(P0):** home·onboarding value-prop·self-assessment·panic/urge·relapse+reset·cause enum·analytics(rewiring%)·accountability(Save A Friend)·paywall·28-day challenge ≈ 12–16장
  - LIVESTRONG MyQuit Coach: tracking(Day/21)·dual-log(smoked/craving)·history ≈ 3장
  - sober/quit 계열 probe(I Am Sober/Reframe/Sober Time): 가능분 ≈ 2–5장
  - (기존 `references/benchmarks/` Quitzilla 30 PNG는 **direct-adjacent로 그대로 참조** — 재캡처 안 함)
- **adjacent targets (목표 10–14):** Opal(home·focus session·block now·blocked-state·app-select·breathe) + Freedom + One Sec(friction/breathing) + ScreenZen/Jomo/ClearSpace 가능분
- **mood references (목표 6–10, polish only):** dark-premium(oura/whoop류 probe), calm/headspace pause, 1~2 journal — **소량만**. 기존 100 webp가 이미 과잉이라 신규는 자기완결용 최소
- **current NoF captures (별도 섹션, 8–10):** 로컬 preview + CDP(검증된 방법)로 390×844 DPR2: home·today_record·pause·protection·danger-input·chrome-setup + blocked.html·popup·options (정적 HTML 직접 캡처)

---

## 8. Claude Design readiness

- **지금 바로 준비됐나? → 아니오.**
- **먼저 캡처해야 할 것:**
  1. **QUITTR 직접 경쟁사 비주얼 세트**(현재 0장 → P0). 이게 없으면 "직접 경쟁 가중" 자체가 불가능.
  2. **현재 NoF 화면 8–10장**(현재 0장). "현재 상태 vs 경쟁사" 대비가 디자인 인풋의 핵심.
  3. adjacent blocker 다양성(Opal 외 1~2개 앱).
- 이 3개가 채워지면 §7 비율(Direct 50 / Adjacent 30 / Mood 20)에 근접 → Claude Design 투입 가능.

---

## 9. Recommended next action

정확한 Mobbin MCP 캡처 플랜 (Phase 5 실행):

1. `search_screens(platform=ios, query="QUITTR …")` × 플로우별(home/onboarding/panic/relapse/analytics/paywall/accountability/self-assessment) → 각 응답의 `image_url` 토큰 즉시 `curl` → `01_direct-competitors/quittr__<flow>__<purpose>__NN.webp`
2. `search_screens` LIVESTRONG MyQuit Coach + sober/quit probe → `01_direct-competitors/`
3. `search_screens`/`search_flows` Opal·Freedom·One Sec·ScreenZen → `02_adjacent-blockers/`
4. (선택) dark-premium·pause mood 소량 → `03_mood-polish/`
5. 로컬 preview(:4173) + ext-loaded chromium(:9222) CDP → 현재 NoF 9화면 → `04_current-nof/`
6. `00_manifest/capture-manifest.json` + `99_contact-sheets/*.html` 생성
7. `docs/NOF_COMPETITIVE_REFERENCE_PACK_V2.md` 최종 보고

**제약 재확인:** 앱/`src/`/extension engine/manifest/QA 변경 금지. push/tag/deploy 금지. 노골적 콘텐츠 미수집(앱 UI 화면만). 스크린샷을 저장했다고 거짓 주장 금지 — magic-byte 검증 통과분만 기록.
