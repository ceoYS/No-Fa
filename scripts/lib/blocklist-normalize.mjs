/*
 * blocklist-normalize.mjs — the ONE shared, pure transform from a raw upstream hosts file to a clean,
 * deterministic domain list. Imported by scripts/fetch-production-blocklist.mjs (network fetch),
 * scripts/build-blocklist.mjs (compile → DNR rules), and the regression checks (fixture QA over the
 * SAME code path). Keeping it in one place means the production path and the tested path are identical.
 *
 * No network, no side effects. A raw hosts file (StevenBlack-style `0.0.0.0 domain` lines, comments,
 * IP prefixes, blank lines) goes in; a sorted, deduped, lowercased, validated array of hostnames
 * comes out. Every stripping rule the founder listed (comments / IP prefixes / paths / schemes /
 * duplicates / invalid hostnames, lowercase) lives here and is unit-checked.
 */
import { createHash } from 'node:crypto';

// Hostnames we must never emit as a block domain (they'd break the user's own machine / loopback).
const NEVER_BLOCK = new Set([
  'localhost',
  'localhost.localdomain',
  'local',
  'broadcasthost',
  'ip6-localhost',
  'ip6-loopback',
  '0.0.0.0',
  '127.0.0.1',
  '255.255.255.255',
  '::1',
]);

const IPV4_RE = /^\d{1,3}(\.\d{1,3}){3}$/;
const SCHEME_RE = /^[a-z][a-z0-9+.-]*:\/\//i;
// A conservative public-hostname shape: dot-separated labels, alnum + hyphen, at least one dot,
// TLD is letters (>=2). Punycode (xn--) is allowed. Deliberately rejects bare tokens and IPs.
const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export function sha256Hex(input) {
  return createHash('sha256').update(input).digest('hex');
}

// Reduce one raw token to a bare hostname (strip scheme, path, port, leading dots), lowercased.
// Returns '' when it is not a usable public hostname.
export function normalizeDomainToken(raw) {
  let d = String(raw || '').trim().toLowerCase();
  if (!d) return '';
  if (SCHEME_RE.test(d)) d = d.replace(SCHEME_RE, '');
  d = d.replace(/\/.*$/, ''); // path
  d = d.replace(/:\d+$/, ''); // :port
  d = d.replace(/^\.+/, '').replace(/\.+$/, ''); // leading/trailing dots
  if (!d || NEVER_BLOCK.has(d) || IPV4_RE.test(d)) return '';
  if (!DOMAIN_RE.test(d)) return '';
  return d;
}

/**
 * normalizeHostsToDomains — raw hosts text → sorted unique valid domains.
 * Handles both `0.0.0.0 domain` / `127.0.0.1 domain` hosts lines and plain one-domain-per-line lists.
 * @param {string} text
 * @returns {string[]} sorted, deduped, lowercased, validated hostnames
 */
export function normalizeHostsToDomains(text) {
  const out = new Set();
  for (const rawLine of String(text || '').split(/\r?\n/)) {
    // Strip inline + full-line comments (# or !) — upstream lists use both.
    const line = rawLine.replace(/[#!].*$/, '').trim();
    if (!line) continue;
    // A hosts line is `IP host [host...]`; a plain list is just `host`. Split on whitespace and, if
    // the first token is an IP, drop it and take the remaining host tokens.
    const parts = line.split(/\s+/);
    const tokens = IPV4_RE.test(parts[0]) || parts[0] === '::1' ? parts.slice(1) : parts;
    for (const tok of tokens) {
      const d = normalizeDomainToken(tok);
      if (d) out.add(d);
    }
  }
  return [...out].sort();
}

// Canonical JSON for a domain payload — stable key order + 2-space indent + trailing newline, so the
// artifact (and its SHA-256) is byte-deterministic across runs. compiledSha256 is taken over this.
export function canonicalDomainsJson(domains) {
  return JSON.stringify([...domains].sort(), null, 2) + '\n';
}

// ── runnable self-check (node scripts/lib/blocklist-normalize.mjs) ──
if (typeof process !== 'undefined' && Array.isArray(process.argv) && import.meta.url === `file://${process.argv[1]}`) {
  const assert = (c, m) => {
    if (!c) throw new Error(m);
  };
  const sample = [
    '# title comment',
    '0.0.0.0 Example-Adult.TEST',
    '0.0.0.0 example-adult.test', // dup after lowercase
    '127.0.0.1 sub.example-adult.test',
    '0.0.0.0 localhost', // never-block
    '0.0.0.0 0.0.0.0', // ip, drop
    'plain-list-domain.test', // plain list line
    'https://scheme.test/path?x=1', // scheme + path stripped
    '0.0.0.0 not a domain', // "not"/"a"/"domain" bare tokens → rejected
    '0.0.0.0 has_underscore.test', // invalid char → rejected
    '   ',
  ].join('\n');
  const domains = normalizeHostsToDomains(sample);
  assert(domains.includes('example-adult.test'), 'keeps a normal domain');
  assert(domains.includes('sub.example-adult.test'), 'keeps a subdomain');
  assert(domains.includes('plain-list-domain.test'), 'accepts a plain-list line');
  assert(domains.includes('scheme.test'), 'strips scheme + path to host');
  assert(!domains.includes('localhost') && !domains.includes('0.0.0.0'), 'drops loopback/never-block');
  assert(!domains.some((d) => d.includes('_')), 'drops invalid hostnames');
  assert(!domains.includes('not') && !domains.includes('domain'), 'drops bare comment-word tokens');
  assert(domains.filter((d) => d === 'example-adult.test').length === 1, 'dedupes case-folded');
  const sorted = [...domains].every((d, i, a) => i === 0 || a[i - 1] <= d);
  assert(sorted, 'output is sorted');
  // Determinism: same input → identical canonical JSON + hash.
  assert(canonicalDomainsJson(domains) === canonicalDomainsJson(normalizeHostsToDomains(sample)), 'deterministic canonical json');
  assert(sha256Hex('abc') === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', 'sha256 known vector');
  console.log('blocklist-normalize.mjs self-check OK');
}
