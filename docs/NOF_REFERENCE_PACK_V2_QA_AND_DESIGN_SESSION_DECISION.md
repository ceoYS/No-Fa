# NoF Reference Pack v2 QA + Claude Design Session Decision

작성일: 2026-06-19
상태: Claude Design 투입 전 최종 의사결정 sprint. 코드/디자인 변경 없음, read-only QA + 결정 문서.
상위: `docs/NOF_COMPETITIVE_REFERENCE_AUDIT_RC16.md`(감사) · `docs/NOF_COMPETITIVE_REFERENCE_PACK_V2.md`(팩 v2)
팩 위치: `references/mobbin/nof-competitive-v2/`
기준선: HEAD = `7ae1314` / origin/wip = nof-rc15 = `2cf4e7b` / main = `1e0a994` / ahead 2 / working tree clean

---

## 1. Summary verdict

- **v2 팩이 Claude Design에 넣기 충분한가? → 예 (YES).** 직접경쟁 가중 기준 충족, 무결성 100%, 시각 QA 통과.
- **기존 세션 vs 새 세션? → 새 Claude Design 세션에서 실제 생성. 기존 세션은 비판(critique) 용도로만.**
- **짧은 답:** v2 팩(직접경쟁 24장 + 인접 10 + 무드 6 + 현재 NoF 11 = 51장)은 검증 완료. 추가 Mobbin 캡처 불필요(나머지 직접 경쟁사는 Mobbin 미수록 = 어제 probe로 확인된 정직한 갭). **직접경쟁 가중 사고를 첫 메시지부터 하기 위해 새 세션 권장.**

---

## 2. Baseline

- HEAD: `7ae1314`
- origin/wip: `2cf4e7b` (= nof-rc15)
- nof-rc15: `2cf4e7b`
- main: `1e0a994` (untouched)
- working tree: clean (ahead 2, 미push)

---

## 3. Pack integrity

- manifest: `00_manifest/capture-manifest.json` 51 items — `{direct-competitor 24, adjacent-blocker 10, mood-polish 6, current-nof 11}`
- raw images: 디스크 51장(webp 40 + png 11), 2.3MB, 전부 magic-byte 검증 통과(팩 v2 문서 기록). **로컬 artifact**(gitignore, 미커밋).
- contact sheets: 5장(direct/adjacent/mood/current/all). img refs 24·10·6·11·51.
- missing/broken files: **0 missing / 0 broken** (manifest 파일 존재검사 + 5개 시트 src 해석 모두 통과).

byApp: QUITTR 21, LIVESTRONG MyQuit Coach 3, Opal 9, bless. 1, Oura 2, Headspace 3, Breathwrk 1, NoF(RC-15) 11.

---

## 4. Visual QA

> 방법: chromium-1223 headless `--screenshot`(1440px 폭, 풀높이 윈도우로 lazy 이미지 강제 로드, DPR1) → 3개 시트 PNG 렌더 → 육안 확인. 코드/캡처 변경 없음.

### Direct competitors (24장)
- **QUITTR(21):** home ×5(streak/rewiring%/AI therapist/quit-by-date+Save A Friend/panic overlay), onboarding ×4, self-assessment, pledge, **panic/urge ×2**, checkin(감정+충동 토글), **relapse ×2**(reset counter 0 / community social-proof), detox, 28-Day program, **analytics ×2**(radar / life-area cards), progress(life tree). → **중복 대시보드 아님, 핵심 플로우 전부 다양.**
- **LIVESTRONG(3):** "I smoked" vs "I'm craving" 이중 분리 로깅 + Check In/Craved/Smoked 타임라인. → NoF 충동≠실패 직접 모델, 유용.
- 노골/불안전 콘텐츠: **없음**(전부 UI 대시보드·텍스트·빨강 버튼). 저해상/판독불가: 없음.
- verdict: **PASS.** panic·relapse·analytics·onboarding·pledge·self-assessment·dual-log 모두 존재.

