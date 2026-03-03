const Material = require('../models/Material');
const Course = require('../models/Course');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');
const { extractYouTubeId } = require('../utils/helpers');
const { updateStreak } = require('../services/analyticsService');

exports.create = async (req, res, next) => {
  try {
    const course = await Course.findOne({ _id: req.body.course, teacher: req.user._id });
    if (!course) throw new AppError('Course not found or not authorized', 404);

    const data = { ...req.body };
    if (data.type === 'youtube' && data.url) {
      data.videoId = extractYouTubeId(data.url);
    }
    if (req.file) {
      data.fileUrl = `/uploads/${req.file.filename}`;
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
    if (req.user.role === 'student') await updateStreak(req.user._id);
    sendResponse(res, 200, 'View tracked');
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id).populate('course');
    if (!material) throw new AppError('Material not found', 404);
    if (material.course.teacher.toString() !== req.user._id.toString())
      throw new AppError('Not authorized', 403);

    const keys = ['title', 'description', 'type', 'url', 'content'];
    keys.forEach(k => {
      if (req.body[k] !== undefined) material[k] = req.body[k];
    });

    if (material.type === 'youtube' && req.body.url) {
      material.videoId = extractYouTubeId(req.body.url);
    }

    if (req.file) {
      material.fileUrl = `/uploads/${req.file.filename}`;
    }

    await material.save();
    sendResponse(res, 200, 'Material updated successfully', material);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const material = await Material.findById(req.params.id).populate('course');
    if (!material) throw new AppError('Material not found', 404);
    if (material.course.teacher.toString() !== req.user._id.toString())
      throw new AppError('Not authorized', 403);
    await material.deleteOne();
    sendResponse(res, 200, 'Material deleted');
  } catch (err) { next(err); }
};