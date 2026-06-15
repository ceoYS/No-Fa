/*
 * chromeExtensionBridge — honest, fail-safe bridge from the NoF web app to the
 * NoF 실드 Chrome extension (extensions/chrome-shield). RC-7.
 *
 * HONESTY NOTE: a normal web page can ONLY reach an extension that (a) lists this
 * page's origin in its manifest `externally_connectable`, AND (b) whose extension
 * ID the page knows. An unpacked dev extension gets a RANDOM id, so there is no way
 * to discover it automatically — the user pastes it (saved locally on this device).
 * We NEVER report "connected" unless a real PING round-trips with chrome.runtime
 * answering and no lastError. Every failure mode degrades to { ok:false, error }:
 * no chrome.runtime (not Chrome / no extension), no id, wrong id, policy-blocked,
 * or no response. The app must never crash on any of these. No network, no fetch.
 */

const EXT_ID_KEY = 'nof.shieldExtensionId';

// Chrome extension IDs are exactly 32 chars in a–p.
export function looksLikeExtensionId(id) {
  return /^[a-p]{32}$/.test(String(id || '').trim());
}

export function getSavedExtensionId() {
  try {
    return localStorage.getItem(EXT_ID_KEY) || '';
  } catch {
    return '';
  }
}

export function saveExtensionId(id) {
  const clean = String(id || '').trim();
  try {
    if (clean) localStorage.setItem(EXT_ID_KEY, clean);
    else localStorage.removeItem(EXT_ID_KEY);
  } catch {
    /* storage unavailable — stay silent, the value still flows through React state */
  }
  return clean;
}

// True only when this page actually has a usable extension-messaging API. For a
// normal web page, chrome.runtime is defined ONLY when an extension whitelists this
// origin; otherwise it is undefined — so this is a real capability probe, not a guess.
export function isChromeRuntimeAvailable() {
  return (
    typeof window !== 'undefined' &&
    typeof window.chrome !== 'undefined' &&
    !!window.chrome.runtime &&
    typeof window.chrome.runtime.sendMessage === 'function'
  );
}

// Send one message to a specific extension id and resolve with its structured reply,
// or a structured { ok:false, error } for every failure path. Times out so a silent
// (never-answering) extension cannot hang the UI.
function sendMessage(extId, message, timeoutMs = 2500) {
  return new Promise((resolve) => {
    if (!isChromeRuntimeAvailable()) {
      resolve({ ok: false, error: 'no_chrome_runtime' });
      return;
    }
    const id = String(extId || '').trim();
    if (!id) {
      resolve({ ok: false, error: 'no_extension_id' });
      return;
    }
    let settled = false;
    const done = (res) => {
      if (settled) return;
      settled = true;
      resolve(res);
    };
    const timer = setTimeout(() => done({ ok: false, error: 'timeout' }), timeoutMs);
    try {
      window.chrome.runtime.sendMessage(id, message, (response) => {
        clearTimeout(timer);
        // lastError is set when the extension is absent / does not whitelist this origin.
        const err = window.chrome.runtime.lastError;
        if (err) {
          done({ ok: false, error: err.message || 'runtime_error' });
          return;
        }
        if (!response || typeof response !== 'object') {
          done({ ok: false, error: 'no_response' });
          return;
        }
        done(response);
      });
    } catch (e) {
      clearTimeout(timer);
      done({ ok: false, error: String((e && e.message) || e) });
    }
  });
}

export function pingExtension(extId) {
  return sendMessage(extId, { type: 'PING' });
}

export function getExtensionStatus(extId) {
  return sendMessage(extId, { type: 'GET_STATUS' });
}

export function sendTestSignal(extId) {
  return sendMessage(extId, { type: 'SET_TEST_SIGNAL' });
}

export function clearExtensionRules(extId) {
  return sendMessage(extId, { type: 'CLEAR_RULES' });
}
