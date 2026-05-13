const Material = require('../models/Material');
const Course = require('../models/Course');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');
const { extractYouTubeId } = require('../utils/helpers');
const { updateLearnerStreak } = require('../services/analyticsService');
const storageService = require('../services/storageService');

const FILE_TYPES = new Set(['pdf', 'ppt', 'video']);

exports.create = async (req, res, next) => {
  try {
    const course = await Course.findOne({ _id: req.body.course, educator: req.user._id });
    if (!course) throw new AppError('Course not found or not authorized', 404);

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
    const materials = await Material.find({ course: req.params.courseId }).sort({ order: 1 });
    sendResponse(res, 200, 'Materials fetched', materials);
  } catch (err) { next(err); }
};

exports.trackView = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalMaterialsViewed: 1 } });
    if (req.user.role === 'learner') await updateLearnerStreak(req.user._id);
    sendResponse(res, 200, 'View tracked');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id).populate('course');
    if (!material) throw new AppError('Material not found', 404);
    if (material.course.educator.toString() !== req.user._id.toString())
      throw new AppError('Not authorized', 403);

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
    if (material.course.educator.toString() !== req.user._id.toString())
      throw new AppError('Not authorized', 403);
    const { fileUrl } = material;
    await material.deleteOne();
    await storageService.deleteMaterialAtUrlIfCloud(fileUrl);
    await storageService.unlinkLocalUploadsPath(fileUrl);
    sendResponse(res, 200, 'Material deleted');
  } catch (err) { next(err); }
};