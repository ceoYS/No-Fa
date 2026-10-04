# RC17 Web Store package QA

The production package and fixture extension have separate QA commands.
`npm run qa:ext` retains its fixture-domain assertion and does **not** validate
the production package. Do not load `extensions/chrome-shield` for production QA.

## Package and verify

From the repository root, with Python 3 and the approved local production artifacts:

```bash
python3 scripts/package-chrome-shield-webstore.py
python3 scripts/package-chrome-shield-webstore.py --check
python3 scripts/test-chrome-shield-webstore.py
```

The packager pins the RC17 release to 63,336 domains / 64 rules and canonical
compiled SHA-256 `b8db042bdd94504ff33188bdb3741a54bcd63f07dd82ac175a8abc9d06b250d8`.
A future approved blocklist release requires an explicit update of these pins.
It substitutes the Web Store manifest and production rules/metadata only in
`dist/chrome-shield-webstore/package`, and creates
`dist/chrome-shield-webstore/NoF-Shield-0.0.1-webstore.zip`.
The ZIP contains exactly 17 allowlisted files, including third-party notices and
`manifest.json` at its root. It contains no raw sources, development manifest, or
`*.production.*` names. Generated browser `_metadata` caches are never packaged.

The ZIP has fixed ordering, timestamps, Unix permissions, and compression level.
Repeat runs with the same inputs and Python/zlib toolchain must have the same
SHA-256. Do not assume cross-zlib byte identity. `--check` verifies staging and
ZIP against the current source inputs, CRC integrity, metadata, and sealed hash.
All diagnostics omit domain entries. The guard tests exercise rejection of
tampered data, metadata, manifests, license flags, and ZIP contents.

A plain Vite build may empty `dist/`. Build the app first, or preserve the release
artifacts with `npm run build -- --emptyOutDir false`, then regenerate the package.

## Isolated browser

Use an **existing** extension-capable Chromium / Chrome for Testing / Edge binary.
Do not install a browser as part of this QA, and never use a normal browser profile.
[Chrome's announcement](https://groups.google.com/a/chromium.org/g/chromium-extensions/c/1-g8EFx2BBY/m/S0ET5wPjCAAJ)
documents removal of `--load-extension` from official branded Chrome starting at
137; Chrome for Testing continues to support it. An executable's presence alone
does not establish that CLI extension loading works.

Create a fresh temporary profile with a basename `nof-webstore-qa-` followed by
at least eight random characters. Launch the browser with:

```text
--user-data-dir=<fresh absolute profile path>
--load-extension=<absolute release staging/package path>
--disable-extensions-except=<same package path>
--enable-automation
--remote-debugging-address=127.0.0.1
--remote-debugging-port=0
--no-first-run
--no-default-browser-check
--disable-background-networking
--disable-component-update
about:blank
```

Headless QA can add `--headless=new`. Keep the browser sandbox enabled. Keep the
launching process alive throughout the test. Record its PID and exact temporary
profile path so cleanup can target only this browser.

For Windows discovery from WSL, pass PowerShell syntax to PowerShell itself:

```bash
powershell.exe -NoLogo -NoProfile -NonInteractive -Command '$paths = @("C:\Program Files\Google\Chrome\Application\chrome.exe", "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe", (Join-Path $env:LOCALAPPDATA "Google\Chrome\Application\chrome.exe"), "C:\Program Files\Microsoft\Edge\Application\msedge.exe", "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"); $paths | Where-Object { Test-Path -LiteralPath $_ }'
```

If needed, copy **only** the 17-file staging package to a new Windows temporary
directory ending in `package`, and use Windows absolute paths in the launch flags.
The smoke checks every loaded file's SHA-256 against the repository's staging.
Do not copy the source extension or raw blocklist inputs. The smoke requires an
isolated profile and checks the actual browser command line before creating tabs
or mutating rules; `--enable-automation` enables that CDP ownership check.

## Discover CDP and run the smoke

Read the port from the test profile's `DevToolsActivePort` file (created when using
port 0), then verify `/json/version` on the address reachable from the test runner.
For WSL/Windows, verify loopback first, then the Windows gateway from
`ip route show default` if needed. Do not assume that a Windows loopback listener
is accessible on its gateway address. If neither address works, record the blocker;
do not change firewall rules or expose CDP publicly. No endpoint is used by default.

```bash
NOF_CDP_URL=http://127.0.0.1:<verified-port> \
NOF_QA_PROFILE='<exact absolute --user-data-dir value>' \
NOF_QA_LOAD_PATH='<exact absolute --load-extension value>' \
NOF_QA_OUT=/tmp/nof-overnight \
node scripts/nof-production-extension-smoke.mjs
```

`NOF_CDP_URLS` accepts comma-separated candidate endpoints. Each is checked with a
bounded HTTP/WebSocket handshake. WebSocket host/port is rewritten to the endpoint
that answered, accommodating Windows advertisements of `localhost`. The first
reachable browser must pass the ownership check. If the Windows extension worker
is idle and cannot be discovered, supply its known ID using `NOF_EXT_ID`.
`NOF_PYTHON` can name the Python 3 executable (default `python3`). Node 22 is required.

The smoke creates its own tabs and fulfills the permitted production-origin bridge
page locally through CDP Fetch interception. That page contains no app scripts and
does not contact the live app. It uses the actual `onMessageExternal` bridge and
actual browser DNR APIs. This is a package smoke, not a full live-app integration test.
No production blocklist target is navigated to or printed.

Checks include MV3/PING/status; all 17 loaded file hashes; production metadata;
calls to the original `getAvailableStaticRuleCount` API via a temporary delegating
tracer; ruleset enable and capacity; harmless static and dynamic redirects;
negative navigation; blocked page rendering; exact handoff parameters and absence
of the harmless target marker. A capacity refusal records fail-closed evidence
but does not count as successful production enable. No insufficient-capacity
failure is simulated in this runtime smoke.

The smoke's `finally` path clears its dynamic rules, verifies protection is off,
restores the capacity tracer, and closes only its own tabs. It writes
`production-smoke.json` and `production-blocked.png` to the output directory.
Exit 0 means every runtime check passed; exit 1 means failure; exit 2 means runtime
was skipped for missing configuration or unreachable CDP. A skipped runtime is
never a production PASS.

After the harness finishes, close only the recorded test browser process and
remove only the recorded test profile / optional copied package directory.
Keep the ZIP and report for review. No commit, push, deployment, or store upload is
part of this workflow.
