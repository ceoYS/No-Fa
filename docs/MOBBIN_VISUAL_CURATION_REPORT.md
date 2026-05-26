# MOBBIN_VISUAL_CURATION_REPORT

Mobbin 시각 레퍼런스 품질 검수 결과 (NoF — 한국 절제/자기통제/회복 앱).
작성 2026-05-26. **Revision: strict re-audit round 2.** 내부 참고 전용. 재배포 금지.

상위 기준: `docs/UX_RULES.md`, `docs/COPY_POLICY.md`, `docs/MOBBIN_PATTERN_ANALYSIS.md`.
**디자인 생성·UI 복제·코드 구현 없음.** 분류/검수만 수행. 성인 키워드·성인 사이트명/URL 수집 없음.

---

## 0. 이번 라운드 (round 2) 개요

이전 라운드 USE 풀(81장)에 CAUTION 성격 화면이 섞여 있다는 사람 표본 검수 지적에 따라,
**USE 폴더 전체를 이미지 단위로 다시 열어 전수 재검수**했다(파일명·메타데이터가 아니라 실제 화면 확인).

- 검수 진입 시점 상태: USE 75 / CAUTION 22 / AVOID 3 (사람이 05·12 등에서 6장을 이미 수동 이동한 상태).
- 이번 라운드 추가 강등: **USE → CAUTION 8장**.
- 이미지 **삭제 없음** — 이동(mv)만. 원본 81장은 `references/mobbin_visual/`에 보존.
- 핸드오프(`handoff/claude-design-nof-visual-v2`)는 **이전 USE 81장 기준의 stale 패키지**였음(streak-repair / freeze / pause-preserve / mood-context 등 CAUTION 화면 포함). → **전면 재생성**.

## 1. 요약 (counts)

| Bucket | Count |
|---|---|
| 검수 대상 원본 | 81 (WebP, 보존) |
| **USE (최종)** | **67** |
| **CAUTION (최종)** | **30** |
| **AVOID (최종)** | **3** |
| **총 큐레이션** | **100** |

## 2. 이전 USE에서 새로 CAUTION으로 이동한 파일 (8장)

실제 이미지를 열어 확인한 근거:

| # | File | 사유 |
|---|---|---|
| 1 | `10_Social_Invite/slowly__invite-copy-link` | "Invite Friends. **Get Free Coins** … Referral Reward **0/100 Coins**" — 코인 인센티브 추천 경제. NoF 동료초대(동의기반·비과금)와 톤 충돌 |
| 2 | `12_Checkin_Journal/calm__mental-note-add-tags` | 하단 **"Add a Note…" 자유서술 영역이 화면 절반 지배** + "Spirituality" 태그. NoF 체크인=1분 enum/bucket 원칙과 충돌(자유 저널링 오학습 위험) |
| 3 | `14_Stats/epsy__count-logging-trend` | "**Seizure count / Medication not taken or logged**" 의학 질환 추적 라벨. NoF는 의학/치료 단정 금지 |
| 4 | `17_Relapse_Recovery/finch__gentle-restart-confirm` | 모달 **"No, back to repair"**(streak repair 기능 경로) + 우상단 재화 **5,918**. 카피("하루 놓쳐도 괜찮아요")는 양호하나 repair 메커닉을 Claude Design이 기능으로 오해 위험 |
| 5 | `18_Home_Dashboard/bloom__daily-self-care-home` | 베이지 웰니스 톤 + "59 words"/entries 탭 + Daily Insights & Advice = **generic wellness/일기장** drift 위험 |
| 6 | `18_Home_Dashboard/finch__character-goals-nav` | 하단 네비 **Shop / Bag(인벤토리) + ⚡XP + "9th Adventure 0/20"** 게임 경제 강하게 노출. 캐릭터+홈 아이디어는 참고하되 상점/XP는 복제 금지 |
| 7 | `20_AppStore_Positioning/alan__trust-safety-q` | 후기 "**shares more details than a doctor**" + "video consultation" + "Is Mo safe for my health?" = 의료 권위/치료 단정 포지셔닝 |
| 8 | `20_AppStore_Positioning/thefork__introducing-feature` | "**Public profiles**"(공개 프로필·팔로워·공개 피드) 기능 홍보 — NoF **비공개 기본** 원칙과 정면 충돌 |

