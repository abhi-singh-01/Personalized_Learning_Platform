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
  const fetchedRef = useRef(false); // Prevent duplicate /auth/me calls (StrictMode)

  // Check if stored token has exceeded max age
  const isTokenExpired = () => {
    const loginTime = localStorage.getItem('loginTime');
    if (!loginTime) return false;
    return Date.now() - parseInt(loginTime, 10) > TOKEN_MAX_AGE_MS;
  };

  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) await API.post('/auth/logout');
    } catch { /* silent */ }

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

    warningTimerRef.current = setTimeout(() => {
      setSessionWarning(true);
    }, SESSION_TIMEOUT_MS - 2 * 60 * 1000);

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
    resetIdleTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      clearTimeout(idleTimerRef.current);
      clearTimeout(warningTimerRef.current);
    };
  }, [user, resetIdleTimer]);

  // Initial load: restore session — runs ONCE even in StrictMode
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');

    if (token && saved) {
      if (isTokenExpired()) {
        logout();
        setLoading(false);
        return;
      }

      // Immediately restore cached user (prevents blank screen)
      setUser(JSON.parse(saved));

      // Validate with server (single call)
      API.get('/auth/me')
        .then((res) => {
          const freshUser = res.data.data;
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    const { token, user: u } = res.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('loginTime', Date.now().toString());
    setUser(u);
    return u;
  };

  const googleLogin = async (idToken, role) => {
    const res = await API.post('/auth/google', { idToken, role });
    const { token, user: u } = res.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('loginTime', Date.now().toString());
    setUser(u);
    return u;
  };

  const register = async (data) => {
    const res = await API.post('/auth/register', data);
    const { token, user: u } = res.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('loginTime', Date.now().toString());
    setUser(u);
    return u;
  };

  const refreshUser = async () => {
    const res = await API.get('/auth/me');
    const freshUser = res.data.data;
    setUser(freshUser);
    localStorage.setItem('user', JSON.stringify(freshUser));
  };

  const extendSession = () => {
    localStorage.setItem('loginTime', Date.now().toString());
    resetIdleTimer();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, register, logout, refreshUser, sessionWarning, extendSession }}>
      {children}
    </AuthContext.Provider>
  );
}