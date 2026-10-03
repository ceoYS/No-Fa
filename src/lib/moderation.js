/*
 * moderation.js — community safety hooks (founder §5). Because NoF is a self-control product, the
 * community must NOT become sexual-content discovery. These are the boundary interfaces the data
 * contract requires: moderateText / reportContent / blockUser / rateLimitPost.
 *
 * HONESTY: real AI/content moderation is a SERVICE that is NOT configured (aiModeration:
 * 'NOT_CONFIGURED'). We do NOT claim AI moderation is running. What runs now is STRUCTURAL, local,
 * and real: length caps, link/contact-info rejection, and client-side rate limiting. Since posting
 * itself needs a backend (socialClient.postShout → not_connected) AND content moderation needs a
 * service, both are gated together — no un-moderated content can be published, and the UI says so.
 *
 * reportContent / blockUser delegate to socialClient: the block is real and local; the network
 * report is not-connected until a backend exists.
 */
import { validateShoutText, containsLink, SHOUT_RATE_LIMIT_MS } from '../constants/social.js';
import { blockUser as clientBlock, reportContent as clientReport } from './socialClient.js';
import { moderateRemote, isSupabaseConfigured } from './supabaseClient.js';

// Contact-info patterns we reject structurally (doxxing / off-platform contact). No explicit-content
// vocabulary is hard-coded in the repo (that judgement is the AI service's job, NOT_CONFIGURED).
const PHONE_RE = /(\+?\d[\d\s-]{7,}\d)/; // loose phone-number shape
const HANDLE_RE = /@[a-z0-9_]{2,}/i; // social handle / off-platform contact

// moderateText — the structural gate. Returns what is real; declares what is not.
export function moderateText(text = '') {
  const reasons = [];
  const v = validateShoutText(text);
  if (!v.ok) reasons.push(v.error); // empty | link_not_allowed | too_long
  if (containsLink(text) && !reasons.includes('link_not_allowed')) reasons.push('link_not_allowed');
  if (PHONE_RE.test(text)) reasons.push('contact_info');
  if (HANDLE_RE.test(text)) reasons.push('contact_info');
  return {
    allowed: reasons.length === 0,
    reasons: [...new Set(reasons)],
    // We do NOT claim AI moderation is running. Content-policy judgement (sexual solicitation,
    // harassment, medical claims) needs a real service that is not configured yet.
    aiModeration: 'NOT_CONFIGURED',
  };
}

// moderateForPublish — the AUTHORITATIVE gate before any PUBLIC publish (founder P2). Structural
// checks run locally first (fast, real); then the server-side OpenAI omni-moderation is consulted and
// is authoritative. If the moderation SERVICE is not configured, this returns
// MODERATION_NOT_CONFIGURED and does NOT allow publishing — un-moderated content never goes public.
export async function moderateForPublish({ type = 'shout', text = '', imageUrl } = {}) {
  const structural = moderateText(text);
  if (text && !structural.allowed) {
    return { allowed: false, reasons: structural.reasons, state: 'STRUCTURAL_REJECTED' };
  }
  if (!isSupabaseConfigured()) {
    return { allowed: false, state: 'MODERATION_NOT_CONFIGURED' };
  }
  const remote = await moderateRemote({ type, text, imageUrl });
  if (!remote || remote.configured === false || remote.state === 'MODERATION_NOT_CONFIGURED') {
    return { allowed: false, state: 'MODERATION_NOT_CONFIGURED' };
  }
  return { allowed: !!remote.allowed, categories: remote.categories || [], state: 'MODERATED' };
}

// The client-observable moderation service state. Real AI moderation runs server-side (edge function
// holding the OpenAI key); the client can only say whether the backend seam is configured at all.
export function moderationServiceState() {
  return isSupabaseConfigured() ? 'REMOTE_AUTHORITATIVE' : 'NOT_CONFIGURED';
}

export function reportContent(args) {
  return clientReport(args); // { ok:false, error:'not_connected', report } until backend exists
}

export function blockUser(profile, blockedId) {
  return clientBlock(profile, blockedId); // REAL + local
}

// rateLimitPost — REAL client-side limiter (server must re-check). ok:false when too soon.
export function rateLimitPost(lastPostAt, now = Date.now()) {
  if (!Number.isFinite(lastPostAt)) return { ok: true, waitMs: 0 };
  const waitMs = SHOUT_RATE_LIMIT_MS - (now - lastPostAt);
  return waitMs > 0 ? { ok: false, waitMs } : { ok: true, waitMs: 0 };
}

export const MODERATION_STATE = 'NOT_CONFIGURED'; // no content-moderation service wired

// ── runnable self-check ──
if (typeof process !== 'undefined' && Array.isArray(process.argv) && import.meta.url === `file://${process.argv[1]}`) {
  const assert = (c, m) => {
    if (!c) throw new Error(m);
  };
  assert(moderateText('오늘 잘 버텼어요').allowed, 'plain text allowed');
  assert(moderateText('연락해 010-1234-5678').reasons.includes('contact_info'), 'phone rejected');
  assert(moderateText('dm me @someone').reasons.includes('contact_info'), 'handle rejected');
  assert(moderateText('여기 www.x.com').reasons.includes('link_not_allowed'), 'link rejected');
  assert(moderateText('오늘 잘 버텼어요').aiModeration === 'NOT_CONFIGURED', 'AI moderation honestly not configured');
  assert(rateLimitPost(Date.now()).ok === false, 'rate limit blocks immediate repost');
  assert(rateLimitPost(Date.now() - SHOUT_RATE_LIMIT_MS - 1).ok === true, 'rate limit clears after window');
  assert(moderationServiceState() === 'NOT_CONFIGURED', 'moderation service honestly not configured without backend');
  moderateForPublish({ type: 'shout', text: '오늘 잘 버텼어요' }).then((r) => {
    // No backend → server moderation not configured → NOT allowed to publish (never fails open).
    assert(r.allowed === false && r.state === 'MODERATION_NOT_CONFIGURED', 'unconfigured moderation must block publish');
    return moderateForPublish({ type: 'shout', text: '연락 010-1234-5678' });
  }).then((r2) => {
    assert(r2.allowed === false && r2.state === 'STRUCTURAL_REJECTED', 'structural reject short-circuits before server');
    console.log('moderation.js self-check OK');
  });
}
