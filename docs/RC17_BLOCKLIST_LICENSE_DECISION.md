# NoF RC-17 — Production Blocklist License Decision (human sign-off gate)

```
PRODUCTION_BLOCKLIST_LICENSE_REVIEW_REQUIRED = YES
PRODUCTION_BLOCKLIST_LICENSE_REVIEW_CLEARED  = NO   ← a human sets this, in BLOCKLIST_ATTRIBUTION.md, never a tool
```

This is the **decision checklist** a human must complete before a real adult-domain blocklist may be
compiled into the shipped NoF 실드 extension. The mechanism (fetch → normalize → gitignored artifact →
license-gated promotion) already exists and is verified; what is missing is a **human judgement about
redistribution rights**, which no script can make. Nothing here sets the flag. The build tool
(`scripts/build-blocklist.mjs --promote-production`) refuses to promote until a human sets
`PRODUCTION_BLOCKLIST_LICENSE_REVIEW_CLEARED = YES` on its own flag line in
`extensions/chrome-shield/data/BLOCKLIST_ATTRIBUTION.md`.

## Why a human must decide (a tool cannot)

The pinned upstream (`StevenBlack/hosts`, porn-only alternate build) is an **aggregator**. Its wrapper
and tooling are MIT, but it assembles third-party source lists whose licenses **vary and are partly
unstated**. Shipping the compiled domains inside our extension **is redistribution of that aggregated
data** — so MIT-on-the-wrapper is not sufficient authority. This is a rights question, not a code
question.

## The decision checklist — ALL must hold before setting the flag to YES

- [ ] **1. Upstream enumerated.** The individual source lists the porn extension pulls in are
      enumerated (from the aggregator's `hosts` extension README / source manifest), and recorded.
- [ ] **2. Each source's redistribution right established.** For every enumerated source, redistribution
      of its domain data is confirmed permitted — **or** that source is excluded from the shipped list.
      No source with unknown/again-unstated terms remains included.
- [ ] **3. Attribution obligations satisfiable.** The StevenBlack/hosts MIT notice + license text will
      travel with the redistribution, and StevenBlack/hosts is credited as the aggregation source
      (see the four obligations in `BLOCKLIST_ATTRIBUTION.md`).
- [ ] **4. Provenance pinned.** `adult-domains.production.json` (written by
      `node scripts/fetch-production-blocklist.mjs`) records the pinned source URL, the retrieval
      timestamp, the `sourceSha256` actually retrieved, and the `compiledSha256`; those same values are
      copied into `BLOCKLIST_ATTRIBUTION.md`.
- [ ] **5. Category correctness.** Spot-check confirms the list is adult-content only (the porn-only
      build), not gambling/social/fakenews, and that only `main_frame` navigations are redirected.
- [ ] **6. No real adult domains enter the repo.** The production artifact + compiled outputs stay
      gitignored (protected rule #5); only the harmless reserved-TLD fixture is committed. Confirm
      `git status` shows none of `adult-domains.production.json`,
      `blocklist-rules.production.json`, `blocklist-meta.production.js`, or `data/.sources/`.
- [ ] **7. Legal/owner sign-off recorded.** The person accountable for the release has reviewed 1–6 and
      accepts the redistribution risk, and records who/when in `BLOCKLIST_ATTRIBUTION.md`.

## Per-source review matrix (fill during human review — NOTHING is downloaded to produce this)

Item 1 above requires enumerating the individual lists the porn build aggregates; items 2 and the
commercial-use column below require a right per source. The rows below are a **candidate roster** of the
sources the StevenBlack porn build has historically aggregated — a starting checklist, **not** an
authoritative or downloaded snapshot. Before sign-off, the reviewer MUST reconcile this list against the
live `hosts` source manifest **at the pinned commit** (the README/`update.json` under the porn
extension), add or remove rows to match, and replace every `VERIFY` with the confirmed term (or exclude
that source from the shipped list). NoF 실드 ships inside a **paid** app, so **commercial redistribution**
must be affirmatively permitted for every included source — an unstated or non-commercial term = exclude.

| # | Source (repo/list) | Source URL | License | Attribution required? | Redistribution allowed? | Commercial use allowed? | Verdict |
|---|--------------------|-----------|---------|-----------------------|-------------------------|-------------------------|---------|
| 0 | **StevenBlack/hosts** (aggregator + tooling — the pinned upstream) | https://github.com/StevenBlack/hosts | MIT (wrapper/tooling only) | Yes — MIT notice + credit | Wrapper: yes. Aggregated data: per-source (rows below) | Wrapper: yes. Data: per-source | AGGREGATOR — data rights are per-source |
| 1 | Clefspeare13/pornhosts | https://github.com/Clefspeare13/pornhosts | VERIFY | VERIFY | VERIFY | VERIFY | VERIFY / exclude |
| 2 | Sinfonietta/hostfiles (pornography-hosts) | https://github.com/Sinfonietta/hostfiles | VERIFY | VERIFY | VERIFY | VERIFY | VERIFY / exclude |
| 3 | Bon-Appetit/porn-domains | https://github.com/Bon-Appetit/porn-domains | VERIFY | VERIFY | VERIFY | VERIFY | VERIFY / exclude |
| 4 | chadmayfield/my-pihole-blocklists | https://github.com/chadmayfield/my-pihole-blocklists | VERIFY | VERIFY | VERIFY | VERIFY | VERIFY / exclude |
| … | any additional source in the pinned manifest | (from manifest) | VERIFY | VERIFY | VERIFY | VERIFY | VERIFY / exclude |

Rules for the matrix:
- **Commercial-use is a hard gate.** A source whose terms are unstated, non-commercial, or forbid
  redistribution is **excluded** from the shipped list — it does not get a "maybe".
- **Retrieval/hash procedure** (item 4): `node scripts/fetch-production-blocklist.mjs` pins the source
  URL, retrieval timestamp, `sourceSha256`, and `compiledSha256`; copy those into
  `BLOCKLIST_ATTRIBUTION.md`. The matrix rows must reference the same pinned commit those hashes came
  from — not a "latest" fetch.
- **Release attribution requirement** (item 3): every included source's required notice/credit travels
  in `BLOCKLIST_ATTRIBUTION.md` and ships in the release zip, alongside the StevenBlack/hosts MIT notice.

## Only then

When — and only when — every box above is genuinely true, a human edits
`extensions/chrome-shield/data/BLOCKLIST_ATTRIBUTION.md` and sets:

```
PRODUCTION_BLOCKLIST_LICENSE_REVIEW_CLEARED = YES
```

after which `node scripts/build-blocklist.mjs --promote-production` will compile the gitignored
production ruleset for the release zip. Until then the extension ships the fixture and blocks nothing
real — which is the correct, honest pre-clearance state.

## What is already true (no human needed)

- Pipeline exists + is deterministic: shared pure normalizer (comments/IP/path/scheme stripped,
  lowercased, deduped, sorted, validated), source + compiled SHA-256, refuses an empty list.
- Promotion **fails closed**: the license flag is read line-anchored (a loose mention in prose cannot
  open the gate), and the committed fixture is never overwritten.
- The extension **never fetches a list at runtime** and never uploads browsing history — matching is
  local `declarativeNetRequest` over a bundled static ruleset.
