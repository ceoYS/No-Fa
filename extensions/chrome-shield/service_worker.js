import { TEST_SIGNAL, buildDynamicRules } from './signals.js';

/*
 * service_worker.js — NoF 실드 Chrome 차단 PoC 서비스 워커 (Manifest V3, 로컬 전용).
 *
 * 항상 켜진 데모 차단은 정적 룰셋(rules.json)에 있다: 최상위 내비게이션의 주소/검색어에
 * 무해한 테스트 토큰(nof-test-risk-signal)이 들어가면 앱 내 멈춤 페이지(blocked.html)로
 * redirect 한다. 이 워커는 *향후 앱 동기화* 경로를 담당한다 — 위험 신호 목록을 받아
 * declarativeNetRequest 동적 룰을 다시 만든다. 프로토타입에선 비어 있고, 나중에 NoF
 * 앱이 runtime 메시지로 자신의 신호를 보낸다(README "앱 신호 동기화" 참고).
 *
 * 네트워크·원격 코드·외부 API 없음. 모든 동작은 로컬이다.
 */

async function applySignals(signals) {
  const addRules = buildDynamicRules(signals);
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existing.map((r) => r.id);
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules });
  return addRules.length;
}

chrome.runtime.onInstalled.addListener(async () => {
  // 동적 룰은 비운 상태로 시작한다. 데모 차단은 정적 룰(rules.json id 1)이 담당한다.
  try {
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    if (existing.length) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existing.map((r) => r.id),
      });
    }
    console.log('[NoF Shield] 프로토타입 준비 완료 — 정적 테스트 신호 동작 중:', TEST_SIGNAL);
  } catch (e) {
    console.warn('[NoF Shield] 초기화 실패', e);
  }
});

// 향후 NoF 앱 → 확장 동기화 훅. 앱(또는 브리지)이 위험 신호를 보내면, 우리는 로컬에서
// 동적 redirect 룰을 다시 만든다. 기기 밖으로 나가는 데이터는 없다.
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === 'nof:set-signals' && Array.isArray(msg.signals)) {
    applySignals(msg.signals)
      .then((count) => sendResponse({ ok: true, count }))
      .catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true; // 비동기 응답 유지
  }
  if (msg && msg.type === 'nof:test-signal') {
    sendResponse({ testSignal: TEST_SIGNAL });
  }
  return false;
});
