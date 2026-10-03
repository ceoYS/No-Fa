/*
 * protection.js — NoF 실드 "기본 보호" 모드 모델 (P0, RC-16).
 *
 * 이 파일은 사용자가 고르는 보호 모드와, 각 모드가 실제 Chrome 확장에 어떤 상태를 요청하는지를
 * 정한다. 실제 차단은 확장(extensions/chrome-shield)이 로컬 declarativeNetRequest 로 한다 —
 * 여기선 그 요청 모양과 정직한 라벨만 다룬다.
 *
 * HONESTY: 번들 목록은 지금 FIXTURE(테스트 도메인)다. 엔진은 진짜지만, 실제 성인/고위험 도메인
 * 데이터셋은 아직 저장소에 없다(PRODUCTION_ADULT_BLOCKLIST_STATE = NOT_YET_PROVISIONED, 보호 규칙 #5).
 * 그래서 "기본 보호 켜짐"은 참이되, 실제 성인 사이트를 막는다고는 말하지 않는다.
 *
 * PRIVACY: 도메인 매칭은 전부 로컬이다. 방문 기록을 서버로 보내지 않고, 원격 텔레메트리도 없다.
 * 허용목록/차단 도메인은 이 기기 localStorage 와 확장 안에만 있다.
 *
 * 우선순위: 허용목록(allow) > 사용자 차단 > 번들 기본 보호. 사용자가 허용한 도메인은 기본 보호보다 우선.
 */

export const PROTECTION_MODES = ['off', 'default', 'custom'];

export const MODE_LABEL = {
  off: '보호 끔',
  default: '기본 보호',
  custom: '사용자 지정 보호',
};

export const MODE_HELP = {
  off: '차단을 모두 꺼요. 잠깐 멈춤 같은 다른 도움은 그대로 쓸 수 있어요.',
  default: '앱이 준비한 기본 보호 목록을 이 Chrome에서 켜요.',
  custom: '기본 보호 목록에, 내가 직접 확인한 차단 도메인을 더해요.',
};

// 번들 목록 종류를 정직하게 부른다. fixture 는 실제 성인 사이트가 아니라 테스트 도메인이다.
export const LISTTYPE_LABEL = {
  fixture: '테스트 목록',
  production: '기본 보호 목록',
};

// 실제 성인/고위험 도메인 데이터셋 상태. 프로덕션 목록이 들어오기 전까지는 이 값이 참이며,
// UI 는 "실제 성인 사이트를 막는다"고 주장하지 않는다.
export const PRODUCTION_ADULT_BLOCKLIST_STATE = 'NOT_YET_PROVISIONED';

export const PRODUCTION_NOT_PROVISIONED_NOTE =
  '실제 성인·고위험 사이트 차단 목록은 아직 제공 전이에요. 지금 목록은 엔진을 확인하기 위한 테스트 도메인이라, 실제 성인 사이트를 막는다고는 말하지 않아요.';

export const PRIVACY_NOTE =
  '차단 판단은 전부 이 기기 Chrome 안에서만 해요. 무엇을 봤는지 서버로 보내지 않아요.';

// ── RC-17 P0-C — 정직한 번들 보호 라벨 ────────────────────────────────────────
// "기본 유해사이트 보호 켜짐" 이라는 프로덕션 주장은, 실제 확장이 (listType==='production' &&
// defaultProtection===true && 용량 OK) 을 확인해 줄 때만 허용한다. 그 전에는 "테스트 목록" 또는
// "실제 보호 목록 준비 필요" 로만 말한다. 절대 "모든 음란사이트 차단" 같은 전수 주장을 하지 않는다 —
// 어떤 차단 목록도 놓침(미탐)과 오탐이 있기 때문이다.
export const PRODUCTION_PROTECTION_ON_LABEL = '기본 유해사이트 보호 켜짐';
export const PRODUCTION_PROTECTION_BASIS_NOTE =
  '알려진 유해사이트 목록을 기준으로 차단해요. 목록이라 놓치거나(미탐) 잘못 막을(오탐) 수 있어요.';
