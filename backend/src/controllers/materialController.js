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

async function pipeRemoteFile(url, res) {
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new AppError('File not found in cloud storage', 404);

  const contentType = response.headers.get('content-type');
  if (contentType) res.setHeader('Content-Type', contentType);
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (response.body) {
    Readable.fromWeb(response.body).pipe(res);
    return;
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  res.send(buffer);
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

    if (/^https?:\/\//i.test(material.fileUrl)) {
      await pipeRemoteFile(material.fileUrl, res);
      return;
    }

    const relativePath = material.fileUrl.replace(/^\/+/, '');
    if (!relativePath.startsWith('uploads/')) throw new AppError('Invalid file path', 400);

    const fileName = path.basename(relativePath);
    const absolutePath = path.join(__dirname, '..', '..', 'uploads', fileName);
    const safeTitle = String(material.title || 'material').replace(/[^\w.\- ]+/g, '').trim() || 'material';
    const ext = path.extname(fileName);

    try {
      await fsp.access(absolutePath, fs.constants.R_OK);
    } catch {
      throw new AppError(
        'This file is no longer on the server. Ask the educator to re-upload the material.',
        404
      );
    }

    res.setHeader('Content-Type', guessContentType(fileName));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', `inline; filename="${safeTitle}${ext}"`);
    return res.sendFile(absolutePath, (err) => {
      if (err && !res.headersSent) {
        next(new AppError('File not found', 404));
      }
    });
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