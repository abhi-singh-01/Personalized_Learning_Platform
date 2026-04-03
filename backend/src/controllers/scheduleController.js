const Schedule = require('../models/Schedule');
const Course = require('../models/Course');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');

// Educator: create a scheduled lecture
exports.create = async (req, res, next) => {
  try {
    const { course, title, description, scheduledAt, duration, meetingLink } = req.body;
    const courseDoc = await Course.findOne({ _id: course, educator: req.user._id });
    if (!courseDoc) throw new AppError('Course not found or not authorized', 404);

    const schedule = await Schedule.create({
      course,
      educator: req.user._id,
      title,
      description,
      scheduledAt,
      duration: duration || 60,
      meetingLink,
    });

    sendResponse(res, 201, 'Lecture scheduled', schedule);
  } catch (err) { next(err); }
};

// Get schedules for a specific course
exports.getByCourse = async (req, res, next) => {
  try {
    const schedules = await Schedule.find({ course: req.params.courseId })
      .sort({ scheduledAt: 1 })
      .populate('educator', 'name');
    sendResponse(res, 200, 'Schedules fetched', schedules);
  } catch (err) { next(err); }
};

// Learner: get all upcoming schedules for enrolled courses
exports.getUpcoming = async (req, res, next) => {
  try {
    const courses = await Course.find({ learners: req.user._id }).select('_id title');
    const courseIds = courses.map((c) => c._id);

    const schedules = await Schedule.find({
      course: { $in: courseIds },
      scheduledAt: { $gte: new Date() },
      status: { $in: ['scheduled', 'live'] },
    })
      .sort({ scheduledAt: 1 })
      .populate('course', 'title')
      .populate('educator', 'name')
      .limit(20);

    // Also fetch recently cancelled (last 7 days)
    const cancelled = await Schedule.find({
      course: { $in: courseIds },
      status: 'cancelled',
      updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    })
      .sort({ updatedAt: -1 })
      .populate('course', 'title')
      .populate('educator', 'name')
      .limit(10);

    sendResponse(res, 200, 'Upcoming schedules fetched', { upcoming: schedules, cancelled });
  } catch (err) { next(err); }
};

// Educator: cancel a scheduled lecture
exports.cancel = async (req, res, next) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) throw new AppError('Schedule not found', 404);
    if (schedule.educator.toString() !== req.user._id.toString())
      throw new AppError('Not authorized', 403);
    if (schedule.status === 'cancelled')
      throw new AppError('Already cancelled', 400);

    schedule.status = 'cancelled';
    schedule.cancelReason = req.body.reason || 'Class cancelled by educator';
    await schedule.save();

    sendResponse(res, 200, 'Lecture cancelled', schedule);
  } catch (err) { next(err); }
};

// Educator: delete a schedule
exports.remove = async (req, res, next) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule) throw new AppError('Schedule not found', 404);
    if (schedule.educator.toString() !== req.user._id.toString())
      throw new AppError('Not authorized', 403);
    await schedule.deleteOne();
    sendResponse(res, 200, 'Schedule deleted');
  } catch (err) { next(err); }
};

// Educator: get all schedules for their courses
exports.getEducatorSchedules = async (req, res, next) => {
  try {
    const schedules = await Schedule.find({ educator: req.user._id })
      .sort({ scheduledAt: 1 })
      .populate('course', 'title');
    sendResponse(res, 200, 'Educator schedules fetched', schedules);
  } catch (err) { next(err); }
};
