import { TEST_SIGNAL, buildDynamicRules } from './signals.js';
import { BLOCKLIST_META } from './blocklist-meta.js';

/*
 * service_worker.js — NoF 실드 Chrome 차단 서비스 워커 (Manifest V3, 로컬 전용).
 *
 * 세 겹의 로컬 차단이 있다. 모두 이 기기 Chrome 안에서만 평가되고, 방문 기록은 어디로도
 * 나가지 않는다.
 *
 *  1) 항상 켜진 데모(정적 rules.json id 1): 무해한 테스트 토큰(nof-test-risk-signal)이 든
 *     최상위 이동을 앱 내 멈춤 페이지(blocked.html)로 redirect 한다.
 *  2) 번들 기본 보호 목록(정적 blocklist-rules.json, 매니페스트에 enabled:false 로 등록):
 *     `기본 보호`를 켜면 updateEnabledRulesets 로 이 정적 룰셋을 켠다. 도메인+하위도메인만
 *     정확히 매칭한다(requestDomains — 부분 문자열 아님). 지금은 FIXTURE(테스트 도메인)다.
 *  3) 사용자 규칙(동적): 사용자가 직접 확인한 차단 도메인/토큰, 그리고 허용(allowlist) 도메인.
 *
 * 우선순위(네이티브 declarativeNetRequest): 허용(allow, priority 3) > 사용자 차단(priority 2)
 * > 번들 기본 보호(priority 1). 사용자가 명시적으로 허용한 도메인은 기본 보호보다 항상 우선한다.
 *
 * 네트워크·원격 코드·외부 API·원격 텔레메트리 없음. 모든 동작은 로컬이다.
 */

// ── 동적 룰 ID 구획 ──────────────────────────────────────────────────────────
// 동적 룰 풀을 용도별 ID 범위로 나눠, 각 매니저가 자기 범위만 지우고 다시 깔도록 한다. 이렇게
// 하면 사용자 차단(RC-8 SET_BLOCK_RULES)과 허용목록이 서로의 룰을 덮어쓰지 않는다.
const USER_BLOCK_ID_START = 1000; // signals.js DYNAMIC_ID_START 와 일치 (사용자 차단)
const USER_BLOCK_ID_END = 1999;
const ALLOW_ID = 2000; // 허용목록은 requestDomains 를 담은 단일 allow 룰 하나로 관리
const ALLOW_PRIORITY = 3;
const BUNDLED_RULESET_ID = 'nof_bundled_blocklist';

async function removeDynamicInRange(lo, hi) {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = existing.filter((r) => r.id >= lo && r.id <= hi).map((r) => r.id);
  return removeRuleIds;
}

// 사용자 차단 신호(동적)를 다시 만든다 — USER_BLOCK 범위만 건드린다. 다른 범위(허용목록)는 그대로
// 둔다. buildDynamicRules() 는 id 를 DYNAMIC_ID_START(=USER_BLOCK_ID_START) 부터 매긴다.
async function applySignals(signals) {
  const addRules = buildDynamicRules(signals);
  const removeRuleIds = await removeDynamicInRange(USER_BLOCK_ID_START, USER_BLOCK_ID_END);
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules });
  return addRules.length;
}

chrome.runtime.onInstalled.addListener(async () => {
  // 동적 룰은 비운 상태로 시작한다. 데모 차단은 정적 룰(rules.json id 1)이 담당한다. 번들 기본
  // 보호(blocklist-rules.json)는 매니페스트에서 enabled:false 라, 사용자가 켤 때까지 꺼져 있다.
  try {
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    if (existing.length) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: existing.map((r) => r.id),
      });
    }
    console.log('[NoF Shield] 준비 완료 — 데모 테스트 신호 동작 중:', TEST_SIGNAL, '· 번들 목록', BLOCKLIST_META);
  } catch (e) {
    console.warn('[NoF Shield] 초기화 실패', e);
  }
});

// 향후 NoF 앱 → 확장 동기화 훅(같은-확장 onMessage). 기기 밖으로 나가는 데이터는 없다.
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
// NoF 웹 페이지(externally_connectable 출처)는 onMessageExternal 로만 닿는다. 응답은 모두
// 구조화된 { ok, ... } 형태다. 네트워크·원격 코드 없음.

function manifestInfo() {
  try {
    const m = chrome.runtime.getManifest();
    return { name: m.name, version: m.version };
  } catch (e) {
    return { name: 'NoF Shield', version: '0.0.0' };
  }
}

// 번들 기본 보호 정적 룰셋이 지금 켜져 있는지 — 실제 Chrome 상태에서 읽는다(추측 아님).
async function isBundledEnabled() {
  try {
    const enabled = await chrome.declarativeNetRequest.getEnabledRulesets();
    return enabled.includes(BUNDLED_RULESET_ID);
  } catch {
    return false;
  }
}

