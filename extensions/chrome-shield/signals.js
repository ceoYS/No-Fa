/*
 * signals.js — NoF 실드 Chrome PoC의 로컬 위험 신호 모델 (프로토타입 전용).
 *
 * 이 파일은 네트워크를 쓰지 않는다. NoF 앱의 "위험 신호" 개념을 확장 쪽에서 거울처럼
 * 들고 있는 순수 데이터/빌더일 뿐이다. 실제 차단은 declarativeNetRequest(정적 rules.json
 * + 서비스 워커의 동적 룰)가 한다. 여기엔 실제 도메인도, 노골적 표현도 담지 않는다 —
 * 오직 해롭지 않은 테스트 토큰 하나뿐이다.
 *
 * 향후 동기화: NoF 앱이 자신의 추상 위험 신호를, 앱이 관리하는 큐레이션 토큰으로 매핑해
 * chrome.runtime.sendMessage({ type: 'nof:set-signals', signals })로 보내면, 서비스
 * 워커가 buildDynamicRules()로 동적 룰을 다시 만든다. 사용자가 위험한 주소를 직접 찾는
 * 일은 없다.
 */

// 유일하게 막는 무해한 테스트 토큰. 이 문구가 최상위 내비게이션의 주소/검색어에 들어가면
// 멈춤 페이지로 보낸다. 실제 사이트 이름이 아니다.
export const TEST_SIGNAL = 'nof-test-risk-signal';

// 프로토타입 신호 목록 — 테스트 토큰 하나뿐. 팝업/옵션 화면이 "신호가 어떻게 생겼는지"를
// 보여줄 때 쓴다. 실제 도메인·성인 표현은 절대 담지 않는다.
export const PROTOTYPE_SIGNALS = [
  { id: 'sig_test', kind: 'keyword', token: TEST_SIGNAL, label: '테스트 위험 신호' },
];

// 동적 룰 ID는 1000부터 시작한다 — rules.json의 항상 켜진 정적 데모 룰(id 1)과 겹치지
// 않게 하기 위해서다.
export const DYNAMIC_ID_START = 1000;

// 위험 신호 목록을 declarativeNetRequest 동적 룰로 바꾼다. 매칭되는 최상위 내비게이션을
// 앱 내 멈춤 페이지(blocked.html)로 redirect 한다. 순수 함수 — 스스로는 아무것도 열지
// 않는다. 토큰이 비어 있는 신호는 건너뛴다.
export function buildDynamicRules(signals = []) {
  return signals
    .filter((s) => s && typeof s.token === 'string' && s.token.trim().length > 0)
    .map((s, i) => ({
      id: DYNAMIC_ID_START + i,
      priority: 1,
      action: { type: 'redirect', redirect: { extensionPath: '/blocked.html' } },
      condition: {
        urlFilter: s.token.trim(),
        resourceTypes: ['main_frame'],
        isUrlFilterCaseSensitive: false,
      },
    }));
}
