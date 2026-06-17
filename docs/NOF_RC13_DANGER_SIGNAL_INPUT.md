# NoF RC-13 — Danger-Signal Input UX

> Local sprint note. Reframes the extension screen's `차단 테스트용 값` (test-value)
> harness into a product-like danger-signal input, over the **already-proven**
> RC-8 `SET_BLOCK_RULES` path. No new engine, no push/tag/deploy, no Chrome Web
> Store work. Baseline: RC-12 sealed @ `5343d8d`.

## What changed

`src/screens/ShieldExtensionScreen.jsx` — the "위험 신호 정리" section now separates:

- **피하고 싶은 사이트나 검색어** (`#danger-site-value`) — a CONCRETE value. Only this
  can become a **브라우저 차단 규칙 후보**. The user confirms it (`차단 규칙 후보로 직접 확인`),
  building an explicit `candidates` list.
- **자주 흔들리는 상황** (`#danger-situation-note`) — an ABSTRACT in-app note. It is a
  reminder only and is **never** sent as a browser rule.

`선택한 값을 이 브라우저 차단 규칙에 반영` sends **only the confirmed `candidates`** through
the existing `sendBlockRules` → `SET_BLOCK_RULES` path. Success copy renders only on a
real `res.ok`; otherwise it stays honestly not-connected.

## Honesty boundaries (unchanged invariants)

- Abstract situation notes / saved 위험 신호 (`blocklist`) are never passed to
  `sendBlockRules` — sending a label as a rule would fake blocking.
- Dangerous schemes (`javascript:` / `data:` / `chrome-extension:` / `file:` / …) are
  rejected app-side (`UNSAFE_SCHEME`) before a value can be confirmed; the extension's
  `normalizeSignals` still strips `http(s)://` and caps the rule count on its side.
- No curated adult-domain list, no AI classification, no automatic detection, no
  device-wide / mobile / other-app blocking claim, no Chrome Web Store / fixed ID claim.
- No user-facing 체크인 / 금욕.

## Engine

Unchanged. `extensions/chrome-shield` `SET_BLOCK_RULES` → `normalizeSignals` →
`buildDynamicRules` → dynamic `declarativeNetRequest` redirect to `blocked.html` is the
same proven path from RC-8 (verified by `qa:ext`).

## Verification

- `qa:mvp` **B39** drives the new input end-to-end (two inputs, situation-note-is-app-only,
  concrete value → candidate, honest no-fake-success); **B35** verifies the confirmed-candidate
  send stays honest. `qa:mvp` is now 39/39.
- `check:nof` guards #100 (input UX honesty) + #101 (B39 binding) pin it in source.
- `qa:ext` is unchanged (SET_BLOCK_RULES is already exercised via the direct bridge).

## Next

RC-14 — Web Store readiness pack (icons, manifest copy cleanup, privacy copy, dev-origin
removal), or one more danger-signal polish pass if the UX still feels rough.
