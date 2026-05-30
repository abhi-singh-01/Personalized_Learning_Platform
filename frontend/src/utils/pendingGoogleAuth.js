const PENDING_GOOGLE_KEY = 'plp_pending_google_credential';

export function stashPendingGoogleCredential(credential) {
  if (credential) {
    sessionStorage.setItem(PENDING_GOOGLE_KEY, credential);
  }
}

export function consumePendingGoogleCredential() {
  const credential = sessionStorage.getItem(PENDING_GOOGLE_KEY);
  if (credential) {
    sessionStorage.removeItem(PENDING_GOOGLE_KEY);
  }
  return credential || null;
}
