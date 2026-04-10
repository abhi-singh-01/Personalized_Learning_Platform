/**
 * Loads https://accounts.google.com/gsi/client and waits until window.google.accounts.id exists.
 * Safe if the script is already in index.html (async/defer) — we attach to its load event
 * or poll for readiness if it has already loaded.
 */
const GSI_URL = 'https://accounts.google.com/gsi/client';

function findGsiScript() {
  return document.querySelector(`script[src="${GSI_URL}"], script[src*="accounts.google.com/gsi/client"]`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Wait for window.google.accounts.id to exist, polling every `intervalMs`.
 * Rejects after `timeoutMs`.
 */
function waitForGsi(timeoutMs, intervalMs = 50) {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();

    const start = Date.now();
    const timer = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(timer);
        return resolve();
      }
      if (Date.now() - start > timeoutMs) {
        clearInterval(timer);
        return reject(
          new Error(
            'Google Sign-In timed out. Try refreshing the page. If this persists, confirm your domain is listed under Authorized JavaScript origins in Google Cloud Console.'
          )
        );
      }
    }, intervalMs);
  });
}

/**
 * @param {{ timeoutMs?: number }} [opts]
 * @returns {Promise<void>}
 */
export async function loadGoogleIdentityScript({ timeoutMs = 25000 } = {}) {
  if (typeof window === 'undefined') {
    throw new Error('Google Sign-In is only available in the browser.');
  }

  // Already fully loaded
  if (window.google?.accounts?.id) {
    return;
  }

  let script = findGsiScript();

  if (script) {
    // Script tag exists — it may still be loading.
    // If it hasn't loaded yet, wait for its load/error events first
    // then fall through to polling for the API object.
    const isLoaded = script.dataset.gsiLoaded === '1';
    if (!isLoaded) {
      await new Promise((resolve, reject) => {
        // Check again — maybe it loaded between our check and attaching listeners
        if (window.google?.accounts?.id) return resolve();

        const onLoad = () => {
          script.dataset.gsiLoaded = '1';
          cleanup();
          resolve();
        };
        const onError = () => {
          cleanup();
          reject(new Error('Could not load Google Sign-In script. Check your network or ad blockers.'));
        };
        const cleanup = () => {
          script.removeEventListener('load', onLoad);
          script.removeEventListener('error', onError);
        };

        script.addEventListener('load', onLoad);
        script.addEventListener('error', onError);

        // Safety: if the script already fired load before we attached, readyState will help
        // (for <script> tags, once loaded, they don't re-fire 'load').
        // Use a short timeout to handle the edge case where load already fired.
        setTimeout(() => {
          if (window.google?.accounts?.id || document.querySelector(`script[src*="accounts.google.com/gsi/client"]`)?.dataset?.gsiLoaded === '1') {
            cleanup();
            resolve();
          }
        }, 200);
      });
    }
  } else {
    // No script tag found — inject one
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = GSI_URL;
      s.async = true;
      s.defer = true;
      s.onload = () => {
        s.dataset.gsiLoaded = '1';
        resolve();
      };
      s.onerror = () => reject(new Error('Could not load Google Sign-In script. Check your network or ad blockers.'));
      document.head.appendChild(s);
    });
  }

  // Script loaded — now wait for the API object to be initialized by Google
  await waitForGsi(timeoutMs);
}
