const Quiz = require('../models/Quiz');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const QuizLearnerAccess = require('../models/QuizLearnerAccess');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');
const { buildLearnerAttemptStatus } = require('../services/quizAccessService');
const {
  assertCanManageCourse,
  assertCanViewCourseContent,
  assertCanViewQuiz,
  isAdminUser,
  isCourseOwner,
  isLearnerUser,
} = require('../services/courseAccessService');

exports.create = async (req, res, next) => {
  try {
    await assertCanManageCourse(req.user, req.body.course);
    const quiz = await Quiz.create({ ...req.body, educator: req.user._id });
    sendResponse(res, 201, 'Quiz created', quiz);
  } catch (err) { next(err); }
};

exports.getByCourse = async (req, res, next) => {
  try {
    const course = await assertCanViewCourseContent(req.user, req.params.courseId);
    const canSeeAnswers = isAdminUser(req.user) || isCourseOwner(req.user, course);

    const quizzes = await Quiz.find({ course: req.params.courseId }).sort({ createdAt: -1 }).lean();

    if (canSeeAnswers) {
      sendResponse(res, 200, 'Quizzes fetched', quizzes);
      return;
    }

    const isLearner = isLearnerUser(req.user);
    const sanitized = await Promise.all(
      (quizzes || []).map(async (q) => {
        const base = {
          ...q,
          questions: (q.questions || []).map((qq) => ({
            ...qq,
            correctAnswer: undefined,
            explanation: undefined,
          })),
        };
        if (!isLearner) return base;
        const attemptStatus = await buildLearnerAttemptStatus(q, req.user._id);
        return { ...base, attemptStatus };
      })
    );
    sendResponse(res, 200, 'Quizzes fetched', sanitized);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) throw new AppError('Quiz not found', 404);
    await assertCanViewQuiz(req.user, quiz);
    const course = await Course.findById(quiz.course).select('educator');
    const canSeeAnswers = isAdminUser(req.user) || isCourseOwner(req.user, course);
    const quizObj = quiz.toObject();
    if (!canSeeAnswers) {
      quizObj.questions = quizObj.questions.map((q) => ({
        ...q,
        correctAnswer: undefined,
        explanation: undefined,
      }));
      quizObj.attemptStatus = await buildLearnerAttemptStatus(quiz, req.user._id);
    }
    sendResponse(res, 200, 'Quiz details', quizObj);
  } catch (err) { next(err); }
};

exports.getEducatorQuizzes = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ educator: req.user._id })
      .populate('course', 'title')
      .sort({ createdAt: -1 });
    sendResponse(res, 200, 'Educator quizzes', quizzes);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) throw new AppError('Quiz not found', 404);

    await assertCanManageCourse(req.user, quiz.course);

    const { title, description, difficulty, timeLimit, maxAttempts, availableFrom, availableUntil, questions } = req.body;
    if (title !== undefined) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (difficulty !== undefined) quiz.difficulty = difficulty;
    if (timeLimit !== undefined) quiz.timeLimit = timeLimit;
    if (maxAttempts !== undefined) {
      const n = Number(maxAttempts);
      if (!Number.isFinite(n) || n < 1) throw new AppError('maxAttempts must be at least 1', 400);
      quiz.maxAttempts = Math.floor(n);
    }
    if (availableFrom !== undefined) {
      quiz.availableFrom = availableFrom ? new Date(availableFrom) : null;
    }
    if (availableUntil !== undefined) {
      quiz.availableUntil = availableUntil ? new Date(availableUntil) : null;
    }
    if (quiz.availableFrom && quiz.availableUntil && quiz.availableFrom >= quiz.availableUntil) {
      throw new AppError('"Available until" must be after "available from"', 400);
    }
    if (Array.isArray(questions)) {
      if (questions.length < 1) throw new AppError('Quiz must have at least one question', 400);
      quiz.questions = questions.map((q) => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
      }));
    }

    await quiz.save();
    sendResponse(res, 200, 'Quiz updated', quiz);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) throw new AppError('Quiz not found', 404);
    await assertCanManageCourse(req.user, quiz.course);
    await quiz.deleteOne();
    await QuizLearnerAccess.deleteMany({ quiz: quiz._id });
    sendResponse(res, 200, 'Quiz deleted');
  } catch (err) { next(err); }
};

