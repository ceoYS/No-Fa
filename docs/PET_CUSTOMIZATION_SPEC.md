# PET_CUSTOMIZATION_SPEC.md

펫/동료 커스터마이징 시스템 — 애착·리텐션·자기통제 루프 (감시·죄책감·pay-to-win 아님)

작성일: 2026-05-27
상태: 제품·디자인·에셋 설계 문서 / 기능 구현 아님 / 이미지·에셋 생성 아님 / 최종 색·캐릭터 확정 아님 (사람 승인 전)
상위/입력 문서:
- `docs/CHARACTER_SYSTEM_SPEC.md` (§13 Ember Cat 후보 — 성장·금지 기준 상속)
- `docs/CLAUDE_DESIGN_PATTERN_BRIEF_EMBER_CAT.md` (Ink & Ember 패턴·화면 매핑)
- `docs/DESIGN_RESET_BRIEF.md` (후보 A "Quiet Shield" 다크 톤, beige/공포/감시 방지 규칙)
- `docs/COPY_POLICY.md`, `docs/UX_RULES.md`, `docs/SCREEN_INVENTORY.md`
- `docs/MONETIZATION_POLICY.md` (비랜덤·비능력 코스메틱 경계)
- `docs/handoff/COMPANY_PC_HANDOFF_20260526_EMBER_CAT.md` (Ember Cat 재해석 근거)

> 이 문서의 역할
> - 펫 시스템을 **모듈형 커스터마이징 구조**로 정리한다. 옵션·상태·성장·공간·간식·수익화·MVP·에셋 전략을 한 장으로 묶는다.
> - 기능 구현·코드 생성·이미지 생성은 하지 않는다. 이미지-생성 라운드는 이 문서의 옵션 구조를 **기준**으로 진행한다(§12).
> - CHARACTER_SYSTEM_SPEC §5·§6·§9·§13의 금지·성장 기준을 그대로 상속하며, 이를 커스터마이징·공간·간식 층위로 구체화한다.

> **v0.3.2 코어 리포커스 정렬 (PRD §0.6.9):** 펫은 코어가 아니라 **코어 루프를 지지하는 보상 층**이다. 코어 루프는 절제 타이머 · 실패/위기 복기 · 사용자 규율 · 기능적 기록 · 사회적 동행이며(PRD §0.6.1), 펫·공간 상태는 이 루프 수행으로 좋아진다. 따뜻함(warmth)은 PRD §0.5.10 C 단일 공식에서만 파생하며 별도 중복 게이지를 만들지 않는다(단일 출처). P2/P3에서 펫 듀얼·던전·퀘스트 **탐색은 허용**되나(PRD §0.6.8), §2의 금지(죽음·병듦·굶주림·퇴화·다침·pay-to-win·확률형 뽑기·실패 삭제·강등)는 단계와 무관하게 그대로 유지한다.

---

## 1. 목적 (Purpose)

펫은 단순 장식이 아니라 NoF의 **애착·리텐션·자기통제 루프**다.

- 사용자가 절제·체크인·위기 극복·차단 설정·회복 루프를 수행할수록 **펫과 공간의 상태가 좋아진다.** 성장은 펫이 강해지는 게 아니라 **사용자의 절제 공간이 안정**되는 것이다(CHARACTER_SYSTEM_SPEC §13).
- 펫은 **감시자·판단자가 아니라 조용한 동료**다(UX_RULES §7, COPY_POLICY §9). 사용자를 평가·훈계하지 않는다.
- 펫은 "매일 열 이유"(리텐션)와 "다시 돌아올 이유"(회복)를 만든다. **죄책감으로 붙잡지 않는다.**

이 문서는 그 루프를 **커스터마이징 가능한 모듈**(이름·외형·성격·공간·간식)로 분해해 애착을 만들되, 어느 모듈도 처벌·감시·과금 압박으로 흐르지 않게 가드레일을 둔다.

---

## 2. 핵심 원칙 (Core principles)

1. **펫이 사용자의 실패로 고통받지 않는다.** 실패/재발 시 울기·죽음·굶주림·퇴화·병듦 **금지**(CHARACTER_SYSTEM_SPEC §6, §13).
2. **처벌은 펫 피해가 아니다.** 처벌처럼 보일 수 있는 유일한 표현은 — 오늘의 **보상 unlock 보류**, 공간 **안정도 정체**(하강 아님), **잔불(앰버 발광) 약화** 정도다. 단계 강등·펫 피해는 없다.
3. **"죄책감"이 아니라 "다시 돌아올 이유"를 만든다.** 실패 화면은 24h 재방문을 유도하되 비난 0(UX_RULES §3, §4).
4. **확률형 뽑기 금지**(MONETIZATION_POLICY §5).
5. **pay-to-win 금지**(MONETIZATION_POLICY §6).
6. **스트릭 복구권·실패 삭제권·차단 해제권 금지**(MONETIZATION_POLICY §10).
7. **펫은 곁에 머무는 보조 존재감.** 화면을 점유하기보다 Home·Urge·Blocking에서 보조 위치(CLAUDE_DESIGN_PATTERN_BRIEF §6).

