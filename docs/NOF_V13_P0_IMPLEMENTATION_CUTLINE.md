# NoF v13 — P0 Implementation Cutline (LOCKED)

> 이 문서는 NoF v13 구현 라운드의 **계약(contract)** 이다.
> 디자인은 고정 레퍼런스, 구현은 incremental. 한 라운드에 전체를 갈아엎지 않는다.
>
> Status: **LOCKED** · Round: P0 implementation handoff intake · Branch: `wip/pet-room-scene-mode`

---

## 0. 최종 디자인 레퍼런스 (고정)

**Final design / product reference (single source of truth):**

```
NoF Product Screens v13 - Final Handoff (standalone).html
```

위치: `claude_design` MCP project `NoF product design guidelines`
(`17cfb064-79b3-4821-ae46-500dee6a476c`).

레퍼런스 성격:

- v13 Final Handoff는 **제품 지도(product map)이자 시각 레퍼런스**다.
- **bulk implementation source가 아니다.** standalone HTML을 앱에 통째로 복붙 금지.
- v13의 86개 화면 전체를 한 번에 구현하지 않는다. P0 vertical slice만 구현한다.
- 화면이 "Final Handoff"라고 표기돼 있어도, 실제 구현은 **반드시 incremental**이다.

함께 읽는 구조화 핸드오프 문서 (design map을 인코딩한 것 — HTML 대신 이 문서들을 기준으로 매핑):

- `NOF_SCREEN_REGISTRY_V1.md` — 전체 화면 레지스트리 (label · domain · tier · $afe 수익화 금지 표시)
- `NOF_IMPLEMENTATION_HANDOFF_V1.md` — 구현 핸드오프 + 우선순위 backlog + merge-gate checklist
- `NOF_UX_DECISIONS_V1.md` — UX 정책 (정체성 · 실패 처리 · Chrome 정직성 · 수익화 금지 위치 · 색 위계)

> 참고: 레지스트리/핸드오프 V1 문서는 visual source로 v9를 명시한다. v13 Final Handoff가 최신 standalone이며,
> 정책·도메인 구조는 v9↔v13에서 안정적이다. 본 라운드는 **v13을 final reference로 고정**하고 정책은 위 V1 문서를 따른다.

---

## 1. 제품 정체성 (변경 금지)

NoF는 좁은 "금딸 카운터 앱"이 아니다. 최종 방향은 **여러 절제 항목을 관리하는 multi-restraint direction system**이다.

예시 절제 항목: 밤 검색 · 숏폼 · 야식 · 음주 · 사용자가 직접 정한 항목.

제품 톤:

- 차갑고 단단한 절제 UI (Soft Slate / Navy 쿨 코어)
- 따뜻한 방/고양이 보상 레이어 (warm tone은 Pet Room/보상 레이어 **내부에만**)
- 죄책감 · 낙인 · 처벌 없음
- "억지로 버티는 앱"이 아니라 "다시 시작하는 앱"

---

## 2. P0 / P1 / P2 Cutline

### P0 — 이번 구현 대상 (구현 허용 범위)

| # | P0 화면/기능 | domain | 현재 코드 상태 |
|---|---|---|---|
| 1 | 온보딩 언어 선택 | onboarding/i18n | ❌ 없음 |
| 2 | 언어 설정 저장 / persist | i18n/settings | ❌ 없음 |
| 3 | 첫 절제 항목 생성 | restraints | △ addCounter 존재, 온보딩 진입 없음 |
| 4 | 홈 화면 | timers/restraints | ✅ `HomeScreen` |
| 5 | 절제 항목 생성/수정/삭제 확인 | restraints | △ add/edit 있음, delete-confirm 없음 |
| 6 | 오늘 기록 기본 저장 | records | ✅ `CheckinScreen` + `completeCheckin` |
| 7 | 기록 항목 추가/편집 (P0 text-only) | records | ❌ 고정 필드, 템플릿 모델 없음 |
| 8 | 월간 캘린더 기본 | calendar | ✅ `CalendarScreen` (실제 7×6 month grid) |
| 9 | Pause 화면 | pause | ✅ `UrgeScreen` (잠깐 멈춤) |
| 10 | blocked.html / 보호 차단 화면 | protection | ✅ `extensions/chrome-shield/blocked.html` + `ShieldExtensionScreen` |
| 11 | 흔들림/리셋 기록 | failure | ✅ `RecoveryScreen` + `relapse()` |
| 12 | 보호 규칙 추가/편집 | protection | ✅ `ProtectionScreen` + `DisciplineScreen` |
| 13 | 설정 / 언어 설정 | settings/i18n | ❌ `SettingsScreen` 없음 |
| 14 | Home room preview | petRoom/home | ✅ `PetRoomPreview` 컴포넌트 존재 |
| 15 | Canonical `CatCompanionLayer` (단일 고양이) | petRoom | △ `PetSceneViewer`(방), `[data-layer]` selector 없음 |

