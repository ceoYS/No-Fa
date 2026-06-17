# NoF RC-15 — Chrome Shield Pre-Submit Hardening

> Local sprint note. RC-15 hardens the `extensions/chrome-shield` extension **before** a
> future Chrome Web Store submission. It is **pre-submit hardening, not an actual Web Store
> submission** — no upload, no fixed production ID, no automatic install, no auto-detection,
> no AI claim. The proven RC-8 `SET_BLOCK_RULES` → dynamic `declarativeNetRequest` engine is
> unchanged. Baseline: RC-14 sealed @ `848018d`, production `https://nof-mauve.vercel.app`.

## 1. Baseline

- Sealed RC-14 at `848018d` (`HEAD == origin/wip == nof-rc14`); RC-13 `707e0ac`; `main`
  untouched at `1e0a994`.
- Production app live at `https://nof-mauve.vercel.app`.
- Gates green at RC-14: `check:nof` 102/102, `qa:mvp` 39/39, `qa:ext` 11/11.
- Extension today: a **locally loaded (unpacked) Manifest V3** extension, connected to the
  NoF web app by a user-pasted extension ID. Not on the Chrome Web Store.

## 2. What RC-15 hardens

1. **Popup / options copy** — the in-extension popup and options pages a Web Store reviewer
   would see no longer carry the internal `프로토타입` stage label. They keep the honest scope
   (this Chrome browser only, not device-wide / other-app, not yet on the Web Store) and make
   no false claim. `blocked.html` keeps its `프로토타입` label on purpose (guard #32 requires
   it; the pause page is an honest local artifact, not store-listing copy).
2. **Submission-candidate manifest** — a separate `manifest.webstore.json` (see §5) so the
   load-bearing local `manifest.json` is never mutated.
3. **Privacy policy draft** — `docs/NOF_PRIVACY_POLICY_DRAFT.md`, ready to host (see §6).
4. **Screenshot checklist** — §7 (a checklist, not captured screenshots).
5. **Frozen listing copy** — §8.
6. **Regression guards** — #106–#109 pin all of the above.

## 3. What RC-15 does not do (no actual Web Store submission)

- It does **not** upload to or list on the Chrome Web Store. **실제 제출이 아니에요.**
- It does **not** claim a fixed production extension ID. Unpacked IDs are path-based.
- It does **not** claim automatic install or automatic extension detection.
- It does **not** claim AI detection or automatic risk classification.
- It does **not** ship a curated adult-category list.
- It does **not** claim device-wide, mobile, or other-app blocking. Chrome desktop only.
- It does **not** change the local `manifest.json`, the DNR engine, or any app screen.

## 4. Popup/options copy hardening

| Surface | Before | After |
|------|------|------|
| `popup.html` `<title>` | `NoF 실드 (프로토타입)` | `NoF 실드` |
| `popup.html` tag | `로컬 Chrome 전용 프로토타입` | `이 Chrome 브라우저 전용 · 수동 연결` |
| `popup.html` | — | + honest scope line (not device-wide, not yet on store) |
| `options.html` `<title>` | `NoF 실드 설정 (프로토타입)` | `NoF 실드 설정` |
| `options.html` tag | `로컬 Chrome 전용 프로토타입` | `이 Chrome 브라우저 전용 · 수동 연결` |
| `options.html` body | `…막는 프로토타입이에요.` / `이 목록은 프로토타입에서 고정이에요.` | `…막아요.` / `이 목록은 지금 고정이에요.` + honest scope line |

The honest limitations are preserved in user words: this Chrome browser only, manual
connection, not device-wide / other apps / mobile, no auto-detection, not yet on the Web
Store. No fake present-tense blocking claim is introduced. Guard #106 pins this.

## 5. Web Store manifest strategy (manifest.webstore.json)

The local `manifest.json` is **load-bearing**: local `qa:mvp` / `qa:ext` and production
`qa:ext` drive the real app↔extension round trip through it, and its `externally_connectable`
keeps all three origins (`nof-mauve.vercel.app`, `localhost`, `127.0.0.1`) that the QA harness
and guard #88 depend on. Mutating it to a production-only shape would break local QA.

