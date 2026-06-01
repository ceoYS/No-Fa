/*
 * shield.js — NoF 실드 "차단 목록 계획"(Blocklist Planner) 데이터 모델 (P0.5).
 *
 * HONESTY NOTE: 이 목록은 아직 아무것도 차단하지 않는다. 사용자가 "나중에 멀리 둘 것"을
 * 미리 적어두는 계획 데이터일 뿐이다. 실제 차단 엔진(P1: 브라우저 확장 / NoF 안전 브라우저)
 * 이 준비되면 이 목록을 입력으로 쓴다. 그래서:
 *   - 실제 도메인/검색어를 시드로 넣지 않는다(추상 카테고리 라벨만 제안한다).
 *   - 성인 도메인·노골적 표현을 코드에 담지 않는다.
 *   - "차단됨"을 주장하지 않는다 — 화면은 항상 "준비 중"으로 둔다.
 * 회귀 가드 #30이 이 불변식을 정적으로 검증한다.
 */

export const BLOCK_KINDS = ['domain', 'keyword', 'appCategory'];

export const KIND_LABEL = {
  domain: '사이트',
  keyword: '검색어',
  appCategory: '앱·SNS',
};

export const KIND_HELP = {
  domain: '멀리 둘 사이트(주소)를 적어요.',
  keyword: '미끄러지기 쉬운 검색어를 적어요.',
  appCategory: '늦추고 싶은 앱·SNS 종류를 적어요.',
};

// 추상 카테고리 제안 — 실제 도메인/검색어가 아니라 "어떤 종류를 멀리 둘지" 라벨이다.
// 사용자가 탭하면 그 라벨이 계획 목록에 들어간다. 직접 입력도 가능. 노골적 표현·실제
// 주소는 절대 시드에 담지 않는다.
export const TEMPLATE_SUGGESTIONS = {
  domain: ['성인 사이트', '도박 사이트', '자극적인 커뮤니티'],
  keyword: ['자극적인 검색어', '도박 관련 검색어'],
  appCategory: ['숏폼 앱', '익명 채팅 앱', '성인 콘텐츠 앱'],
};

// 시드는 비어 있다 — 어떤 항목도 기본 제공하지 않는다(사용자가 직접 채운다).
export const DEFAULT_BLOCKLIST = [];

let seq = 0;

// 계획 항목 하나를 만든다(상태는 건드리지 않는 순수 팩토리). 라벨이 비면 null.
export function makeBlockEntry({ kind, label, counterId = null } = {}) {
  const k = BLOCK_KINDS.includes(kind) ? kind : 'domain';
  const text = (label ?? '').trim();
  if (!text) return null;
  seq += 1;
  return { id: `blk_${Date.now()}_${seq}`, kind: k, label: text, counterId: counterId ?? null };
}

export function summarizeBlocklist(list = []) {
  const byKind = { domain: 0, keyword: 0, appCategory: 0 };
  for (const e of list) if (byKind[e.kind] != null) byKind[e.kind] += 1;
  return { total: list.length, byKind };
}

export function entriesForCounter(list = [], counterId = null) {
  return list.filter((e) => e.counterId === counterId);
}