상태 범례: ✅ 존재 · △ 부분/근접 · ❌ 부재(net-new).

### P1 — 이번에 구현하지 말 것 (문서/주석으로만 남김)

- My Room 본 화면
- Decorate mode (방 꾸미기 상세)
- Reward ladder / Reward unlock (마일스톤 보상 해금)
- Future diary (미래일기)
- Image generation / Prompt history (이미지 생성 · 프롬프트 기록)
- Public future diary (공개 미래일기)
- Today's Sentence (오늘의 문장)
- Plan comparison / Paywall (Pro Paywall)
- Subscription management (구독 관리)

### P2 / after PMF

- 고급 분석
- 공개 채널 moderation 전체
- 이미지 생성 고도화
- 다중 기기 / 브라우저 확장
- 커뮤니티 확장
- 책임 파트너 / 소셜 락인

### 절대 금지 (구현하지 않는다)

86개 화면 전체 구현 · 리더보드 · 팔로워/좋아요 경쟁 · 시끄러운 SNS 피드 · 카카오 친구 책임 파트너 ·
성인 콘텐츠 링크/노출 · 자동 AI 감지 주장 · 기기 전체 차단 주장 · 모바일 전체 차단 주장 · 모든 앱 차단 주장 ·
치료/회복 보장 표현 · 실패자/타락/처벌/벌점/낙인 표현 · 취약 순간 Paywall/Pro/상품/결제/Store CTA 노출 ·
고양이 삭제 · 흔들림 후 방 붕괴/고양이 아픔·실망 연출 · 코인/가챠/유료 아이템형 Pet Room 보상.

---

## 3. Current Repo vs P0 — Gap Table

기준 코드: Vite + React 18 SPA (`nof-p0-prototype`). 상태는 `src/App.jsx`에 lift, 단일 localStorage 번들
(`nof.mvp.state.v1`, no network)로 persist.

### 이미 충족 (P0 재구현 불필요)

| P0 | 기존 자산 | 메모 |
|---|---|---|
| #4 홈 | `src/screens/HomeScreen.jsx` | multi-counter hero + 항목 리스트 |
| #6 오늘 기록 저장 | `CheckinScreen.jsx` + `App.completeCheckin` | once-per-day reward guard 포함 |
| #8 월간 캘린더 | `CalendarScreen.jsx` | RC-2A 실제 year/month 7×6 grid |
| #9 Pause | `UrgeScreen.jsx` (잠깐 멈춤) | nav 상존, $afe |
| #10 blocked | `extensions/chrome-shield/blocked.html` + `ShieldExtensionScreen.jsx` | Chrome 데스크톱 전용 고지 |
| #11 흔들림/리셋 | `RecoveryScreen.jsx` + `App.relapse()` | 선택 카운터만 리셋, 기록/방 보존 |
| #12 보호 규칙 | `ProtectionScreen.jsx`(plan) + `DisciplineScreen.jsx`(규율) | 자동 감지 없음 고지 |
| #14 room preview | `components/PetRoomPreview.jsx` | Home 미니 미리보기 |

### P0 GAP (net-new / 부분 — 후속 slice 대상)

