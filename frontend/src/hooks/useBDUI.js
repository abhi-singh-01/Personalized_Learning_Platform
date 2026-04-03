import { useState, useEffect, useCallback } from 'react';
import useApi from './useApi';

/**
 * Backend-Driven UI hook
 * Fetches UI configuration for a specific screen from the backend
 * Returns grouped UI elements: banners, popups, strips, sections, etc.
 */
export default function useBDUI(screen) {
  const api = useApi();
  const [config, setConfig] = useState({
    banners: [],
    carousels: [],
    popups: [],
    strips: [],
    modals: [],
    sections: [],
    announcements: [],
  });
  const [loaded, setLoaded] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.get(`/ui-config/screen/${screen}`);
      if (res.data) {
        setConfig(res.data);
      }
      setLoaded(true);
    } catch (err) {
      console.error(`[BDUI] Failed to fetch config for screen: ${screen}`, err);
      setLoaded(true);
    }
  }, [screen]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Track impression for a specific config item
  const trackImpression = useCallback(async (configId) => {
    try {
      await api.post(`/ui-config/${configId}/impression`);
    } catch { /* silent */ }
  }, []);

  // Track click for a specific config item
  const trackClick = useCallback(async (configId) => {
    try {
      await api.post(`/ui-config/${configId}/click`);
    } catch { /* silent */ }
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