So RC-15 ships a **separate submission candidate**, `extensions/chrome-shield/manifest.webstore.json`:

- `externally_connectable.matches` = **production origin only** (`https://nof-mauve.vercel.app/*`);
  the `localhost` / `127.0.0.1` dev origins are dropped from the shipped build.
- `name` (`NoF 실드`), the four icons, and minimal permissions (`declarativeNetRequest` only)
  are preserved; the description carries no stage label and no over-claim.
- `host_permissions` stays broad (`http://*/*`, `https://*/*`) **on purpose** — a user-confirmed
  risk signal is a substring that can appear on any navigation, so the DNR rules must match
  across the web. Narrowing it is a remaining blocker (§9), not done here, because it would
  break the proven substring-match engine and `qa:ext`.

Guard #108 pins that the candidate keeps the production origin, drops the dev origins, and
keeps name / icons / minimal perms / honest copy.

## 6. Privacy policy status

`docs/NOF_PRIVACY_POLICY_DRAFT.md` is the drafted privacy policy: on-device only, no
collection, `declarativeNetRequest`-only, the app's situation note is never sent as a rule,
no data sale, not medical, not device-wide / mobile / AI. **공개 URL 호스팅은 아직 남은
작업이에요** — the draft must live at a public URL and be linked from the store listing before
submission. Guard #107 pins the draft's honesty.

## 7. Screenshot checklist

A checklist — **no screenshots are captured in this RC** (do not stage fake success states).
Store listing needs 1280×800 (or 640×400). Capture before submission:

- [ ] 확장 팝업 (popup.html)
- [ ] 옵션 페이지 (options.html)
- [ ] NoF 앱 `Chrome 확장 연결` 카드 (수동 ID 붙여넣기)
- [ ] NoF 앱 `위험 신호 정리` — 구체 값 → 브라우저 차단 규칙 후보 확인
- [ ] 차단 동작: 위험 신호가 든 주소 → `blocked.html` 잠깐 멈춤
- [ ] 멈춤 페이지 → 앱 이어가기 (`오늘 기록` / `잠깐 멈춤`)

## 8. Store listing draft freeze

Frozen honest positioning — no auto-detection, no AI, no device-wide, no fixed ID, no
Web-Store-live claim. (Device-wide / mobile disclaimers live in the prose, not in these
blocks, so the frozen copy stays claim-clean.)

**EN (short):**

```
NoF Chrome Shield helps you pause before visiting user-confirmed risk signals in this Chrome browser.
```

**KO (short):**

```
NoF Chrome Shield는 사용자가 직접 확인한 위험 신호가 이 Chrome 브라우저에서 열릴 때 잠깐 멈춤 화면으로 이어지게 도와줍니다.
```

**Single-purpose statement (Web Store "single purpose" field):**

```
Redirect this Chrome browser's top-level navigations that match a user-confirmed risk signal to an in-extension pause page.
```

## 9. Remaining blockers before actual Web Store submission

1. **Privacy policy must be publicly hosted** — the §6 / `NOF_PRIVACY_POLICY_DRAFT.md` draft
   has to live at a real URL and be linked in the listing.
2. **Broad host permission** — `*://*/*` draws review scrutiny; narrow it or write the formal
   justification. Not narrowed in RC-15 (would break the substring-match engine + `qa:ext`).
3. **Package with `manifest.webstore.json`** — the actual submitted ZIP must use the
   production-only candidate, not the local `manifest.json`.
4. **Minimal-functionality review risk** — the always-on demo blocks one harmless test token;
   real value comes from user-confirmed dynamic rules. The listing must make that clear.
5. **No fixed production ID until published** — the manual ID-paste flow stays the honest path
   until the Web Store assigns a stable ID.
6. **Screenshots** — capture the §7 set (none captured yet).
7. **Developer account + registration fee + identity verification.**

## Next

RC-15 seal sprint (push / tag / deploy / remote QA), only after explicit user approval —
production stays RC-14 until then. Actual Chrome Web Store submission remains out of scope
until the §9 blockers are cleared.
