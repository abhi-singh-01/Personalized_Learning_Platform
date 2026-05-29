/**
 * Map auth API portal errors to the correct sign-in page.
 * @returns {{ path: string, toast: string } | null}
 */
export function getAuthPortalRedirect(message, currentPortal = 'learner') {
  const lower = String(message || '').toLowerCase();

  if (lower.includes('admin sign in') || lower.includes('administrator only')) {
    return {
      path: '/admin/login',
      toast: 'This account is an administrator. Opening admin sign in…',
    };
  }

  if (
    currentPortal !== 'educator'
    && (lower.includes('educator sign in') || lower.includes('educator account'))
  ) {
    return {
      path: '/login?role=educator',
      toast: 'This email belongs to an educator account. Opening educator sign in…',
    };
  }

  if (currentPortal === 'educator' && lower.includes('learner account')) {
    return {
      path: '/login',
      toast: 'This email belongs to a learner account. Opening learner sign in…',
    };
  }

  if (currentPortal === 'admin' && lower.includes('learner account')) {
    return {
      path: '/login',
      toast: 'This is a learner account. Opening learner sign in…',
    };
  }

  if (currentPortal === 'admin' && lower.includes('educator')) {
    return {
      path: '/login?role=educator',
      toast: 'This is an educator account. Opening educator sign in…',
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

function portalAccessError(message) {
  const err = new Error(message);
  err.response = { status: 403, data: { message } };
  return err;
}

/** Block wrong-portal sign-in before storing session (defense in depth). */
export function assertClientPortalAccess(user, requestedRole) {
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
  if (!portalRole) return;

  const userRole = normalizePortalRole(user.role);
  if (userRole === portalRole) return;

  if (userRole === 'learner' && portalRole === 'educator') {
    throw portalAccessError(
      'This is a learner account. Please sign in as a learner or switch to educator from your account.'
    );
  }

  if (userRole === 'educator' && portalRole === 'learner') {
    throw portalAccessError('This is an educator account. Please use the educator sign in page.');
  }

  throw portalAccessError('This account cannot access the selected portal');
}
