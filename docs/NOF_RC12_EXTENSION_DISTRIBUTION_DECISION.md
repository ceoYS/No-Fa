# NoF RC-12 — Chrome Extension Distribution Decision

> Local decision packet. No code-behavior change, no push, no tag, no deploy, no
> Chrome Web Store item. Decides the **next major path** for the NoF 실드 Chrome
> extension: go to Web Store packaging now, or improve the danger-signal input UX first.
>
> Baseline: RC-11 sealed @ `32f4ff8` · production `https://nof-mauve.vercel.app`.

---

## 1. Current sealed state

- **RC-11 is sealed.** Tag `nof-rc11` @ `32f4ff8` on `wip/pet-room-scene-mode`; `main`
  untouched (`1e0a994`).
- **Production URL:** https://nof-mauve.vercel.app (RC-11 live; remote `qa:mvp` 38/38,
  prod `qa:ext` 11/11).
- **What works today (proven, end-to-end, on real Chrome via CDP):**
  - App ↔ extension connection (RC-7): the app sends a real `PING`; the screen shows
    `연결됨` only when the extension actually answers `ok:true`.
  - Concrete user value → real block (RC-8): a value typed into `차단 테스트용 값` is sent
    via `SET_BLOCK_RULES`; the extension installs a real `declarativeNetRequest` **dynamic**
    rule; a matching top-level navigation redirects to the in-extension pause page.
  - Guided setup (RC-9): a `3분 보호 설정` stepper whose every step state is derived from
    real state (value typed / real PING / real `ok:true` / test guidance opened).
  - Pause-page handoff (RC-10): `blocked.html` → NoF web app (`?from=shield&to=record|urge`),
    carrying no visited target.
  - Compressed honest setup (RC-11): one `Chrome 확장 준비` orientation card (압축해제 설치 →
    확장 ID 복사 → 붙여넣기), an honest 완료 state gated on real connection **and** a real rule.
- **What is still unpacked / manual:**
  - Install is the developer **압축해제(unpacked) load**, not a Chrome Web Store install.
  - The user must copy/paste the extension's 32-char ID into the app by hand.
  - The unpacked ID is **not fixed** — it can change on reload, so the user re-pastes.
  - No Chrome Web Store package, no stable production extension ID, no public install path.

---

## 2. Current extension architecture

| Piece | State today | Honesty boundary |
|-------|-------------|------------------|
| **Web app** | `nof-mauve.vercel.app` (Vite SPA). Renders `ShieldExtensionScreen`; talks to the extension via `chromeExtensionBridge.js`. | Text + messaging only. No network/remote-code sink in the bridge; never reports `연결됨` without a real PING. |
| **Chrome extension** | `extensions/chrome-shield`, MV3, version `0.0.1`, name `NoF 실드 (프로토타입)`. | Local-only. No remote code / CDN / fetch. Chrome desktop only. |
| **`externally_connectable`** | `https://nof-mauve.vercel.app/*`, `http://localhost/*`, `http://127.0.0.1/*` (ports excluded — Chrome match patterns reject ports). | Narrow origin allow-list — production app + local dev only. Still carries the two **dev** origins. |
| **Extension ID** | Random per unpacked load path (not fixed). User pastes it; saved in `localStorage`. | A normal web page genuinely cannot discover an unpacked ID — paste is real, not laziness. |
| **Dynamic rules** | `SET_BLOCK_RULES` → `normalizeSignals()` (trim/lowercase, drop dangerous schemes, strip `http(s)://`, dedupe, cap 20) → `buildDynamicRules()` (`declarativeNetRequest`, `main_frame`, case-insensitive substring, redirect to `/blocked.html`). | Conservative normalization; matching tokens only, never a URL the extension fetches. Substring match breadth is disclosed. |
| **`blocked.html` handoff** | In-extension pause page; deep-links back to the app with `from=shield&to=record\|urge`. | Never passes the visited address/search. App safely drops invalid destinations to home. |
| **Static demo rule** | `rules.json` blocks one harmless test token (`nof-test-risk-signal`) → `blocked.html`. | The only always-on match is a harmless test token, not any real site. |

