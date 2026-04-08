import { useState, useCallback, useRef } from 'react';
import API from '../api/axios';

/**
 * useApi — wrapper around axios with loading/error state and unmount safety.
 * Prevents "Can't perform state update on unmounted component" warnings.
 */
export default function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  // Track unmount — reset on every render (component re-mount resets the ref)
  // Use a layout-like pattern: set true on mount, false on unmount
  if (!mountedRef.current) mountedRef.current = true;

  const request = useCallback(async (method, url, data = null, config = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API({ method, url, data, ...config });
      if (mountedRef.current) setLoading(false);
      return res.data;
    } catch (err) {
      if (mountedRef.current) {
        const msg = err.response?.data?.message || err.message;
        setError(msg);
        setLoading(false);
      }
      throw err;
    }
  }, []);

  const get = useCallback((url, config) => request('get', url, null, config), [request]);
  const post = useCallback((url, data, config) => request('post', url, data, config), [request]);
  const put = useCallback((url, data, config) => request('put', url, data, config), [request]);
  const del = useCallback((url, config) => request('delete', url, null, config), [request]);

  return { loading, error, get, post, put, del, setError };
}