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
const SOURCES = [
  {
    id: 'hostsvn-adult-vn',
    project: 'bigdargon/hostsVN',
    commit: 'ffd066115880f98f590640ae55e544fbfc46d9b5',
    url: 'https://raw.githubusercontent.com/bigdargon/hostsVN/ffd066115880f98f590640ae55e544fbfc46d9b5/extensions/adult/hosts-VN',
    homepage: 'https://github.com/bigdargon/hostsVN',
    license: 'MIT',
  },
  {
    id: 'sinfonietta-pornography',
    project: 'Sinfonietta/hostfiles',
    commit: '46f3097d7bcfc9eea323fe365074dfd771d0d17c',
    url: 'https://raw.githubusercontent.com/Sinfonietta/hostfiles/46f3097d7bcfc9eea323fe365074dfd771d0d17c/pornography-hosts',
    homepage: 'https://github.com/Sinfonietta/hostfiles',
    license: 'MIT',
  },
  {
    id: 'tiuxo-porn',
    project: 'tiuxo/hosts',
    commit: 'b950765effd7808e90fda888b23540689ed46766',
    url: 'https://raw.githubusercontent.com/tiuxo/hosts/b950765effd7808e90fda888b23540689ed46766/porn',
    homepage: 'https://github.com/tiuxo/hosts',
    license: 'CC-BY-4.0',
  },
];

const SCHEMA = 'nof.blocklist/v1';
const ARTIFACT_VERSION = 2;
const FETCH_TIMEOUT_MS = 30000;

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, '..', 'extensions', 'chrome-shield', 'data');
const SOURCES_DIR = join(DATA, '.sources'); // gitignored raw cache — never committed
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
  const retrievedAt = new Date().toISOString();
  const fetched = [];

  for (const source of SOURCES) {
    console.log(`[fetch-blocklist] GET ${source.id} @ ${source.commit.slice(0, 12)}`);
    const raw = await fetchText(source.url);
    const sourceSha256 = sha256Hex(raw);
    const sourceDomains = normalizeHostsToDomains(raw);

    if (sourceDomains.length === 0) {
      throw new Error(`${source.id}: normalized domain count is 0`);
    }

    fetched.push({ source, raw, sourceSha256, domains: sourceDomains });
    console.log(
      `[fetch-blocklist] ${source.id}: domains=${sourceDomains.length} sourceSha256=${sourceSha256}`,
    );
  }

  const domains = [...new Set(fetched.flatMap((x) => x.domains))].sort();
  const compiledSha256 = sha256Hex(canonicalDomainsJson(domains));

  const provenance = fetched.map(({ source, sourceSha256, domains }) => ({
    ...source,
    sourceSha256,
    domainCount: domains.length,
  }));

  console.log(
    `[fetch-blocklist] mergedDomains=${domains.length} compiledSha256=${compiledSha256}`,
  );

  if (dry) {
    console.log('[fetch-blocklist] --dry: nothing written.');
    return;
  }

  mkdirSync(SOURCES_DIR, { recursive: true });

  for (const { source, raw } of fetched) {
    writeFileSync(join(SOURCES_DIR, `${source.id}.hosts`), raw);
  }

  const artifact = {
    schema: SCHEMA,
    version: ARTIFACT_VERSION,
    listType: 'production',
    strategy: 'direct-pinned-sources',
    retrievedAt,
    sources: provenance,
    compiledSha256,
    domainCount: domains.length,
    domains,
  };

  writeFileSync(ARTIFACT_OUT, JSON.stringify(artifact, null, 2) + '\n');

  console.log(`[fetch-blocklist] wrote ${ARTIFACT_OUT} (${domains.length} domains)`);
  console.log('[fetch-blocklist] NOT promoted. Human license review remains required.');
}

main().catch((e) => {
  console.error(`[fetch-blocklist] FAILED: ${e.message}`);
  process.exit(1);
});
