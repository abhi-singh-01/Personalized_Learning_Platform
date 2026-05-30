const Setting = require('../models/Setting');

const TTL_MS = 60 * 1000;
let cached = null;
let cachedAt = 0;

/** Cached platform settings — avoids a DB round-trip on every login. */
async function getCachedSettings() {
  if (cached && Date.now() - cachedAt < TTL_MS) return cached;
  cached = await Setting.findOne().lean();
  cachedAt = Date.now();
  return cached;
}

function invalidateSettingsCache() {
  cached = null;
  cachedAt = 0;
}

module.exports = { getCachedSettings, invalidateSettingsCache };
