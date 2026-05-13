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
