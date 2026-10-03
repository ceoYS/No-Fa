import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getSavedExtensionId,
  getExtensionStatus,
  setProtectionState,
} from '../lib/chromeExtensionBridge.js';
import {
  desiredProtectionState,
  normalizeDomainInput,
  isLikelyDomain,
} from '../constants/protection.js';

/*
 * useShieldProtection — owns the user's 기본 보호 mode + allowlist + custom block domains, and
 * syncs the COMPLETE desired state to the real Chrome extension. RC-16 (P0).
 *
 * Why a self-owned hook (not App state): App.jsx is protected/hash-pinned, so this preference
 * store lives in its own localStorage key (`nof.protection.v1`) and talks to the extension bridge
 * directly. Nothing here touches the App bundle.
 *
 * HONESTY: the extension is the enforcement truth. We persist the user's PREFERENCE locally, but
 * `status` (what the UI shows) is only ever the REAL GET_STATUS reply. When disconnected we save
 * the preference and say it will apply once connected — we never claim protection is on without a
 * real reply. All matching is local; no network, no telemetry.
 */

const KEY = 'nof.protection.v1';

function readPrefs() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      mode: ['off', 'default', 'custom'].includes(raw.mode) ? raw.mode : 'off',
      allowlist: Array.isArray(raw.allowlist) ? raw.allowlist.map(normalizeDomainInput).filter(Boolean) : [],
      userBlocks: Array.isArray(raw.userBlocks) ? raw.userBlocks.map(normalizeDomainInput).filter(Boolean) : [],
    };
  } catch {
    return { mode: 'off', allowlist: [], userBlocks: [] };
  }
}

function writePrefs(prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* storage unavailable — value still flows through React state */
  }
}

export function useShieldProtection() {
  const [prefs, setPrefs] = useState(readPrefs);
  // conn: 'idle' | 'checking' | 'connected' | 'disconnected'
  const [conn, setConn] = useState('idle');
  const [status, setStatus] = useState(null); // last REAL GET_STATUS reply (facts only)
  const [busy, setBusy] = useState(false);
  const extIdRef = useRef('');

  // Read the real extension status once on mount. Never infer "connected" from saved prefs.
  const refresh = useCallback(async () => {
    const extId = getSavedExtensionId();
    extIdRef.current = extId;
    if (!extId) {
      setConn('disconnected');
      setStatus(null);
      return null;
    }
    setConn('checking');
    const res = await getExtensionStatus(extId);
    if (res && res.ok) {
      setConn('connected');
      setStatus(res);
      return res;
    }
    setConn('disconnected');
    setStatus(null);
    return null;
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const extId = getSavedExtensionId();
      extIdRef.current = extId;
      if (!extId) {
        if (alive) setConn('disconnected');
        return;
      }
      if (alive) setConn('checking');
      const res = await getExtensionStatus(extId);
      if (!alive) return;
      if (res && res.ok) {
        setConn('connected');
        setStatus(res);
      } else {
        setConn('disconnected');
        setStatus(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Push the complete desired state for the given prefs to the extension, and adopt the REAL reply
  // as status. Returns the reply (or a { ok:false } shape). Never fabricates success.
  const push = useCallback(async (next) => {
    const extId = getSavedExtensionId();
    extIdRef.current = extId;
    if (!extId) {
      setConn('disconnected');
      return { ok: false, error: 'no_extension_id' };
    }
    setBusy(true);
    const desired = desiredProtectionState(next.mode, next);
    const res = await setProtectionState(extId, desired);
    setBusy(false);
    if (res && res.ok) {
      setConn('connected');
      setStatus(res);
    } else {
      setConn('disconnected');
    }
    return res;
  }, []);

  // Persist a preference change, then (if connected) sync it to Chrome. Save always happens so the
  // user's choice survives even offline; enforcement follows only through a real reply.
  const commit = useCallback(
    (next) => {
      setPrefs(next);
      writePrefs(next);
      return push(next);
    },
    [push],
  );

  const setMode = useCallback((mode) => commit({ ...prefs, mode }), [commit, prefs]);

  const addAllow = useCallback(
    (raw) => {
      const d = normalizeDomainInput(raw);
      if (!isLikelyDomain(d) || prefs.allowlist.includes(d)) return false;
      commit({ ...prefs, allowlist: [...prefs.allowlist, d] });
      return true;
    },
    [commit, prefs],
  );

  const removeAllow = useCallback(
    (d) => commit({ ...prefs, allowlist: prefs.allowlist.filter((x) => x !== d) }),
    [commit, prefs],
  );

  const addUserBlock = useCallback(
    (raw) => {
      const d = normalizeDomainInput(raw);
      if (!isLikelyDomain(d) || prefs.userBlocks.includes(d)) return false;
      commit({ ...prefs, userBlocks: [...prefs.userBlocks, d] });
      return true;
    },
    [commit, prefs],
  );

  const removeUserBlock = useCallback(
    (d) => commit({ ...prefs, userBlocks: prefs.userBlocks.filter((x) => x !== d) }),
    [commit, prefs],
  );

  return {
    mode: prefs.mode,
    allowlist: prefs.allowlist,
    userBlocks: prefs.userBlocks,
    conn,
    connected: conn === 'connected',
    status, // REAL facts from the extension, or null when not connected
    busy,
    refresh,
    setMode,
    addAllow,
    removeAllow,
    addUserBlock,
    removeUserBlock,
  };
}
