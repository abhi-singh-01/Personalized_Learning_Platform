import DOMPurify from 'dompurify';

export function sanitizeHtml(html = '') {
  return DOMPurify.sanitize(String(html || ''), {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel'],
  });
}