export const FIXTURE_PROTECTION_ON_LABEL = '기본 보호 테스트 목록';
export const PRODUCTION_LIST_NOT_READY_LABEL = '실제 보호 목록 준비 필요';
export const CAPACITY_INSUFFICIENT_NOTE =
  '이 브라우저가 담을 수 있는 차단 규칙 한도를 넘어, 기본 유해사이트 보호를 켜지 못했어요. 목록을 줄이거나 나눠서 다시 시도해요.';

// bundledStatusView — REAL GET_STATUS 사실만으로 정직한 표시 상태를 만든다. 프로덕션 보호 주장은
// 실제 상태가 확인될 때만 나온다(추측 금지). 순수 함수라 테스트로 고정한다.
//   disconnected           : 확장 미연결(사실 없음)
//   capacity_insufficient  : 켜달라 했지만 Chrome 용량 초과로 못 켬(fail closed)
//   off                    : 번들 보호 꺼짐
//   fixture_on             : 켜짐이지만 테스트 목록(실제 성인 사이트 차단 주장 금지)
//   production_on          : 프로덕션 목록이 실제로 켜져 있음 → 유일하게 "기본 유해사이트 보호 켜짐"
export function bundledStatusView(status) {
  if (!status || status.ok !== true) return { state: 'disconnected', protecting: false };
  if (status.bundled && status.bundled.capacity === 'INSUFFICIENT') {
    return { state: 'capacity_insufficient', headline: PRODUCTION_LIST_NOT_READY_LABEL, note: CAPACITY_INSUFFICIENT_NOTE, protecting: false };
  }
  if (!status.defaultProtection) return { state: 'off', protecting: false };
  if (status.bundled && status.bundled.listType === 'production') {
    return { state: 'production_on', headline: PRODUCTION_PROTECTION_ON_LABEL, note: PRODUCTION_PROTECTION_BASIS_NOTE, protecting: true };
  }
  return { state: 'fixture_on', headline: FIXTURE_PROTECTION_ON_LABEL, note: PRODUCTION_NOT_PROVISIONED_NOTE, protecting: true };
}

// 앱 입력용 도메인 검사 — 사용자가 허용목록/차단에 넣을 값을 보내기 전에 걸러낸다. URL·스킴·공백·
// 경로는 도메인이 아니다. 확장 쪽 normalizeDomains 와 같은 규칙(스킴/경로/앞점 제거)을 거울처럼 둔다.
const UNSAFE_SCHEME = /^(?:javascript|data|vbscript|file|blob|chrome|chrome-extension):/i;

export function normalizeDomainInput(raw) {
  let d = String(raw || '').trim().toLowerCase();
  if (!d || UNSAFE_SCHEME.test(d)) return '';
  d = d.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^\.+/, '');
  return d;
}

// 도메인처럼 보이는가 — 점 하나 이상, 라벨은 영숫자/하이픈, 공백 없음. 너무 엄격하지 않게(국제화
// 도메인은 사용자가 퓨니코드로 넣는다고 가정) 최소한만 검사한다.
export function isLikelyDomain(raw) {
  const d = normalizeDomainInput(raw);
  if (!d || d.length > 200) return false;
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(d);
}

// 모드 → 확장에 요청할 보호 상태. 이 한 함수가 "모드가 뭘 켜는지"의 단일 진실이다.
//   off    : 전부 끔 (번들 끔, 사용자 차단 비움, 허용목록 비움)
//   default: 번들 켬, 사용자 차단 없음, 허용목록 적용
//   custom : 번들 켬, 사용자 차단 적용, 허용목록 적용
// 허용목록은 항상 마지막에 우선한다(allow > block).
export function desiredProtectionState(mode, { userBlocks = [], allowlist = [] } = {}) {
  const blocks = (userBlocks || []).map(normalizeDomainInput).filter(Boolean);
  const allows = (allowlist || []).map(normalizeDomainInput).filter(Boolean);
  switch (mode) {
    case 'default':
      return { defaultProtection: true, userBlocks: [], allowlist: allows };
    case 'custom':
      return { defaultProtection: true, userBlocks: blocks, allowlist: allows };
    case 'off':
    default:
      return { defaultProtection: false, userBlocks: [], allowlist: [] };
  }
}

