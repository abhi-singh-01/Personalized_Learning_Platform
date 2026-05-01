import { useCallback, useEffect, useRef, useState } from 'react';
import { loadGoogleIdentityScript } from '../../lib/loadGoogleIdentityScript';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 2000;

/**
 * How long (ms) to wait after renderButton for the native div[role="button"]
 * to appear inside the hidden host element. If it doesn't show up, the
 * component falls back to google.accounts.id.prompt().
 */
const RENDER_WAIT_MS = 1500;

/**
 * Google Identity Services — custom branded button that works reliably
 * on all deployments (localhost, Vercel, etc.).
 *
 * Strategy:
 *  1. Initialize GSI + call renderButton in a hidden host.
 *  2. Wait briefly to see if Google renders div[role="button"].
 *  3. If yes → clicking our custom button triggers the native one.
 *  4. If no  → clicking our custom button calls google.accounts.id.prompt()
 *     which opens the One Tap / account chooser popup programmatically.
 *
 * @param {object} props
 * @param {'signin'|'signup'} props.mode
 * @param {(credential: string) => Promise<void>} props.onCredential
 * @param {(message: string) => void} [props.onGsiError]
 * @param {boolean} [props.disabled]
 * @param {React.ReactNode | ((busy: boolean) => React.ReactNode)} [props.children]
 * @param {string} [props.className]
 */