---

## 3. Option A — Chrome Web Store / fixed ID path

Package the extension and publish it to the Chrome Web Store, which yields a **stable,
fixed extension ID** and a public install link.

**What improves**
- **Stable install path** — one-click install from a Web Store URL; no developer mode,
  no "load unpacked".
- **Less ID-paste friction** — a published item has a **fixed** ID, so the app could ship
  it as a constant; the user no longer copy/pastes a 32-char string (the single highest
  friction step today, RC-11's own caveat).
- **Stronger user trust** — a real listing with icon, screenshots, and a privacy
  disclosure reads as a product, not a dev artifact.
- **Easier onboarding** — install → open app → it just connects.

**What must be prepared (today: none of these exist)**
- **Store listing** — name, summary, category, language(s).
- **Extension icons** — 16 / 32 / 48 / 128 px. **None exist** in the manifest or the
  extension folder today. This is a hard Web Store requirement.
- **Permission explanations** — a justification for `host_permissions: http://*/*` +
  `https://*/*` (broad) and for `declarativeNetRequest` with a redirect action.
- **Privacy policy** — a public URL. Even though nothing leaves the device, the Web Store
  requires a privacy disclosure for an extension with host access / DNR redirect.
- **Screenshots / promo tiles** — at least one screenshot; promo images for the listing.
- **Support contact** — an email / page for the listing.
- **Review-safe copy** — the manifest `name`, `description`, and `default_title` all
  currently say **프로토타입**; `description` also says **로컬 전용**. A public listing should
  not ship "prototype" wording.
- **Clear limitation copy** — keep the honest scope (this-Chrome-only, friction-not-wall,
  bypassable, on-device-only) visible in the listing, not just in-app.
- **Production-origin cleanup** — `externally_connectable` still lists `localhost` and
  `127.0.0.1`; a published build should not whitelist dev origins.

**Risks**
- **Review delay** — store review is days-to-weeks and out of our control; it would block
  the sprint on an external queue.
- **Policy rejection / minimal-functionality** — the extension currently only blocks one
  harmless **test token**; a reviewer installing it sees nothing happen on normal sites.
  That is honest, but it risks a "does not do what it claims / minimal functionality"
  review flag until the danger-signal flow makes real user value visible.
- **Permission-wording risk** — broad `http://*/*` + `https://*/*` host permissions draw
  scrutiny; we would likely be asked to narrow scope or justify it carefully.
- **Extension-scope scrutiny** — a redirecting DNR extension with all-hosts access is
  exactly the profile reviewers inspect closely.
- **Future maintenance overhead** — a public listing means versioned releases, review
  cycles on every change, and a privacy-policy surface to keep accurate.

---

## 4. Option B — Delay store packaging, improve danger-signal UX first

Keep the unpacked dev distribution for now (technical/beta users), and spend the next
product sprint making the **danger-signal input** feel like a real product instead of a
test harness. Prepare a lightweight store-readiness checklist in parallel.

**What improves**
- **Product value before distribution** — today the real, user-entered value is framed as
  `차단 테스트용 값` (a test value). Before public review, the user's danger-signal entry
  should read as "the things I want to keep away from", mapped honestly to concrete
  browser-rule candidates the user confirms.
- **Clearer user input flow** — `내가 피하고 싶은 사이트 / 검색어 / 상황` → concrete rule
  candidates → user confirms → extension applies. The engine already exists (SET_BLOCK_RULES
  → dynamic rule); this is UX over a proven path, no new engine.
- **Better testing before public review** — a stronger flow can be exercised end-to-end
  (qa:mvp / qa:ext) before we expose it to store reviewers.
- **Less premature policy work** — no privacy policy, icons, screenshots, or permission
  justifications committed to before the product they describe is stable.

**What remains painful (accepted, temporarily)**
- **Unpacked install** — developer mode + load unpacked stays.
- **Extension-ID paste** — the user still copies/pastes the random 32-char ID.
- **No public install path** — no Web Store URL to share.
- **Only technical / beta users can use it** — non-technical users cannot self-install.

---

## 5. Recommended path

**Do not jump straight into Web Store packaging as the next coding sprint.**

The extension **engine** is proven (connect → real dynamic rule → redirect → app handoff),
but the core **user value** is still framed through `차단 테스트용 값` — a test harness, not a
product. Two findings from the Phase 1 audit make "store now" the weaker first move:

1. **The product isn't store-shaped yet.** A reviewer installs it and sees one harmless
   test token block; normal browsing is untouched. That is honest, but it invites a
   minimal-functionality / "does not match description" review flag. Shipping the
   danger-signal UX first turns the listing's value into something a reviewer can see.
2. **Store assets don't exist and would be premature.** No icons, no privacy policy, no
   screenshots; `name`/`description`/`title` still say 프로토타입; `host_permissions` is
   broad (`http://*/*` + `https://*/*`); `externally_connectable` still lists dev origins.
   Producing all of that now bakes in copy/permissions for a flow we're about to change.

Recommended sequence:

- **RC-13 — danger-signal input UX** (next coding sprint): `내가 피하고 싶은 사이트/검색어/상황`
  → concrete browser-rule candidates → user confirms → extension applies (over the existing
  SET_BLOCK_RULES path; no new engine, same honesty gates).
- **In parallel — a lightweight Web Store readiness checklist** (docs only): icons,
  manifest copy cleanup, permission justification, privacy copy, screenshots, dev-origin
  removal — tracked, not yet built.
- **RC-14 — packaging / listing preparation**, *only after* the danger-signal UX is stable.

**Reason:** before going to store review, NoF should make the user's danger-signal entry
feel like a real product, not a test harness. The distribution friction (unpacked install,
ID paste) is real but is the *second* problem; the *first* is that the thing we would list
isn't yet shaped like the product we want reviewed.

---

## 6. Decision

**DECISION: delay Web Store, improve danger-signal UX first.**

Keep unpacked dev distribution for now. Next coding sprint is RC-13 (danger-signal input
UX) over the already-proven block path; prepare the Web Store readiness checklist in
parallel as docs only; defer packaging/listing to RC-14 once the UX is stable. No Chrome
Web Store item is created in RC-12.

---

## 7. Next RC recommendation

Because the decision is **delay**:

- **RC-13 — danger-signal input UX.**
  `내가 피하고 싶은 사이트 / 검색어 / 상황` → concrete browser-rule candidates → user confirms →
  extension applies. Build on the proven RC-8 `SET_BLOCK_RULES` → dynamic rule path; keep
  every honesty gate (real `ok:true` before "반영", never claim a redirect the app can't
  observe, no curated adult list, no auto-detection). Reframe `차단 테스트용 값` into the
  user's own danger signals without ever asking the user to hunt for a risky address.

(If the decision is later revised to **prepare store now**, the next RC instead becomes
**RC-13 — Web Store readiness pack**: icons (16/32/48/128), manifest copy cleanup
[drop 프로토타입, remove dev origins], permission justification, privacy copy, screenshots,
local package validation.)

---

## 8. Non-goals

This RC-12 packet (and the recommended RC-13) explicitly do **not**:

- add an adult-domain list (matching stays user-entered test/danger values, never a
  curated explicit list);
- add AI / automatic detection (no claim the app detects risky content on its own);
- implement device-wide / mobile / other-app / other-browser blocking (this Chrome
  desktop only);
- add automatic install (install stays user-driven);
- create a Chrome Web Store item or submit for review in RC-12;
- add payment / account / cloud / network sink;
- change RC-11 product behavior, push, tag, or deploy.
