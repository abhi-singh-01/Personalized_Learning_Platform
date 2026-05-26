import axios from 'axios';

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isAuthRoute = err.config?.url?.includes('/auth/');
      if (!isAuthRoute) {
        const message = err.response?.data?.message || '';
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('loginTime');
        localStorage.removeItem('lastActivityAt');

        if (message.includes('Session expired') || message.includes('logged out')) {
          window.location.replace('/login?reason=session_expired');
        } else {
          window.location.replace('/login');
        }
      }
    }
    return Promise.reject(err);
  }
);

export default API;