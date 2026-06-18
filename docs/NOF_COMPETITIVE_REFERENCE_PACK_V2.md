# NoF Competitive Reference Pack v2

작성일: 2026-06-18
상태: reference research sprint 완료 (코드/디자인 변경 없음). Claude Design 투입용 직접경쟁 가중 레퍼런스 팩.
상위: `docs/NOF_COMPETITIVE_REFERENCE_AUDIT_RC16.md` (이 팩을 만든 감사 보고서)
팩 위치: `references/mobbin/nof-competitive-v2/`
수집: Mobbin MCP `search_screens` → `image_url` 단축토큰 `curl`(세션 한정) → webp magic 검증. 현재 NoF는 로컬 vite preview(:4173 `?dev=1`) + raw-CDP 390×844 DPR2 캡처.

---

## 1. Final verdict

- **Claude Design 준비됐는가? → 예 (YES), 직접경쟁 가중 기준 충족.**
- **무엇이 바뀌었나 (old pack → v2):**
  - old: 100 webp 중 **직접 경쟁사 0장**, 진짜 blocker ~7장(Opal 위주), 현재 NoF 0장 → 사실상 generic wellness 보드.
  - v2: **직접 경쟁사 24장(QUITTR 21 + LIVESTRONG 3)**, 인접 blocker 10장(Opal 9 + bless. 1), mood/polish 6장, **현재 NoF 11장**(별도 섹션).
  - 비율(경쟁 레퍼런스 40장 기준): Direct **60%** / Adjacent **25%** / Mood **15%** → 목표(50/30/20)를 **직접경쟁 쪽으로 더 강하게** 충족. (의도적: 카테고리 비주얼 기준선이 비어 있어 직접경쟁을 깊게 채움.)

---

## 2. Final pack counts

| bucket | count | 비고 |
|---|---|---|
| direct competitors | **24** | QUITTR 21, LIVESTRONG MyQuit Coach 3 |
| adjacent blocker/focus | **10** | Opal 9, bless. 1 |
| mood/premium | **6** | Oura 2, Headspace 3, Breathwrk 1 (polish only) |
| current NoF (RC-15) | **11** | 별도 섹션 — 경쟁 레퍼런스로 계산 안 함 |
| **총** | **51** | 2.2MB, 전부 magic-byte 검증 통과 |

기존 `references/benchmarks/`의 quit/금단 PNG 30장(Quitzilla·Kintimer)은 **direct-adjacent 보조 입력**으로 그대로 유지(재캡처 안 함). 기존 `references/mobbin_visual*` 100 webp는 **polish 보조**로 격하.

---

## 3. Direct competitor findings

### QUITTR (21장) — 유일한 폴리시드 quit-porn 직접 경쟁사
모든 핵심 플로우 확보: home(×5: streak/rewiring%/AI therapist/quit-by-date+Save A Friend), onboarding(×4: value-prop chips/custom plan/target days/method+content-filter), self-assessment(목표 선택), pledge, **panic**(수치·공포 대표 반면교사), urge, checkin(감정+충동 토글), relapse(×2: reset counter / community social-proof), detox, 28-Day program, analytics(×2: radar / life-area cards), progress(life tree).
- **차용(패턴만):** 상태반응 중앙 오브제, 항상-도달 위기 진입점, 충동 토글, 목표일+동기 입력, 영역별 자기이해 카드.
- **배제(반면교사):** "DON'T BREAK THAT PROMISE… FEW SECONDS OF PLEASURE" 수치 카피, "Side effects: REDUCED PERFORMANCE" 신체위협, 빨강 Reset=0 가혹 연출, Brain Rewiring%/dopamine reset 의사과학, 남성성 슬랭("goons"), 부정감정 소셜프루프, 직설 어휘.

### LIVESTRONG MyQuit Coach (3장) — 인접 quit 루프(금연)
- **핵심 차용:** "I smoked"(실패) vs "I'm craving"(충동) **이중 분리 로깅** + Check In/Craved/Smoked 타임라인 → NoF 충동/회복 분리의 직접 모델.
- **주의:** "cigarettes over" 빨강 실패강조는 피함.

### 기타 직접 경쟁사 — Mobbin 미수록 (정직한 갭)
Fortify / Brainbuddy / BlockerX / NoFap / Remojo / Covenant Eyes / Ever Accountable / Accountable2You / I Am Sober / Reframe / Quit Genius **모두 Mobbin 검색 무결과**(QUITTR·Opal·습관앱으로 폴백). → 비주얼 캡처 불가, 텍스트 포지셔닝만(`docs/DIRECT_COMPETITOR_VISUAL_AUDIT.md` §2.4). 이는 **카테고리 비주얼 기준선이 비어 있다 = NoF 기회**를 재확인.

---

## 4. Adjacent blocker findings

### Opal (9장) — 차단/포커스 비주얼 리더
blocks 대시보드 + 5분 해제 시트, **블록리스트 카테고리 + "Adult Blocking" 토글 + 정직 고지(사생활 모드 비활성)**, blocked-state 안내, 세션 일시중지/기간선택, 재잠금, 유형별 체크리스트(Adult/Dating 포함), 차단 온보딩 스텝.
- **차용:** "차단=내가 정한 세션", 유예(5분/하루) 정상화, Adult 토글의 **정직한 한계 고지**, 카테고리 차단 — NoF 위험신호/차단규칙과 직접 대응.

