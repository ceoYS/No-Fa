/*
 * social.js — the ONE social domain model shared by League, 광장(shout), and 영감(inspiration).
 * (P1 foundation.) There is deliberately NOT three separate systems: all three ride this model and,
 * later, the same socialClient adapter (src/lib/socialClient.js).
 *
 * PUBLIC vs PRIVATE identity (founder §7): the public/network identity here is ANONYMOUS and fully
 * separate from the private local diary identity. No real name, ever. A public object never carries
 * a counter name, a streak length, local ids, or private metadata — public copies are built by
 * whitelist, never by stripping a private record.
 *
 * HONESTY: this file is data + pure helpers only. It performs NO network call and fabricates NO
 * users, posts, rankings, or shares. When no backend is configured the adapter returns empty +
 * configured:false (see socialClient.js) — the UI then shows an honest "not connected yet" state.
 */

// ── Community constraints (founder §2B) ──────────────────────────────────────
export const SHOUT_MAX_LEN = 100; // short text only
export const SHOUT_TTL_MS = 24 * 60 * 60 * 1000; // messages expire after 24h
export const SHOUT_RATE_LIMIT_MS = 60 * 1000; // ponytail: 1 post / minute client-side; server must re-check
export const REACTION_KINDS = ['ember', 'cheer', 'together']; // no free-form; a small warm set
export const REPORT_REASONS = ['sexual', 'harassment', 'doxxing', 'medical', 'spam', 'other'];

// Safe anonymous alias parts — warm, non-identifying. The user's OWN handle (this is them, not a
// fabricated other user). Never a real name; never sexual; never a contact handle.
const ALIAS_ADJ = ['잔잔한', '고요한', '단단한', '따뜻한', '맑은', '차분한', '꾸준한', '조용한'];
const ALIAS_NOUN = ['오후', '새벽', '걸음', '불씨', '바람', '물결', '언덕', '아침'];

