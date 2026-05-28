const LiveClass = require('../models/LiveClass');
const Schedule = require('../models/Schedule');
const Course = require('../models/Course');
const Setting = require('../models/Setting');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');
const crypto = require('crypto');

// Generate unique room ID
function generateRoomId() {
  return 'lc-' + crypto.randomBytes(6).toString('hex') + '-' + Date.now().toString(36);
}

// ─── Educator: Start a live class from a schedule ───
exports.startFromSchedule = async (req, res, next) => {
  try {
    const { scheduleId } = req.params;
    const schedule = await Schedule.findById(scheduleId).populate('course', 'title learners');
    if (!schedule) throw new AppError('Schedule not found', 404);
    if (schedule.educator.toString() !== req.user._id.toString())
      throw new AppError('Not authorized', 403);

    // Check if already started
    if (schedule.liveClass) {
      const existing = await LiveClass.findById(schedule.liveClass);
      if (existing && existing.status === 'live') {
        return sendResponse(res, 200, 'Class already live', existing);
      }
    }

    // Check concurrent class limit
    const settings = await Setting.findOne().lean();
    const maxConcurrent = settings?.maxConcurrentLiveClasses || 5;
    const activeCount = await LiveClass.countDocuments({ educator: req.user._id, status: 'live' });
    if (activeCount >= maxConcurrent) {
      throw new AppError(`You can have at most ${maxConcurrent} concurrent live classes`, 400);
    }

    const roomId = generateRoomId();

    const liveClass = await LiveClass.create({
      schedule: schedule._id,
      course: schedule.course._id,
      educator: req.user._id,
      roomId,
      roomName: schedule.title,
      topic: schedule.title,
      description: schedule.description,
      status: 'live',
      startedAt: new Date(),
      maxParticipants: schedule.maxAttendees || 100,
      chatEnabled: settings?.liveClassDefaults?.chatEnabled ?? true,
    });

    // Update schedule
    schedule.status = 'live';
    schedule.liveClass = liveClass._id;
    await schedule.save();

    // Send notifications to enrolled learners
    if (schedule.course.learners && schedule.course.learners.length > 0) {
      const notifications = schedule.course.learners.map(learnerId => ({
        user: learnerId,
        type: 'class_starting',
        title: 'Live Class Starting!',
        message: `${schedule.title} is now live. Join now!`,
        data: { courseId: schedule.course._id, liveClassId: liveClass._id, roomId },
      }));
      await Notification.insertMany(notifications);

      // Emit via socket if available
      const io = req.app.get('io');
      if (io) {
        schedule.course.learners.forEach(learnerId => {
          io.to(`user:${learnerId}`).emit('class:started', {
            liveClassId: liveClass._id,
            courseId: schedule.course._id,
            courseName: schedule.course.title,
            title: schedule.title,
            roomId,
          });
        });
      }
    }

    sendResponse(res, 201, 'Live class started', liveClass);
  } catch (err) { next(err); }
};

// ─── Educator: Start a quick class (without schedule) ───
exports.startQuick = async (req, res, next) => {
  try {
    const { courseId, topic, description, maxParticipants } = req.body;

    const course = await Course.findOne({ _id: courseId, educator: req.user._id });
    if (!course) throw new AppError('Course not found or not authorized', 404);

    // Check concurrent class limit
    const settings = await Setting.findOne().lean();
    const maxConcurrent = settings?.maxConcurrentLiveClasses || 5;
    const activeCount = await LiveClass.countDocuments({ educator: req.user._id, status: 'live' });
    if (activeCount >= maxConcurrent) {
      throw new AppError(`You can have at most ${maxConcurrent} concurrent live classes`, 400);
    }

    const roomId = generateRoomId();

    const liveClass = await LiveClass.create({
      course: courseId,
      educator: req.user._id,
      roomId,
      roomName: topic || course.title + ' — Live',
      topic: topic || '',
      description: description || '',
      status: 'live',
      startedAt: new Date(),
      maxParticipants: maxParticipants || 100,
      chatEnabled: settings?.liveClassDefaults?.chatEnabled ?? true,
    });

    // Notify enrolled learners
    if (course.learners && course.learners.length > 0) {
      const notifications = course.learners.map(learnerId => ({
        user: learnerId,
        type: 'class_starting',
        title: 'Surprise Live Class!',
        message: `${liveClass.roomName} is now live in ${course.title}. Join now!`,
        data: { courseId: course._id, liveClassId: liveClass._id, roomId },
      }));
      await Notification.insertMany(notifications);

      const io = req.app.get('io');
      if (io) {
        course.learners.forEach(learnerId => {
          io.to(`user:${learnerId}`).emit('class:started', {
            liveClassId: liveClass._id,
            courseId: course._id,
            courseName: course.title,
            title: liveClass.roomName,
            roomId,
          });
        });
      }
    }

    sendResponse(res, 201, 'Quick live class started', liveClass);
  } catch (err) { next(err); }
};

