#!/usr/bin/env node
// Production-package QA only. Fixture qa:ext is intentionally unchanged.
// Requires Node 22, Python 3, and an ALREADY RUNNING isolated Chromium browser.
// See extensions/chrome-shield/WEBSTORE_QA.md for launch and endpoint discovery.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STAGE = path.join(ROOT, 'dist/chrome-shield-webstore/package');
const ORIGIN = 'https://nof-mauve.vercel.app';
const BUNDLED = 'nof_bundled_blocklist';
const RESULTS = [];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const normalizePath = (value) => value.replaceAll('\\', '/').replace(/\/$/, '');
const out = process.env.NOF_QA_OUT || '/tmp/nof-overnight';

function check(id, ok, evidence = {}) {
  RESULTS.push({ id, status: ok ? 'PASS' : 'FAIL', evidence });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${id} ${JSON.stringify(evidence)}`);
  if (!ok) throw new Error(id);
}

// A browser-level connection, so we create our own tabs and never reuse a user's.
class Client {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.listeners = new Map();
    ws.onmessage = ({ data }) => {
      const message = JSON.parse(data);
      const pending = this.pending.get(message.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pending.delete(message.id);
        message.error ? pending.reject(new Error(`CDP ${pending.method} failed (code ${message.error.code})`))
          : pending.resolve(message.result);
      } else {
        this.listeners.get(`${message.sessionId || ''}:${message.method}`)?.(message.params);
      }
    };
    ws.onclose = () => {
      for (const pending of this.pending.values()) {
        clearTimeout(pending.timer);
        pending.reject(new Error('CDP disconnected'));
      }
      this.pending.clear();
    };
  }

  static async connect(endpoint) {
    const version = await (await fetch(`${endpoint}/json/version`, {
      signal: AbortSignal.timeout(2000),
    })).json();
    const url = new URL(version.webSocketDebuggerUrl);
    // Windows may advertise localhost even when reached through a WSL gateway.
    // Use only the host/port whose HTTP handshake actually succeeded.
    url.host = new URL(endpoint).host;
    url.protocol = new URL(endpoint).protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => { ws.close(); reject(new Error('CDP connection timed out')); }, 3000);
      ws.onopen = () => { clearTimeout(timer); resolve(); };
      ws.onerror = () => { clearTimeout(timer); reject(new Error('CDP connection failed')); };
    });
    return new Client(ws);
  }

  send(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, 10000);
      this.pending.set(id, { resolve, reject, timer, method });
      this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }

  async evaluate(session, expression) {
    const result = await this.send('Runtime.evaluate', {
      expression, awaitPromise: true, returnByValue: true,
    }, session);
    // Don't print exceptionDetails: a browser may include a raw ruleset in them.
    if (result.exceptionDetails) throw new Error('Browser evaluation failed (details suppressed)');
    return result.result.value;
  }

  async attach(targetId) {
    const { sessionId } = await this.send('Target.attachToTarget', { targetId, flatten: true });
    await this.send('Runtime.enable', {}, sessionId);
    return sessionId;
  }
}

async function main() {
  fs.mkdirSync(out, { recursive: true });
  // Read-only check validates CRC, exact 17-file allowlist, substitutions and the
  // sealed canonical digest. Only the packager's redacted diagnostics may escape.
  execFileSync(process.env.NOF_PYTHON || 'python3', [
    path.join(ROOT, 'scripts/package-chrome-shield-webstore.py'), '--check',
  ], { stdio: ['ignore', 'ignore', 'inherit'] });
  check('release staging and ZIP preflight', true);

  const profile = process.env.NOF_QA_PROFILE;
  const loadPath = process.env.NOF_QA_LOAD_PATH;
  const endpoints = (process.env.NOF_CDP_URLS || process.env.NOF_CDP_URL || '').split(',').filter(Boolean);
  if (!profile || !loadPath || !endpoints.length) {
    RESULTS.push({ id: 'runtime', status: 'SKIP', evidence: { reason: 'NOF_QA_PROFILE, NOF_QA_LOAD_PATH and NOF_CDP_URL(S) are required; see WEBSTORE_QA.md' } });
    process.exitCode = 2;
    return;
  }
  check('dedicated QA profile path', /(?:^|\/)nof-webstore-qa-[a-zA-Z0-9_-]{8,}$/.test(normalizePath(profile))
    && (path.isAbsolute(profile) || path.win32.isAbsolute(profile)));
  check('release package load path', normalizePath(loadPath).endsWith('/package')
    && !normalizePath(loadPath).includes('/extensions/chrome-shield'));

  let client;
  let endpoint;
  for (const candidate of endpoints) {
    try { client = await Client.connect(candidate.trim()); endpoint = candidate.trim(); break; }
    catch { /* try the next explicitly supplied address; never assume localhost */ }
  }
  if (!client) {
    RESULTS.push({ id: 'runtime', status: 'SKIP', evidence: { reason: 'No supplied CDP endpoint is reachable' } });
    process.exitCode = 2;
    return;
  }
  const tabs = [];
  let bridge;
  let worker;
  let extId;
  let cleanupNeeded = false;
  let interceptionError = false;
  const requests = [];
  const evaluate = (session, expression) => client.evaluate(session, expression);
  const send = (message) => evaluate(bridge, `new Promise(resolve => {
    const timeout = setTimeout(() => resolve({ok:false,error:'message_timeout'}), 5000);
    try {
      chrome.runtime.sendMessage(${JSON.stringify(extId)}, ${JSON.stringify(message)}, reply => {
        clearTimeout(timeout);
        resolve(chrome.runtime.lastError ? {ok:false,error:'runtime_message_failed'} : reply);
      });
    } catch { clearTimeout(timeout); resolve({ok:false,error:'runtime_unavailable'}); }
  })`);

  async function newPage() {
    const { targetId } = await client.send('Target.createTarget', { url: 'about:blank' });
    tabs.push(targetId);
    const session = await client.attach(targetId);
    await client.send('Page.enable', {}, session);
    await client.send('Network.enable', {}, session);
    client.listeners.set(`${session}:Network.requestWillBeSent`, ({ request }) => requests.push(request.url));
    client.listeners.set(`${session}:Fetch.requestPaused`, (event) => {
      const url = new URL(event.request.url);
      // No public request is continued. A tiny synthetic page exercises the real
      // production-origin message bridge without fetching or executing the app.
      const allowed = url.origin === ORIGIN || url.origin === 'http://127.0.0.1:9';
      const command = allowed ? client.send('Fetch.fulfillRequest', {
        requestId: event.requestId, responseCode: 200,
        responseHeaders: [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }],
        body: Buffer.from('<!doctype html><html><head><link rel="icon" href="data:,"></head><body>NoF production smoke control</body></html>').toString('base64'),
      }, session) : client.send('Fetch.failRequest', { requestId: event.requestId, errorReason: 'BlockedByClient' }, session);
      command.catch(() => { interceptionError = true; });
    });
    await client.send('Fetch.enable', { patterns: [
      { urlPattern: 'http://*', requestStage: 'Request' },
      { urlPattern: 'https://*', requestStage: 'Request' },
    ] }, session);
    return session;
  }

  async function navigate(session, url, expected) {
    await client.send('Page.navigate', { url }, session);
    const deadline = Date.now() + 6000;
    while (Date.now() < deadline) {
      if (await evaluate(session, `location.href === ${JSON.stringify(expected)} && document.readyState === 'complete'`)) return true;
      await sleep(100);
    }
    return false;
  }

  try {
    // --enable-automation is required for this read-only ownership check.
    // Do not create tabs or send any extension mutation until it passes.
    const { arguments: args } = await client.send('Browser.getBrowserCommandLine');
    const flag = (name) => args.filter((arg) => arg.startsWith(`${name}=`)).map((arg) => arg.slice(name.length + 1));
    check('isolated browser ownership', flag('--user-data-dir').length === 1
      && normalizePath(flag('--user-data-dir')[0]) === normalizePath(profile)
      && flag('--load-extension').length === 1
      && normalizePath(flag('--load-extension')[0]) === normalizePath(loadPath)
      && flag('--disable-extensions-except').length === 1
      && normalizePath(flag('--disable-extensions-except')[0]) === normalizePath(loadPath));
    const version = await client.send('Browser.getVersion');
    check('CDP endpoint verified', true, { endpoint, browser: version.product, protocol: version.protocolVersion });
    const { targetInfos } = await client.send('Target.getTargets');
    const target = targetInfos.find((item) => /^chrome-extension:\/\/[a-p]{32}\/service_worker\.js$/.test(item.url));
    // Unpacked Linux IDs are derived from the absolute path; an explicit ID also
    // covers idle Windows workers. PING and every packaged byte verify identity.
    extId = process.env.NOF_EXT_ID || target?.url.split('/')[2]
      || hash(loadPath).slice(0, 32).replace(/[0-9a-f]/g, (c) => String.fromCharCode(97 + parseInt(c, 16)));
    check('extension ID shape', /^[a-p]{32}$/.test(extId));
    bridge = await newPage();
    check('synthetic production-origin bridge', await navigate(bridge, `${ORIGIN}/?nof-production-smoke=bridge`, `${ORIGIN}/?nof-production-smoke=bridge`));
    const ping = await send({ type: 'PING' });
    const manifest = JSON.parse(fs.readFileSync(path.join(STAGE, 'manifest.json'), 'utf8'));
    check('PING', ping?.ok && ping.name === manifest.name && ping.version === manifest.version);
    const targets = (await client.send('Target.getTargets')).targetInfos;
    const sw = targets.find((item) => item.type === 'service_worker' && item.url === `chrome-extension://${extId}/service_worker.js`);
    check('MV3 service worker loaded', !!sw && manifest.manifest_version === 3);
    worker = await client.attach(sw.targetId);

    const names = ['manifest.json', 'blocklist-rules.json', 'blocklist-meta.js', 'THIRD_PARTY_NOTICES.md',
      'service_worker.js', 'signals.js', 'popup.html', 'popup.js', 'options.html', 'options.js',
      'blocked.html', 'blocked.js', 'rules.json', ...[16, 32, 48, 128].map((n) => `icons/icon${n}.png`)];
    const actual = await evaluate(worker, `(async () => {
      const result = {};
      for (const name of ${JSON.stringify(names)}) {
        const response = await fetch(chrome.runtime.getURL(name));
        const digest = await crypto.subtle.digest('SHA-256', await response.arrayBuffer());
        result[name] = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
      }
      return result;
    })()`);
    check('all 17 loaded files equal release staging', names.every((name) => actual[name] === hash(fs.readFileSync(path.join(STAGE, name)))));

    // Transparent tracer counts ACTUAL calls and delegates to the original API.
    // No capacity result is fabricated, and finally restores the original.
    check('capacity tracer installed', await evaluate(worker, `(() => {
      const api = chrome.declarativeNetRequest;
      if (typeof api.getAvailableStaticRuleCount !== 'function') return false;
      globalThis.__nofProductionProbe = {calls:0, original:api.getAvailableStaticRuleCount};
      const wrapper = (...args) => {
        globalThis.__nofProductionProbe.calls++;
        return globalThis.__nofProductionProbe.original.apply(api, args);
      };
      api.getAvailableStaticRuleCount = wrapper;
      return api.getAvailableStaticRuleCount === wrapper;
    })()`));
    const before = await send({ type: 'GET_STATUS' });
    check('GET_STATUS production metadata', before?.ok && before.bundled?.listType === 'production'
      && before.bundled.domainCount === 63336 && before.bundled.ruleCount === 64,
    { listType: before?.bundled?.listType, domainCount: before?.bundled?.domainCount, ruleCount: before?.bundled?.ruleCount });
    check('fresh profile starts with protection off', before.defaultProtection === false && before.dynamicRuleCount === 0);
    check('GET_STATUS calls real capacity API', await evaluate(worker, 'globalThis.__nofProductionProbe.calls') > 0
      && Number.isFinite(before.availableStaticRuleCount), { available: before.availableStaticRuleCount });
    cleanupNeeded = true;
    const callsBefore = await evaluate(worker, 'globalThis.__nofProductionProbe.calls');
    const enabled = await send({ type: 'SET_PROTECTION_STATE', defaultProtection: true, allowlist: [], userBlocks: [] });
    const ruleSets = await evaluate(worker, 'chrome.declarativeNetRequest.getEnabledRulesets()');
    check('enable path calls real capacity API', (await evaluate(worker, 'globalThis.__nofProductionProbe.calls')) >= callsBefore + 2);
    const enabledOK = enabled?.ok && enabled.defaultProtection === true && enabled.enableVerdict?.enabled === true
      && enabled.enableVerdict.capacity === 'OK' && enabled.bundled?.capacity === 'OK' && ruleSets.includes(BUNDLED);
    const closed = enabled?.ok && enabled.defaultProtection === false && enabled.enableVerdict?.enabled === false
      && enabled.enableVerdict.capacity === 'INSUFFICIENT' && !ruleSets.includes(BUNDLED);
    check('production capacity and enable verdict', enabledOK || closed, {
      enabled: enabled?.defaultProtection, capacity: enabled?.enableVerdict?.capacity,
      available: enabled?.enableVerdict?.available, needed: enabled?.enableVerdict?.needed,
      failClosed: closed, error: enabled?.enableVerdict?.error || null,
    });
    // A fail-closed capacity result is evidence, but is not a successful release enable.
    if (!enabledOK) RESULTS.push({ id: 'production ruleset enabled', status: 'FAIL', evidence: { reason: 'capacity rejected enable; protection remained off' } });
    else check('production ruleset enabled', true, { ruleset: BUNDLED });

    const page = await newPage();
    const blocked = `chrome-extension://${extId}/blocked.html`;
    check('harmless static signal redirects', await navigate(page, 'http://127.0.0.1:9/?q=nof-test-risk-signal', blocked));
    const token = `nof-production-smoke-${Date.now().toString(36)}`;
    const set = await send({ type: 'SET_BLOCK_RULES', signals: [token] });
    const after = await send({ type: 'GET_STATUS' });
    check('harmless dynamic signal installed', set?.ok && set.count === 1 && after?.dynamicRuleCount === 1);
    check('harmless dynamic signal redirects', await navigate(page, `http://127.0.0.1:9/?q=${token}`, blocked));
    check('blocked page renders without target leak', await evaluate(page, `(() => {
      const body = document.body.innerText;
      return body.includes('잠깐 멈춤') && body.includes('오늘 기록으로 남기기')
        && body.includes('잠깐 멈춤 계속하기') && !body.includes(${JSON.stringify(token)})
        && !document.documentElement.outerHTML.includes('127.0.0.1:9')
        && location.search === '' && location.hash === '' && document.referrer === '';
    })()`));
    const links = await evaluate(page, `['go-record','go-urge'].map(id => document.getElementById(id)?.href)`);
    check('handoff URLs contain only coarse destinations', links.every((href, index) => {
      const url = new URL(href);
      return url.origin === ORIGIN && url.pathname === '/' && !url.hash && !url.username && !url.password
        && url.searchParams.size === 2 && url.searchParams.get('from') === 'shield'
        && url.searchParams.get('to') === ['record', 'urge'][index];
    }), { destinations: ['record', 'urge'], parameterKeys: ['from', 'to'] });
    const { cssContentSize } = await client.send('Page.getLayoutMetrics', {}, page);
    const shot = await client.send('Page.captureScreenshot', {
      format: 'png', captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: cssContentSize.width, height: cssContentSize.height, scale: 1 },
    }, page);
    fs.writeFileSync(path.join(out, 'production-blocked.png'), Buffer.from(shot.data, 'base64'));
    const allowed = 'http://127.0.0.1:9/?q=nof-production-allowed-control';
    check('non-target navigation passes through', await navigate(page, allowed, allowed)
      && await evaluate(page, "document.body.innerText === 'NoF production smoke control'"));
    check('only harmless requests and extension resources observed', !interceptionError && requests.every((request) => {
      const url = new URL(request);
      return url.origin === ORIGIN || url.origin === 'http://127.0.0.1:9'
        || request.startsWith(`chrome-extension://${extId}/`) || url.protocol === 'data:';
    }), { requestCount: requests.length, publicRequestsFulfilledLocally: true });
  } finally {
    try {
      if (cleanupNeeded) {
        const clear = await send({ type: 'CLEAR_RULES' });
        const final = await send({ type: 'GET_STATUS' });
        const actual = await evaluate(worker, `(async () => ({
          dynamic: (await chrome.declarativeNetRequest.getDynamicRules()).length,
          enabled: await chrome.declarativeNetRequest.getEnabledRulesets(),
        }))()`);
        check('cleanup: no dynamic rules and protection off', clear?.ok && final?.ok
          && final.defaultProtection === false && final.dynamicRuleCount === 0
          && actual.dynamic === 0 && !actual.enabled.includes(BUNDLED));
      }
    } finally {
      if (worker) await evaluate(worker, `(() => {
        const probe = globalThis.__nofProductionProbe;
        if (probe) chrome.declarativeNetRequest.getAvailableStaticRuleCount = probe.original;
        delete globalThis.__nofProductionProbe;
      })()`).catch(() => RESULTS.push({ id: 'restore capacity tracer', status: 'FAIL' }));
      for (const targetId of tabs) await client.send('Target.closeTarget', { targetId }).catch(() => {});
      client.ws.close();
    }
  }
}

try {
  await main();
} catch (error) {
  // All authored errors are metadata-only. Do not dump CDP responses or rules.
  console.error(`Production smoke stopped: ${error.code || error.message}`);
  RESULTS.push({ id: 'smoke completion', status: 'FAIL', evidence: { reason: error.code || error.message } });
  process.exitCode = 1;
} finally {
  if (RESULTS.some((item) => item.status === 'FAIL')) process.exitCode = 1;
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'production-smoke.json'), JSON.stringify(RESULTS, null, 2) + '\n');
  console.log(`Production smoke: ${RESULTS.filter((r) => r.status === 'PASS').length} PASS, ${RESULTS.filter((r) => r.status === 'FAIL').length} FAIL, ${RESULTS.filter((r) => r.status === 'SKIP').length} SKIP`);
}
