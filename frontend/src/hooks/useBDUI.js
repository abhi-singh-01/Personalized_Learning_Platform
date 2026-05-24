import { useState, useEffect, useCallback } from 'react';
import useApi from './useApi';
import { unwrapApiData } from '../utils/apiData';

const EMPTY = {
  banners: [],
  carousels: [],
  popups: [],
  strips: [],
  modals: [],
  sections: [],
  announcements: [],
};

/**
 * Backend-Driven UI — fetches active blocks for a screen from /api/ui-config/screen/:screen
 */
export default function useBDUI(screen) {
  const api = useApi();
  const [config, setConfig] = useState(EMPTY);
  const [loaded, setLoaded] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.get(`/ui-config/screen/${screen}`);
      const grouped = unwrapApiData(res);
      if (grouped && typeof grouped === 'object') {
        setConfig({ ...EMPTY, ...grouped });
      } else {
        setConfig(EMPTY);
      }
    } catch (err) {
      console.error(`[BDUI] Failed to fetch config for screen: ${screen}`, err);
      setConfig(EMPTY);
    } finally {
      setLoaded(true);
    }
  }, [screen]);

  useEffect(() => {
    setLoaded(false);
    fetchConfig();
  }, [fetchConfig]);

  const trackImpression = useCallback(async (configId) => {
    if (!configId) return;
    try {
      await api.post(`/ui-config/${configId}/impression`);
    } catch {
      /* silent */
    }
  }, []);

  const trackClick = useCallback(async (configId) => {
    if (!configId) return;
    try {
      await api.post(`/ui-config/${configId}/click`);
    } catch {
      /* silent */
    }
  }, []);

  return {
    ...config,
    loaded,
    loading: api.loading,
    trackImpression,
    trackClick,
    refresh: fetchConfig,
  };
}