### Adjacent blockers (10장)
- **Opal(9):** block 대시보드 + 5분 해제 시트, **Apps Blocked / All Internet 토글**, **카테고리 블록리스트(Reviews/Messaging/Dating/News/Adult)**, blocked-state 안내, 세션 disable/기간선택/재잠금, Work Hours 스케줄 스텝. → 차단 셋업·블록리스트·Adult 토글·blocked-state·session/relock·한계고지 전부 커버.
- **bless.(1):** "Breathe in, breathe out. Don't Open / Open for 5 min" 마찰형 비공포 개입.
- verdict: **PASS.** 요구 인접 항목 전부 충족. (Freedom/One Sec/ScreenZen는 Mobbin 미수록 = 정직 갭.)

### Mood/polish (6장)
- Oura 2(다크 프리미엄·차분 데이터 카드), Headspace 3(따뜻한 호흡/그라운딩), Breathwrk 1(호흡 점수). polish 전용, 의도적 소량.
- verdict: **PASS (polish only).**

### Current NoF (11장)
- screen count: 11 — 01_home, 02_today_record, 03_pause_flow, 04_protection_settings, 05_danger_signal_input, 06_chrome_extension_setup, 07_blocked_html, 08_extension_popup, 09_extension_options, 0A_block_settings, 0B_safe_browser.
- legibility: 한국어 판독 가능(Malgun Gothic 폴백 렌더 — 실기기 Pretendard/Apple SD Gothic Neo와 자형 차이 가능, 레이아웃/카피/ember 정체성 충실).
- currentness: 실제 RC-15 화면(ember/잔불 다크 테마, 절제 12일 03:24:20, 잠깐 멈춤 05:00, 위험신호 입력, 실드 설정).
- dev switcher: **노출 없음.**
- verdict: **PASS.** 요구 8종(home/오늘기록/잠깐멈춤/보호설정/위험신호/Chrome연결/blocked.html/popup·options) 전부 + block_settings + safe_browser.

### 종합
- **ready for Claude Design? → YES.** 4개 버킷 전부 PASS, 무결성 100%, 불안전 콘텐츠 0.

---

## 5. Targeted Mobbin retry

- **Was retry needed? → 아니오.** Phase 3 retry 트리거(직접경쟁 반복/panic 결손/relapse 결손/blocked-state 결손/현재NoF 깨짐/시트 판독불가) **하나도 미충족.**
- Queries tried: 없음(MCP 호출 안 함).
- New useful captures: 없음.
- Unavailable apps: Fortify / Brainbuddy / BlockerX / Covenant Eyes / NoFap / Remojo / Accountable2You / I Am Sober / Reframe / Quit Genius / Freedom / One Sec / ScreenZen / Jomo — **Mobbin 미수록**(2026-06-18 audit에서 probe 완료, QUITTR/Opal/wellness로 폴백). 1일 경과로 결과 변동 가능성 낮음 → 재probe 가치 없음.
- Duplicates/fallbacks: QUITTR 중복·무관 wellness 폴백은 신규 커버리지로 안 셈(정책 준수).
- **Conclusion:** retry 불필요·미수행. 브라우저/콘텐츠 차단 확장 직접경쟁 비주얼은 **정직한 영구 갭**(Mobbin에 폴리시드 화면 없음). NoF Chrome 확장(06/07)이 고유 자산, Opal app-block이 유일 인접 비교군.

---

## 6. Decision: existing vs new Claude Design session

- **Existing session(handoff/claude-design-nof-visual-v1·v2): critique only.** 과거 산출이 **generic wellness 팩(직접경쟁 0장, "Baseline B beige/wellness diary" 실패모드)** 위에서 나왔음. 새 v2 대비 **왜 약했는지** before/after 비판에만 사용. 그 방향에 **앵커링 금지.**
- **New session: 실제 비주얼 방향 생성.** v2 팩이 old 팩과 **본질적으로 다름**(직접경쟁 0→24). 첫 메시지부터 **직접경쟁 가중** 사고 + **3개 신선 방향** 필요 → 새 세션이 앵커링 회피에 유리.
- **Recommendation:**
  - Existing → critique only
  - New → actual generation
