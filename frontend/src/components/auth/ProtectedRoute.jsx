import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { roleHomeSegment, roleMatchesAllowed } from '../../utils/rolePaths';

function loginPathForRoles(allowedRoles, pathname = '') {
  if (allowedRoles?.includes('admin')) return '/admin/login';
  if (allowedRoles?.includes('educator')) return '/login?role=educator';
  if (pathname.startsWith('/admin')) return '/admin/login';
  if (pathname.startsWith('/educator')) return '/login?role=educator';
  return '/login?role=learner';
}

/**
 * ProtectedRoute — guards authenticated routes with role checks.
 *
 * Usage:
 *   <ProtectedRoute>               → any authenticated user
 *   <ProtectedRoute allowedRoles={['learner']}>  → learners (and legacy student)
 *   <ProtectedRoute allowedRoles={['educator']}> → educators (and legacy teacher)
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // ── Still checking auth → show loading spinner (prevents blank screen) ──
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-primary-200 dark:border-primary-800 rounded-full" />
            <div className="absolute inset-0 w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium animate-pulse">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // ── Not authenticated → redirect to login ──
  if (!user) {
    return <Navigate to={loginPathForRoles(allowedRoles, location.pathname)} replace />;
  }

  // ── Role mismatch → redirect to correct dashboard ──
  if (allowedRoles && !roleMatchesAllowed(user.role, allowedRoles)) {
    const correctPath = `/${roleHomeSegment(user.role)}/dashboard`;
    return <Navigate to={correctPath} replace />;
  }

  // ── Authorized → render children ──
  return children;
}