> 이전 라운드(사람 수동)에서 이미 이동된 6장(05 streak-repair/freeze/pause-preserve 계열, 12 자유서술 계열 등)은 CAUTION에 그대로 유지.

## 3. 카테고리별 최종 USE 수

| Cat | USE | Cat | USE |
|---|---:|---|---:|
| 01_Onboarding ✅ | 7 | 11_Accountability | 3 |
| 02_Permissions | 4 | 12_Checkin_Journal ✅ | 3 |
| 03_Blocking ✅ | 7 | 13_Crisis ✅ | 6 |
| 04_Habit | 2 | 14_Stats | 3 |
| 05_Streak ✅ | 2 | 15_Paywall | 4 |
| 06_Character ✅ | 5 | 16_Privacy | 4 |
| 07_Rewards | 2 | 17_Relapse_Recovery ✅ | 4 |
| 08_Shop_Gacha | 0 | 18_Home_Dashboard ✅ | 4 |
| 09_Leaderboard | 0 | 19_Notification_Reminder | 3 |
| 10_Social_Invite | 2 | 20_AppStore_Positioning | 2 |

> **안전성 > 수량.** 핵심 카테고리 05(2)·12(3)·17(4)·18(4)는 5장 기준 미달이나, 위험 화면을 억지로 USE에 두지 않았다. 부족분은 §7 수동 캡쳐 큐로 이관.

## 4. 특별 재검수 결과 (강하게 본 카테고리)

- **01_Onboarding** — 7장 전량 USE 유지. citizen 다크 "protection circle"/emergencies 톤은 다소 무겁지만 체크리스트 구조 참고 목적으로 유지(톤 복제 금지).
- **03_Blocking** — 7장 전량 USE 유지. opal/stoic 노출 앱명은 Instagram/Facebook 등 메인스트림이며 **성인 사이트명/URL 없음**. "완벽 차단/강압 권한" 인상 화면 없음(세션·자기설정·유예 톤).
- **05_Streak** — repair/freeze/protection/pause-preserve 계열은 전량 CAUTION. USE는 중립 스트릭 캘린더·skip 허용·longest-current 2장만.
- **06_Character** — 동료/마스코트 5장 USE. meplus journey-companion 은 "keep streak alive"+gem 토큰 톤 주의(§6). 유치한 펫 방치/체력바/처벌(abode), 사실적 성인 인접 아바타(replika)는 CAUTION 유지.
- **12_Checkin_Journal** — enum 기반만 USE(fitbit 5점, breeze 긍/부정 그리드, breeze 슬라이더+enum). 자유서술/메모 지배 화면(calm mental-note, calm mood-context, 5-minute-journal)은 CAUTION.
- **13_Crisis** — 호흡/멈춤/유예 6장 전량 USE. 위기 톤이 부드럽고 비난 없음.
- **17_Relapse_Recovery** — 자기연민·데이터 보존 재시작 4장 USE. 유료/메커닉 repair(finch 2장)와 가혹 리셋(duolingo resets-to-zero, AVOID)은 제외.
- **18_Home_Dashboard** — 플랜/지표/코스/미션 홈 4장 USE. 게임 경제(finch Shop/XP)·웰니스 일기 톤(bloom)은 CAUTION.

## 5. Claude Design에 넣어도 되는 폴더 (✅ allow)

```
handoff/claude-design-nof-visual-v2/mobbin_visual_curated/USE/   ← 최종 USE 67장 (Mobbin footer crop)
handoff/claude-design-nof-visual-v2/mobbin_visual_curated/CURATED_REFERENCE_INDEX.md / .json
handoff/claude-design-nof-visual-v2/docs/MOBBIN_VISUAL_CURATION_REPORT.md   ← 본 문서
```

