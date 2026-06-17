# NoF RC-14 — Chrome Web Store Readiness Pack

> Local sprint note. RC-14 prepares the `extensions/chrome-shield` extension for a
> *future* Chrome Web Store submission. It is a **readiness pack, not a launch** — no
> upload, no fixed production ID, no automatic install, no auto-detection claim. The
> proven RC-8 `SET_BLOCK_RULES` → dynamic `declarativeNetRequest` engine is unchanged.
> Baseline: RC-13 sealed @ `707e0ac`, production `https://nof-mauve.vercel.app`.

## 1. Baseline

- Sealed RC-13 at `707e0ac` (`HEAD == origin/wip == nof-rc13`); `main` untouched at `1e0a994`.
- Production app live at `https://nof-mauve.vercel.app`.
- Gates green at RC-13: `check:nof` 98/98, `qa:mvp` 39/39, `qa:ext` 11/11.
- Extension today: a **locally loaded (unpacked) Manifest V3** extension. Not on the
  Chrome Web Store. Connected to the NoF web app by a user-pasted extension ID.

## 2. What RC-14 prepares

1. **Icons** — real `icons/icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`
   (dark ember card + shield + 잠깐 멈춤 pause mark), referenced from `manifest.json`
   (`icons` + `action.default_icon`). Web Store requires a 128px icon.
2. **Manifest copy** — the store-facing `name` / `description` / `action.default_title`
   no longer carry the internal `프로토타입` stage label; the description states the
   honest scope (this Chrome browser, user-confirmed signals, no device-wide blocking,
   no auto-detection).
3. **Permission justification** — documented below (§5).
4. **Host-permission rationale** — documented below (§6), with the narrowing work
   flagged as a pre-submit item.
5. **Data-handling / privacy copy** — documented below (§7), ready to become a hosted
   privacy policy.
6. **Screenshot checklist** — documented below (§8).
7. **Store listing copy draft** — honest positioning (§9).
8. **Pre-submit checklist + remaining blockers** — §10 / §11.

## 3. What RC-14 does not claim

- It does **not** claim the extension is on the Chrome Web Store. It is not.
- It does **not** claim a fixed production extension ID. Unpacked IDs are path-based.
- It does **not** claim automatic install or automatic extension detection.
- It does **not** claim AI detection or automatic risk classification.
- It does **not** ship a curated adult-category list.
- It does **not** claim device-wide, mobile, or other-app blocking. Chrome desktop only.

## 4. Manifest summary

| Field | Value |
|------|------|
| `manifest_version` | 3 |
| `name` | `NoF 실드` |
| `version` | `0.0.1` |
| `description` | 이 Chrome 브라우저에서, 직접 확인한 위험 신호가 열리면 NoF 잠깐 멈춤으로 이어줘요. 기기 전체·다른 앱·모바일은 막지 않고, 자동으로 감지하지도 않아요. |
| `permissions` | `["declarativeNetRequest"]` |
| `host_permissions` | `["http://*/*", "https://*/*"]` |
| `icons` | 16 / 32 / 48 / 128 → `icons/icon*.png` |
| `action` | `default_popup` `popup.html`, `default_title` `NoF 실드`, `default_icon` 16/32/48/128 |
| `declarative_net_request` | static `rules.json` (`nof_static_rules`, enabled) |
| `web_accessible_resources` | `blocked.html` (the in-app pause page) |
| `externally_connectable` | `https://nof-mauve.vercel.app/*`, `http://localhost/*`, `http://127.0.0.1/*` |

## 5. Permission justification

- **`declarativeNetRequest`** — the only requested permission. It is the engine that
  redirects a top-level navigation whose URL/query contains a user-confirmed risk
  signal to the in-extension `blocked.html` pause page. DNR runs the match/redirect
  inside Chrome without the extension ever reading page contents or request bodies, so
  it is the least-privilege way to do the one thing this extension does.
- **No `webRequest`, `tabs`, `cookies`, `scripting`, `content_scripts`, `storage`,
  `history`.** The extension reads no browsing history, injects no scripts, sets no
  cookies, and stores nothing about visited pages.
- **`externally_connectable`** (not a permission, but a capability) — a narrow
  allow-list lets *only* the NoF web app origins message the service worker
  (`onMessageExternal`) to install user-confirmed rules. No wildcard host.

## 6. Host permission rationale

- **`host_permissions: ["http://*/*", "https://*/*"]`** — a user-confirmed risk signal
  is a substring (e.g. a site or search term) that can appear on *any* http/https
  navigation, so the static + dynamic DNR rules must be allowed to match across the web.
  The extension still reads nothing from those pages — DNR only matches the URL and
  redirects. **Pre-submit item:** investigate whether DNR redirect rules function with a
  narrower host scope (or none) so the broad grant can be reduced before submission; the
  Web Store reviews broad host access closely.
- **`externally_connectable` keeps `http://localhost/*` and `http://127.0.0.1/*`** today
  so the local QA harness (`qa:ext`, `qa:mvp`) can drive the real app↔extension round
  trip from a local preview, alongside the production origin `nof-mauve.vercel.app`.
  **Pre-submit item:** drop the localhost/127.0.0.1 dev origins from the *shipped* build
  so production users expose only the production origin. This is recorded honestly as a
  local/prod split — the dev origins exist for testing, not for end users.

## 7. Data handling / privacy copy

Draft text, ready to host as the required privacy policy:

