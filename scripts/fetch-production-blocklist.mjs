#!/usr/bin/env node
/*
 * fetch-production-blocklist.mjs — DEVELOPER / RELEASE-ONLY. Fetches the pinned upstream adult
 * blocklist, normalizes it to bare domains, and writes a deterministic production artifact with
 * provenance + SHA-256 hashes. NOTHING here runs in the browser or the extension, and NOTHING is
 * uploaded — this is a one-way GET of a public text list. Run it by hand at release time only:
 *
 *     node scripts/fetch-production-blocklist.mjs            # fetch + normalize + write artifact
 *     node scripts/fetch-production-blocklist.mjs --dry      # fetch + report counts/hashes, write nothing
 *
 * It does NOT promote the list. Promotion (making the extension actually load it) is a separate,
 * explicit, license-gated step: `node scripts/build-blocklist.mjs --promote-production`. And that step
 * is itself blocked until the license review in extensions/chrome-shield/data/BLOCKLIST_ATTRIBUTION.md
 * is cleared (PRODUCTION_BLOCKLIST_LICENSE_REVIEW_REQUIRED).
 *
 * Founder P0 contract enforced here: fetch only on this explicit command · extension never fetches at
 * runtime · normalize to domains only · strip comments/IPs/paths/schemes/dupes/invalid/lowercase ·
 * preserve upstream attribution · deterministic artifact · SHA-256 for source AND compiled result ·
 * pin source URL + retrieval timestamp + source hash · never upload browsing history.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { normalizeHostsToDomains, canonicalDomainsJson, sha256Hex } from './lib/blocklist-normalize.mjs';

// ── PINNED upstream (founder: StevenBlack porn-only family) ──────────────────────────────────────
// The "porn-only" alternate build = the unified base list + the pornography extension ONLY (no
// gambling/social/fakenews), which is what an adult-site blocklist wants. Pinned by URL; the exact
// bytes retrieved are hashed (sourceSha256) so a release is reproducible and auditable.
const SOURCE = {
  project: 'StevenBlack/hosts (porn-only alternate build)',
  url: 'https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/porn-only/hosts',
  homepage: 'https://github.com/StevenBlack/hosts',
  // Do NOT assert a single license here — this is an aggregator of upstream sources with potentially
  // different licenses. The license review lives in BLOCKLIST_ATTRIBUTION.md and gates promotion.
  license: 'aggregated — see BLOCKLIST_ATTRIBUTION.md (redistribution review required)',
};

const SCHEMA = 'nof.blocklist/v1';
const ARTIFACT_VERSION = 1;
const FETCH_TIMEOUT_MS = 30000;

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, '..', 'extensions', 'chrome-shield', 'data');
const SOURCES_DIR = join(DATA, '.sources'); // gitignored raw cache — never committed
const RAW_OUT = join(SOURCES_DIR, 'stevenblack-porn-only.hosts');
const ARTIFACT_OUT = join(DATA, 'adult-domains.production.json');

async function fetchText(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const dry = process.argv.includes('--dry');
  console.log(`[fetch-blocklist] GET ${SOURCE.url}`);
  const raw = await fetchText(SOURCE.url);
  const sourceSha256 = sha256Hex(raw);
  const domains = normalizeHostsToDomains(raw);
  const compiledSha256 = sha256Hex(canonicalDomainsJson(domains));
  const retrievedAt = new Date().toISOString();

  console.log(`[fetch-blocklist] rawBytes=${raw.length} sourceSha256=${sourceSha256}`);
  console.log(`[fetch-blocklist] domains=${domains.length} compiledSha256=${compiledSha256}`);

  if (domains.length === 0) throw new Error('normalized domain count is 0 — refusing to write an empty production list');

  if (dry) {
    console.log('[fetch-blocklist] --dry: nothing written.');
    return;
  }

  mkdirSync(SOURCES_DIR, { recursive: true });
  writeFileSync(RAW_OUT, raw);

  const artifact = {
    schema: SCHEMA,
    version: ARTIFACT_VERSION,
    listType: 'production',
    source: SOURCE,
    retrievedAt,
    sourceSha256,
    compiledSha256,
    domainCount: domains.length,
    domains,
  };
  writeFileSync(ARTIFACT_OUT, JSON.stringify(artifact, null, 2) + '\n');

  console.log(`[fetch-blocklist] wrote ${ARTIFACT_OUT} (${domains.length} domains)`);
  console.log('[fetch-blocklist] NOT promoted. Next, after clearing the license review:');
  console.log('[fetch-blocklist]   node scripts/build-blocklist.mjs --promote-production');
}

main().catch((e) => {
  console.error(`[fetch-blocklist] FAILED: ${e.message}`);
  process.exit(1);
});
