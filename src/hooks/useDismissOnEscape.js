import { useEffect } from 'react';

/*
 * useDismissOnEscape — close an open overlay (sheet / detail) on the Escape key.
 *
 * A keyboard user must be able to dismiss a modal sheet without a pointer. Pass
 * whether the overlay is currently `active` and the `onDismiss` callback; the
 * listener is attached only while active and cleans itself up. This is the
 * minimal keyboard-dismiss affordance — a full focus-trap / focus-return pass is
 * tracked separately and intentionally out of scope here.
 */
export default function useDismissOnEscape(active, onDismiss) {
  useEffect(() => {
    if (!active || typeof window === 'undefined') return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onDismiss?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, onDismiss]);
}