> **NoF 실드 개인정보 처리 방침 (초안)**
>
> - **온디바이스 전용.** NoF 실드는 방문 기록·주소·검색어를 수집하지 않고, 어떤
>   서버로도 보내지 않는다. 네트워크 호출, 원격 코드(CDN), 외부 API, 애널리틱스가 없다.
> - **막은 대상을 저장하지 않는다.** 멈춤 페이지(`blocked.html`)는 어디로 가려 했는지
>   읽지도, 저장하지도, 표시하지도 않는다.
> - **앱 → 확장 데이터.** NoF 웹앱은 사용자가 *직접 확인한 구체 값*만
>   `SET_BLOCK_RULES` 로 보낸다. 앱의 **상황 메모는 브라우저 규칙으로 보내지 않는다.**
> - **앱으로 돌아가는 딥링크.** 멈춤 페이지의 "앱에서 이어가기" 링크는 `from=shield` 와
>   거친 목적지(`to=record|urge`)만 담는다. 막은 주소·검색어는 절대 넘기지 않는다.
> - **권한 최소화.** `declarativeNetRequest` 하나만 쓴다. 브라우징을 읽거나 스크립트를
>   주입하지 않는다.

## 8. Screenshot checklist

Store listing needs 1280×800 (or 640×400) screenshots. Capture (placeholders to shoot
before submission — do **not** stage fake success states):

- [ ] NoF 앱 `실제 차단 테스트` → `Chrome 확장 연결` 카드 (수동 ID 붙여넣기 흐름)
- [ ] NoF 앱 `위험 신호 정리` 카드 (구체 값 → 브라우저 차단 규칙 후보, 상황 메모는 앱 전용)
- [ ] 차단 동작: 위험 신호가 든 주소 → NoF `잠깐 멈춤`(`blocked.html`) 멈춤 화면
- [ ] 통과 동작: 평범한 주소는 그대로 열림 (오탐 없음을 보여 줌)
- [ ] 멈춤 페이지 → 앱 이어가기(`오늘 기록` / `잠깐 멈춤`) 핸드오프
- [ ] (선택) 확장 팝업/옵션 화면

## 9. Store listing copy draft

Honest positioning — no auto-detection, no device-wide, no Web-Store-live, no fixed-ID,
no AI claim:

**EN (short):**

```
NoF Chrome Shield helps you pause before visiting user-confirmed risk signals in this Chrome browser.
```

**KO (short):**

```
NoF Chrome Shield는 사용자가 직접 확인한 위험 신호가 이 Chrome 브라우저에서 열릴 때 잠깐 멈춤 화면으로 이어지게 도와줍니다.
```

**KO (detailed):**

```
NoF 실드는 NoF 웹앱과 함께 작동하는 Chrome 데스크톱 보조 도구입니다. 사용자가 NoF 앱에서
직접 확인한 위험 신호(사이트나 검색어)가 이 Chrome 브라우저의 주소창 이동에서 열리면, 그
페이지 대신 NoF 잠깐 멈춤 화면으로 이어 줍니다. 무엇을 멈출지는 사용자가 정합니다.
온디바이스에서만 동작하며, 방문 기록을 수집하거나 외부로 보내지 않습니다.
```

Single-purpose statement (for the Web Store "single purpose" field):

```
Redirect this Chrome browser's top-level navigations that match a user-confirmed risk signal to an in-extension pause page.
```

## 10. Pre-submit checklist

- [x] 128px icon (+ 16/32/48) present and referenced in the manifest.
- [x] Manifest store copy free of internal stage labels (`프로토타입`).
- [x] Honest description (this browser; user-confirmed signals; no device-wide; no auto-detect).
- [x] Least-privilege permission set (`declarativeNetRequest` only).
- [x] Data-handling / privacy copy drafted (§7).
- [x] Store listing copy drafted, honest (§9).
- [ ] Privacy policy hosted at a public URL (link it in the listing).
- [ ] Narrow `host_permissions` validated, or written justification for the broad grant.
- [ ] Drop `localhost` / `127.0.0.1` dev origins from the shipped `externally_connectable`.
- [ ] Replace remaining `프로토타입` labels in `popup.html` / `options.html` UI.
- [ ] Screenshots captured (§8).
- [ ] Decide a published version number (currently `0.0.1`).
- [ ] Developer account + Web Store registration fee + identity verification.

## 11. Remaining blockers before actual Web Store submission

1. **Privacy policy must be publicly hosted** — the §7 draft has to live at a real URL.
2. **Broad host permission** — `*://*/*` will draw review scrutiny; narrow it or justify it.
3. **Dev origins in `externally_connectable`** — `localhost` / `127.0.0.1` must leave the
   shipped build (they exist now only for the local QA harness).
4. **Minimal-functionality review risk** — the always-on demo blocks a single harmless
   test token (`nof-test-risk-signal`); real value comes from user-confirmed dynamic
   rules sent by the app. The listing must make that interaction clear so the reviewer
   does not read the default state as "does almost nothing".
5. **No fixed production ID until published** — the app's manual ID-paste flow stays the
   honest path until the Web Store assigns a stable ID.
6. **`popup.html` / `options.html` still show the `프로토타입` stage label** — in-extension
   dev UI, harmless today, but should be cleaned for a public listing.

## Next

RC-14 seal sprint (push / tag / deploy / remote QA), only after explicit user approval —
production stays RC-13 until then. Actual Chrome Web Store submission remains out of scope
until the §11 blockers are cleared.
