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

// ── RC-7 앱 ↔ 확장 브리지 ────────────────────────────────────────────────────
// NoF 웹 페이지(매니페스트 externally_connectable 에 등록된 출처)는 일반 onMessage 로는
// 닿지 못한다 — 외부 페이지는 onMessageExternal 을 거쳐야 한다. 여기서 작고 명시적인
// 메시지 규약을 처리하고, 인앱 흐름과 똑같은 *로컬* declarativeNetRequest 경로를 재사용한다.
// 네트워크·원격 코드 없음. 모든 응답은 구조화된 { ok, ... } 형태다.

function manifestInfo() {
  try {
    const m = chrome.runtime.getManifest();
    return { name: m.name, version: m.version };
  } catch (e) {
    return { name: 'NoF Shield', version: '0.0.0' };
  }
}

async function getStatus() {
  const dynamic = await chrome.declarativeNetRequest.getDynamicRules();
  return { dynamicRuleCount: dynamic.length, testSignal: TEST_SIGNAL, ...manifestInfo() };
}

async function clearDynamicRules() {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  if (existing.length) {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: existing.map((r) => r.id) });
  }
  return existing.length;
}

// declarativeNetRequest 동적 룰 안전 상한 (RC-8). 이 경로는 사용자가 적은 신호를 실제
// redirect 룰로 바꾸므로 보수적으로 다룬다: 평범한 매칭 토큰이 아닌 건 버리고, 중복을
// 없애고, 개수를 제한한다.
const MAX_BLOCK_RULES = 20;
const MAX_TOKEN_LEN = 200;
// redirect 매칭 토큰이 되면 안 되는 위험 스킴 (javascript:/data: 등). 받자마자 버린다.
const BLOCKED_SCHEME = /^(javascript|data|vbscript|file|blob|chrome|chrome-extension):/i;

// 느슨하게 들어온 사용자 입력 신호를 안전한 { token } 형태로 정규화한다 (RC-8). 문자열은
// 토큰으로, 객체는 { token } 또는 { domain } 을 토큰으로 본다. 위험 스킴은 버리고, 평범한
// 스킴(http/https)은 벗겨 호스트만 남긴다. 가져올 URL 은 절대 받지 않는다 — declarativeNetRequest
// 가 쓸 매칭 토큰만 받는다. 소문자화·중복 제거하고, 안전을 위해 개수를 MAX_BLOCK_RULES 로 막는다.
function normalizeSignals(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  const out = [];
  for (const s of input) {
    let raw = '';
    if (typeof s === 'string') raw = s;
    else if (s && typeof s === 'object') {
      raw = typeof s.token === 'string' ? s.token : typeof s.domain === 'string' ? s.domain : '';
    }
    let token = String(raw).trim().toLowerCase();
    if (!token || BLOCKED_SCHEME.test(token)) continue; // 빈 값·위험 스킴 거부
    token = token.replace(/^https?:\/\//, '').replace(/^\/+/, ''); // 평범한 스킴·앞 슬래시 제거
    if (!token || token.length > MAX_TOKEN_LEN) continue;
    if (seen.has(token)) continue; // 중복 제거
    seen.add(token);
    const base = s && typeof s === 'object' ? s : {};
    out.push({ ...base, token });
    if (out.length >= MAX_BLOCK_RULES) break; // 개수 상한
  }
  return out;
}

// RC-7 메시지 규약: PING / GET_STATUS / SET_TEST_SIGNAL / SET_BLOCK_RULES / CLEAR_RULES.
async function handleRc7Message(msg) {
  const type = msg && msg.type;
  switch (type) {
    case 'PING':
      return { ok: true, ...manifestInfo() };
    case 'GET_STATUS':
      return { ok: true, ...(await getStatus()) };
    case 'SET_TEST_SIGNAL': {
      const count = await applySignals([{ id: 'sig_test', token: TEST_SIGNAL }]);
      return { ok: true, count, testSignal: TEST_SIGNAL };
    }
    case 'SET_BLOCK_RULES': {
      const count = await applySignals(normalizeSignals(msg.signals));
      return { ok: true, count };
    }
    case 'CLEAR_RULES': {
      const removed = await clearDynamicRules();
      return { ok: true, removed };
    }
    default:
      return { ok: false, error: 'unknown_message_type' };
  }
}

// 외부 페이지(NoF 앱)는 onMessageExternal 로 닿는다 — onMessage 는 같은 확장 전용이다.
chrome.runtime.onMessageExternal.addListener((msg, _sender, sendResponse) => {
  handleRc7Message(msg)
    .then((res) => sendResponse(res))
    .catch((e) => sendResponse({ ok: false, error: String((e && e.message) || e) }));
  return true; // 비동기 응답을 위해 채널 유지
});