exports.getLearnerAccessOverview = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) throw new AppError('Quiz not found', 404);
    await assertCanManageCourse(req.user, quiz.course);

    const course = await Course.findById(quiz.course).populate('learners', 'name email');
    if (!course) throw new AppError('Course not found', 404);

    const learners = course.learners || [];
    const learnerIds = learners.map((l) => l._id);

    const [progressCounts, overrides] = await Promise.all([
      learnerIds.length
        ? Progress.aggregate([
            { $match: { quiz: quiz._id, learner: { $in: learnerIds } } },
            { $group: { _id: '$learner', attemptsUsed: { $sum: 1 } } },
          ])
        : Promise.resolve([]),
      QuizLearnerAccess.find({ quiz: quiz._id }).lean(),
    ]);

    const countMap = {};
    progressCounts.forEach((row) => {
      countMap[row._id.toString()] = row.attemptsUsed;
    });
    const ovMap = {};
    overrides.forEach((o) => {
      ovMap[o.learner.toString()] = o;
    });

    const maxAttempts = Math.max(1, quiz.maxAttempts == null ? 1 : quiz.maxAttempts);
    const rows = learners.map((user) => {
      const uid = user._id.toString();
      const ov = ovMap[uid];
      const attemptsUsed = countMap[uid] || 0;
      const extra = ov?.extraAttempts || 0;
      return {
        learner: { _id: user._id, name: user.name, email: user.email },
        attemptsUsed,
        maxAttempts,
        totalAttemptsAllowed: maxAttempts + extra,
        override: ov
          ? {
              extraAttempts: ov.extraAttempts,
              blocked: ov.blocked,
              blockReason: ov.blockReason,
              educatorNote: ov.educatorNote,
              updatedAt: ov.updatedAt,
            }
          : null,
      };
    });

    sendResponse(res, 200, 'Learner access overview', {
      quiz: {
        _id: quiz._id,
        title: quiz.title,
        maxAttempts: quiz.maxAttempts,
        availableFrom: quiz.availableFrom,
        availableUntil: quiz.availableUntil,
        timeLimit: quiz.timeLimit,
      },
      learners: rows,
    });
  } catch (err) { next(err); }
};

exports.putLearnerAccess = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) throw new AppError('Quiz not found', 404);
    await assertCanManageCourse(req.user, quiz.course);

    const course = await Course.findById(quiz.course);
    if (!course) throw new AppError('Course not found', 404);

    const learnerOid = req.params.learnerId;
    const enrolled = (course.learners || []).some((id) => id.toString() === learnerOid);
    if (!enrolled) throw new AppError('Learner is not enrolled in this course', 400);

    const { extraAttempts = 0, blocked = false, blockReason = '', educatorNote = '' } = req.body || {};
    const set = {
      extraAttempts: Math.max(0, Math.floor(Number(extraAttempts) || 0)),
      blocked: Boolean(blocked),
      blockReason: blocked ? String(blockReason || '').slice(0, 500) : '',
      educatorNote: String(educatorNote || '').slice(0, 1000),
    };
    if (!blocked) set.lastResolvedAt = new Date();

    const doc = await QuizLearnerAccess.findOneAndUpdate(
      { quiz: quiz._id, learner: learnerOid },
      { $set: set, $setOnInsert: { learner: learnerOid, quiz: quiz._id } },
      { upsert: true, new: true, runValidators: true }
    );
    sendResponse(res, 200, 'Learner access updated', doc);
  } catch (err) { next(err); }
};