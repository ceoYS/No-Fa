#!/usr/bin/env node
// NoF 실드 — RC-8 extension smoke (run: `npm run qa:ext`).
//
// Automates what RC-7 proved by hand, now for the RC-8 gap: a user-authored concrete signal
// sent through SET_BLOCK_RULES becomes a REAL declarativeNetRequest *dynamic* rule, and a
// matching top-level navigation redirects to the in-app pause page. It drives an ALREADY-RUNNING
// Chrome/Chromium that has the unpacked extension loaded, over raw CDP (no puppeteer/playwright,
// no repo dependency — same client as qa:mvp).
//
// Honesty contract (identical to qa:mvp):
//   - It exercises the real bridge + real DNR redirect; it does not fake coverage.
//   - If it cannot find the loaded extension or a drivable browser, it FAILS with exact launch
//     instructions and a non-zero exit — never a green pass it did not earn.
//   - It blocks a FRESH token (not the always-on static test token), so a redirect proves the
//     DYNAMIC rule installed via SET_BLOCK_RULES, not the static rules.json demo.
//
// Config (env):
//   NOF_CDP_URL   CDP endpoint of a Chrome with the extension loaded (default http://localhost:9222)
//   NOF_APP_URL   local app URL to drive            (default http://127.0.0.1:4173/)
//   NOF_QA_OUT    screenshot dir                    (default /tmp/nof-mvp-qa)
//
// Launch recipe (WSL headless Chromium, extension loaded):
//   chromium --no-sandbox --headless=new --remote-debugging-port=9222 \
//     --remote-debugging-address=127.0.0.1 --no-first-run --disable-gpu --disable-dev-shm-usage \
//     --load-extension=<repo>/extensions/chrome-shield \
//     --disable-extensions-except=<repo>/extensions/chrome-shield \
//     --user-data-dir=/tmp/nof-qa-chrome-ext about:blank
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CDP, CDP_URL, QA_OUT, cdpReachable } from './nof-cdp-client.mjs';

const APP_URL = (process.env.NOF_APP_URL || 'http://127.0.0.1:4173/').replace(/\/+$/, '/') ;
const EXT_ID_KEY = 'nof.shieldExtensionId';
// A FRESH token, NOT the always-on static one (nof-test-risk-signal). A redirect on this token
// can ONLY come from a dynamic rule installed via SET_BLOCK_RULES — that is the RC-8 proof.
const BLOCK_TOKEN = 'nof-rc8-blocked-signal';
const ALLOW_TOKEN = 'nof-rc8-allowed-signal'; // never installed → negative control (must pass through)

const log = (s) => console.log(`[ext-smoke] ${s}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
function check(id, ok, extra = '') {
  results.push({ id, ok: !!ok, extra });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id}${extra ? ' :: ' + extra : ''}`);
}

async function httpReachable(url, timeoutMs = 1500) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    return r.status > 0;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

// Chrome derives an UNPACKED extension's id deterministically from its absolute load path:
// sha256(path) → first 32 hex nibbles, each mapped 0–f → a–p. Computing it removes the
// dependency on the (ephemeral) MV3 service-worker target appearing in /json — an idle SW
// drops out of the HTTP target list, but messaging it from the page wakes it. PING confirms.
function unpackedExtId(absPath) {
  const h = crypto.createHash('sha256').update(absPath).digest('hex');
  return h.slice(0, 32).split('').map((ch) => String.fromCharCode(97 + parseInt(ch, 16))).join('');
}
function repoExtPath() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, '..', 'extensions', 'chrome-shield');
}

