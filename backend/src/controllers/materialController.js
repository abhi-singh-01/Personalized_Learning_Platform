const Material = require('../models/Material');
const User = require('../models/User');
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const { Readable } = require('stream');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');
const { extractYouTubeId } = require('../utils/helpers');
const { updateLearnerStreak } = require('../services/analyticsService');
const storageService = require('../services/storageService');
const {
  assertCanManageCourse,
  assertCanViewCourseContent,
  assertCanViewMaterial,
  isLearnerUser,
} = require('../services/courseAccessService');

const FILE_TYPES = new Set(['pdf', 'ppt', 'video']);

function guessContentType(fileName) {
  const ext = path.extname(fileName || '').toLowerCase();
  const map = {
    '.mp4': 'video/mp4',
    '.mpeg': 'video/mpeg',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.webm': 'video/webm',
    '.wmv': 'video/x-ms-wmv',
    '.mkv': 'video/x-matroska',
    '.pdf': 'application/pdf',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  };
  return map[ext] || 'application/octet-stream';
}

async function pipeRemoteFile(url, res, rangeHeader) {
  try {
    const cloudObject = await storageService.getMaterialObjectFromCloudUrl(url, {
      range: rangeHeader || undefined,
    });
    if (cloudObject?.body) {
      if (cloudObject.contentType) res.setHeader('Content-Type', cloudObject.contentType);
      if (cloudObject.contentLength != null) {
        res.setHeader('Content-Length', String(cloudObject.contentLength));
      }
      if (cloudObject.contentRange) res.setHeader('Content-Range', cloudObject.contentRange);
      if (cloudObject.etag) res.setHeader('ETag', cloudObject.etag);
      if (cloudObject.lastModified) {
        res.setHeader('Last-Modified', new Date(cloudObject.lastModified).toUTCString());
      }
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (cloudObject.statusCode === 206) res.status(206);

      if (typeof cloudObject.body.pipe === 'function') {
        cloudObject.body.pipe(res);
        return;
      }
      if (typeof cloudObject.body.transformToWebStream === 'function') {
        Readable.fromWeb(cloudObject.body.transformToWebStream()).pipe(res);
        return;
      }
    }
  } catch (err) {
    if (err?.name !== 'NoSuchKey') {
      console.warn('Cloud SDK stream failed, trying direct fetch:', err.message);
    }
  }

  const fetchHeaders = {};
  if (rangeHeader) fetchHeaders.Range = rangeHeader;
  const response = await fetch(url, { redirect: 'follow', headers: fetchHeaders });
  if (!response.ok && response.status !== 206) throw new AppError('File not found in cloud storage', 404);

  const contentType = response.headers.get('content-type');
  if (contentType) res.setHeader('Content-Type', contentType);
  const contentLength = response.headers.get('content-length');
  if (contentLength) res.setHeader('Content-Length', contentLength);
  const contentRange = response.headers.get('content-range');
  if (contentRange) res.setHeader('Content-Range', contentRange);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (response.status === 206) res.status(206);

  if (response.body) {
    Readable.fromWeb(response.body).pipe(res);
    return;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  res.send(buffer);
}

async function serveLocalFile(absolutePath, fileName, material, res, rangeHeader) {
  const stat = await fsp.stat(absolutePath);
  const fileSize = stat.size;
  const safeTitle = String(material.title || 'material').replace(/[^\w.\- ]+/g, '').trim() || 'material';
  const ext = path.extname(fileName);
  const contentType = guessContentType(fileName);

  res.setHeader('Content-Type', contentType);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', `inline; filename="${safeTitle}${ext}"`);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'private, max-age=3600');

  if (rangeHeader) {
    const match = /^bytes=(\d*)-(\d*)$/i.exec(rangeHeader);
    if (match) {
      let start = match[1] ? parseInt(match[1], 10) : 0;
      let end = match[2] ? parseInt(match[2], 10) : fileSize - 1;
      if (Number.isNaN(start)) start = 0;
      if (Number.isNaN(end) || end >= fileSize) end = fileSize - 1;
      if (start > end || start >= fileSize) {
        res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
        return res.end();
      }
      const chunkSize = end - start + 1;
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', chunkSize);
      return fs.createReadStream(absolutePath, { start, end }).pipe(res);
    }
  }

  res.setHeader('Content-Length', fileSize);
  return fs.createReadStream(absolutePath).pipe(res);
}

exports.create = async (req, res, next) => {
  try {
    await assertCanManageCourse(req.user, req.body.course);

    const data = { ...req.body };
    if (data.type === 'youtube' && data.url) {
      data.videoId = extractYouTubeId(data.url);
    }
    if (req.file) {
      let fileUrl = `/uploads/${req.file.filename}`;
      if (storageService.isMaterialCloudUploadEnabled()) {
        try {
          const cloudUrl = await storageService.uploadMaterialFromDisk({
            localPath: req.file.path,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
          });
          if (cloudUrl) {
            fileUrl = cloudUrl;
            await storageService.unlinkLocalUploadsPath(req.file.path);
          }
        } catch (err) {
          console.error('Cloud upload failed; using local /uploads path:', err.message);
        }
      }
      data.fileUrl = fileUrl;
    }
    const count = await Material.countDocuments({ course: data.course });
    data.order = count;

    const material = await Material.create(data);
    sendResponse(res, 201, 'Material uploaded', material);
  } catch (err) { next(err); }
};

exports.getByCourse = async (req, res, next) => {
  try {
    await assertCanViewCourseContent(req.user, req.params.courseId);
    const materials = await Material.find({ course: req.params.courseId }).sort({ order: 1 });
    sendResponse(res, 200, 'Materials fetched', materials);
  } catch (err) { next(err); }
};

exports.reorderCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      throw new AppError('orderedIds must be a non-empty array', 400);
    }

    await assertCanManageCourse(req.user, courseId);

    const materials = await Material.find({ course: courseId }).select('_id').lean();
    if (materials.length !== orderedIds.length) {
      throw new AppError('Order list must include every material for this course', 400);
    }

    const valid = new Set(materials.map((m) => m._id.toString()));
    for (const id of orderedIds) {
      if (!valid.has(String(id))) throw new AppError('Invalid material id in order list', 400);
    }

    const bulk = orderedIds.map((id, order) => ({
      updateOne: {
        filter: { _id: id, course: courseId },
        update: { $set: { order } },
      },
    }));
    await Material.bulkWrite(bulk);
    const updated = await Material.find({ course: courseId }).sort({ order: 1 });
    sendResponse(res, 200, 'Materials reordered', updated);
  } catch (err) { next(err); }
};