> 한 줄 검수: "이 모듈이 사용자를 깎아내리는가, 다시 일어서게 하는가?"(UX_RULES §1)

---

## 3. 펫 종류 (Pet species)

| 종류 | 단계 | 톤 적합성 |
|---|---|---|
| 고양이 (Cat) | **MVP 우선** | Ink & Ember / 조용한 동료 / 밤 / 잔불 수호자 톤에 적합. 정적·차분한 존재감. |
| 강아지 (Dog) | 확장(P1+) | 추후 운동/대체활동/활동형 루틴 캐릭터로 확장 가능. 더 활동적 톤. |

- MVP는 **고양이만**. Ember Cat(검은 잉크 실루엣 + 앰버 포인트, CHARACTER_SYSTEM_SPEC §13) 방향을 그대로 잇는다.
- 강아지는 톤 좌표가 다르므로(활동형) 별도 검증 후 도입. 초기 동시 출시는 Open decision(§14).

---

## 4. 커스터마이징 옵션 구조 (Customization option structure)

모든 옵션은 **모듈형 enum**으로 정의한다. 조합을 완성 이미지로 만들지 않고 모듈을 조합한다(§11). 모든 옵션은 **미적 선택이며 능력·성공률·성과에 영향 없음**(CHARACTER_SYSTEM_SPEC §8).

### A. 이름 (Name)
- 사용자 자유 입력. 기본값 제안 가능(예: "재"/"잔불"/"Ember"). 비공개 기본.
- 금지: 강제 입력, 성적·노골 단어 필터 미적용 노출. 자유 입력은 비공개(UX_RULES §10).

### B. 동물 종류 (Species)
- `cat`(MVP) / `dog`(확장). §3.

### C. 성별 (Sex / gender presentation)
- `female`(암컷) / `male`(수컷) / `unspecified`(미지정·중성형).
- **중성형 옵션을 기본 가능하게 둔다.** 성별은 외형 프리셋 라벨일 뿐 능력 차이 없음. 명시 여부는 Open decision(§14, 성격 타입으로 대체 가능).

### D. 털 색 (Coat color)
- `white`(흰색) / `black`(검은색) / `gray`(회색) / `brown`(갈색) / `cream`(크림색) / `ginger`(치즈/오렌지).
- Ink & Ember 정합: 어떤 털 색이든 **어두운 잉크 환경 위 실루엣**으로 읽히게. 색은 면(plane)이 아닌 톤·실루엣으로 차별(CLAUDE_DESIGN_PATTERN_BRIEF §5).

### E. 눈 색 (Eye color)
- `amber`(앰버) / `dark_brown`(다크 브라운) / `olive`(올리브) / `blue_gray`(블루그레이) / `hazel`(헤이즐).
- 눈은 **앰버 포인트가 켜지는 핵심 발광 지점**(§13 성장 표현 1단계 "눈빛만 켜짐"). 앰버는 기본 추천, 나머지는 프리셋.

### F. 성격 타입 (Personality type)
- `quiet_companion`(조용한 동료) / `steady_guardian`(든든한 수호자) / `clever_advisor`(영리한 조언자) / `warm_friend`(따뜻한 친구).
- 성격은 **카피 톤·메시지 빈도**에만 영향(COPY_POLICY §9 상속). 능력·성공률 영향 0. 전 타입 공통: 비난·평가·훈계 금지.

### G. 자세/실루엣 (Pose / silhouette)
- `sitting`(앉은 자세) / `loaf`(loaf 자세) / `paws_visible`(손/발 보이는 자세) / `resting`(쉬는 자세).
- 자세는 §11 캐릭터 base sheet에서 **같은 각도·같은 조명·같은 비율**로 시트화.

---

## 5. 상태 시스템 (State system)

펫 상태는 사용자 행동·시간대에 반응하는 **표현 enum**이다. 능력치가 아니다.