- 핸드오프 이미지는 **USE 67장만** 포함. CAUTION/AVOID 이미지는 **미포함**.
- 핸드오프 이미지는 앱 화면 외부의 **Mobbin footer(하단 검은 바, 약 60px)만 crop** 제거 — 앱 UI 자체는 무수정. **원본(uncropped)은 `references/mobbin_visual_curated/USE/`에 보존.**

## 6. 톤은 차용 금지 (USE이나 주의해서 볼 항목)

| File | 주의 |
|---|---|
| 06 meplus · journey-companion | "keep your self-care streak alive" 약한 손실압박 + gem 토큰 — 동료 초대 구조만, 손실/재화 톤 제외 |
| 06/15 tolan · 3d-companion-home / free-vs-star | 브랜드(AI 동반자) 인접성 — 이미지는 안전하나 수동 확인 권장 |
| 12 breeze · mood-slider-feelings-tags / emotion-positive-negative | 자유 메모·사진 필드 동반 — **enum/슬라이더만 차용, 자유서술·사진 제외** |
| 01 citizen · get-started-checklist | 다크 "protection circle"/emergency 톤 — 체크리스트 구조만 |
| 11 finch · send-encouragement | ⚡5 XP 표기 — 동료 격려 구조만, XP 제외 |

## 7. Claude Design에 넣으면 안 되는 목록 (❌ 문서로만 전달)

- **CAUTION 30장 전체** — `CURATED_REFERENCE_INDEX.md §CAUTION` 표 참조. 정보 구조만 텍스트로 참고, **이미지 미전달**.
- **AVOID 3장** — anti-pattern, 대조용:

| File | Why |
|---|---|
| 08 mimo · RISK-protection-sale | 보호기간 세일=과금 압박/손실 회피 |
| 09 mimo · league-danger-note | 강등 "danger"=망신/공포 |
| 17 duolingo · resets-to-zero-contrast | "Miss a day, it resets to 0" 가혹 리셋 |

## 8. 아직 수동 확인이 필요한 파일 / 항목 (manual queue)

USE에 두었으나 사람 최종 확인을 권장하는 화면 + Mobbin으로 못 채운 공백:

1. `06 meplus · journey-companion` — gem 토큰/"streak alive" 손실 톤이 NoF 기준 허용선인지 최종 판단.
2. `06/15 tolan` 2장 — 브랜드(AI 동반자) 인접성이 NoF 수호자/절제 공간 톤과 충돌하지 않는지.
3. `12 breeze` 2장 — NoF 구현 시 자유 메모/사진 필드를 확실히 제거하고 enum만 가져가는지 검증.
4. **05_Streak / 12_Checkin / 17 / 18 핵심 카테고리 USE<5** — 안전한 중립 화면 보강 캡쳐 필요.
5. **one sec / ScreenZen** 실제 "앱 열기 전 지연·심호흡" intervention 플로우 (Mobbin 미노출, 13/03 1순위).
6. **Daylio** 본연의 mood+activity 그리드(현재 Breeze/Fitbit 대체).
7. **enum 트리거 기반 실패 기록(자유서술 선택·비공개)** 전용 17 화면.
8. **정직한 차단 한계 고지 카피**("모든 경로를 막을 수는 없어요")가 보이는 03 화면.
9. **동의 기반 파트너 공유 범위(기본 비공개)** 한국형/카카오 맥락 10/11 화면.

> 성인 키워드/성인 사이트명·URL 검색은 수행하지 않음. NoFap 경쟁앱(QUITTR 등) 성인 단어 노출 화면은 수집 제외.

## 9. 산출물 경로

- 큐레이션 이미지: `references/mobbin_visual_curated/{USE,CAUTION,AVOID}/`
- 인덱스: `references/mobbin_visual_curated/CURATED_REFERENCE_INDEX.{md,json}`
- 본 보고서: `docs/MOBBIN_VISUAL_CURATION_REPORT.md`
- 디자인 핸드오프: `handoff/claude-design-nof-visual-v2/` (USE 67장 footer-cropped + 인덱스 + 본 보고서)
- 원본 보존: `references/mobbin_visual/` (81장, 무삭제·uncropped)
