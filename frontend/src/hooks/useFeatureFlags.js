import { useState, useEffect, useCallback } from 'react';
import useApi from './useApi';

/**
 * Feature flags hook — fetches flags for the current user from the backend
 * Returns a map of flag names to { enabled, metadata }
 */
export default function useFeatureFlags() {
  const api = useApi();
  const [flags, setFlags] = useState({});
  const [loaded, setLoaded] = useState(false);

  const fetchFlags = useCallback(async () => {
    try {
      const res = await api.get('/feature-flags/me');
      if (res.data) {
        setFlags(res.data);
      }
      setLoaded(true);
    } catch (err) {
      console.error('[FeatureFlags] Fetch error:', err);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  // Check if a specific flag is enabled
  const isEnabled = useCallback((flagName) => {
    return flags[flagName]?.enabled || false;
  }, [flags]);

  // Get metadata for a flag
  const getMeta = useCallback((flagName) => {
    return flags[flagName]?.metadata || {};
  }, [flags]);

  return {
    flags,
    loaded,
    loading: api.loading,
    isEnabled,
    getMeta,
    refresh: fetchFlags,
  };
}