| GAP | 설명 | 권장 도메인 |
|---|---|---|
| i18n 부재 | locale 레이어 전무. 모든 문자열 하드코딩 KR. storage 번들에 `locale` 없음 | i18n/settings |
| Settings 부재 | `SettingsScreen` 없음 (#13) | settings |
| Onboarding 부재 | 온보딩 화면 전무 (언어 선택 #1, 첫 항목 #3 진입) | onboarding |
| Canonical cat 부재 | `[data-layer="cat-companion"]` selector 없음. 고양이 = `PetSceneViewer`(방), Home preview = `PetRoomPreview` (#15) | petRoom |
| Record 템플릿 부재 | 기록 고정 필드. `shortText`/`longText` 사용자 정의 필드 모델 없음 (#7) | records |
| Delete confirm 부재 | 카운터 delete 미연결(의도적). archive/delete 확인 다이얼로그 없음 (#5) | restraints |

### Copy guard 현황 (baseline)

- `src/` 사용자-facing 금지어 스캔 **clean**. 유일 hit는 내부 가드 주석 `// 규율 = 내가 정한 기준, not 처벌`.
- `실패` 사용자-facing 1건. `금딸/금욕/실패자/치료/회복 보장` 화면 내 없음.
- Baseline verify: `npm run build` OK · `npm run check:nof` 106/106 PASS.

---

## 4. Vulnerable No-Monetization Guard (취약 순간 수익화 금지)

아래 화면/상태에는 **Pro / Paywall / Store / 상품 / 결제 / 구독 CTA를 노출하지 않는다.**

- Pause (잠깐 멈춤) — 대기 중 · 완료 모두
- blocked.html / 보호 차단 화면
- 흔들림/리셋 기록 직후 (right-after-wavered record)
- Pause 완료
- 리셋 후 다시 시작
- 보호 규칙에 걸린 직후
- 모든 취약 순간

수익화 노출 **허용** 위치 (취약 순간 아님): 항목 관리(custom 한도) · 이미지 생성 진입(Pro 잠금/quota) ·
Pro Paywall · 설정. (P0 범위 밖이지만 경계만 명시.)

$afe 화면 (레지스트리 기준 수익화 금지 6종): 잠깐 멈춤 · 잠깐 멈춤 완료 · blocked · 실패 기록 ·
실패 다시 시작됨 · (Paywall 취약 순간 진입 금지).

---

## 5. Chrome Honesty Guard (정직한 차단 고지)

blocked / protection copy는 반드시 정직해야 한다. 온보딩(Chrome 범위) · blocked.html · 보호 설정에서 **동일 문구 일관 사용.**

**하는 것:** 이 Chrome에서 사용자가 정한 사이트를 열 때 잠깐 멈춤 화면 표시.
**하지 않는 것:** 기기 전체 · 다른 브라우저 · 휴대폰 차단, 무엇을 보는지 자동 감지.
보호는 사용자가 직접 추가한 규칙으로만 작동.

정직성 고정 문구:

**KR**

- `이 Chrome 브라우저에서 설정한 규칙만 적용돼요.`
- `AI가 자동으로 감지한 것이 아니라, 내가 직접 추가한 규칙이에요.`

**EN**

- `Works only in this Chrome browser.`
- `This wasn't detected by AI. It comes from rules you added yourself.`

금지 주장: 자동 감지 / AI 감지 / 기기 전체 차단 / 모바일 전체 차단 / 모든 앱 차단 / 치료·회복 보장.

흐름: `blocked.html` → `잠깐 멈춤` → `오늘 기록`.

---

## 6. Canonical CatCompanionLayer Decision

P0에서 **방 전체 구현 금지.** Home room preview만 최소 구현. 고양이는 **canonical component 하나**로만 간다.

결정:

- Canonical 컴포넌트명: **`CatCompanionLayer`** (또는 기존 구조에 맞춘 단일 `CatCompanion`).
- 단일 고양이 컴포넌트가 Home preview · 온보딩 · Pause에서 재사용된다 (P0에서는 이 세 곳 정도에만 최소 적용).
- 현재 코드: `PetSceneViewer`(방 composite, 항상 고양이 표시), `EmberCat`(컴포넌트), `PetRoomPreview`(Home).
  P0 통합 시 이들을 canonical layer 하나로 수렴시키되, **이번 docs 라운드에서는 cat 코드를 건드리지 않는다.**

**Future QA selector (구현 후 게이트):**

```js
document.querySelectorAll('[data-layer="cat-companion"]').length
```

- 목표: 한 화면에 canonical cat이 **정확히 1개**만 렌더링 (Home preview, Pause 등에서 중복 0).
- 구현 시 canonical layer 루트에 `data-layer="cat-companion"` 속성을 부여한다.

금지: 방 안 고양이 도형 중복 렌더 · 고양이 삭제 · 흔들림 후 고양이 아픔/사라짐 연출 · 방 붕괴 연출 ·
코인/가챠/유료 아이템형 보상.

---

## 7. P0 Record Custom Fields Model

P0 active field types: **`shortText`, `longText` 만.**

P1/P2 또는 locked/future: `number` · `time` · `tag` · `checklist` · `score` · `mood scale`.

권장 데이터 모델 (locale-flexible title):

```js
recordTemplate = {
  id,
  restraintItemId,
  fields: [
    {
      id,
      title,            // 현재 언어 입력 문자열 (표시용)
      sourceLocale,     // 입력 당시 언어 ('ko' | 'en')
      titleByLocale,    // { ko?, en? } — 있는 것만, 강제 아님
      type: 'shortText' | 'longText',
      required,
      order,
      enabled,
    },
  ],
}
```

원칙:

- P0에서는 사용자가 **현재 언어에서 필드 제목 하나만** 입력하면 된다.
- `titleKo` / `titleEn`을 모두 강제하지 않는다 (locale-flexible).
- 기존 Records 저장 구조(`checkinLedger`, `todayRecord`)를 **보존**하고, 템플릿은 그 위에 additive하게 얹는다.

---

## 8. 도메인 경계 / One Commit = One Domain

도메인: `restraints` · `timers` · `records` · `failure` · `calendar` · `pause` · `protection` ·
`analytics` · `futureDiary` · `imageGeneration` · `promptHistory` · `publicDiary` · `todaySentence` ·
`petRoom` · `monetization` · `settings` · `onboarding` · `i18n`.

규칙:

- 각 domain은 자기 상태/컴포넌트를 소유. 타 domain 직접 침범 금지.
- Records 변경 → Records 파일에서만. Protection/Pause/blocked → protection 도메인에서만.
  Pet Room/Home preview → room/pet/home 도메인에서만. Settings/language → settings/i18n 도메인에서만.
- `petRoom`은 절제 누적을 **읽기만** 한다. 실패가 방 상태를 바꾸지 못한다.
- **한 커밋 = 한 도메인.** 한 커밋에 여러 도메인을 섞지 않는다.

### Copy 기준

선호: 흔들림 · 리셋 · 다시 시작 · 흔들린 날 · 리셋 기록.
피함: 실패 · 실패자 · 타락 · 처벌 · 벌점 · 치료 · 회복 보장 · 금딸 · 금욕.
예외: 내부 변수명 `slip`은 기존 코드 호환을 위해 유지 가능 (사용자-facing 아님).

---

## 9. Next Recommended Slices (after this docs commit)

순서는 도메인 격리 + 최소 변경 우선. 각 slice는 별도 커밋, build + check:nof 그린 유지.

1. **`fix: align NoF P0 copy with v13 handoff`** — copy / guard / i18n only
   - 온보딩/Pause/blocked/흔들림 copy 정리
   - language persistence primitive (storage 번들에 `locale` 슬라이스 + `src/constants/locale.js` + App state, additive)
   - 사용자-facing 금지어 점검/제거
   - *주의: 전체 화면 재번역 금지. locale 골격 + 점진적 EN 문자열만.*

2. **`feat: add P0 companion room preview`** — room preview / cat only
   - Home room preview 최소 구현 + canonical `CatCompanionLayer`
   - `[data-layer="cat-companion"]` 부여, duplicate cat 방지
   - P0 범위 내에서만 (방 전체 금지)

3. **`feat: support P0 text record fields`** — records custom fields only
   - `shortText` / `longText` only
   - locale-flexible title model (§7)
   - 기존 Records 저장 구조 보존

(Settings 화면 + onboarding 진입은 i18n primitive 착지 후 별도 slice. 한 번에 묶지 않는다.)

---

## 10. Verification / Merge Gate

매 코드 slice 후 실행:

```bash
npm run build        # 필수 통과
npm run check:nof    # 필수 통과 (현재 106/106)
npm run qa:mvp || true
npm run qa:ext || true
git diff --check
```

`qa:mvp`/`qa:ext`가 환경 문제로 실패하면 숨기지 말고 정확히 보고. build/check:nof는 반드시 통과.
가능하면 **390px 모바일** 기준 주요 화면 확인 (디자인 프레임 폭 338px).

### Post-render QA note (cat 단일성)

cat layer 구현 후, 주요 화면에서:

```js
document.querySelectorAll('[data-layer="cat-companion"]').length  // 화면당 정확히 1
```

### 금지어 grep (slice 후)

```bash
grep -RInE "금딸|금욕|실패자|타락|처벌|벌점|치료|회복 보장|AI.*자동 감지|기기 전체|모든 앱|all apps|device-wide|automatic detection|guaranteed recovery" src docs scripts
grep -RInE "Paywall|Pro|Store|billing|subscribe|결제|구독|상품" src docs scripts
```

주의: grep hit가 전부 실패는 아니다. docs의 가드 설명 잔존은 문맥 검토. 사용자-facing 취약 화면에 남으면 반드시 제거.