### bless. (1장) — 마찰형 개입
"Breathe in, breathe out. Do you really need to open this app right now? Don't Open / Open for 5 min" → One Sec/ScreenZen 류 마찰 패턴의 **비공포 버전**. NoF 잠깐 멈춤 톤 모델.

### Freedom / One Sec / ScreenZen / Jomo / ClearSpace / Roots
**Mobbin 미수록.** 검색 시 Opal/stoic/breathing 앱으로 폴백 → 추가 캡처 불가(정직 보고). 마찰 패턴은 bless. + Opal로 대표.

---

## 5. Mood/polish findings (polish only)
- **Oura(2):** 다크=프리미엄 입증, 차분한 데이터 카드 위계/여백.
- **Headspace(3):** 따뜻한 호흡/그라운딩/세션 진입.
- **Breathwrk(1):** 호흡 점수 게임화(차분 버전).
- 이 버킷은 **전략이 아니라 마감 polish**용. 기존 100 webp가 이미 과잉이라 신규는 자기완결 최소만.

---

## 6. NoF design implications

- **borrow:** 상태반응 중앙 오브제(QUITTR 구체 → NoF 고양이/잔불), 충동≠실패 분리 로깅(LIVESTRONG), 항상-도달 위기 진입점(QUITTR Panic → NoF 잠깐 멈춤, 카피 전면 교체), 자기설정 차단 세션 + 유예 정상화(Opal), 마찰형 비공포 개입(bless.), 다크 프리미엄 + 차분한 데이터 카드(Oura).
- **avoid:** 수치·공포·약속배신·신체위협 카피, 빨강 즉시-0-리셋 가혹 연출, 의사과학 완치/rewiring% 단정, 남성성 슬랭, 부정감정 소셜프루프, 감시형 accountability, 직설 어휘 전면 노출.
- **trust cues:** Opal "Adult 차단 시 사생활 모드 비활성" 정직 고지, NoF blocked.html "완벽한 벽이 아니라 마찰" 한계 고지 — **정직한 한계 고지가 NoF의 차별점.**
- **blocker UX cues:** 카테고리/유형 선택(Opal) vs NoF 위험신호 직접 입력(05_danger_signal), 차단 상태 안내(Opal blocked-state vs NoF blocked.html).
- **progress UX cues:** 차분한 영역 점수/타임라인 차용, "회복 %"·즉시 0 리셋 배제.
- **pause UX cues:** bless.·Headspace의 따뜻한 호흡 진입 + QUITTR Panic의 **정반대** 톤 = NoF 잠깐 멈춤 좌표.
- **Chrome extension UX cues:** 직접 경쟁사 비주얼 없음(미수록) → NoF 06_chrome_extension_setup/07_blocked_html이 **고유 자산**. Opal app-block이 유일한 인접 비교군.

---

## 7. Gaps still remaining

- **폴리시드 quit-porn 직접 경쟁사 = QUITTR 단독.** Fortify/Brainbuddy/BlockerX/Covenant Eyes 등 비주얼 캡처 불가(Mobbin 미수록) — 텍스트 포지셔닝으로만 대체.
- **브라우저/콘텐츠 차단 확장 셋업** 직접 경쟁사 비주얼 없음(BlockerX/Covenant Eyes 미수록). Opal app-block이 최근접.
- **한국어 직접 경쟁사 비주얼 0** — 모든 캡처가 영어권. 한국 톤은 현재 NoF 캡처가 유일 기준.
- mood 버킷은 의도적으로 작게(6) — 필요 시 기존 100 webp에서 보충.
- current-NoF는 Malgun Gothic 폴백 렌더(실기기 Pretendard/Apple SD Gothic Neo와 자형 차이 가능). 레이아웃·카피·ember 정체성은 충실.

---

## 8. Claude Design input recommendation

- **첨부할 폴더/파일:**
  - `references/mobbin/nof-competitive-v2/` 전체 (01~04 + 00_manifest/capture-manifest.json + 99_contact-sheets/all-reference-pack.html).
  - `docs/NOF_COMPETITIVE_REFERENCE_AUDIT_RC16.md` + 본 문서.
  - 컨텍스트: `docs/DIRECT_COMPETITOR_VISUAL_AUDIT.md`, `docs/DESIGN_DIRECTION.md`, `COPY_POLICY`/`UX_RULES`.
- **가장 무겁게 볼 것 (weight heavily):** `01_direct-competitors/`(특히 QUITTR panic/relapse/analytics/home + LIVESTRONG 이중로깅) — **반면교사 + 차별화 좌표**. `02_adjacent-blockers/` Opal(차단 세션·Adult 토글 정직 고지). `04_current-nof/`(현재 vs 경쟁 대비).
- **polish로만 (do not weight):** `03_mood-polish/` + 기존 `references/mobbin_visual*` 100 webp.

---

## 9. Next prompt

다음 Claude Design 프롬프트 제목:
> **"NoF Competitive Visual Direction Refresh — Direct Competitor Weighted"**

입력: 본 v2 팩(직접경쟁 24장 우선) + 감사 보고서 2종 + DESIGN_DIRECTION/COPY_POLICY/UX_RULES.
지시: QUITTR 반면교사(공포·수치·의사과학·빨강리셋)를 0으로, 차용은 패턴만(상태반응 오브제·충동≠실패 분리·위기 진입점·자기설정 차단·정직 한계고지), 한국 네이티브 + 차분한 프리미엄 + 따뜻한 인간미. 최종 색/UI는 사람 승인 후.