// ─── Educator: End a live class ───
exports.end = async (req, res, next) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) throw new AppError('Live class not found', 404);
    if (liveClass.educator.toString() !== req.user._id.toString())
      throw new AppError('Not authorized', 403);
    if (liveClass.status === 'ended')
      throw new AppError('Class already ended', 400);

    liveClass.status = 'ended';
    liveClass.endedAt = new Date();

    // Calculate attendance durations
    liveClass.attendees.forEach(a => {
      if (!a.leftAt) a.leftAt = new Date();
      a.duration = Math.round((a.leftAt - a.joinedAt) / 60000);
    });
    liveClass.totalUniqueAttendees = liveClass.attendees.length;

    await liveClass.save();

    // Update linked schedule
    if (liveClass.schedule) {
      await Schedule.findByIdAndUpdate(liveClass.schedule, { status: 'completed' });
    }

    // Notify via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`room:${liveClass.roomId}`).emit('class:ended', {
        liveClassId: liveClass._id,
        message: 'The live class has ended.',
      });
    }

    sendResponse(res, 200, 'Live class ended', liveClass);
  } catch (err) { next(err); }
};

// ─── Learner: Join a live class ───
exports.join = async (req, res, next) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id).populate('course', 'title learners');
    if (!liveClass) throw new AppError('Live class not found', 404);
    if (liveClass.status !== 'live') throw new AppError('This class is not currently live', 400);

    // Check if learner is enrolled in the course
    const isEnrolled = liveClass.course.learners.some(
      l => l.toString() === req.user._id.toString()
    );
    const isEducator = liveClass.educator.toString() === req.user._id.toString();
    if (!isEnrolled && !isEducator) throw new AppError('You are not enrolled in this course', 403);

    // Check capacity
    const currentAttendees = liveClass.attendees.filter(a => !a.leftAt).length;
    if (currentAttendees >= liveClass.maxParticipants) {
      throw new AppError('Class is full', 400);
    }

    // Check if already joined (rejoin)
    const existingIdx = liveClass.attendees.findIndex(
      a => a.user.toString() === req.user._id.toString() && !a.leftAt
    );
    if (existingIdx === -1) {
      liveClass.attendees.push({ user: req.user._id, joinedAt: new Date() });
    }

    // Update peak
    const now = liveClass.attendees.filter(a => !a.leftAt).length;
    if (now > liveClass.peakAttendance) liveClass.peakAttendance = now;

    await liveClass.save();

    // Get Jitsi domain from settings
    const settings = await Setting.findOne().lean();
    const jitsiDomain = settings?.liveClassDefaults?.jitsiDomain || 'meet.jit.si';

    sendResponse(res, 200, 'Joined live class', {
      liveClassId: liveClass._id,
      roomId: liveClass.roomId,
      roomName: liveClass.roomName,
      jitsiDomain,
      chatEnabled: liveClass.chatEnabled,
      topic: liveClass.topic,
      startedAt: liveClass.startedAt,
      courseName: liveClass.course?.title,
    });
  } catch (err) { next(err); }
};

// ─── Learner: Leave a live class ───
exports.leave = async (req, res, next) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) throw new AppError('Live class not found', 404);

    const attendee = liveClass.attendees.find(
      a => a.user.toString() === req.user._id.toString() && !a.leftAt
    );

    if (attendee) {
      attendee.leftAt = new Date();
      attendee.duration = Math.round((attendee.leftAt - attendee.joinedAt) / 60000);
      await liveClass.save();
    }

    sendResponse(res, 200, 'Left live class');
  } catch (err) { next(err); }
};

// ─── Auth: Get all currently active classes (for enrolled courses) ───
exports.getActive = async (req, res, next) => {
  try {
    let query = { status: 'live' };

    if (req.user.role === 'learner') {
      const enrolledCourses = await Course.find({ learners: req.user._id }).select('_id');
      const courseIds = enrolledCourses.map(c => c._id);
      query.course = { $in: courseIds };
    } else if (req.user.role === 'educator') {
      query.educator = req.user._id;
    }
    // admin sees all

    const classes = await LiveClass.find(query)
      .populate('course', 'title thumbnail')
      .populate('educator', 'name avatar')
      .sort({ startedAt: -1 })
      .lean();

    // Add live attendee count
    classes.forEach(c => {
      c.currentAttendees = c.attendees ? c.attendees.filter(a => !a.leftAt).length : 0;
    });

    sendResponse(res, 200, 'Active classes fetched', classes);
  } catch (err) { next(err); }
};

