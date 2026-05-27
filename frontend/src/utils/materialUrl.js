import API from '../api/axios';

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

async function readBlobErrorMessage(blob) {
  if (!(blob instanceof Blob)) return null;
  if (!blob.type.includes('json') && blob.size > 2048) return null;
  try {
    const json = JSON.parse(await blob.text());
    return json.message || json.error || null;
  } catch {
    return null;
  }
}

export async function createProtectedMaterialObjectUrl(materialId) {
  try {
    const res = await API.get(`/materials/${materialId}/file`, { responseType: 'blob' });
    const apiMessage = await readBlobErrorMessage(res.data);
    if (apiMessage) throw new Error(apiMessage);
    if (!res.data?.size) {
      throw new Error('File is empty or unavailable. Ask the educator to re-upload it.');
    }
    return URL.createObjectURL(res.data);
  } catch (err) {
    const blobMessage = err.response?.data instanceof Blob
      ? await readBlobErrorMessage(err.response.data)
      : null;
    throw new Error(
      blobMessage ||
      err.response?.data?.message ||
      err.message ||
      'Could not open this material. Please try again.'
    );
  }
}
