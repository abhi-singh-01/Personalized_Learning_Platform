/**
 * Map auth API portal errors to the correct sign-in page (admin only).
 * Learner/educator cross-portal mismatches return generic invalid credentials — no redirect.
 * @returns {{ path: string, toast: string } | null}
 */
export function getAuthPortalRedirect(message) {
  const lower = String(message || '').toLowerCase();

  if (lower.includes('admin sign in') || lower.includes('administrator only')) {
    return {
      path: '/admin/login',
      toast: 'This account is an administrator. Opening admin sign in…',
    };
  }

  return null;
}

function normalizePortalRole(role) {
  if (role === 'teacher') return 'educator';
  if (role === 'student') return 'learner';
  if (role === 'educator' || role === 'learner' || role === 'admin') return role;
  return null;
}

function portalAccessError(message, status = 403) {
  const err = new Error(message);
  err.response = { status, data: { message } };
  return err;
}

const INVALID_CREDENTIALS = 'Invalid email or password';
const INVALID_GOOGLE_SIGNIN = 'Google sign-in failed. Please try again.';

/** Block wrong-portal sign-in before storing session (defense in depth). */
export function assertClientPortalAccess(user, requestedRole, { googleAuth = false } = {}) {
  if (!user) return;

  if (user.role === 'admin') {
    if (requestedRole !== 'admin') {
      throw portalAccessError('Admin accounts must use the admin sign in page');
    }
    return;
  }

  if (requestedRole === 'admin') {
    throw portalAccessError('Access denied. This login is for platform administrators only.');
  }

  const portalRole = normalizePortalRole(requestedRole);
  if (!portalRole) {
    throw portalAccessError('Sign-in portal role is required', 400);
  }

  const userRole = normalizePortalRole(user.role);
  if (userRole === portalRole) return;

  const masked = googleAuth ? INVALID_GOOGLE_SIGNIN : INVALID_CREDENTIALS;
  const maskedStatus = 401;

  if (userRole === 'learner' && portalRole === 'educator') {
    throw portalAccessError(masked, maskedStatus);
  }

  if (userRole === 'educator' && portalRole === 'learner') {
    throw portalAccessError(masked, maskedStatus);
  }

  throw portalAccessError(masked, maskedStatus);
}