function rid(prefix) {
  // Local, collision-resistant enough for client ids. Not a security token.
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * @typedef {Object} AnonymousProfile
 * @property {string} anonymousUserId  local-generated, opaque; never a real name
 * @property {string} displayAlias     warm two-word handle
 * @property {string} kittenForm       from progression (cosmetic), e.g. 'ember'
 * @property {string} leagueTier       tier id, e.g. 'ember'
 * @property {number} createdAt
 */

export function makeAnonymousProfile({ kittenForm = 'ember', leagueTier = 'ember', seed } = {}) {
  const n = typeof seed === 'number' ? seed : Math.floor(Math.random() * 1e6);
  const alias = `${ALIAS_ADJ[n % ALIAS_ADJ.length]} ${ALIAS_NOUN[(n >> 3) % ALIAS_NOUN.length]}`;
  return {
    anonymousUserId: rid('anon'),
    displayAlias: alias,
    kittenForm,
    leagueTier,
    createdAt: Date.now(),
  };
}

/**
 * @typedef {Object} ShoutMessage
 * @property {string} id
 * @property {string} anonymousUserId
 * @property {string} displayAlias
 * @property {string} text            <= SHOUT_MAX_LEN, no links
 * @property {number} createdAt
 * @property {number} expiresAt       createdAt + SHOUT_TTL_MS
 * @property {Object} reactionCounts  { [kind]: number }
 */

export function makeShout({ profile, text, now = Date.now() }) {
  const clean = normalizeShoutText(text);
  return {
    id: rid('shout'),
    anonymousUserId: profile?.anonymousUserId ?? 'anon',
    displayAlias: profile?.displayAlias ?? '익명',
    text: clean,
    createdAt: now,
    expiresAt: now + SHOUT_TTL_MS,
    reactionCounts: {},
  };
}

export function makeReaction({ messageId, profile, kind }) {
  return {
    messageId,
    anonymousUserId: profile?.anonymousUserId ?? 'anon',
    kind: REACTION_KINDS.includes(kind) ? kind : 'ember',
    createdAt: Date.now(),
  };
}

/**
 * @typedef {Object} FutureDiaryShare  a PUBLIC copy, separate from the private record
 * @property {string} id
 * @property {string} sourcePrivateId  local reference to the private entry (NEVER uploaded)
 * @property {string} displayAlias
 * @property {string} futureSelf       scrubbed prose (may be empty)
 * @property {string} idealDay
 * @property {string} feelingsEnvironment
 * @property {number} createdAt
 * @property {boolean} published       true only once a real backend accepted it
 */

// Build a PUBLIC copy from a private diary entry by WHITELIST (founder §3 scrub rules): only the
// three prose fields survive. The exact counter name, streak length, local id, createdAt timestamp,
// type discriminator, and any other private metadata are dropped by construction — never copied.
export function scrubFutureDiaryForShare(entry = {}, { profile } = {}) {
  return {
    id: rid('share'),
    sourcePrivateId: typeof entry.id === 'string' ? entry.id : null, // kept LOCAL, never sent
    displayAlias: profile?.displayAlias ?? '익명',
    futureSelf: safeProse(entry.futureSelf),
    idealDay: safeProse(entry.idealDay),
    feelingsEnvironment: safeProse(entry.feelingsEnvironment),
    createdAt: Date.now(),
    published: false,
  };
}

export function makeReport({ targetType, targetId, profile, reason }) {
  return {
    id: rid('report'),
    targetType, // 'shout' | 'share'
    targetId,
    reporterId: profile?.anonymousUserId ?? 'anon',
    reason: REPORT_REASONS.includes(reason) ? reason : 'other',
    createdAt: Date.now(),
  };
}

export function makeBlockRelation({ profile, blockedId }) {
  return { blockerId: profile?.anonymousUserId ?? 'anon', blockedId, createdAt: Date.now() };
}

// ── pure validators / helpers ────────────────────────────────────────────────

// A conservative link/contact detector — 광장 forbids links (founder §2B). Real and enforceable
// client-side (the server must re-check). Catches schemes, www., bare domains, and @handles.
const LINK_RE = /(https?:\/\/|www\.|@[a-z0-9_]{2,}|[a-z0-9-]+\.(com|net|org|io|kr|xyz|link|me|gg|tv))/i;

export function containsLink(text = '') {
  return LINK_RE.test(String(text));
}

export function normalizeShoutText(text = '') {
  return String(text).replace(/\s+/g, ' ').trim().slice(0, SHOUT_MAX_LEN);
}

// Returns { ok, error } — enforces the hard constraints (length, no links). Content-policy
// judgement (sexual solicitation / harassment / doxxing / medical) is moderateText()'s job.
export function validateShoutText(text = '') {
  const clean = normalizeShoutText(text);
  if (!clean) return { ok: false, error: 'empty' };
  if (containsLink(text)) return { ok: false, error: 'link_not_allowed' };
  if (String(text).length > SHOUT_MAX_LEN) return { ok: false, error: 'too_long' };
  return { ok: true, text: clean };
}

function safeProse(v) {
  return String(v ?? '').trim();
}

// A public object must never carry private fields. Used by tests/guards to prove the whitelist.
export const PUBLIC_SHARE_ALLOWED_KEYS = [
  'id',
  'sourcePrivateId',
  'displayAlias',
  'futureSelf',
  'idealDay',
  'feelingsEnvironment',
  'createdAt',
  'published',
];

// Fields that must NEVER appear on a public share (private record leakage).
export const PRIVATE_LEAK_KEYS = ['counterName', 'streakDays', 'type', 'createdAtPrivate', 'moodLabel'];

// ── runnable self-check ──
if (typeof process !== 'undefined' && Array.isArray(process.argv) && import.meta.url === `file://${process.argv[1]}`) {
  const assert = (c, m) => {
    if (!c) throw new Error(m);
  };
  const p = makeAnonymousProfile({ seed: 3 });
  assert(p.anonymousUserId.startsWith('anon_') && p.displayAlias.includes(' '), 'profile shape');
  assert(!/\d{3,}/.test(p.displayAlias), 'alias carries no numeric identity');
  const v1 = validateShoutText('오늘 하루 잘 버텼어요');
  assert(v1.ok, 'plain shout ok');
  assert(!validateShoutText('여기 봐 www.example.com').ok, 'link rejected');
  assert(!validateShoutText('  ').ok, 'empty rejected');
  assert(!validateShoutText('x'.repeat(200)).ok, 'over-long raw input rejected by validator');
  assert(normalizeShoutText('x'.repeat(200)).length === SHOUT_MAX_LEN, 'normalize truncates to max');
  const share = scrubFutureDiaryForShare(
    { id: 'future-123', createdAt: 999, type: 'future-diary', futureSelf: '건강한 나', counterName: '금연' },
    { profile: p },
  );
  for (const k of PRIVATE_LEAK_KEYS) assert(!(k in share), `share must not carry private key ${k}`);
  assert(Object.keys(share).every((k) => PUBLIC_SHARE_ALLOWED_KEYS.includes(k)), 'share is whitelist-only');
  assert(share.sourcePrivateId === 'future-123' && share.futureSelf === '건강한 나', 'share keeps prose + local ref');
  const s = makeShout({ profile: p, text: 'x'.repeat(300) });
  assert(s.text.length === SHOUT_MAX_LEN && s.expiresAt - s.createdAt === SHOUT_TTL_MS, 'shout ttl + cap');
  console.log('social.js self-check OK');
}
