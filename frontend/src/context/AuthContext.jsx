import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import API from '../api/axios';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes idle
const TOKEN_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours max session
const LAST_ACTIVITY_KEY = 'lastActivityAt';
const LOGOUT_REASON_KEY = 'authLogoutReason';

function isAuthenticatedArea(pathname) {
  return /^\/(learner|educator|admin|profile|notifications)(\/|$)/.test(pathname);
}

function readLastActivity() {
  const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
  if (!raw) return null;
  const ts = parseInt(raw, 10);
  return Number.isFinite(ts) ? ts : null;
}

function isIdleExpired() {
  const last = readLastActivity();
  const loginTime = parseInt(localStorage.getItem('loginTime') || '', 10);
  const reference = last ?? (Number.isFinite(loginTime) ? loginTime : null);
  if (reference == null) return false;
  return Date.now() - reference > SESSION_TIMEOUT_MS;
}

function isTokenMaxAgeExpired() {
  const loginTime = localStorage.getItem('loginTime');
  if (!loginTime) return false;
  return Date.now() - parseInt(loginTime, 10) > TOKEN_MAX_AGE_MS;
}

function touchActivity() {
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
}

function clearLocalAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('loginTime');
  localStorage.removeItem(LAST_ACTIVITY_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionWarning, setSessionWarning] = useState(false);
  const idleTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const fetchedRef = useRef(false);

  const role = user?.role || 'learner';
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const logout = useCallback(async (options = {}) => {
    const { reason, redirect } = options;

    try {
      const t = localStorage.getItem('token');
      if (t) {
        await API.post('/auth/logout');
      }
    } catch { /* clear local state regardless */ }

    if (reason === 'idle') {
      sessionStorage.setItem(LOGOUT_REASON_KEY, 'idle');
    }

    clearLocalAuth();
    setUser(null);
    setSessionWarning(false);
    clearTimeout(idleTimerRef.current);
    clearTimeout(warningTimerRef.current);

    if (redirect === 'login') {
      window.location.replace(reason === 'idle' ? '/login?expired=1' : '/login');
    }
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (!user) return;
    touchActivity();
    setSessionWarning(false);
    clearTimeout(idleTimerRef.current);
    clearTimeout(warningTimerRef.current);

    warningTimerRef.current = setTimeout(() => {
      setSessionWarning(true);
    }, SESSION_TIMEOUT_MS - 2 * 60 * 1000);

    idleTimerRef.current = setTimeout(() => {
      logout({ reason: 'idle', redirect: 'login' });
    }, SESSION_TIMEOUT_MS);
  }, [user, logout]);

  const checkSessionStillValid = useCallback(() => {
    if (!localStorage.getItem('token')) return true;
    if (isIdleExpired() || isTokenMaxAgeExpired()) {
      logout({
        reason: 'idle',
        redirect: isAuthenticatedArea(window.location.pathname) ? 'login' : undefined,
      });
      return false;
    }
    return true;
  }, [logout]);

  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetIdleTimer();

    events.forEach((e) => window.addEventListener(e, handleActivity, { passive: true }));
    resetIdleTimer();

    const onReturn = () => {
      if (document.visibilityState === 'visible') {
        checkSessionStillValid();
      }
    };
    document.addEventListener('visibilitychange', onReturn);
    window.addEventListener('focus', checkSessionStillValid);
    window.addEventListener('pageshow', checkSessionStillValid);

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      document.removeEventListener('visibilitychange', onReturn);
      window.removeEventListener('focus', checkSessionStillValid);
      window.removeEventListener('pageshow', checkSessionStillValid);
      clearTimeout(idleTimerRef.current);
      clearTimeout(warningTimerRef.current);
    };
  }, [user, resetIdleTimer, checkSessionStillValid]);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const storedToken = localStorage.getItem('token');

    if (!storedToken) {
      setLoading(false);
      return;
    }

    if (isIdleExpired() || isTokenMaxAgeExpired()) {
      sessionStorage.setItem(LOGOUT_REASON_KEY, 'idle');
      clearLocalAuth();
      setLoading(false);
      if (isAuthenticatedArea(window.location.pathname)) {
        window.location.replace('/login?expired=1');
      }
      return;
    }

    const controller = new AbortController();
    API.get('/auth/me', { signal: controller.signal })
      .then((res) => {
        const freshUser = res.data.data;
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
        touchActivity();
      })
      .catch((err) => {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
        clearLocalAuth();
        setUser(null);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const persistLogin = (t, u) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('loginTime', Date.now().toString());
    touchActivity();
    setUser(u);
  };

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    const { token: t, user: u } = res.data.data;
    persistLogin(t, u);
    return u;
  };

  const googleLogin = async (idToken, role) => {
    const res = await API.post('/auth/google', { idToken, role });
    const { token: t, user: u } = res.data.data;
    persistLogin(t, u);
    return u;
  };

  const register = async (data) => {
    const res = await API.post('/auth/register', data);
    const { token: t, user: u } = res.data.data;
    persistLogin(t, u);
    return u;
  };

  const refreshUserRef = useRef(false);
  const refreshUser = async () => {
    if (refreshUserRef.current) return;
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

  const switchRole = async (targetRole, { password, idToken } = {}) => {
    const res = await API.post('/auth/switch-role', {
      targetRole,
      confirmSwitch: true,
      password: password || undefined,
      idToken: idToken || undefined,
    });
    const { token: t, user: u } = res.data.data;
    persistLogin(t, u);
    return u;
  };

  const extendSession = () => {
    touchActivity();
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
