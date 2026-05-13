/**
 * Optional cloud object storage for course material uploads.
 * When AWS_* (or S3-compatible) env vars are set, files are uploaded after Multer writes to disk,
 * then the local temp file is removed. Otherwise paths stay as /uploads/... (ephemeral on some hosts).
 */
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

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
 * @param {{ localPath: string, originalName?: string, mimeType?: string }} opts
 * @returns {Promise<string|null>} Public URL or null if cloud upload not configured / skipped
 */
async function uploadMaterialFromDisk(opts) {
  if (!isMaterialCloudUploadEnabled()) return null;

  const { localPath, originalName, mimeType } = opts;
  const ext = path.extname(originalName || localPath || '');
  const key = `materials/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

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
    return u.pathname.replace(/^\//, '');
  } catch {
    return null;
  }
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
  uploadMaterialFromDisk,
  deleteMaterialAtUrlIfCloud,
  unlinkLocalUploadsPath,
};
