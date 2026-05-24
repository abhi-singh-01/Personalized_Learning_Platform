/** useApi returns axios `response.data` — backend uses { success, message, data }. */
export function unwrapApiData(payload) {
  if (payload == null) return null;
  if (Array.isArray(payload)) return payload;
  if (typeof payload === 'object' && payload.data !== undefined && payload.success !== undefined) {
    return payload.data;
  }
  return payload;
}