### 상태 후보 (허용)
- `default`(기본)
- `content`(만족)
- `relaxed`(편안함)
- `sleepy`(졸림)
- `treat_received`(간식 받음)
- `cheering`(응원 중)
- `taking_a_break`(쉬어가는 중) — 실패/재발 시의 상태. CHARACTER_SYSTEM_SPEC §6 "쉬는 상태"와 동일.
- `ember_low`(잔불 약함) — 공간 안정도 정체 시 앰버 발광이 약해진 상태. 펫 피해 아님, 하강 연출 아님.

### 금지 상태 (Forbidden states)
배고픔으로 고통 · 울음 · 죽음 · 아픔 · 실망 · 벌받음 · 퇴화.
(CHARACTER_SYSTEM_SPEC §6·§13, DESIGN_RESET_BRIEF §8 — 하강·X·경고등 연출 0.)

> `taking_a_break`·`ember_low`은 실패의 시각 신호이되 **처벌이 아니라 "다시 돌아오면 잔불이 살아난다"는 회복 동선**으로 설계한다. 빨강·우는 표정·해골 등 금지.

---

## 6. 성장 / 공간 안정도 시스템 (Growth / space stability system)

성장은 "펫이 강해지는 것"이 아니라 **"사용자의 절제 공간이 안정되는 것"**(CHARACTER_SYSTEM_SPEC §13, handoff §6).

### 성장 입력 (Growth inputs) — 스트릭 단독 아님
- 매일 1분 체크인 (누적)
- 위기 버튼 사용 후 버틴 횟수
- 차단 세션 설정 횟수
- 회복 루프 완료 횟수
- 연속일(스트릭)
- 총 기록일

### 성장 표현 (시각 단계 후보, CHARACTER_SYSTEM_SPEC §13 상속)
1. 작은 잉크 고양이 — 눈빛만 작게 켜짐
2. 곁에 작은 잔불이 생김
3. 고양이 주변 공간이 안정됨
4. 꼬리 끝 빛이 길어짐
5. 절제 공간/방/결계가 완성됨

### 강등 없음 규칙 (No-demotion rule)
- **실패/재발이 있어도 단계는 내려가지 않는다**(CHARACTER_SYSTEM_SPEC §5, UX_RULES §3).
- 다만 **오늘의 보상/간식/장식 unlock은 보류**될 수 있고, **공간 안정도는 정체**(하강 아님), **잔불은 약화**(`ember_low`)될 수 있다.
- 누적 데이터·펫·여정은 사라지지 않음을 시각화한다(DESIGN_RESET_BRIEF §8).

---

## 7. 집/방 꾸미기 시스템 (Room customization system)

펫이 머무는 "내 절제 공간"을 꾸민다. 꾸미기는 **미적 선택**이며 능력·성공률 영향 0(CHARACTER_SYSTEM_SPEC §8). Ink & Ember 다크 베이스 위 잔불 톤(CLAUDE_DESIGN_PATTERN_BRIEF §7).

### A. 방 테마 (Room themes)
- 밤의 서재 (Night Study)
- 잔불 방 (Ember Room)
- 비 오는 창가 (Rain Window)
- 조용한 침실 (Quiet Bedroom)
- 작은 다락방 (Small Attic)

### B. 가구/장식 (Furniture / decoration)
- 쿠션 / 담요 / 조명 / 캣타워 / 책장 / 작은 화분 / 창문 / 장난감

### C. 분위기 요소 (Ambient elements)
- 잔불 입자 / 달빛 / 비 내리는 창문 / 따뜻한 램프 / 벽 조명

> 분위기 요소는 §6 공간 안정도와 연동(예: 안정될수록 램프가 따뜻해짐). 단, 정체/약화는 "꺼짐·붕괴"가 아니라 "조용해짐"으로 표현. 경고등·붕괴 연출 금지.

---

## 8. 간식 / 보상 시스템 (Treat / reward system)

간식은 **애착·연출·공간 안정감을 위한 장식성 보상**이다. 성과를 조작하지 않고 펫 능력치를 올리지 않는다(CHARACTER_SYSTEM_SPEC §7, MONETIZATION_POLICY §4).

제공 방식: **직접 구매형** 또는 **행동 보상 unlock**.

### 허용 (Allowed)
- 오늘 체크인 완료 후 간식 1개 unlock
- 위기 버튼 완료 후 따뜻한 음료/간식 unlock (위기 사용 = 성취로 인정, 깎지 않음 — UX_RULES §6)
- 회복 루프 완료 후 공간 조명 회복

### 금지 (Forbidden)
- 돈으로 스트릭 복구 / 실패 삭제 / 차단 해제 (MONETIZATION_POLICY §10)
- 확률형 간식 뽑기 (MONETIZATION_POLICY §5)
- 펫 능력치 상승 (능력치 개념 자체가 없음)

