# NoF 실드 — Chrome 차단 프로토타입 (chrome-shield)

> Status: **P1.0 PoC, 로컬 전용**. Manifest V3 · `declarativeNetRequest`.
> 이 프로토타입은 Chrome 데스크톱 전용이며, iOS·Android·SNS·이미지 모자이크 차단이 아니다.

NoF 실드의 "실제로 동작하는 첫 차단"을 가장 낮은 리스크로 보여 주는 Chrome 확장
프로토타입이다. **해롭지 않은 테스트 신호 하나(`nof-test-risk-signal`)** 만 막아,
"막힘 → 잠깐 멈춤" 흐름이 진짜 브라우저 탐색에서도 도는지 검증한다. 실제 성인 사이트
목록이나 검색어는 담지 않는다.

---

## 무엇을 하나

- 최상위 내비게이션(주소창 이동·검색)의 URL/검색어에 `nof-test-risk-signal` 이 들어가면,
  그 페이지를 열지 않고 **앱 내 멈춤 페이지(`blocked.html`)로 redirect** 한다.
- 멈춤 페이지는 **어디로 가려 했는지 보여주지 않고**, 그 자리에서 5분 멈춤 타이머를 돌린다
  ("잠깐 멈춤으로 가기").
- 그 외 주소는 **그대로 통과**한다(아무것도 막지 않는다).

## 무엇을 하지 않나

- 실제 성인 사이트/검색어를 막지 않는다 — 막는 건 무해한 테스트 토큰 한 개뿐이다.
- 모바일(iOS·Android), 타사 SNS 앱, 이미지 모자이크는 **하지 않는다**(P2/P3 영역).
- 네트워크 요청, 원격 코드(CDN), 외부 API가 **없다**. 방문 기록을 어디로도 보내지 않는다.
- 사용자에게 위험한 주소를 직접 찾거나 붙여넣게 하지 않는다.

---

## 설치 (개발자 모드)

1. Chrome에서 `chrome://extensions` 를 연다.
2. 우측 상단 **개발자 모드**를 켠다.
3. **압축해제된 확장 프로그램을 로드** → 이 폴더(`extensions/chrome-shield`)를 고른다.

> **회사·조직 관리 브라우저 주의:** 로드할 때 `Extension installation is blocked by policy`
> 가 뜨면, 회사/조직의 브라우저 정책이 *압축해제된 확장 로드*를 막은 것이다 — NoF 코드
> 결함이 아니다. 정책을 우회하지 말고, 허용된 개인 PC 또는 비관리 브라우저에서만 테스트한다.
> 그런 환경이 없으면 이 PC에서는 실제 차단 테스트를 완료할 수 없다(앱·확장 코드와는 무관).

## 테스트

**막히는 경우 (테스트 신호 닿음)**
- 주소창에 `example.com/?q=nof-test-risk-signal` 처럼 테스트 토큰이 든 주소를 입력하거나,
  검색창에 `nof-test-risk-signal` 을 검색한다.
- → 대상이 열리지 않고 NoF "잠깐 멈춤" 페이지로 이어진다. "잠깐 멈춤으로 가기"로 5분
  타이머가 시작된다.

**통과하는 경우 (안 닿음)**
- `example.com` 같은 평범한 주소로 이동한다.
- → 차단 없이 그대로 열린다.

> 대소문자는 무시한다(`NOF-TEST-RISK-SIGNAL` 도 막힌다). main_frame(탭 이동)만 대상이며,
> 페이지 안의 하위 리소스는 건드리지 않는다.

---

## 파일 구성

| 파일 | 역할 |
|------|------|
| `manifest.json` | MV3 매니페스트. `declarativeNetRequest` 권한 + 정적 룰셋 등록, 모듈 서비스 워커. |
| `rules.json` | 정적 룰: 테스트 토큰 → `blocked.html` 로 redirect (main_frame, 대소문자 무시). |
| `signals.js` | 로컬 위험 신호 모델 + `buildDynamicRules()`(신호 → 동적 룰). 무해한 테스트 토큰만. |
| `service_worker.js` | 동적 룰 동기화 경로(`updateDynamicRules`) + 앱 메시지 수신 훅. |
| `blocked.html` / `blocked.js` | NoF 멈춤 페이지. 대상 비표시, 로컬 5분 타이머. |
| `popup.html` / `popup.js` | 상태·테스트 신호 표시, 설정 열기. |
| `options.html` / `options.js` | 신호 목록 보기 + 앱 동기화 설계 설명. |

---

## 앱 신호 동기화 (다음 단계 설계)

지금은 정적 룰(`rules.json`, id 1)이 테스트 토큰 하나를 막는 **항상 켜진 데모**다. 동적 룰은
비어 있다(id ≥ 1000 예약). 향후 NoF 앱과 이렇게 잇는다:

1. NoF 앱이 사용자의 **추상 위험 신호**(카테고리 · 검색 신호 · 앱·SNS · 상황)를 가진다.
2. 앱이 그 신호를 **앱이 관리·갱신하는 큐레이션 토큰**으로 매핑한다. (사용자가 위험한
   주소를 직접 찾지 않는다 — 그 검색 자체가 재발 트리거이기 때문이다.)
3. 앱(또는 브리지)이 확장에 메시지를 보낸다:
   `chrome.runtime.sendMessage(EXT_ID, { type: 'nof:set-signals', signals })`.
4. `service_worker.js` 가 `buildDynamicRules()` 로 동적 룰을 만들어
   `chrome.declarativeNetRequest.updateDynamicRules()` 로 적용한다. 모든 처리는 로컬이다.

---

## 프라이버시 · 한계

- **온디바이스 전용**: 방문 내용·신호를 서버로 보내지 않는다.
- **마찰이지 벽이 아니다**: 시크릿 창·다른 브라우저·확장 끄기로 우회할 수 있다. 정직하게
  고지한다.
- **Chrome 데스크톱 한정**: 기기 전역(OS) 차단은 P2, SNS 이미지 모자이크는 P3 연구 영역이다.

자세한 단계 정의는 [`../../docs/NOF_SHIELD_ROADMAP.md`](../../docs/NOF_SHIELD_ROADMAP.md)
의 **P1.0** 절을 본다.
