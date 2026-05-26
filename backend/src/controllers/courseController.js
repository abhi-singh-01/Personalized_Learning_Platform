const Course = require('../models/Course');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');
const storageService = require('../services/storageService');

const COURSE_FIELDS = [
  'title',
  'description',
  'category',
  'difficulty',
  'price',
  'currency',
  'shortDescription',
  'previewVideoUrl',
  'refundPolicy',
  'maxEnrollments',
  'enrollmentDeadline',
  'isPublished',
  'status',
];

function buildCoursePayload(body = {}) {
  const payload = {};
  COURSE_FIELDS.forEach((field) => {
    if (body[field] !== undefined) payload[field] = body[field];
  });

  if (payload.price !== undefined) payload.price = Number(payload.price) || 0;
  if (payload.maxEnrollments !== undefined) payload.maxEnrollments = Number(payload.maxEnrollments) || 0;
  if (typeof payload.isPublished === 'string') payload.isPublished = payload.isPublished === 'true';
  if (payload.enrollmentDeadline === '') delete payload.enrollmentDeadline;

  if (body.tags !== undefined) {
    payload.tags = Array.isArray(body.tags)
      ? body.tags
      : String(body.tags).split(',').map((tag) => tag.trim()).filter(Boolean);
  }

  return payload;
}

async function resolveUploadedThumbnail(file) {
  if (!file) return '';

  let thumbnailUrl = `/uploads/${file.filename}`;
  if (storageService.isMaterialCloudUploadEnabled()) {
    try {
      const cloudUrl = await storageService.uploadCourseThumbnailFromDisk({
        localPath: file.path,
        originalName: file.originalname,
        mimeType: file.mimetype,
      });
      if (cloudUrl) {
        thumbnailUrl = cloudUrl;
        await storageService.unlinkLocalUploadsPath(file.path);
      }
    } catch (err) {
      console.error('Course thumbnail cloud upload failed; using local /uploads path:', err.message);
    }
  }

  return thumbnailUrl;
}

exports.create = async (req, res, next) => {
  try {
    const payload = buildCoursePayload(req.body);
    const thumbnailUrl = await resolveUploadedThumbnail(req.file);
    if (thumbnailUrl) payload.thumbnail = thumbnailUrl;

    const course = await Course.create({ ...payload, educator: req.user._id });
    sendResponse(res, 201, 'Course created', course);
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const filter = { isPublished: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };
    const courses = await Course.find(filter)
      .populate('educator', 'name avatar')
      .sort({ createdAt: -1 });
    sendResponse(res, 200, 'Courses fetched', courses);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('educator', 'name avatar bio')
      .populate('learners', 'name avatar aiLevel');
    if (!course) throw new AppError('Course not found', 404);
    sendResponse(res, 200, 'Course details', course);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, educator: req.user._id });
    if (!course) throw new AppError('Course not found or not authorized', 404);

    const previousThumbnail = course.thumbnail;
    Object.assign(course, buildCoursePayload(req.body));

    const thumbnailUrl = await resolveUploadedThumbnail(req.file);
    if (thumbnailUrl) {
      course.thumbnail = thumbnailUrl;
      if (previousThumbnail && previousThumbnail !== thumbnailUrl) {
        await storageService.deleteMaterialAtUrlIfCloud(previousThumbnail);
        await storageService.unlinkLocalUploadsPath(previousThumbnail);
      }
    }

    await course.save();
    sendResponse(res, 200, 'Course updated', course);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const course = await Course.findOneAndDelete({ _id: req.params.id, educator: req.user._id });
    if (!course) throw new AppError('Course not found or not authorized', 404);
    await storageService.deleteMaterialAtUrlIfCloud(course.thumbnail);
    await storageService.unlinkLocalUploadsPath(course.thumbnail);
    sendResponse(res, 200, 'Course deleted');
  } catch (err) { next(err); }
};

exports.duplicateCourse = async (req, res, next) => {
  try {
    const original = await Course.findOne({ _id: req.params.id, educator: req.user._id });
    if (!original) throw new AppError('Course not found or not authorized', 404);
    const clone = await Course.create({
      title: original.title + ' (Copy)',
      description: original.description,
      category: original.category,
      thumbnail: original.thumbnail,
      educator: req.user._id,
      difficulty: original.difficulty,
      tags: original.tags,
      isPublished: false,
      price: original.price,
      currency: original.currency,
      status: 'draft',
      shortDescription: original.shortDescription,
      refundPolicy: original.refundPolicy,
      maxEnrollments: original.maxEnrollments,
    });
    sendResponse(res, 201, 'Course duplicated', clone);
  } catch (err) { next(err); }
};

exports.togglePublish = async (req, res, next) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, educator: req.user._id });
    if (!course) throw new AppError('Course not found or not authorized', 404);
    const isNowPublished = !course.isPublished;
    course.isPublished = isNowPublished;
    course.status = isNowPublished ? 'published' : 'draft';
    await course.save();
    sendResponse(res, 200, isNowPublished ? 'Course published' : 'Course unpublished', course);
  } catch (err) { next(err); }
};

exports.enroll = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw new AppError('Course not found', 404);
    if (course.learners.includes(req.user._id))
      throw new AppError('Already enrolled', 400);

    // If course is paid, require a verified payment
    if (course.price > 0) {
      const Payment = require('../models/Payment');
      const payment = await Payment.findOne({
        user: req.user._id,
        course: course._id,
        status: 'captured',
      });
      if (!payment) throw new AppError('Payment required to enroll in this course', 402);
    }

    course.learners.push(req.user._id);
    await course.save();

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { enrolledCourses: course._id },
    });

    sendResponse(res, 200, 'Enrolled successfully', course);
  } catch (err) { next(err); }
};

exports.getEducatorCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ educator: req.user._id })
      .populate('learners', 'name aiLevel engagementScore')
      .sort({ createdAt: -1 });
    sendResponse(res, 200, 'Educator courses', courses);
  } catch (err) { next(err); }
};

const CourseProgress = require('../models/CourseProgress');
exports.toggleMaterialComplete = async (req, res, next) => {
  try {
    const { id: courseId, materialId } = req.params;
    let progress = await CourseProgress.findOne({ learner: req.user._id, course: courseId });
    if (!progress) {
      progress = new CourseProgress({ learner: req.user._id, course: courseId, completedMaterials: [] });
    }

    // Toggle
    const index = progress.completedMaterials.indexOf(materialId);
    if (index > -1) {
      progress.completedMaterials.splice(index, 1);
    } else {
      progress.completedMaterials.push(materialId);
    }
    await progress.save();
    sendResponse(res, 200, 'Material completion toggled', progress);
  } catch (err) { next(err); }
};

exports.getCourseProgress = async (req, res, next) => {
  try {
    const progress = await CourseProgress.findOne({ learner: req.user._id, course: req.params.id });
    sendResponse(res, 200, 'Course progress', progress || { completedMaterials: [] });
  } catch (err) { next(err); }
};

const Comment = require('../models/Comment');
exports.getComments = async (req, res, next) => {
  try {
    const comments = await Comment.find({ course: req.params.id })
      .populate('user', 'name role avatar')
      .sort({ createdAt: -1 });
    sendResponse(res, 200, 'Comments fetched', comments);
  } catch (err) { next(err); }
};

exports.addComment = async (req, res, next) => {
  try {
    const comment = await Comment.create({
      course: req.params.id,
      user: req.user._id,
      text: req.body.text
    });
    const populated = await Comment.findById(comment._id).populate('user', 'name role avatar');
    sendResponse(res, 201, 'Comment added', populated);
  } catch (err) { next(err); }
};