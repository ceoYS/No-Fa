/*
 * shield.js — NoF 실드 "위험 신호 계획"(Risk-signal Planner) 데이터 모델 (P0.5).
 *
 * SAFETY NOTE: 사용자에게 위험한 사이트 주소를 찾아 적게 하지 않는다. 자극적인 사이트를
 * 직접 검색해 링크를 복붙하는 행위 자체가 재발 트리거가 되기 때문이다. 그래서 이 모델은
 * 도메인/URL/주소 개념을 다루지 않는다. 대신 추상적인 "위험 신호"만 다룬다:
 *   category    — 멀리 둘 자극 콘텐츠 종류
 *   keyword     — 미끄러지기 쉬운 검색 신호(실제 검색어가 아니라 신호 라벨)
 *   appCategory — 늦추고 싶은 앱·SNS 종류
 *   situation   — 위험해지는 상황·시간
 *
 * HONESTY NOTE: 이 목록은 아직 아무것도 차단하지 않는다. 사용자가 "나중에 멀리 둘 신호"를
 * 미리 정해두는 계획 데이터일 뿐이다. 실제 차단 엔진(P1)이 준비되면 이 카테고리/키워드
 * 신호를, 앱이 관리하는 큐레이션 차단 팩으로 매핑한다(사용자가 도메인을 찾는 게 아니다).
 * 시드는 비어 있고, 제안은 추상 라벨만 — 실제 도메인·노골적 표현은 코드에 담지 않는다.
 * 회귀 가드 #30이 이 불변식을 정적으로 검증한다.
 */

export const BLOCK_KINDS = ['category', 'keyword', 'appCategory', 'situation'];

export const KIND_LABEL = {
  category: '카테고리',
  keyword: '검색 신호',
  appCategory: '앱·SNS',
  situation: '상황',
};

export const KIND_HELP = {
  category: '멀리 두고 싶은 자극 콘텐츠 종류를 골라요.',
  keyword: '미끄러지기 쉬운 검색 신호를 적어요. 실제 검색어가 아니라 신호만요.',
  appCategory: '늦추고 싶은 앱·SNS 종류를 골라요.',
  situation: '위험해지는 상황이나 시간을 적어요.',
};

// 추상 신호 제안 — 실제 사이트·검색어가 아니라 "어떤 신호를 멀리 둘지" 라벨이다. 사용자가
// 탭하면 그 라벨이 계획 목록에 들어간다. 직접 입력도 가능. 노골적 표현·실제 주소는 절대
// 시드에 담지 않는다.
export const TEMPLATE_SUGGESTIONS = {
  category: ['자극 콘텐츠', '도박', '이미지 피드'],
  keyword: ['검색 유혹', '자극 검색 신호'],
  appCategory: ['숏폼', '익명 커뮤니티', '늦은 밤 SNS'],
  situation: ['혼자 있는 시간', '잠들기 전'],
};

// 시드는 비어 있다 — 어떤 항목도 기본 제공하지 않는다(사용자가 직접 정한다).
export const DEFAULT_BLOCKLIST = [];

let seq = 0;

// 계획 신호 하나를 만든다(상태는 건드리지 않는 순수 팩토리). 라벨이 비면 null.
export function makeBlockEntry({ kind, label, counterId = null } = {}) {
  const k = BLOCK_KINDS.includes(kind) ? kind : 'category';
  const text = (label ?? '').trim();
  if (!text) return null;
  seq += 1;
  return { id: `sig_${Date.now()}_${seq}`, kind: k, label: text, counterId: counterId ?? null };
}

export function summarizeBlocklist(list = []) {
  const byKind = { category: 0, keyword: 0, appCategory: 0, situation: 0 };
  for (const e of list) if (byKind[e.kind] != null) byKind[e.kind] += 1;
  return { total: list.length, byKind };
}

export function entriesForCounter(list = [], counterId = null) {
  return list.filter((e) => e.counterId === counterId);
}
