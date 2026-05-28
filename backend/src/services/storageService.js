/**
 * Optional cloud object storage for course material uploads.
 * When AWS_* (or S3-compatible) env vars are set, files are uploaded after Multer writes to disk,
 * then the local temp file is removed. Otherwise paths stay as /uploads/... (ephemeral on some hosts).
 */
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const os = require('os');
const { pipeline } = require('stream/promises');
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} = require('@aws-sdk/client-s3');

function isMaterialCloudUploadEnabled() {
  return Boolean(
    process.env.AWS_S3_BUCKET &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  );
}

function getS3Client() {
  const region = process.env.AWS_REGION || 'us-east-1';
  const cfg = { region };
  if (process.env.AWS_S3_ENDPOINT) {
    cfg.endpoint = process.env.AWS_S3_ENDPOINT;
    cfg.forcePathStyle = true;
  }
  return new S3Client(cfg);
}

function publicUrlForKey(key) {
  const cleanKey = key.replace(/^\//, '');
  const base = (process.env.AWS_S3_PUBLIC_URL_BASE || '').replace(/\/$/, '');
  if (base) return `${base}/${cleanKey}`;

  const bucket = process.env.AWS_S3_BUCKET;
  if (process.env.AWS_S3_ENDPOINT) {
    const ep = process.env.AWS_S3_ENDPOINT.replace(/\/$/, '');
    return `${ep}/${bucket}/${cleanKey}`;
  }
  const region = process.env.AWS_REGION || 'us-east-1';
  return `https://${bucket}.s3.${region}.amazonaws.com/${cleanKey}`;
}

/**
 * @param {{ localPath: string, originalName?: string, mimeType?: string, keyPrefix?: string }} opts
 * @returns {Promise<string|null>} Public URL or null if cloud upload not configured / skipped
 */
async function uploadFileFromDisk(opts) {
  if (!isMaterialCloudUploadEnabled()) return null;

  const { localPath, originalName, mimeType, keyPrefix = 'materials' } = opts;
  const ext = path.extname(originalName || localPath || '');
  const cleanPrefix = keyPrefix.replace(/^\/+|\/+$/g, '') || 'materials';
  const key = `${cleanPrefix}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  const client = getS3Client();
  const Body = fs.createReadStream(localPath);
  const ContentType = mimeType || 'application/octet-stream';

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body,
      ContentType,
    })
  );

  return publicUrlForKey(key);
}

function uploadMaterialFromDisk(opts) {
  return uploadFileFromDisk({ ...opts, keyPrefix: 'materials' });
}

function uploadCourseThumbnailFromDisk(opts) {
  return uploadFileFromDisk({ ...opts, keyPrefix: 'course-thumbnails' });
}

/**
 * Best-effort delete when removing a material record (only for http(s) URLs we likely uploaded).
 */
async function deleteMaterialAtUrlIfCloud(publicUrl) {
  if (!isMaterialCloudUploadEnabled() || !publicUrl || !/^https?:\/\//i.test(publicUrl)) return;

  const key = extractKeyFromPublicUrl(publicUrl);
  if (!key) return;

  try {
    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key,
      })
    );
  } catch (err) {
    console.error('S3 delete failed (non-fatal):', err.message);
  }
}

function extractKeyFromPublicUrl(url) {
  try {
    const base = (process.env.AWS_S3_PUBLIC_URL_BASE || '').replace(/\/$/, '');
    if (base && url.startsWith(base)) {
      return url.slice(base.length + 1).replace(/^\//, '');
    }
    const u = new URL(url);
    const bucket = process.env.AWS_S3_BUCKET;
    const host = (u.hostname || '').toLowerCase();
    const pathname = u.pathname.replace(/^\//, '');

    // Virtual-hosted style: https://bucket.s3.region.amazonaws.com/key
    if (bucket && host.startsWith(`${String(bucket).toLowerCase()}.`)) {
      return pathname;
    }

    // Path style: https://endpoint/bucket/key
    if (bucket && pathname.startsWith(`${bucket}/`)) {
      return pathname.slice(bucket.length + 1);
    }

    return pathname;
  } catch {
    return null;
  }
}

/**
 * Read an object from cloud storage using backend credentials.
 * Useful when bucket/object is private and not publicly readable.
 */
/**
 * Download a cloud object to a temp file (for AI transcription / analysis).
 * @returns {Promise<{ localPath: string, cleanup: () => Promise<void> } | null>}
 */
async function downloadCloudUrlToTempFile(publicUrl) {
  const cloud = await getMaterialObjectFromCloudUrl(publicUrl);
  if (!cloud?.body) return null;

  let ext = '.mp4';
  try {
    ext = path.extname(new URL(publicUrl).pathname) || '.mp4';
  } catch {
    /* keep default */
  }

  const dest = path.join(
    os.tmpdir(),
    `plp-cloud-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`
  );

  if (typeof cloud.body.pipe === 'function') {
    await pipeline(cloud.body, fs.createWriteStream(dest));
  } else if (typeof cloud.body.transformToByteArray === 'function') {
    const bytes = await cloud.body.transformToByteArray();
    await fsp.writeFile(dest, Buffer.from(bytes));
  } else {
    const chunks = [];
    for await (const chunk of cloud.body) {
      chunks.push(Buffer.from(chunk));
    }
    await fsp.writeFile(dest, Buffer.concat(chunks));
  }

  return {
    localPath: dest,
    cleanup: () => fsp.unlink(dest).catch(() => {}),
  };
}

async function getMaterialObjectFromCloudUrl(publicUrl) {
  if (!isMaterialCloudUploadEnabled() || !publicUrl || !/^https?:\/\//i.test(publicUrl)) {
    return null;
  }

  const key = extractKeyFromPublicUrl(publicUrl);
  if (!key) return null;

  const out = await getS3Client().send(
    new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    })
  );

  return {
    body: out.Body,
    contentType: out.ContentType,
    contentLength: out.ContentLength,
    etag: out.ETag,
    lastModified: out.LastModified,
  };
}

/** Remove a local file (Multer absolute path or `/uploads/...` relative to backend root). */
async function unlinkLocalUploadsPath(localPathOrRelative) {
  if (!localPathOrRelative || /^https?:\/\//i.test(localPathOrRelative)) return;
  let abs;
  if (path.isAbsolute(localPathOrRelative)) {
    abs = localPathOrRelative;
  } else {
    const rel = localPathOrRelative.replace(/^\//, '');
    if (!rel.startsWith('uploads')) return;
    abs = path.join(__dirname, '..', '..', rel);
  }
  await fsp.unlink(abs).catch(() => {});
}

module.exports = {
  isMaterialCloudUploadEnabled,
  uploadFileFromDisk,
  uploadMaterialFromDisk,
  uploadCourseThumbnailFromDisk,
  deleteMaterialAtUrlIfCloud,
  getMaterialObjectFromCloudUrl,
  downloadCloudUrlToTempFile,
  unlinkLocalUploadsPath,
};
