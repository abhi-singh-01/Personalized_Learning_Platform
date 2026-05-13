/**
 * localStorage helpers for in-progress quiz state (survives refresh and tab close).
 * Payloads are wrapped with a TTL so stale drafts are removed automatically.
 */

const WRAP_VERSION = 1;

/** Default retention for saved in-progress quizzes */
export const QUIZ_DRAFT_TTL_HOURS = 24;
export const QUIZ_DRAFT_TTL_MS = QUIZ_DRAFT_TTL_HOURS * 60 * 60 * 1000;

function writeWrapped(key, data, ttlMs) {
  const wrapped = {
    _wrap: WRAP_VERSION,
    savedAt: Date.now(),
    ttlMs,
    data,
  };
  localStorage.setItem(key, JSON.stringify(wrapped));
}

/** One-time migration from legacy sessionStorage drafts (same keys). */
function migrateFromSessionStorageIfNeeded(key) {
  try {
    if (localStorage.getItem(key)) return;
    const raw = sessionStorage.getItem(key);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed?.v === 1) {
      writeWrapped(key, parsed, QUIZ_DRAFT_TTL_MS);
      sessionStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}

/**
 * @param {string} key
 * @returns {object|null} inner draft or null if missing / expired
 */
export function readDraftJson(key) {
  migrateFromSessionStorageIfNeeded(key);
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?._wrap === WRAP_VERSION && parsed.data != null) {
      const ttl = typeof parsed.ttlMs === 'number' ? parsed.ttlMs : QUIZ_DRAFT_TTL_MS;
      if (Date.now() - parsed.savedAt > ttl) {
        localStorage.removeItem(key);
        return null;
      }
      return parsed.data;
    }
    // Unwrapped legacy shape (same tab as old build)
    if (parsed?.v === 1 && (parsed.quizSnapshot || parsed.phase)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * @param {string} key
 * @param {object} obj draft payload (must include your `v` / shape)
 * @param {number} [ttlMs] override TTL
 */
export function writeDraft(key, obj, ttlMs = QUIZ_DRAFT_TTL_MS) {
  try {
    writeWrapped(key, obj, ttlMs);
  } catch (e) {
    console.warn('[quizDraft] save failed', e);
  }
}

export function clearDraft(key) {
  try {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
