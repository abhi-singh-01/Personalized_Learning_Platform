const { FRONTEND_URL, CORS_ALLOW_VERCEL_PREVIEWS } = require('./env');

/**
 * Comma-separated origins in FRONTEND_URL, e.g.
 *   https://my-app.vercel.app,https://www.my-domain.com
 */
function listAllowedOrigins() {
  return String(FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

/**
 * @param {string|undefined} origin - Request Origin header (missing for same-origin / curl)
 */
function isOriginAllowed(origin) {
  if (!origin) return true;
  const allowed = listAllowedOrigins();
  if (allowed.includes(origin)) return true;
  if (CORS_ALLOW_VERCEL_PREVIEWS) {
    try {
      const { hostname } = new URL(origin);
      if (hostname === 'localhost' || hostname.endsWith('.vercel.app')) return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}

module.exports = { listAllowedOrigins, isOriginAllowed };