// ─── Educator: Get their active classes ───
exports.getEducatorActive = async (req, res, next) => {
  try {
    const classes = await LiveClass.find({
      educator: req.user._id,
      status: 'live',
    })
      .populate('course', 'title thumbnail')
      .sort({ startedAt: -1 })
      .lean();

    classes.forEach(c => {
      c.currentAttendees = c.attendees ? c.attendees.filter(a => !a.leftAt).length : 0;
    });

    sendResponse(res, 200, 'Educator active classes fetched', classes);
  } catch (err) { next(err); }
};

// ─── Educator: Get class history ───
exports.getHistory = async (req, res, next) => {
  try {
    const { courseId, page = 1, limit = 20 } = req.query;
    const query = { educator: req.user._id, status: 'ended' };
    if (courseId) query.course = courseId;

    const classes = await LiveClass.find(query)
      .populate('course', 'title')
      .select('-chatMessages -attendees')
      .sort({ endedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await LiveClass.countDocuments(query);

    sendResponse(res, 200, 'Class history fetched', { classes, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
};

// ─── Educator: Get attendance for a specific class ───
exports.getAttendance = async (req, res, next) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id)
      .populate('attendees.user', 'name email avatar');

    if (!liveClass) throw new AppError('Live class not found', 404);
    if (liveClass.educator.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      throw new AppError('Not authorized', 403);

    sendResponse(res, 200, 'Attendance fetched', {
      totalUnique: liveClass.totalUniqueAttendees,
      peakAttendance: liveClass.peakAttendance,
      attendees: liveClass.attendees,
    });
  } catch (err) { next(err); }
};

// ─── Auth: Send chat message ───
exports.sendChat = async (req, res, next) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) throw new AppError('Live class not found', 404);
    if (liveClass.status !== 'live') throw new AppError('Class is not live', 400);
    if (!liveClass.chatEnabled) throw new AppError('Chat is disabled', 400);

    const { message } = req.body;
    if (!message || !message.trim()) throw new AppError('Message is required', 400);

    const chatMsg = {
      user: req.user._id,
      userName: req.user.name,
      message: message.trim(),
      timestamp: new Date(),
    };

    liveClass.chatMessages.push(chatMsg);
    await liveClass.save();

    // Broadcast via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`room:${liveClass.roomId}`).emit('chat:message', {
        ...chatMsg,
        liveClassId: liveClass._id,
      });
    }

    sendResponse(res, 201, 'Message sent', chatMsg);
  } catch (err) { next(err); }
};

// ─── Auth: Get chat history ───
exports.getChatHistory = async (req, res, next) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id)
      .select('chatMessages chatEnabled roomId')
      .populate('chatMessages.user', 'name avatar');

    if (!liveClass) throw new AppError('Live class not found', 404);

    sendResponse(res, 200, 'Chat history fetched', {
      chatEnabled: liveClass.chatEnabled,
      messages: liveClass.chatMessages,
    });
  } catch (err) { next(err); }
};

// ─── Admin: Get all active classes (monitoring) ───
exports.adminGetAll = async (req, res, next) => {
  try {
    const { status = 'live' } = req.query;

    const classes = await LiveClass.find({ status })
      .populate('course', 'title')
      .populate('educator', 'name email')
      .sort({ startedAt: -1 })
      .lean();

    classes.forEach(c => {
      c.currentAttendees = c.attendees ? c.attendees.filter(a => !a.leftAt).length : 0;
      delete c.chatMessages;
      delete c.attendees;
    });

    sendResponse(res, 200, 'All live classes fetched', classes);
  } catch (err) { next(err); }
};

// ─── Admin: Force-end a class ───
exports.adminForceEnd = async (req, res, next) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id);
    if (!liveClass) throw new AppError('Live class not found', 404);

    liveClass.status = 'ended';
    liveClass.endedAt = new Date();
    liveClass.attendees.forEach(a => {
      if (!a.leftAt) {
        a.leftAt = new Date();
        a.duration = Math.round((a.leftAt - a.joinedAt) / 60000);
      }
    });
    liveClass.totalUniqueAttendees = liveClass.attendees.length;
    await liveClass.save();

    if (liveClass.schedule) {
      await Schedule.findByIdAndUpdate(liveClass.schedule, { status: 'completed' });
    }

    // Notify via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`room:${liveClass.roomId}`).emit('class:ended', {
        liveClassId: liveClass._id,
        message: 'This class has been ended by the administrator.',
      });
    }

    sendResponse(res, 200, 'Live class force-ended', liveClass);
  } catch (err) { next(err); }
};
