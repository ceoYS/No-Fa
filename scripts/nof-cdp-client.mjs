// NoF raw CDP QA helper — a zero-dependency Chrome DevTools Protocol client.
//
// Drives an ALREADY-RUNNING Chrome/Chromium that exposes a CDP endpoint. Built on
// the Node 22 global `WebSocket` and `fetch` only: no puppeteer, no playwright, no
// repo dependency. This mirrors the driver that cleared the MVP freeze audit, so
// `npm run qa:mvp` exercises the real browser instead of asserting over source.
//
// Config (env, never user-specific hardcoded paths):
//   NOF_CDP_URL  CDP http endpoint            (default http://localhost:9222)
//   NOF_QA_OUT   screenshot/output directory  (default /tmp/nof-mvp-qa)
//
// The endpoint and output directory are intentionally configurable so this runs
// against the user's own Chrome (or CI's) without editing the file.
import fs from 'node:fs';
import path from 'node:path';

export const CDP_URL = process.env.NOF_CDP_URL || 'http://localhost:9222';
export const QA_OUT = process.env.NOF_QA_OUT || '/tmp/nof-mvp-qa';
export const VIEWPORT = { width: 390, height: 844 };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJSON(url, timeoutMs = 2500) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

// True when something answers the CDP version handshake at `base`. Used by the
// harness to decide between reuse, auto-launch, and a clear manual instruction.
export async function cdpReachable(base = CDP_URL, timeoutMs = 1500) {
  try {
    const v = await fetchJSON(`${base}/json/version`, timeoutMs);
    return !!(v && (v.webSocketDebuggerUrl || v.Browser));
  } catch {
    return false;
  }
}

// Resolve a CDP page target's websocket URL. Reuses an existing about:blank/page
// target; falls back to opening a fresh one via /json/new so a headless launch
// with no initial page still connects.
async function pickPageTarget(base) {
  let list = await fetchJSON(`${base}/json`);
  let page = Array.isArray(list) ? list.find((t) => t.type === 'page') : null;
  if (!page) {
    try {
      page = await fetchJSON(`${base}/json/new`);
    } catch {
      /* older Chrome: PUT-only; fall through to retry list */
    }
  }
  if (!page) {
    list = await fetchJSON(`${base}/json`);
    page = Array.isArray(list) ? list.find((t) => t.type === 'page') : null;
  }
  if (!page || !page.webSocketDebuggerUrl) throw new Error(`no CDP page target at ${base}`);
  return page.webSocketDebuggerUrl;
}

