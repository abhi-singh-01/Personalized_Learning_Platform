import { useCallback, useEffect, useRef, useState } from 'react';
import { loadGoogleIdentityScript } from '../../lib/loadGoogleIdentityScript';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/** Off-screen but sized so Google's iframe/button can mount reliably */
const HIDDEN_HOST_STYLE = {
  position: 'fixed',
  left: '-9999px',
  top: '0',
  width: '320px',
  height: '48px',
  opacity: 0.02,
  pointerEvents: 'none',
  zIndex: -1,
  overflow: 'visible',
};

/**
 * Google Identity Services — custom branded button + hidden native renderButton.
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

    (async () => {
      try {
        await loadGoogleIdentityScript();
        if (cancelled) return;

        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          auto_select: false,
          callback: async (response) => {
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
          },
        });

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

        if (!cancelled) {
          setGsiStatus('ready');
          setGsiMessage('');
        }
      } catch (e) {
        if (cancelled) return;
        const msg = e?.message || 'Google Sign-In could not start.';
        setGsiStatus('error');
        setGsiMessage(msg);
        onGsiErrorRef.current?.(msg);
      }
    })();

    return () => {
      cancelled = true;
      try {
        window.google?.accounts?.id?.cancel();
      } catch {
        /* ignore */
      }
    };
  }, [mode]);

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
    const nativeBtn = hostRef.current?.querySelector('div[role="button"]');
    if (nativeBtn) {
      nativeBtn.click();
      return;
    }
    const msg =
      'Google button did not initialize. Refresh the page. If the console shows origin_mismatch, add your exact Vercel URL (https://…, no trailing slash) under Authorized JavaScript origins in Google Cloud Console.';
    setGsiMessage(msg);
    onGsiErrorRef.current?.(msg);
  }, [gsiStatus]);

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
      {/* Hidden native GSI control — must keep non-zero layout box */}
      <div ref={hostRef} style={HIDDEN_HOST_STYLE} aria-hidden="true" />

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
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{gsiMessage}</p>
      )}
    </div>
  );
}
