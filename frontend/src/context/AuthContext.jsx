import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import API from '../api/axios';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes idle timeout
const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours max token age

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionWarning, setSessionWarning] = useState(false);
  const idleTimerRef = useRef(null);
  const warningTimerRef = useRef(null);

  // ── StrictMode guard: prevent double /auth/me fetch ──
  const fetchedRef = useRef(false);

  // Derived state for convenience
  const role = user?.role || 'learner';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Check if stored token has exceeded max age
  const isTokenExpired = () => {
    const loginTime = localStorage.getItem('loginTime');
    if (!loginTime) return false;
    return Date.now() - parseInt(loginTime, 10) > TOKEN_MAX_AGE_MS;
  };

  const logout = useCallback(async () => {
    // Remove server-side session (device slot)
    try {
      const t = localStorage.getItem('token');
      if (t) {
        await API.post('/auth/logout');
      }
    } catch { /* silent — clear local state regardless */ }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
    setUser(null);
    setSessionWarning(false);
    clearTimeout(idleTimerRef.current);
    clearTimeout(warningTimerRef.current);
  }, []);

  // Reset idle timer on user activity
  const resetIdleTimer = useCallback(() => {
    if (!user) return;
    setSessionWarning(false);
    clearTimeout(idleTimerRef.current);
    clearTimeout(warningTimerRef.current);

    // Show warning 2 minutes before timeout
    warningTimerRef.current = setTimeout(() => {
      setSessionWarning(true);
    }, SESSION_TIMEOUT_MS - 2 * 60 * 1000);

    // Auto logout after full timeout
    idleTimerRef.current = setTimeout(() => {
      logout();
      window.location.href = '/login?expired=1';
    }, SESSION_TIMEOUT_MS);
  }, [user, logout]);

  // Listen for user activity to reset idle timer
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetIdleTimer();

    events.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));
    resetIdleTimer(); // start the timer

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      clearTimeout(idleTimerRef.current);
      clearTimeout(warningTimerRef.current);
    };
  }, [user, resetIdleTimer]);

  // ── Initial load: restore session (StrictMode-safe) ──
  useEffect(() => {
    // Guard: skip if already fetched (React StrictMode double-mount)
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const storedToken = localStorage.getItem('token');
    const saved = localStorage.getItem('user');

    if (storedToken && saved) {
      // Check token age
      if (isTokenExpired()) {
        logout();
        setLoading(false);
        return;
      }

      // Immediately restore cached user (prevents blank flash)
      try {
        setUser(JSON.parse(saved));
      } catch {
        // Corrupted localStorage — clear it
        localStorage.removeItem('user');
      }

      // Background refresh from server
      const controller = new AbortController();
      API.get('/auth/me', { signal: controller.signal })
        .then((res) => {
          const freshUser = res.data.data;
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        })
        .catch((err) => {
          // Don't logout on abort (component unmount)
          if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
          logout();
        })
        .finally(() => setLoading(false));

      return () => controller.abort();
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    const { token: t, user: u } = res.data.data;
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('loginTime', Date.now().toString());
    setUser(u);
    return u;
  };

  const googleLogin = async (idToken, role) => {
    const res = await API.post('/auth/google', { idToken, role });
    const { token: t, user: u } = res.data.data;
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('loginTime', Date.now().toString());
    setUser(u);
    return u;
  };

  const register = async (data) => {
    const res = await API.post('/auth/register', data);
    const { token: t, user: u } = res.data.data;
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('loginTime', Date.now().toString());
    setUser(u);
    return u;
  };

  // Deduped user refresh — call this from any component
  const refreshUserRef = useRef(false);
  const refreshUser = async () => {
    if (refreshUserRef.current) return; // prevent concurrent refreshes
    refreshUserRef.current = true;
    try {
      const res = await API.get('/auth/me');
      const freshUser = res.data.data;
      setUser(freshUser);
      localStorage.setItem('user', JSON.stringify(freshUser));
    } finally {
      refreshUserRef.current = false;
    }
  };

  // Switch role with explicit confirmation + re-authentication
  const switchRole = async (targetRole, { password, idToken } = {}) => {
    const res = await API.post('/auth/switch-role', {
      targetRole,
      confirmSwitch: true,
      password: password || undefined,
      idToken: idToken || undefined,
    });
    const { token: t, user: u } = res.data.data;
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('loginTime', Date.now().toString());
    setUser(u);
    return u;
  };

  const extendSession = () => {
    localStorage.setItem('loginTime', Date.now().toString());
    resetIdleTimer();
  };

  return (
    <AuthContext.Provider value={{
      user, loading, role, token,
      login, googleLogin, register, logout, refreshUser, switchRole,
      sessionWarning, extendSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}