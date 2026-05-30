/**
 * Dashboard URL segment (legacy DB roles → app routes).
 */
export function roleHomeSegment(role) {
  if (!role) return 'learner';
  if (role === 'teacher' || role === 'educator') return 'educator';
  if (role === 'student') return 'learner';
  return role;
}

export function isLearnerRole(role) {
  return role === 'learner' || role === 'student';
}

export function isEducatorRole(role) {
  return role === 'educator' || role === 'teacher';
}

/**
 * Whether user satisfies ProtectedRoute allowedRoles (single source of truth).
 */
export function roleMatchesAllowed(userRole, allowedRoles) {
  if (!allowedRoles?.length) return true;
  return allowedRoles.some((allowed) => {
    if (allowed === 'learner') return isLearnerRole(userRole);
    if (allowed === 'educator') return isEducatorRole(userRole);
    return userRole === allowed;
  });
}

/** Learner sign-in URL (default portal). */
export function learnerLoginPath(query = '') {
  return query ? `/login?${query.replace(/^\?/, '')}` : '/login';
}

/** Educator sign-in URL — dedicated path so navbar / CTAs never drop the portal role. */
export function educatorLoginPath(query = '') {
  return query ? `/educator/login?${query.replace(/^\?/, '')}` : '/educator/login';
}

/** True when the current route is the educator login portal. */
export function isEducatorLoginRoute(pathname, searchParams) {
  if (pathname === '/educator/login') return true;
  if (pathname === '/login' && searchParams?.get?.('role') === 'educator') return true;
  return false;
}
