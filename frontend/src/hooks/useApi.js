import { useState, useCallback } from 'react';
import API from '../api/axios';

export default function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (method, url, data = null, config = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await API({ method, url, data, ...config });
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const get = (url, config) => request('get', url, null, config);
  const post = (url, data, config) => request('post', url, data, config);
  const put = (url, data, config) => request('put', url, data, config);
  const del = (url, config) => request('delete', url, null, config);

  return { loading, error, get, post, put, del, setError };
}