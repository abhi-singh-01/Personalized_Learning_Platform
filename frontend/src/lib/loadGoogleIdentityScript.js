/**
 * Loads https://accounts.google.com/gsi/client and waits until window.google.accounts.id exists.
 * Safe if the script is already in index.html (async/defer) — we only poll for readiness.
 */
const GSI_URL = 'https://accounts.google.com/gsi/client';

function findGsiScript() {
  return document.querySelector(`script[src="${GSI_URL}"], script[src*="accounts.google.com/gsi/client"]`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * @param {{ timeoutMs?: number }} [opts]
 * @returns {Promise<void>}
 */
export async function loadGoogleIdentityScript({ timeoutMs = 20000 } = {}) {
  if (typeof window === 'undefined') {
    throw new Error('Google Sign-In is only available in the browser.');
  }

  if (window.google?.accounts?.id) {
    return;
  }

  let script = findGsiScript();
  if (!script) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = GSI_URL;
      s.async = true;
      s.defer = true;
      s.onload = resolve;
      s.onerror = () => reject(new Error('Could not load Google Sign-In script. Check your network or ad blockers.'));
      document.head.appendChild(s);
    });
  }

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (window.google?.accounts?.id) {
      return;
    }
    await sleep(40);
  }

  throw new Error(
    'Google Sign-In is still loading. Try refreshing the page. If this persists, confirm your domain is listed under Authorized JavaScript origins in Google Cloud Console.'
  );
}