> 보상 수령 화면에 "한 번 더 뽑기"·과금 압박 금지(COPY_POLICY §11, CHARACTER_SYSTEM_SPEC §7).

---

## 9. 수익화 정책 (Monetization policy)

MONETIZATION_POLICY §4·§5·§6·§10 + handoff §7 상속. 유료 코스메틱은 **P2, 검증 후, 비랜덤·비능력만**.

### 허용 (Allowed — 직접 구매형·성과 무관·비랜덤)
- 직접 구매형 스킨 (예: Ember Cat Skin Pack)
- 눈 색 / 털 색 프리셋
- 방 테마 (Quiet Room / Night Desk / Rain Window Theme)
- 조명 효과
- 집중 사운드 (Focus Bell Sound)
- 계절 한정 쿠션/담요 (비랜덤 시즌 단품)
- Companion Quote Pack

### 금지 (Forbidden)
- 확률형 뽑기
- pay-to-win
- 회복/절제 성과에 영향을 주는 아이템
- 실패를 돈으로 지우는 상품
- 차단을 돈으로 우회하는 상품

---

## 10. MVP 범위 (MVP scope)

MVP에서는 너무 많이 만들지 않는다. 권장:

| 모듈 | MVP 범위 |
|---|---|
| 종류 | 고양이만 |
| 기본 고양이 | **4종** (아래) |
| 눈 색 | 3종 (예: 앰버 / 다크 브라운 / 헤이즐) |
| 이름 | 설정 가능 |
| 기본 상태 | 3종 — 기본 / 만족 / 쉬는 중 |
| 방 | 기본 방 1개 |
| 방 테마 | 2개 |
| 장식 아이템 | 5개 |
| 간식 | 3개 |

### 기본 고양이 4종
1. 흰색 암컷 고양이
2. 검은색 수컷 고양이
3. 회색 안경 고양이 ("영리한 조언자" 성격 매칭 후보)
4. 갈색 loaf 암컷 고양이

> MVP는 검증용 최소 세트. P1에서 눈 색·상태·테마·장식 확장, P1+에서 강아지·진화 단계.

---

## 11. 에셋 생산 전략 (Asset production strategy)

- 모든 조합을 완성 이미지로 만들지 않는다. **모듈형 구조**로 만든다.
- 먼저 **기준 캐릭터 원형을 확정**한다. 그다음 옵션 시트와 상태 시트를 만든다.

### 단계 (Sheets, 순서)
1. **Character base sheet** — 기준 고양이 원형(같은 각도·조명·비율). 자세 4종(§4-G) 포함.
2. **Color/eye variation sheet** — 털 색 6 + 눈 색 5 변주를 동일 포즈로 비교.
3. **State expression sheet** — 허용 상태(§5)만. 금지 상태 미생성.
4. **Room/background sheet** — 방 테마 5 + 분위기 요소.
5. **Decoration/item sheet** — 가구·장식·간식 아이템.
6. **App screen integration** — Home/Urge/Blocking 화면 내 펫 배치(CLAUDE_DESIGN_PATTERN_BRIEF §6 보조 위치).

> 2D/3D 최종 파이프라인, 단일 완성 이미지 vs layered asset은 Open decision(§14). MVP는 layered/모듈형 권장(조합 폭발 방지).

---

## 12. 이미지-생성 브리프 방향 (GPT Image / image-generation brief direction)

- 이미지 생성 전 **반드시 §4 옵션 구조를 기준**으로 생성한다.
- 무작정 예쁜 이미지 1장을 뽑지 말고, **같은 각도·같은 조명·같은 비율의 비교 시트**를 만든다(§11).
- 캐릭터는 **cute but refined.** 큰 눈은 허용하되 **anime/chibi/sticker 금지**(CHARACTER_SYSTEM_SPEC §13: 큰 눈/볼터치/과한 표정 금지와 정합 — "허용하는 큰 눈"은 절제된 또렷함이지 chibi 과장이 아니다).
- NoF의 **Ink & Ember 세계관 유지**: 검은 잉크 실루엣 + 앰버 포인트는 눈·꼬리 끝·숨결·주변 잔불에만 소량(면 아닌 점).
- 금지(상속): 동글동글 펫게임화, 빨강·공포·하강, 우는/죽은/병든 상태, OPAL gem 형태·색 복제(구조만 참고).

---

## 13. 검수 체크리스트 (Review checklist)