export default function GoogleSignInButton({
  mode = 'signin',
  onCredential,
  onGsiError,
  disabled = false,
  children,
  className = '',
}) {
  const hostRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  const onGsiErrorRef = useRef(onGsiError);
  const [gsiStatus, setGsiStatus] = useState('loading'); // loading | ready | error | no_client
  const [gsiMessage, setGsiMessage] = useState('');
  const [flowPending, setFlowPending] = useState(false);
  const [initKey, setInitKey] = useState(0); // bump to trigger re-init
  const hasNativeBtn = useRef(false); // tracks whether renderButton produced a clickable element
  const gsiInitialized = useRef(false); // tracks whether google.accounts.id.initialize was called

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);
  useEffect(() => {
    onGsiErrorRef.current = onGsiError;
  }, [onGsiError]);

  useEffect(() => {
    if (!CLIENT_ID || String(CLIENT_ID).trim() === '') {
      setGsiStatus('no_client');
      setGsiMessage('Google Sign-In is not configured (missing VITE_GOOGLE_CLIENT_ID).');
      return;
    }

    let cancelled = false;
    hasNativeBtn.current = false;
    gsiInitialized.current = false;

    const handleCredentialResponse = async (response) => {
      if (!response?.credential) {
        const msg = 'Google did not return a credential.';
        setGsiMessage(msg);
        onGsiErrorRef.current?.(msg);
        return;
      }
      setFlowPending(true);
      try {
        await onCredentialRef.current(response.credential);
      } catch (err) {
        const msg = err?.response?.data?.message || err?.message || 'Google sign-in failed';
        setGsiMessage(msg);
        onGsiErrorRef.current?.(msg);
      } finally {
        setFlowPending(false);
      }
    };

    const initGsi = async (attempt = 0) => {
      try {
        setGsiStatus('loading');
        setGsiMessage('');

        await loadGoogleIdentityScript();
        if (cancelled) return;

        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: handleCredentialResponse,
        });
        gsiInitialized.current = true;

        // Try rendering the native button in a hidden host
        const el = hostRef.current;
        if (el && !cancelled) {
          el.innerHTML = '';
          window.google.accounts.id.renderButton(el, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: mode === 'signup' ? 'signup_with' : 'continue_with',
            width: 300,
            locale: typeof navigator !== 'undefined' ? navigator.language : undefined,
          });
        }

        // Wait briefly for the native button to materialize
        await new Promise((r) => setTimeout(r, RENDER_WAIT_MS));
        if (cancelled) return;

        const nativeBtn = hostRef.current?.querySelector('div[role="button"]');
        hasNativeBtn.current = !!nativeBtn;

        if (hasNativeBtn.current) {
          console.info('[GSI] Native button rendered successfully.');
        } else {
          console.info('[GSI] Native button not rendered — will use prompt() fallback.');
        }

        if (!cancelled) {
          setGsiStatus('ready');
          setGsiMessage('');
        }
      } catch (e) {
        if (cancelled) return;

        // Auto-retry on failure
        if (attempt < MAX_RETRIES) {
          console.warn(`[GSI] Attempt ${attempt + 1} failed, retrying in ${RETRY_DELAY_MS}ms…`, e?.message);
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          if (!cancelled) return initGsi(attempt + 1);
          return;
        }

        const msg = e?.message || 'Google Sign-In could not start.';
        setGsiStatus('error');
        setGsiMessage(msg);
        onGsiErrorRef.current?.(msg);
      }
    };

    initGsi(0);

    return () => {
      cancelled = true;
      try {
        window.google?.accounts?.id?.cancel();
      } catch {
        /* ignore */
      }
    };
  }, [mode, initKey]);

  // Manual retry from error state
  const retryInit = useCallback(() => {
    setInitKey((k) => k + 1);
  }, []);

  const triggerNative = useCallback(() => {
    setGsiMessage('');
    if (!CLIENT_ID) {
      const msg = 'Google Client ID is not configured.';
      setGsiMessage(msg);
      onGsiErrorRef.current?.(msg);
      return;
    }
    if (gsiStatus !== 'ready') {
      const msg =
        gsiStatus === 'loading'
          ? 'Google Sign-In is still loading. Please wait a moment and try again.'
          : gsiStatus === 'error'
            ? 'Google Sign-In failed to load. Refresh the page or check your connection.'
            : 'Google Sign-In is not available.';
      setGsiMessage(msg);
      onGsiErrorRef.current?.(msg);
      return;
    }

    // Strategy 1: Click the native rendered button if it exists
    if (hasNativeBtn.current) {
      const nativeBtn = hostRef.current?.querySelector('div[role="button"]');
      if (nativeBtn) {
        nativeBtn.click();
        return;
      }
    }

    // Strategy 2: Use prompt() as fallback — opens Google's account chooser popup
    if (gsiInitialized.current && window.google?.accounts?.id) {
      console.info('[GSI] Using prompt() fallback.');
      try {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed()) {
            const reason = notification.getNotDisplayedReason();
            console.warn('[GSI] prompt() not displayed:', reason);

            // If suppressed_by_user or opt_out_or_no_session, open the popup flow via a workaround
            if (reason === 'opt_out_or_no_session' || reason === 'suppressed_by_user') {
              // Fall back to rendering a visible button briefly
              openPopupFallback();
            } else {
              setGsiMessage(
                `Google Sign-In popup was blocked (${reason}). Please allow popups or try a different browser.`
              );
            }
          } else if (notification.isSkippedMoment()) {
            console.warn('[GSI] prompt() skipped:', notification.getSkippedReason());
          }
          // If displayed, the credential callback handles the rest
        });
      } catch (err) {
        console.error('[GSI] prompt() error:', err);
        setGsiMessage('Could not open Google Sign-In. Please try refreshing the page.');
      }
      return;
    }

    // Last resort error
    setGsiMessage(
      'Google Sign-In could not initialize. Please refresh the page and try again.'
    );
    onGsiErrorRef.current?.('Google Sign-In could not initialize.');
  }, [gsiStatus]);

  /**
   * Last-resort fallback: briefly show the hidden host on-screen so Google
   * will render the button, then auto-click it.
   */
  const openPopupFallback = useCallback(() => {
    const el = hostRef.current;
    if (!el || !window.google?.accounts?.id) return;

    // Temporarily make the host visible (off-screen won't work, but we can
    // position it behind a modal overlay)
    el.style.position = 'fixed';
    el.style.left = '50%';
    el.style.top = '50%';
    el.style.transform = 'translate(-50%, -50%)';
    el.style.opacity = '1';
    el.style.zIndex = '99999';
    el.style.pointerEvents = 'auto';

    // Re-render the button now that the host is visible
    el.innerHTML = '';
    window.google.accounts.id.renderButton(el, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: mode === 'signup' ? 'signup_with' : 'continue_with',
      width: 300,
    });

    // After a short delay, check if the button appeared and click it
    setTimeout(() => {
      const btn = el.querySelector('div[role="button"]');
      if (btn) {
        btn.click();
        // Hide again after click
        setTimeout(() => {
          el.style.position = 'fixed';
          el.style.left = '-9999px';
          el.style.top = '0';
          el.style.opacity = '0.02';
          el.style.zIndex = '-1';
          el.style.pointerEvents = 'none';
          el.style.transform = '';
        }, 500);
      } else {
        // If still no button, hide and show error
        el.style.position = 'fixed';
        el.style.left = '-9999px';
        el.style.top = '0';
        el.style.opacity = '0.02';
        el.style.zIndex = '-1';
        el.style.pointerEvents = 'none';
        el.style.transform = '';
        setGsiMessage(
          'Google Sign-In is unavailable. Please check that your origin is authorized in Google Cloud Console.'
        );
      }
    }, 800);
  }, [mode]);

  const busy = flowPending || disabled;
  const buttonDisabled = busy || gsiStatus === 'loading' || gsiStatus === 'no_client';

  const label = typeof children === 'function' ? children(flowPending) : children;

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={triggerNative}
        disabled={buttonDisabled}
        className={className}
        aria-busy={flowPending}
      >
        {label}
      </button>
      {/* Hidden native GSI control — kept for the renderButton strategy */}
      <div
        ref={hostRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '0',
          width: '320px',
          height: '48px',
          opacity: 0.02,
          pointerEvents: 'none',
          zIndex: -1,
          overflow: 'visible',
        }}
        aria-hidden="true"
      />

      {gsiStatus === 'loading' && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Loading Google Sign-In…</p>
      )}
      {gsiStatus === 'no_client' && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          Set <code className="rounded bg-gray-100 px-1 dark:bg-gray-800">VITE_GOOGLE_CLIENT_ID</code> in Vercel
          Environment Variables and redeploy.
        </p>
      )}
      {gsiStatus === 'error' && gsiMessage && (
        <div className="mt-2">
          <p className="text-xs text-red-600 dark:text-red-400">{gsiMessage}</p>
          <button
            type="button"
            onClick={retryInit}
            className="mt-1 text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline"
          >
            ↻ Retry loading Google Sign-In
          </button>
        </div>
      )}
      {gsiStatus === 'ready' && gsiMessage && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{gsiMessage}</p>
      )}
    </div>
  );
}