// 동적 룰을 범위별로 세어 정직한 상태를 만든다.
async function countDynamic() {
  const rules = await chrome.declarativeNetRequest.getDynamicRules();
  let userBlockCount = 0;
  let allowlistCount = 0;
  for (const r of rules) {
    if (r.id >= USER_BLOCK_ID_START && r.id <= USER_BLOCK_ID_END) userBlockCount += 1;
    else if (r.id === ALLOW_ID) {
      const domains = r.condition && Array.isArray(r.condition.requestDomains) ? r.condition.requestDomains : [];
      allowlistCount = domains.length;
    }
  }
  return { total: rules.length, userBlockCount, allowlistCount };
}

// RC-17 P0-B — 실제 Chrome 정적 룰 여유량. 번들(특히 프로덕션) 룰셋을 켤 수 있는지 추측하지 않고
// chrome.declarativeNetRequest.getAvailableStaticRuleCount() 로 진짜로 물어본다. API 가 없으면(구형
// Chrome) null → 'UNKNOWN' 로 정직하게 둔다(거짓 OK 를 만들지 않는다).
async function availableStaticRuleCount() {
  try {
    const api = chrome.declarativeNetRequest.getAvailableStaticRuleCount;
    if (typeof api === 'function') return await chrome.declarativeNetRequest.getAvailableStaticRuleCount();
  } catch {
    /* fall through — treat as unknown */
  }
  return null;
}

function capacityLabel(available, needed) {
  if (available == null) return 'UNKNOWN';
  return available >= needed ? 'OK' : 'INSUFFICIENT';
}

async function getStatus() {
  const dyn = await countDynamic();
  const defaultProtection = await isBundledEnabled();
  const available = await availableStaticRuleCount();
  const needed = (BLOCKLIST_META && BLOCKLIST_META.ruleCount) || 0;
  // 이미 켜져 있으면 Chrome 이 이미 담고 있는 것이므로 용량은 OK. 꺼져 있을 때만 여유량으로 판정한다.
  const capacity = defaultProtection ? 'OK' : capacityLabel(available, needed);
  return {
    // 사실만 보고한다. 앱이 이 사실들로 모드 라벨(보호 끔/기본/사용자 지정)을 그린다.
    dynamicRuleCount: dyn.total,
    userBlockCount: dyn.userBlockCount,
    allowlistCount: dyn.allowlistCount,
    defaultProtection, // 번들 기본 보호 정적 룰셋이 켜져 있는가
    availableStaticRuleCount: available, // 실제 Chrome 여유량(모르면 null)
    bundled: {
      version: BLOCKLIST_META.version,
      listType: BLOCKLIST_META.listType, // 'fixture' | 'production' — 앱이 정직하게 표시한다
      domainCount: BLOCKLIST_META.domainCount,
      ruleCount: needed,
      capacity, // 'OK' | 'INSUFFICIENT' | 'UNKNOWN' — 프로덕션 목록이 Chrome 용량을 넘으면 INSUFFICIENT
    },
    testSignal: TEST_SIGNAL,
    ...manifestInfo(),
  };
}

async function clearDynamicRules() {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  if (existing.length) {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: existing.map((r) => r.id) });
  }
  return existing.length;
}

// declarativeNetRequest 동적 룰 안전 상한 (RC-8). 사용자 입력을 실제 룰로 바꾸므로 보수적으로:
// 평범한 매칭 토큰이 아닌 건 버리고, 중복을 없애고, 개수를 제한한다.
const MAX_BLOCK_RULES = 20;
const MAX_TOKEN_LEN = 200;
const BLOCKED_SCHEME = /^(javascript|data|vbscript|file|blob|chrome|chrome-extension):/i;

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
    if (!token || BLOCKED_SCHEME.test(token)) continue;
    token = token.replace(/^https?:\/\//, '').replace(/^\/+/, '');
    if (!token || token.length > MAX_TOKEN_LEN) continue;
    if (seen.has(token)) continue;
    seen.add(token);
    const base = s && typeof s === 'object' ? s : {};
    out.push({ ...base, token });
    if (out.length >= MAX_BLOCK_RULES) break;
  }
  return out;
}

// 허용목록/차단 도메인 정규화 — declarativeNetRequest requestDomains 는 호스트만 받는다. 스킴·경로·
// 앞 점을 벗기고 소문자화·중복 제거·개수 제한한다. 위험 스킴은 버린다. 가져올 URL 은 받지 않는다.
function normalizeDomains(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  const out = [];
  for (const raw of input) {
    let d = String((raw && raw.domain) || raw || '').trim().toLowerCase();
    if (!d || BLOCKED_SCHEME.test(d)) continue;
    d = d.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^\.+/, '');
    if (!d || d.length > MAX_TOKEN_LEN) continue;
    if (seen.has(d)) continue;
    seen.add(d);
    out.push(d);
    if (out.length >= MAX_BLOCK_RULES) break;
  }
  return out;
}