export class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.shots = 0;
    this.outDir = QA_OUT;
  }

  static async connect(base = CDP_URL) {
    const url = await pickPageTarget(base);
    const ws = new WebSocket(url);
    await new Promise((res, rej) => {
      ws.onopen = res;
      ws.onerror = (e) => rej(new Error(`CDP websocket error: ${e?.message || 'open failed'}`));
    });
    const c = new CDP(ws);
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && c.pending.has(m.id)) {
        const { res, rej } = c.pending.get(m.id);
        c.pending.delete(m.id);
        m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result);
      }
    };
    await c.send('Page.enable');
    await c.send('Runtime.enable');
    return c;
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          rej(new Error(`CDP timeout: ${method}`));
        }
      }, 15000);
    });
  }

  // 390x844 mobile emulation — the MVP's only supported form factor.
  async viewport(w = VIEWPORT.width, h = VIEWPORT.height) {
    await this.send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: h,
      deviceScaleFactor: 2,
      mobile: true,
    });
  }

  async goto(url, settle = 700) {
    await this.send('Page.navigate', { url });
    await sleep(settle);
  }

  async reload(settle = 700) {
    await this.send('Page.reload', {});
    await sleep(settle);
  }

  async eval(expr, awaitPromise = false) {
    const r = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise,
    });
    if (r.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.exceptionDetails));
    return r.result.value;
  }

  // Click the first visible button/link/[role=button] whose collapsed text CONTAINS
  // `text`. The freeze audit learned this can over-match (a substring like
  // "기록 지우기" also hit the trigger button before the sheet), so destructive
  // confirmations must use clickInScope() / clickExact() instead.
  async click(text, settle = 450) {
    const ok = await this.eval(`(() => {
      const els = [...document.querySelectorAll('button, a, [role="button"]')];
      const el = els.find(e => e.offsetParent !== null && e.textContent.replace(/\\s+/g,' ').trim().includes(${JSON.stringify(text)}));
      if (!el) return false; el.click(); return true;
    })()`);
    await sleep(settle);
    return ok;
  }

  // Click a button/link whose collapsed text EXACTLY equals `text` (trimmed).
  async clickExact(text, settle = 450) {
    const ok = await this.eval(`(() => {
      const els = [...document.querySelectorAll('button, a, [role="button"]')];
      const el = els.find(e => e.offsetParent !== null && e.textContent.replace(/\\s+/g,' ').trim() === ${JSON.stringify(text)});
      if (!el) return false; el.click(); return true;
    })()`);
    await sleep(settle);
    return ok;
  }

  // Click a button INSIDE `scopeSel` whose trimmed text equals `text`. This is the
  // honest way to confirm the reset sheet: scope to the open `.sheet` so the click
  // can never land on the trigger button behind the backdrop.
  async clickInScope(scopeSel, text, settle = 450) {
    const ok = await this.eval(`(() => {
      const scope = document.querySelector(${JSON.stringify(scopeSel)});
      if (!scope) return false;
      const el = [...scope.querySelectorAll('button, a, [role="button"]')]
        .find(e => e.textContent.replace(/\\s+/g,' ').trim() === ${JSON.stringify(text)});
      if (!el) return false; el.click(); return true;
    })()`);
    await sleep(settle);
    return ok;
  }

  async clickSelector(sel, settle = 450) {
    const ok = await this.eval(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); if(!el) return false; el.click(); return true; })()`);
    await sleep(settle);
    return ok;
  }

  // Drive a REAL pointer drag (mouse/touch unified) by dispatching PointerEvents:
  // pointerdown on `sel` at its centre, two pointermove steps toward a target inside
  // `stageSel`, then pointerup. This exercises the component's actual pointer-drag
  // path (the same one a finger/mouse takes), so a reposition can be asserted on the
  // rendered DOM rather than faked. toXFrac/toYFrac are fractions of the stage rect.
  async pointerDrag(sel, toXFrac, toYFrac, stageSel = '.room-decorator-stage', settle = 350) {
    const ok = await this.eval(`(() => {
      const el = document.querySelector(${JSON.stringify(sel)});
      const stage = document.querySelector(${JSON.stringify(stageSel)});
      if (!el || !stage) return false;
      const r = el.getBoundingClientRect();
      const sr = stage.getBoundingClientRect();
      const x1 = r.left + r.width / 2, y1 = r.top + r.height / 2;
      const x2 = sr.left + sr.width * ${Number(toXFrac)}, y2 = sr.top + sr.height * ${Number(toYFrac)};
      const mk = (type, x, y) => new PointerEvent(type, { clientX: x, clientY: y, bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', button: 0 });
      el.dispatchEvent(mk('pointerdown', x1, y1));
      window.dispatchEvent(mk('pointermove', (x1 + x2) / 2, (y1 + y2) / 2));
      window.dispatchEvent(mk('pointermove', x2, y2));
      window.dispatchEvent(mk('pointerup', x2, y2));
      return true;
    })()`);
    await sleep(settle);
    return ok;
  }

  // React-safe text entry: use the native value setter then dispatch a bubbling
  // 'input' event so React's onChange fires (plain el.value = x does not).
  async type(sel, val, settle = 180) {
    const ok = await this.eval(`(() => {
      const el = document.querySelector(${JSON.stringify(sel)});
      if (!el) return false;
      const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setter.call(el, ${JSON.stringify(val)});
      el.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    })()`);
    await sleep(settle);
    return ok;
  }

  async text() {
    return this.eval('document.body.innerText');
  }

  async has(s) {
    return this.eval(`document.body.innerText.includes(${JSON.stringify(s)})`);
  }

  // Poll until the body text contains `s` (or timeout). Returns true on success.
  async waitForText(s, timeout = 4000, interval = 150) {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      if (await this.has(s)) return true;
      await sleep(interval);
    }
    return false;
  }

  async clearLS() {
    await this.eval('localStorage.clear()');
  }

  async setLS(key, val) {
    await this.eval(`localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(val)})`);
  }

  async getLS(key) {
    return this.eval(`localStorage.getItem(${JSON.stringify(key)})`);
  }

  // Horizontal-overflow probe at the current viewport: any element wider than the
  // document client width is a critical 390px clip. Returns the offenders (capped).
  async overflow() {
    return this.eval(`(() => {
      const vw = document.documentElement.clientWidth;
      const bad = [...document.querySelectorAll('*')]
        .filter(e => e.getBoundingClientRect().width > vw + 1)
        .map(e => (e.className && typeof e.className === 'string' ? e.className.split(' ')[0] : e.tagName))
        .slice(0, 8);
      return { vw, docScrollW: document.documentElement.scrollWidth, bad };
    })()`);
  }

  // Screenshot to NOF_QA_OUT (default /tmp/nof-mvp-qa) — outside the repo so QA
  // artifacts are never committed.
  async shot(name) {
    const r = await this.send('Page.captureScreenshot', { format: 'png' });
    fs.mkdirSync(this.outDir, { recursive: true });
    const p = path.join(this.outDir, `${String(++this.shots).padStart(2, '0')}_${name}.png`);
    fs.writeFileSync(p, Buffer.from(r.data, 'base64'));
    return p;
  }

  sleep(ms) {
    return sleep(ms);
  }

  close() {
    try {
      this.ws.close();
    } catch {
      /* already closed */
    }
  }
}
