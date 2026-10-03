# NoF 실드 — Production Adult Blocklist Attribution & License Review

**Status flags (machine-read by `scripts/build-blocklist.mjs --promote-production`):**

```
PRODUCTION_BLOCKLIST_LICENSE_REVIEW_REQUIRED = YES
PRODUCTION_BLOCKLIST_LICENSE_REVIEW_CLEARED  = NO
```

Promotion of a real production blocklist is **blocked** until a human sets
`PRODUCTION_BLOCKLIST_LICENSE_REVIEW_CLEARED = YES` here, after verifying the redistribution
rights described below. This file exists so we never silently ship a list we do not have the
right to redistribute.

---

## Why this review is required (do not assume MIT)

The chosen upstream is an **aggregator**. It assembles many third-party source lists into one
hosts file. The aggregator's own repository and tooling are MIT-licensed, **but the individual
upstream domain sources it pulls in carry their own, sometimes unstated, licenses.** MIT on the
wrapper does not automatically grant redistribution rights over every aggregated record. Shipping
the compiled domain data inside the NoF 실드 extension **is** redistribution, so the aggregated
data's provenance — not just the wrapper's license — has to hold up.

Because those upstream licenses cannot be uniformly established from the wrapper alone, this
review is open (`PRODUCTION_BLOCKLIST_LICENSE_REVIEW_REQUIRED = YES`).

## Upstream

| Field | Value |
|-------|-------|
| Project | StevenBlack/hosts — "porn-only" alternate build (unified base + pornography extension only) |
| Homepage | https://github.com/StevenBlack/hosts |
| Pinned source URL | https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/porn-only/hosts |
| Wrapper license | MIT (StevenBlack/hosts repository & assembly tooling) |
| Aggregated-data license | **VARIES / partially unstated** — the pornography extension draws on multiple third-party lists; each must be checked individually before redistribution |
| Retrieval date | `NOT_YET_FETCHED` (filled by `fetch-production-blocklist.mjs` at retrieval time) |
| Source SHA-256 | `NOT_YET_FETCHED` (the exact bytes retrieved are hashed and pinned in `adult-domains.production.json`) |
| Compiled SHA-256 | `NOT_YET_FETCHED` (deterministic hash of the normalized domain list) |

## Attribution obligations to satisfy before clearing

1. Preserve the StevenBlack/hosts **MIT** copyright notice and license text with any redistribution.
2. Credit StevenBlack/hosts as the aggregation source.
3. Enumerate the upstream sources that the porn extension pulls in (the aggregator documents these
   in its `hosts` extension `README`/source manifest), and confirm each one's license permits
   redistribution of the domain data, **or** exclude any source that does not.
4. Record, here and in `adult-domains.production.json`, the pinned source URL, the retrieval
   timestamp, and the source SHA-256 actually retrieved.

Only when all four hold, and a human is satisfied redistribution is permitted, set
`PRODUCTION_BLOCKLIST_LICENSE_REVIEW_CLEARED = YES`.

## How the real list ships (it never enters this repo)

The production list contains real adult domains, which must never be committed to source
(protected rule #5). It is a **release-time artifact**, not version-controlled:

1. `node scripts/fetch-production-blocklist.mjs` — fetch the pinned upstream, normalize to bare
   domains, write the **gitignored** `data/adult-domains.production.json` (schema, version,
   `listType: production`, source, retrievedAt, sourceSha256, compiledSha256, domainCount, domains).
2. Clear this license review (set the flag above).
3. `node scripts/build-blocklist.mjs --promote-production` — compile to the **gitignored**
   `blocklist-rules.production.json` + `blocklist-meta.production.js`.
4. Release packaging swaps the `.production.*` files over the fixture files **inside the extension
   zip only**. The committed repo keeps the harmless fixture (`adult-domains.v1.json`,
   `listType: fixture`) so it holds no real adult domains.

Everything is local: the extension never fetches a list at runtime, and no browsing history is ever
uploaded.