// 허용목록(동적, allow) 재구성 — ALLOW 범위만 건드린다. 도메인 배열을 단일 allow 룰 하나에
// requestDomains 로 담아 priority 3 으로 둔다. 그래서 사용자가 허용한 도메인은 번들 기본 보호
// (priority 1)·사용자 차단(priority 2)보다 항상 우선한다(ALLOWLIST > USER BLOCK > BUNDLED).
async function applyAllowlist(domains) {
  const clean = normalizeDomains(domains);
  const removeRuleIds = [ALLOW_ID];
  const addRules = clean.length
    ? [
        {
          id: ALLOW_ID,
          priority: ALLOW_PRIORITY,
          action: { type: 'allow' },
          condition: { requestDomains: clean, resourceTypes: ['main_frame'] },
        },
      ]
    : [];
  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds, addRules });
  return clean.length;
}

// 번들 기본 보호 정적 룰셋을 켜고 끈다. updateEnabledRulesets 는 Chrome 세션을 넘어 유지된다.
// RC-17 P0-B — FAIL CLOSED: 켜기 전에 실제 여유량을 확인하고, updateEnabledRulesets 가 한도 초과로
// 거부하면 확실히 끈 상태로 되돌린다. "부분 보호"를 참이라 우기지 않는다 — 켜졌거나(enabled:true),
// 용량 부족(capacity:'INSUFFICIENT')이거나 둘 중 하나만 정직하게 돌려준다.
async function setBundled(on) {
  if (!on) {
    await chrome.declarativeNetRequest.updateEnabledRulesets({ disableRulesetIds: [BUNDLED_RULESET_ID] });
    return { enabled: false, capacity: 'OK' };
  }
  const needed = (BLOCKLIST_META && BLOCKLIST_META.ruleCount) || 0;
  const available = await availableStaticRuleCount();
  if (available != null && available < needed) {
    // 켜지 않는다 — Chrome 이 담을 수 없는 룰셋을 반만 켜서 보호되는 척하지 않는다.
    await chrome.declarativeNetRequest.updateEnabledRulesets({ disableRulesetIds: [BUNDLED_RULESET_ID] }).catch(() => {});
    return { enabled: false, capacity: 'INSUFFICIENT', needed, available };
  }
  try {
    await chrome.declarativeNetRequest.updateEnabledRulesets({ enableRulesetIds: [BUNDLED_RULESET_ID] });
    return { enabled: true, capacity: available == null ? 'UNKNOWN' : 'OK', needed, available };
  } catch (e) {
    // 한도 초과 등으로 거부되면 확실히 끈다.
    await chrome.declarativeNetRequest.updateEnabledRulesets({ disableRulesetIds: [BUNDLED_RULESET_ID] }).catch(() => {});
    return { enabled: false, capacity: 'INSUFFICIENT', needed, available, error: String((e && e.message) || e) };
  }
}

// RC-16 — 앱이 원하는 보호 상태 전체를 한 번에 보낸다(멱등 조정). SW 가 Chrome 을 그 상태에 맞추고
// 실제 상태를 돌려준다. mode 파생은 앱 몫; 여기선 사실(defaultProtection/allowlist/userBlocks)만 반영.
async function applyProtectionState({ defaultProtection = false, allowlist = [], userBlocks = null }) {
  const enableVerdict = await setBundled(!!defaultProtection);
  await applyAllowlist(Array.isArray(allowlist) ? allowlist : []);
  // userBlocks 가 배열로 오면 사용자 차단 범위를 그 값으로 맞춘다(빈 배열이면 사용자 차단을 비운다).
  // null 이면 사용자 차단은 손대지 않는다(다른 화면의 RC-8 흐름을 존중).
  if (Array.isArray(userBlocks)) {
    await applySignals(normalizeSignals(userBlocks));
  }
  const status = await getStatus();
  // RC-17 P0-B — 앱이 "켜달라고 했는데 실제로 켜졌는지"를 알 수 있게 판정을 함께 돌려준다. capacity
  // 부족이면 status.defaultProtection 은 false 이고 enableVerdict.capacity 는 'INSUFFICIENT' 이다.
  return { ...status, enableRequested: !!defaultProtection, enableVerdict };
}

// RC-7/RC-16 메시지 규약.
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
    case 'SET_ALLOWLIST': {
      const count = await applyAllowlist(msg.domains);
      return { ok: true, allowlistCount: count };
    }
    case 'SET_PROTECTION_STATE': {
      const status = await applyProtectionState(msg || {});
      return { ok: true, ...status };
    }
    case 'CLEAR_RULES': {
      const removed = await clearDynamicRules();
      // 번들 기본 보호도 함께 끈다 — "전부 끔"이 정직하게 전부를 끄도록.
      try {
        await setBundled(false);
      } catch {
        /* ruleset 미등록 등은 무시 — 동적 룰은 이미 지웠다 */
      }
      return { ok: true, removed };
    }
    default:
      return { ok: false, error: 'unknown_message_type' };
  }
}

chrome.runtime.onMessageExternal.addListener((msg, _sender, sendResponse) => {
  handleRc7Message(msg)
    .then((res) => sendResponse(res))
    .catch((e) => sendResponse({ ok: false, error: String((e && e.message) || e) }));
  return true; // 비동기 응답을 위해 채널 유지
});
