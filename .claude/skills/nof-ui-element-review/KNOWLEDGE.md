# NoF Knowledge — what is true and what must never be faked

Declarative reference for the NoF UI honesty review. This file answers *what is
true about the product* and *what must never be faked*. For the review
*procedure*, see [RUNBOOK.md](./RUNBOOK.md). For traps, see
[GOTCHAS.md](./GOTCHAS.md).

Verify every claim below against the actual source and
`scripts/nof-regression-check.mjs` before relying on it — docs can go stale, the
code is authoritative.

## Prime directive

> Do not fake functionality. Do not claim blocking, motion, sound, dragging,
> placement, safety, iOS/Android/SNS blocking, image/video mosaic, or pet eating
> unless it actually works.

The prime directive wins every conflict. Everything below is a specific
application of it.

## The 9 protected NoF rules (verbatim — never violate)

1. Do not claim real drag if only preview/planning exists.
2. If drag is not truly supported, call it "배치 계획" or "배치 미리보기," not real placement.
3. Do not claim cat ate a snack unless there is real animation/sound/state support.
4. Do not claim Shield blocks real adult sites yet.
5. Do not add real adult URLs or explicit adult terms to the repo.
6. Do not ask the user to search risky sites.
7. Do not reset all counters when only one counter relapses.
8. Do not delete rules/discipline unless explicitly requested.
9. Keep copy Korean, premium, warm, and non-shaming.

## Protected honesty rules in force (lie → honest behavior → guard)

Each rule names: the lie to never tell, the honest current behavior to preserve,
and the regression guard in `scripts/nof-regression-check.mjs` that pins it.

### 1. No fake blocking claim
- **Never:** present-tense copy that NoF "blocks / is blocking / blocked" real
  adult sites, apps, SNS, or the whole web.
- **Honest now:** the Shield screen is a 준비 중 planner; the only real block is the
  separate local Chrome extension redirecting the harmless test token
  `nof-test-risk-signal` to an in-app pause page.
- **Guards:** #29 (honest 준비 중 placeholder), #30 (non-enforcing planner),
  #31 (Safe Browser opens nothing, routes a match to 잠깐 멈춤), #37 (extension
  boundary screen, honest scope).

### 2. No fake pet eating / motion / sound claim
- **Never:** copy or tokens saying the cat ate, stretched, moved its tail, or made
  a sound; no fake-motion keyframe copy.
- **Honest now:** feeding is a hand-off — "간식을 고양이 곁에 놓아두었어요" — animated as a
  travelling ember particle, not the raw snack image; audio is a silent gated
  fallback until a real file is probed present.
- **Guards:** #6 (banned eating/motion/emoji tokens), #13 (honest feed hand-off),
  #25 (ember-particle travel, not the raw image), #26 (silent audio fallback),
  #33 (sound toggle hidden until `usePetSound.hasSound`).

### 3. No real adult URL / token collection
- **Never:** add real adult URLs or explicit adult search terms anywhere in the
  repo; never ask the user to hunt for or paste a risky site (the search itself is
  a relapse trigger).
- **Honest now:** the Shield planner edits abstract signals only
  (category / keyword / app·SNS / situation), seeds an empty list, exposes no
  address vocabulary, and carries a safety note steering users away from hunting.
- **Guards:** #30 (abstract signals, no address vocab, safety note, empty seed),
  #32 / #35 (no adult tokens in the extension), #37 (only the harmless test token).

### 4. No browser policy bypass
- **Never:** claim NoF bypasses, overrides, or defeats a browser's own policy or a
  company-managed Chrome's settings.
- **Honest now:** the extension is a normal MV3 `declarativeNetRequest` PoC,
  least-privilege, Chrome-desktop only; on a managed Chrome it may be blocked from
  installing by policy, and that is expected, not a bug to "work around."
- **Guards:** #32 (local-only MV3, no remote code), #35 (least privilege, no
  dangerous keys). See [GOTCHAS.md](./GOTCHAS.md) on managed-Chrome policy.

### 5. No whole-counter reset from one relapse
- **Never:** reset every abstinence counter (or the whole streak) when a single
  counter relapses.
- **Honest now:** `relapse()` is scoped to `selectedCounterId`; non-selected
  counters are returned untouched.
- **Guard:** #18 (relapse scoped to the selected counter, id guard present).

### 6. No item placement claim before real transparent sprites
- **Never:** claim items can be dragged/placed into the room while only a
  composite, non-transparent room image exists.
- **Honest now:** the room is one finished composite image; placement mode is an
  honest no-overlay placeholder labelled "배치 기능은 투명 아이템 이미지가 준비되면 제공돼요";
  drag stays disabled and no `spriteReady:true` exists.
- **Guards:** #5 (drag disabled until sprites ready), #24 (honest no-overlay
  placeholder), #6 (no `spriteReady:true`), #28 (composite cat-room image).

### 7. No external data / API leak
- **Never:** add a network sink, remote code, CDN, analytics, or external API to
  the app or the extension; never reveal the visited target of a block.
- **Honest now:** the Safe Browser PoC opens nothing (no http / iframe /
  window.open / href); the extension pulls in no remote code and the pause page
  never reads the blocked URL.
- **Guards:** #31 (Safe Browser opens nothing), #32 / #35 (no remote code / CDN /
  fetch / analytics, no target leak).

### 8. No-delete & non-shaming (protected rules 8–9)
- **Never:** delete rules/discipline unless explicitly requested; never use
  shaming vocabulary (위반 / 벌점 / 실패자 / 강등 / 랭킹 / 점수).
- **Honest now:** no delete affordance exists in code; relapse is framed as
  다시 시작; 규율 means "the standard I set," never punishment.
- **Guard:** #4 (no delete affordance; only comments may mention it).

## Operational caveats (judgment required — not a single code guard)

### localStorage privacy caveat
NoF persists MVP state to `localStorage`. It is **local only** (no server, no
sync) — but it still writes to disk on the machine. On a shared or company PC, use
dummy data only; never enter real personal abstinence data into a build running on
a machine you do not control. See [GOTCHAS.md](./GOTCHAS.md).

### Shield extension boundary
Real browser blocking lives **only** in the separate Chrome extension
(`extensions/chrome-shield`), not in the app. It is Chrome-desktop only — NOT
mobile, NOT SNS, NOT image/video mosaic. A company-managed Chrome may block
installing an unpacked extension by policy; that boundary is honest and must be
stated, never worked around.

## Product model — the 8 pillars the UI must serve

timer-first home · multi-counter abstinence model · rules linked to counters ·
non-shaming restart · 5-minute 잠깐 멈춤 pause · recovery/reflection log · pet reward
loop · Shield (planner + local Chrome PoC).

A surface "passes" only when every visible element serves one of these honestly,
with no faked capability.
