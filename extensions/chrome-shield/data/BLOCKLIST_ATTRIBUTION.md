# NoF 실드 — Production Adult Blocklist Attribution & License Review

PRODUCTION_BLOCKLIST_LICENSE_REVIEW_REQUIRED = YES
PRODUCTION_BLOCKLIST_LICENSE_REVIEW_CLEARED  = YES
## Release source policy

NoF does not redistribute the StevenBlack unified or porn-only aggregate.

Production candidates are fetched directly from category-specific upstream files,
and every URL is pinned to an immutable Git commit SHA.

## Included sources

| Source | Commit | File | License |
|---|---|---|---|
| bigdargon/hostsVN | ffd066115880f98f590640ae55e544fbfc46d9b5 | extensions/adult/hosts-VN | MIT |
| Sinfonietta/hostfiles | 46f3097d7bcfc9eea323fe365074dfd771d0d17c | pornography-hosts | MIT |
| tiuxo/hosts | b950765effd7808e90fda888b23540689ed46766 | porn | CC BY 4.0 |

## Required attribution

### bigdargon/hostsVN

MIT License.
Copyright (c) 2026 BigDargon.

The MIT copyright and permission notice must accompany redistribution.

### Sinfonietta/hostfiles

MIT License.
Copyright (c) 2016 Sinfonietta.

The MIT copyright and permission notice must accompany redistribution.

### tiuxo/hosts

Creative Commons Attribution 4.0 International (CC BY 4.0).

The release must identify the source, license and modifications made by NoF,
including normalization, deduplication and conversion to Chrome DNR rules.

## Explicitly excluded

- StevenBlack unified/base list
- StevenBlack alternates/porn-only aggregate
- brijrajparmar27 until authoritative licensing is independently established
- Clefspeare13 while original-source provenance cannot be independently verified
- Sinfonietta snuff-hosts
- any source with unclear or non-commercial redistribution terms

## Provenance requirements

Each production artifact must record:

1. source repository
2. immutable commit SHA
3. exact raw URL
4. per-source SHA-256
5. per-source normalized domain count
6. merged compiled SHA-256
7. retrieval timestamp

Raw sources and real-domain production artifacts remain gitignored.

## Human release gate

Before changing CLEARED to YES:

- [x] all pinned source files still resolve
- [x] recorded licenses still match those pinned repositories
- [x] excluded sources are absent
- [x] dry fetch succeeds
- [x] per-source SHA-256 values are recorded
- [x] merged SHA-256 is recorded
- [x] THIRD_PARTY_NOTICES is included in the release package
- [x] release owner accepts the attribution obligations

Until then:

Release state confirmed: `CLEARED = YES`

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

## Human release-owner sign-off

Release-owner approval recorded: `2026-10-03`

The release owner approved redistribution of the three pinned candidate
sources under the attribution obligations recorded in this document.

This is a product/release approval record, not a statement of external legal advice.
