import { useEffect } from 'react';

function swallow(e) {
  e.preventDefault();
}

function blockCopyPasteKeys(e) {
  const ctrlOrMeta = e.ctrlKey || e.metaKey;
  if (ctrlOrMeta) {
    const k = e.key?.toLowerCase();
    if (k === 'c' || k === 'v' || k === 'x' || k === 'a') {
      e.preventDefault();
    }
  }
  if (e.shiftKey && e.key === 'Insert') {
    e.preventDefault();
  }
}

/**
 * While enabled, blocks context menu and clipboard actions at the window level
 * (best-effort; not a security boundary).
 */
export default function useQuizSecureSession(enabled) {
  useEffect(() => {
    if (!enabled) return;
    const opts = { capture: true };
    const names = ['copy', 'cut', 'paste', 'contextmenu'];
    names.forEach((n) => window.addEventListener(n, swallow, opts));
    window.addEventListener('keydown', blockCopyPasteKeys, opts);
    return () => {
      names.forEach((n) => window.removeEventListener(n, swallow, opts));
      window.removeEventListener('keydown', blockCopyPasteKeys, opts);
    };
  }, [enabled]);
}
