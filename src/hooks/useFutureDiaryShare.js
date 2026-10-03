import { useCallback, useState } from 'react';
import { scrubFutureDiaryForShare } from '../constants/social.js';
import { getProfile, shareFutureDiary as clientShare } from '../lib/socialClient.js';

/*
 * useFutureDiaryShare — the PUBLIC copy store for 미래일기, fully separate from the private record
 * (founder §3). The private diary lives in App's nof.mvp.state.v1 and is NEVER touched here.
 *
 * Guarantees (all local, all demonstrable offline):
 *  - PRIVATE by default: nothing is shared unless the user explicitly calls shareEntry().
 *  - PUBLIC COPY separate from PRIVATE: shareEntry() writes a scrubbed whitelist copy to our OWN
 *    store (nof.social.shares.v1); it does not read or mutate the private entry.
 *  - DELETE PUBLIC ≠ DELETE PRIVATE: removeShare() deletes only from this store.
 *  - No auto-publish: without a backend, socialClient.shareFutureDiary is not_connected, so the copy
 *    stays a LOCAL draft (published:false). Nothing leaves the device yet.
 */

const KEY = 'nof.social.shares.v1';

function read() {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    /* storage unavailable — value still flows through React state */
  }
}

export function useFutureDiaryShare() {
  const [shares, setShares] = useState(read);

  // Create + persist a scrubbed public copy from a private entry (or an edited draft the user
  // approved in the preview). The edited fields win over the source entry's prose, so the user can
  // trim anything before it becomes public. Then attempt a real publish; with no backend it stays a
  // local draft (published:false) — honest, nothing uploaded.
  const shareEntry = useCallback(async (entry, edited = null) => {
    const profile = getProfile();
    const base = scrubFutureDiaryForShare(entry, { profile });
    const copy = edited
      ? {
          ...base,
          futureSelf: String(edited.futureSelf ?? base.futureSelf).trim(),
          idealDay: String(edited.idealDay ?? base.idealDay).trim(),
          feelingsEnvironment: String(edited.feelingsEnvironment ?? base.feelingsEnvironment).trim(),
        }
      : base;

    let published = false;
    const res = await clientShare(copy);
    if (res && res.ok) published = true; // only a real backend ok flips this true

    const record = { ...copy, published };
    setShares((prev) => {
      const next = [record, ...prev].slice(0, 50);
      write(next);
      return next;
    });
    return { record, backend: res };
  }, []);

  // Delete ONLY the public copy. The private diary entry is in a different store and is untouched.
  const removeShare = useCallback((id) => {
    setShares((prev) => {
      const next = prev.filter((s) => s.id !== id);
      write(next);
      return next;
    });
  }, []);

  const isShared = useCallback((privateId) => shares.some((s) => s.sourcePrivateId === privateId), [shares]);

  return { shares, shareEntry, removeShare, isShared };
}