exports.trackView = async (req, res, next) => {
  try {
    await assertCanViewMaterial(req.user, req.params.id);
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalMaterialsViewed: 1 } });
    if (isLearnerUser(req.user)) await updateLearnerStreak(req.user._id);
    sendResponse(res, 200, 'View tracked');
  } catch (err) { next(err); }
};

exports.serveFile = async (req, res, next) => {
  try {
    const material = await assertCanViewMaterial(req.user, req.params.id);
    if (!FILE_TYPES.has(material.type)) throw new AppError('This material does not have a protected file', 400);
    if (!material.fileUrl) throw new AppError('No file found for this material', 404);

    const rangeHeader = req.headers.range;

    if (/^https?:\/\//i.test(material.fileUrl)) {
      res.setHeader('Cache-Control', 'private, max-age=3600');
      await pipeRemoteFile(material.fileUrl, res, rangeHeader);
      return;
    }

    const relativePath = material.fileUrl.replace(/^\/+/, '');
    if (!relativePath.startsWith('uploads/')) throw new AppError('Invalid file path', 400);

    const fileName = path.basename(relativePath);
    const absolutePath = path.join(__dirname, '..', '..', 'uploads', fileName);

    try {
      await fsp.access(absolutePath, fs.constants.R_OK);
    } catch {
      throw new AppError(
        'This file is no longer on the server. Ask the educator to re-upload the material.',
        404
      );
    }

    await serveLocalFile(absolutePath, fileName, material, res, rangeHeader);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id).populate('course');
    if (!material) throw new AppError('Material not found', 404);
    await assertCanManageCourse(req.user, material.course);

    const prevType = material.type;
    const prevFileUrl = material.fileUrl || '';

    const keys = ['title', 'description', 'type', 'url', 'content'];
    keys.forEach(k => {
      if (req.body[k] !== undefined) material[k] = req.body[k];
    });

    const newType = material.type;
    if (FILE_TYPES.has(prevType) && !FILE_TYPES.has(newType) && prevFileUrl) {
      await storageService.deleteMaterialAtUrlIfCloud(prevFileUrl);
      await storageService.unlinkLocalUploadsPath(prevFileUrl);
      material.fileUrl = '';
    }
    if (newType === 'youtube' && prevType !== 'youtube') {
      material.fileUrl = '';
    }
    if (FILE_TYPES.has(newType)) {
      material.videoId = '';
      material.url = '';
    }

    if (material.type === 'youtube' && req.body.url) {
      material.videoId = extractYouTubeId(req.body.url);
    }

    if (req.file) {
      const prevUrl = material.fileUrl;
      let fileUrl = `/uploads/${req.file.filename}`;
      if (storageService.isMaterialCloudUploadEnabled()) {
        try {
          const cloudUrl = await storageService.uploadMaterialFromDisk({
            localPath: req.file.path,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
          });
          if (cloudUrl) {
            fileUrl = cloudUrl;
            await storageService.unlinkLocalUploadsPath(req.file.path);
          }
        } catch (err) {
          console.error('Cloud upload failed; using local /uploads path:', err.message);
        }
      }
      material.fileUrl = fileUrl;
      if (prevUrl && prevUrl !== fileUrl) {
        await storageService.deleteMaterialAtUrlIfCloud(prevUrl);
        await storageService.unlinkLocalUploadsPath(prevUrl);
      }
    }

    await material.save();
    sendResponse(res, 200, 'Material updated successfully', material);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id).populate('course');
    if (!material) throw new AppError('Material not found', 404);
    await assertCanManageCourse(req.user, material.course);
    const { fileUrl } = material;
    await material.deleteOne();
    await storageService.deleteMaterialAtUrlIfCloud(fileUrl);
    await storageService.unlinkLocalUploadsPath(fileUrl);
    sendResponse(res, 200, 'Material deleted');
  } catch (err) { next(err); }
};