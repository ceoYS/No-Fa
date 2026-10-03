# RC17 Production Blocklist License Decision

Status:

PRODUCTION_BLOCKLIST_LICENSE_REVIEW_REQUIRED = YES
PRODUCTION_BLOCKLIST_LICENSE_REVIEW_CLEARED  = YES
## Decision — 2026-10-03

The StevenBlack porn-only aggregate is not used as the NoF production
redistribution source.

The release pipeline instead uses direct, category-specific, immutable-pinned
files from:

- bigdargon/hostsVN — MIT
- Sinfonietta/hostfiles — MIT
- tiuxo/hosts — CC BY 4.0

The current pinned commits are recorded in
extensions/chrome-shield/data/BLOCKLIST_ATTRIBUTION.md and
scripts/fetch-production-blocklist.mjs.

Excluded sources must not enter the production artifact unless their licensing
and provenance are independently reviewed.

The production promotion gate was opened after third-party notices,
provenance hashes and human release-owner sign-off were completed.

<!-- NOF_BLOCKLIST_SNAPSHOT_START -->
## Verified production-candidate provenance snapshot

- Retrieved at: `2026-10-03T14:28:01.257Z`
- Strategy: `direct-pinned-sources`
- Merged domain count: `63336`
- Compiled SHA-256: `b8db042bdd94504ff33188bdb3741a54bcd63f07dd82ac175a8abc9d06b250d8`
- Expected Chrome DNR rule count: `64`

### Per-source evidence

- `bigdargon/hostsVN`
  - commit: `ffd066115880f98f590640ae55e544fbfc46d9b5`
  - normalized domains: `1943`
  - source SHA-256: `e3c74d8340db6782bbb9a897a9125e50775401d0dd91d965c049771929fd7649`

- `Sinfonietta/hostfiles`
  - commit: `46f3097d7bcfc9eea323fe365074dfd771d0d17c`
  - normalized domains: `61153`
  - source SHA-256: `d5c31a7ee9f1920df47044270449ad42a1b09ad4f3b608410383abaabb27fa1d`

- `tiuxo/hosts`
  - commit: `b950765effd7808e90fda888b23540689ed46766`
  - normalized domains: `369`
  - source SHA-256: `2e30d7012de8560ced54c92963a1fc9e8b755c437d691d20fa268e810897399c`

<!-- NOF_BLOCKLIST_SNAPSHOT_END -->

## Release-owner approval

Release-owner approval recorded: `2026-10-03`.

The three pinned direct sources may proceed through the NoF production
blocklist promotion path subject to the recorded third-party notices.
