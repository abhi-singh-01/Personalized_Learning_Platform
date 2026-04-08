import { useState, useCallback, useRef } from 'react';
import API from '../api/axios';

export default function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inflightRef = useRef(new Map()); // Dedup concurrent identical requests

  const request = useCallback(async (method, url, data = null, config = {}) => {
    // Create a dedup key for GET requests to prevent StrictMode double-fire
    const dedupKey = method === 'get' ? `${method}:${url}` : null;

    if (dedupKey && inflightRef.current.has(dedupKey)) {
      return inflightRef.current.get(dedupKey);
    }

    setLoading(true);
    setError(null);

    const promise = API({ method, url, data, ...config })
      .then((res) => {
        if (dedupKey) inflightRef.current.delete(dedupKey);
        return res.data;
      })
      .catch((err) => {
        if (dedupKey) inflightRef.current.delete(dedupKey);
        const msg = err.response?.data?.message || err.message;
        setError(msg);
        throw err;
      })
      .finally(() => {
        setLoading(false);
      });

    if (dedupKey) inflightRef.current.set(dedupKey, promise);
    return promise;
  }, []);

  const get = useCallback((url, config) => request('get', url, null, config), [request]);
  const post = useCallback((url, data, config) => request('post', url, data, config), [request]);
  const put = useCallback((url, data, config) => request('put', url, data, config), [request]);
  const del = useCallback((url, config) => request('delete', url, null, config), [request]);

  return { loading, error, get, post, put, del, setError };
}