// 실제 확장 상태(GET_STATUS 사실들)에서 사용자에게 보일 모드를 되읽는다. 저장된 선호와 실제 상태가
// 어긋날 수 있으니(다른 기기·재설치), 표시는 언제나 실제 상태에서 파생한다.
export function deriveModeFromStatus(status) {
  if (!status || !status.ok) return 'off';
  if (!status.defaultProtection) return 'off';
  return (status.userBlockCount || 0) > 0 ? 'custom' : 'default';
}

// ── runnable self-check (node scripts/../constants/protection.js 로 직접 실행 시) ──
if (typeof process !== 'undefined' && Array.isArray(process.argv) && import.meta.url === `file://${process.argv[1]}`) {
  const assert = (c, m) => {
    if (!c) throw new Error(m);
  };
  assert(desiredProtectionState('off').defaultProtection === false, 'off must disable bundled');
  assert(desiredProtectionState('default').defaultProtection === true, 'default must enable bundled');
  assert(desiredProtectionState('default', { userBlocks: ['a.com'] }).userBlocks.length === 0, 'default carries no user blocks');
  assert(desiredProtectionState('custom', { userBlocks: ['a.com'] }).userBlocks[0] === 'a.com', 'custom keeps user blocks');
  assert(desiredProtectionState('custom', { allowlist: ['https://b.com/x'] }).allowlist[0] === 'b.com', 'allowlist normalized to host');
  assert(isLikelyDomain('example.com') && isLikelyDomain('www.a.co.kr'), 'plain domains accepted');
  assert(!isLikelyDomain('not a domain') && !isLikelyDomain('javascript:alert(1)') && !isLikelyDomain('localhost'), 'non-domains rejected');
  assert(deriveModeFromStatus({ ok: true, defaultProtection: true, userBlockCount: 2 }) === 'custom', 'derive custom');
  assert(deriveModeFromStatus({ ok: true, defaultProtection: true, userBlockCount: 0 }) === 'default', 'derive default');
  assert(deriveModeFromStatus({ ok: true, defaultProtection: false }) === 'off', 'derive off');
  // bundledStatusView — production claim ONLY on confirmed production+enabled; never faked.
  assert(bundledStatusView(null).state === 'disconnected', 'no status → disconnected');
  assert(bundledStatusView({ ok: true, defaultProtection: false }).state === 'off', 'not enabled → off');
  const fx = bundledStatusView({ ok: true, defaultProtection: true, bundled: { listType: 'fixture' } });
  assert(fx.state === 'fixture_on' && fx.headline === FIXTURE_PROTECTION_ON_LABEL, 'fixture on → fixture label, not production');
  const pr = bundledStatusView({ ok: true, defaultProtection: true, bundled: { listType: 'production', capacity: 'OK' } });
  assert(pr.state === 'production_on' && pr.headline === PRODUCTION_PROTECTION_ON_LABEL && pr.protecting === true, 'production+enabled → production label');
  const cap = bundledStatusView({ ok: true, defaultProtection: false, bundled: { listType: 'production', capacity: 'INSUFFICIENT' } });
  assert(cap.state === 'capacity_insufficient' && cap.protecting === false, 'capacity insufficient → fail-closed, not protecting');
  // A production listType that is NOT actually enabled must NOT claim production protection.
  assert(bundledStatusView({ ok: true, defaultProtection: false, bundled: { listType: 'production' } }).state === 'off', 'production list but disabled → off, no claim');
  assert(!PRODUCTION_PROTECTION_BASIS_NOTE.includes('모든'), 'basis note must never make a "모든 …" total-coverage claim');
  console.log('protection.js self-check OK');
}
