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

/**
 * CSP frame-ancestors for PDF/video iframes. Iframe navigations often omit Origin,
 * so include configured frontends plus Referer origin when allowed.
 */
function buildFrameAncestorsDirective(req) {
  const ancestors = new Set(["'self'"]);
  for (const allowed of listAllowedOrigins()) {
    ancestors.add(allowed);
  }

  const origin = req?.headers?.origin;
  if (origin && isOriginAllowed(origin)) {
    ancestors.add(origin);
  }

  const referer = req?.headers?.referer;
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (isOriginAllowed(refererOrigin)) {
        ancestors.add(refererOrigin);
      }
    } catch {
      /* ignore */
    }
  }

  return `frame-ancestors ${Array.from(ancestors).join(' ')}`;
}

module.exports = { listAllowedOrigins, isOriginAllowed, buildFrameAncestorsDirective };
