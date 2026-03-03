const Course = require('../models/Course');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');

exports.create = async (req, res, next) => {
  try {
    const course = await Course.create({ ...req.body, teacher: req.user._id });
    sendResponse(res, 201, 'Course created', course);
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const filter = { isPublished: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };
    const courses = await Course.find(filter)
      .populate('teacher', 'name avatar')
      .sort({ createdAt: -1 });
    sendResponse(res, 200, 'Courses fetched', courses);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name avatar bio')
      .populate('students', 'name avatar aiLevel');
    if (!course) throw new AppError('Course not found', 404);
    sendResponse(res, 200, 'Course details', course);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!course) throw new AppError('Course not found or not authorized', 404);
    sendResponse(res, 200, 'Course updated', course);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const course = await Course.findOneAndDelete({ _id: req.params.id, teacher: req.user._id });
    if (!course) throw new AppError('Course not found or not authorized', 404);
    sendResponse(res, 200, 'Course deleted');
  } catch (err) { next(err); }
};

exports.enroll = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) throw new AppError('Course not found', 404);
    if (course.students.includes(req.user._id))
      throw new AppError('Already enrolled', 400);

    course.students.push(req.user._id);
    await course.save();

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { enrolledCourses: course._id },
    });

    sendResponse(res, 200, 'Enrolled successfully', course);
  } catch (err) { next(err); }
};

exports.getTeacherCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ teacher: req.user._id })
      .populate('students', 'name aiLevel engagementScore')
      .sort({ createdAt: -1 });
    sendResponse(res, 200, 'Teacher courses', courses);
  } catch (err) { next(err); }
};

const CourseProgress = require('../models/CourseProgress');
exports.toggleMaterialComplete = async (req, res, next) => {
  try {
    const { id: courseId, materialId } = req.params;
    let progress = await CourseProgress.findOne({ student: req.user._id, course: courseId });
    if (!progress) {
      progress = new CourseProgress({ student: req.user._id, course: courseId, completedMaterials: [] });
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
    const progress = await CourseProgress.findOne({ student: req.user._id, course: req.params.id });
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