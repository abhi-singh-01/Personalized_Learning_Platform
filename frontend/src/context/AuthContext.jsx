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

  // Check if stored token has exceeded max age
  const isTokenExpired = () => {
    const loginTime = localStorage.getItem('loginTime');
    if (!loginTime) return false;
    return Date.now() - parseInt(loginTime, 10) > TOKEN_MAX_AGE_MS;
  };

  const logout = useCallback(async () => {
    // Remove server-side session (device slot)
    try {
      const token = localStorage.getItem('token');
      if (token) {
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

  // Initial load: restore session
  useEffect(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');

    if (token && saved) {
      // Check token age
      if (isTokenExpired()) {
        logout();
        setLoading(false);
        return;
      }

      setUser(JSON.parse(saved));
      API.get('/auth/me')
        .then((res) => {
          setUser(res.data.data);
          localStorage.setItem('user', JSON.stringify(res.data.data));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

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
    setUser(res.data.data);
    localStorage.setItem('user', JSON.stringify(res.data.data));
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