- **Reason:** old 세션은 약한 레퍼런스에 영향받음 + v2는 materially different + 직접경쟁 가중을 처음부터 원함 + old 출력 앵커링 회피. (프롬프트 기대 로직과 증거 일치.)

---

## 7. Risks

- **raw images local-only:** 51장 gitignore·미커밋. 클론에서 재현 불가 → Claude Design에 **수동 첨부 필수.** WSL 프로필 소실 시 재캡처 필요(Mobbin 토큰 세션한정, 이미 만료).
- **overfitting to QUITTR:** 직접경쟁 24장 중 21장이 QUITTR 단독. 패턴만 차용·반면교사(공포/수치/rewiring%/빨강리셋)로 명시 배제하지 않으면 톤 전염 위험.
- **missing Fortify/Brainbuddy/BlockerX:** 비주얼 캡처 영구 불가(Mobbin 미수록) → 텍스트 포지셔닝으로만 대체. 차단확장 직접경쟁 좌표 없음.
- **current NoF font fallback:** Malgun 폴백 렌더 → 자형이 실기기와 다름. 디자이너에게 "폰트는 참고 아님" 고지 필요.
- **mood references overpowering:** 기존 `references/mobbin_visual*` 100 webp가 과잉. v2 mood는 6장으로 의도적 축소했으나, old 팩을 같이 첨부하면 wellness 보드로 회귀 위험 → **old 팩은 downweight/미첨부.**

---

## 8. Final Claude Design input plan

- **attach:**
  - `references/mobbin/nof-competitive-v2/` 전체(01~04 + `00_manifest/capture-manifest.json` + `99_contact-sheets/all-reference-pack.html`)
  - `docs/NOF_COMPETITIVE_REFERENCE_AUDIT_RC16.md` + `docs/NOF_COMPETITIVE_REFERENCE_PACK_V2.md` + 본 결정 문서
  - 컨텍스트: `docs/DIRECT_COMPETITOR_VISUAL_AUDIT.md`, `docs/DESIGN_DIRECTION.md`, COPY_POLICY/UX_RULES
- **weight heavily:** `01_direct-competitors/`(QUITTR panic/relapse/analytics/home + LIVESTRONG 이중로깅 = 반면교사·차별화 좌표), `02_adjacent-blockers/` Opal(차단 세션·Adult 토글 정직 고지), `04_current-nof/`(현재 vs 경쟁 대비)
- **use for polish only:** `03_mood-polish/`(Oura 다크 프리미엄·Headspace 호흡)
- **do not attach or downweight:** 기존 `references/mobbin_visual*` 100 webp + handoff/* 중복(wellness 회귀 위험)
- **prompt title:** **"NoF Competitive Visual Direction Refresh — Direct Competitor Weighted"**
  - 지시 핵심: QUITTR 공포·수치·의사과학·빨강리셋 = 0, 차용은 패턴만(상태반응 오브제·충동≠실패 분리·항상-도달 위기 진입점·자기설정 차단·정직 한계고지), 한국 네이티브 + 차분한 프리미엄 + 따뜻한 인간미, 최종 색/UI는 사람 승인 후.

---

## 9. Next action

1. **새 Claude Design 세션**을 §8 입력 플랜으로 시작 — 제목 "NoF Competitive Visual Direction Refresh — Direct Competitor Weighted", v2 팩(직접경쟁 24장 우선) + 감사 2종 + 본 문서 첨부, 3개 방향 생성.
2. (선택) **기존 세션**에 v2 대비 old 방향 약점 critique 1회 요청 — 앵커링 금지.
3. raw 51장은 **수동 첨부**(local-only). old wellness 팩은 미첨부.
4. 색/UI 확정은 **사람 승인 후** — 이번 sprint는 의사결정까지만.

제약 준수: 앱/`src/`/extension/manifest/QA 미변경. Claude Design 미호출. push/tag/deploy 없음. raw image force-add 없음. Mobbin 미호출.
