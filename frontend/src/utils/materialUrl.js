/**
 * Resolve a material file path to a full URL the browser can load.
 * /uploads/... must hit the backend host in production (not the Vercel SPA).
 */
export function resolveMaterialUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }

  const path = url.startsWith('/') ? url : `/${url}`;
  const apiBase = import.meta.env.VITE_API_URL || '/api';

  if (apiBase.startsWith('http')) {
    try {
      return `${new URL(apiBase).origin}${path}`;
    } catch {
      return path;
    }
  }

  const backend = import.meta.env.VITE_BACKEND_URL;
  if (backend) {
    return `${String(backend).replace(/\/$/, '')}${path}`;
  }

  return path;
}