// Candidate extension ids, best-first: an explicit NOF_EXT_ID override, the deterministic id
// for this repo's extension path, then any chrome-extension target still listed in /json (minus
// the Chrome component ext, thunk.js). We confirm the right one by PINGing each and matching the
// NoF name — so a wrong guess can never pass.
async function candidateExtIds(base) {
  const ids = [];
  if (process.env.NOF_EXT_ID) ids.push(process.env.NOF_EXT_ID.trim());
  ids.push(unpackedExtId(repoExtPath()));
  try {
    const list = await (await fetch(`${base}/json`)).json();
    for (const t of Array.isArray(list) ? list : []) {
      const url = t.url || '';
      if (url.includes('thunk.js')) continue; // Chrome component ext, not ours
      const m = url.match(/chrome-extension:\/\/([a-p]{32})\//);
      if (m) ids.push(m[1]);
    }
  } catch {
    /* /json may omit an idle SW; the deterministic id covers that case */
  }
  return [...new Set(ids)];
}

// Send one message to the extension FROM the app page context (externally_connectable), and
// resolve its structured reply or a { ok:false, error }. Mirrors chromeExtensionBridge.
async function extSend(c, id, message) {
  const expr = `new Promise((resolve) => {
    try {
      if (!(window.chrome && chrome.runtime && chrome.runtime.sendMessage)) {
        resolve({ ok:false, error:'no_chrome_runtime' }); return;
      }
      chrome.runtime.sendMessage(${JSON.stringify(id)}, ${JSON.stringify(message)}, (r) => {
        const e = chrome.runtime.lastError;
        resolve(e ? { ok:false, error:String(e.message || e) } : r);
      });
    } catch (e) { resolve({ ok:false, error:String((e && e.message) || e) }); }
  })`;
  return c.eval(expr, true);
}

function instructions(reason) {
  console.error('\n──────────────────────────────────────────────────────────────');
  console.error(`NoF RC-8 extension smoke: ${reason}`);
  console.error('Start a Chrome/Chromium with the unpacked extension loaded + remote debugging:');
  console.error('  chromium --no-sandbox --headless=new --remote-debugging-port=9222 \\');
  console.error('    --remote-debugging-address=127.0.0.1 --no-first-run --disable-gpu \\');
  console.error('    --disable-dev-shm-usage \\');
  console.error('    --load-extension=$(pwd)/extensions/chrome-shield \\');
  console.error('    --disable-extensions-except=$(pwd)/extensions/chrome-shield \\');
  console.error('    --user-data-dir=/tmp/nof-qa-chrome-ext about:blank');
  console.error('Then serve the app (npm run build && npm run preview -- --host 127.0.0.1 --port 4173)');
  console.error('and re-run `npm run qa:ext`. Override endpoints with NOF_CDP_URL / NOF_APP_URL.');
  console.error('──────────────────────────────────────────────────────────────\n');
}

async function main() {
  log(`RC-8 extension smoke — app=${APP_URL} cdp=${CDP_URL} out=${QA_OUT}`);

  if (!(await cdpReachable(CDP_URL))) {
    instructions(`no CDP endpoint at ${CDP_URL}`);
    process.exit(2);
  }
  if (!(await httpReachable(APP_URL))) {
    instructions(`app not reachable at ${APP_URL}`);
    process.exit(2);
  }
  const candidates = await candidateExtIds(CDP_URL);
  if (!candidates.length) {
    instructions('no chrome-extension target found (is extensions/chrome-shield loaded?)');
    process.exit(2);
  }

  const c = await CDP.connect(CDP_URL);
  try {
    await c.viewport();
    await c.goto(APP_URL, 900);

    // Identify OUR extension: PING each candidate from the app page, keep the one that answers
    // with the NoF name. A wrong id simply fails to answer — never a false pass.
    let extId = null;
    let pingRes = null;
    for (const id of candidates) {
      const r = await extSend(c, id, { type: 'PING' });
      if (r && r.ok && typeof r.name === 'string' && r.name.includes('NoF')) {
        extId = id;
        pingRes = r;
        break;
      }
    }
    check('PING', !!extId, extId ? `id=${extId} name=${pingRes.name} v=${pingRes.version}` : `tried ${candidates.length} candidate(s), none answered as NoF`);
    if (!extId) {
      instructions('extension target(s) found but none answered PING as NoF (origin not whitelisted? wrong build?)');
      throw new Error('no NoF extension answered PING');
    }

    // Persist the id the way the app does, then reload so the app page would also show connected.
    await c.setLS(EXT_ID_KEY, extId);
    await c.reload(700);

    const before = await extSend(c, extId, { type: 'GET_STATUS' });
    const baseCount = before && before.ok ? before.dynamicRuleCount : null;
    check('GET_STATUS', before && before.ok, `dynamicRuleCount(before)=${baseCount}`);

    // The RC-8 core: send a FRESH user token through SET_BLOCK_RULES → real dynamic rule.
    const set = await extSend(c, extId, { type: 'SET_BLOCK_RULES', signals: [BLOCK_TOKEN] });
    check('SET_BLOCK_RULES', set && set.ok && set.count >= 1, `count=${set && set.count}`);

    const after = await extSend(c, extId, { type: 'GET_STATUS' });
    const afterCount = after && after.ok ? after.dynamicRuleCount : null;
    check('dynamic rule installed', after && after.ok && afterCount >= 1 && (baseCount == null || afterCount > baseCount),
      `dynamicRuleCount ${baseCount} -> ${afterCount}`);

    // Positive: a local URL carrying the FRESH token must redirect to the in-extension pause page
    // — proving the DYNAMIC rule (the static rule only knows nof-test-risk-signal).
    await c.goto(`${APP_URL}?q=${BLOCK_TOKEN}`, 1300);
    const blockedHref = await c.eval('location.href');
    const redirected = new RegExp(`^chrome-extension://${extId}/blocked\\.html`).test(blockedHref);
    check('token URL → blocked.html (dynamic rule)', redirected, blockedHref);
    await c.shot('rc8_dynamic_block');

    // Negative: a NON-installed token must load the app (no false block). HOST-AGNOSTIC (RC-9):
    // prove "not blocked" STRUCTURALLY — the non-target did NOT redirect to the in-extension
    // pause page and did NOT land on a chrome-extension:// page — and confirm it stayed in the
    // app context (still carrying the allowed token, or on the app URL). NEVER hardcode the host,
    // so this same check passes against local preview AND the real production origin (nof-mauve).
    await c.goto(`${APP_URL}?q=${ALLOW_TOKEN}`, 1100);
    const allowHref = await c.eval('location.href');
    const notBlocked = !allowHref.includes('blocked.html') && !/^chrome-extension:\/\//.test(allowHref);
    const stayedInApp = allowHref.includes(ALLOW_TOKEN) || allowHref.startsWith(APP_URL.replace(/\/+$/, ''));
    const passedThrough = notBlocked && stayedInApp;
    check('non-target URL passes through', passedThrough, allowHref);
    await c.shot('rc8_passthrough');

    // Cleanup: clear the dynamic rule we installed so the browser profile is left as found.
    const cleared = await extSend(c, extId, { type: 'CLEAR_RULES' });
    check('CLEAR_RULES (cleanup)', cleared && cleared.ok, `removed=${cleared && cleared.removed}`);
  } finally {
    c.close();
  }

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n=== NoF RC-8 extension smoke: ${passed}/${results.length} checks PASS ===`);
  const fails = results.filter((r) => !r.ok);
  if (fails.length) {
    console.log('FAILED:\n' + fails.map((f) => ` - ${f.id}${f.extra ? ' :: ' + f.extra : ''}`).join('\n'));
  }
  console.log(`screenshots: ${QA_OUT}`);
  process.exit(fails.length ? 1 : 0);
}

main().catch((e) => {
  console.error('NoF RC-8 extension smoke crashed:', e?.message || e);
  if (results.length) {
    const passed = results.filter((r) => r.ok).length;
    console.log(`\n=== NoF RC-8 extension smoke: ${passed}/${results.length} checked before crash ===`);
  }
  process.exit(1);
});