- [ ] 펫이 유치한 게임 캐릭터처럼 보이지 않는가? (펫게임화·chibi·sticker 0)
- [ ] 남성 유저가 부담 없이 선택할 수 있는가? (과한 귀여움·핑크 일색 아님)
- [ ] 실패했을 때 죄책감을 과도하게 유발하지 않는가? (`taking_a_break`이 회복 동선인가)
- [ ] 보상 잠금이 처벌처럼 보이지 않는가? (unlock 보류 ≠ 강등·피해)
- [ ] 가챠/중독형 루프처럼 보이지 않는가? (확률형 0, 과금 압박 0)
- [ ] Ink & Ember 톤과 맞는가? (잉크 실루엣 + 앰버 소량)
- [ ] 앱의 민감한 주제를 가볍게 희화화하지 않는가?
- [ ] 강등 없음·펫 피해 없음·pay-to-win 없음이 전 모듈에서 지켜지는가?
- [ ] 자유 입력 이름·꾸미기 데이터가 기본 비공개인가(UX_RULES §10)?

---

## 13.5 P0 프로토타입 펫 자산 계약 (P0 prototype pet asset contract)

P0 프로토타입의 시각 품질에 대한 명시적 계약. 이 절은 자산 누수·우발적 커밋·UX 잡음을 방지한다.

- **현재 펫 그림은 SVG placeholder다.** `src/components/EmberCat.jsx`의 `CatSilhouette()`이 그것이며, 최종 시각이 아니다. 최종 시각 품질은 **사람 승인을 받은 압축 이미지 자산**(WebP)이 도착해야 결정된다.
- **EmberCat은 자산 계약(asset contract)을 구현한다.** `imageSrc` prop을 받으면 해당 이미지를 `object-fit: contain` + `object-position: bottom center`로 렌더링하고, 없으면 SVG placeholder로 자동 폴백한다. 즉, 진짜 이미지가 들어와도 **화면 코드를 수정하지 않아도 된다.**
- **이미지 자산은 이번 라운드에서 커밋하지 않는다.** `.gitignore`가 `*.webp`/`*.png`/`*.jpg`/`*.jpeg`/`*.gif`를 차단한다. 향후 자산은 별도 **자산 승인 단계**에서 의도적으로 추가한다(우발적 커밋 금지).
- **예상 자산 경로 (승인 후 도입):**
  - `/assets/pets/white_kitten_main.webp`
  - `/assets/pets/black_guardian.webp`
  - `/assets/pets/gray_mentor.webp`
  - `/assets/pets/brown_loaf.webp`
  - `/assets/rooms/ember_room_empty.webp`
  - `/assets/rooms/ember_room_with_kitten.webp`
- **placeholder 가드레일:** SVG placeholder가 보기 흉할 경우 펫 스테이지 비율·SVG 폭·opacity를 낮춰 시각적 지배를 줄인다. placeholder가 최종처럼 평가되지 않도록 한다(§13 검수 체크리스트 상속).
- **승인 흐름:** §11의 character base sheet → variation sheet → state sheet 단계를 따른다. 임시 ChatGPT/Midjourney 출력만으로 자산을 정식 도입하지 않는다.

이 계약 덕분에 진짜 자산이 도착해도 `EmberCat`을 사용하는 모든 화면(Home, Recovery, Reward 등)은 코드 수정 없이 자동으로 새 시각을 받는다.

## 14. Open decisions (사람 확정 필요)

1. 고양이만 MVP로 갈지, **강아지도 초기에 열지.**
2. **성별 옵션을 명시할지, 성격 타입(§4-F)으로 대체할지.**
3. **간식 보상 빈도** (일 1회 / 행동당 / 상한).
4. **방 꾸미기 유료/무료 경계** (어디까지 행동 unlock, 어디부터 P2 코스메틱).
5. 캐릭터 이미지 생성 방식: **단일 완성 이미지 vs layered asset.**
6. **2D/3D 최종 에셋 파이프라인.**

---

## 부록: 다음 추천 이미지-생성 라운드 (Next image-generation round)

MVP §10 범위로 한정. P0 전 옵션을 한 번에 뽑지 않는다.

1. **Character base sheet (1순위)** — 기본 고양이 4종(§10)을 같은 각도·조명·비율로. 자세 sitting/loaf 우선.
2. **State expression sheet (MVP 3상태만)** — 기본 / 만족 / 쉬는 중. 금지 상태 미생성.
3. **Room base + 테마 2개** — 기본 방 + 방 테마 2종, 분위기 요소(잔불 입자·따뜻한 램프).

> 산출물은 방향 검증용. 최종 색·캐릭터·UI 확정은 사람 승인 후(§13 통과 전제).

---

STOP — Pet customization spec complete. Awaiting human review.
