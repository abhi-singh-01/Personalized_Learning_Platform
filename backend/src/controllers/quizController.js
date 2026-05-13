const Quiz = require('../models/Quiz');
const Course = require('../models/Course');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');

const isEducatorRole = (role) => role === 'educator' || role === 'teacher';

exports.create = async (req, res, next) => {
  try {
    const course = await Course.findOne({ _id: req.body.course, educator: req.user._id });
    if (!course) throw new AppError('Course not found or not authorized', 404);
    const quiz = await Quiz.create({ ...req.body, educator: req.user._id });
    sendResponse(res, 201, 'Quiz created', quiz);
  } catch (err) { next(err); }
};

exports.getByCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId).select('educator');
    if (!course) throw new AppError('Course not found', 404);

    const ownerId = course.educator?.toString();
    const isOwner =
      req.user &&
      ownerId &&
      isEducatorRole(req.user.role) &&
      req.user._id.toString() === ownerId;

    const quizzes = await Quiz.find({ course: req.params.courseId }).sort({ createdAt: -1 }).lean();

    if (isOwner) {
      sendResponse(res, 200, 'Quizzes fetched', quizzes);
      return;
    }

    const sanitized = quizzes.map((q) => ({
      ...q,
      questions: (q.questions || []).map((qq) => ({
        ...qq,
        correctAnswer: undefined,
        explanation: undefined,
      })),
    }));
    sendResponse(res, 200, 'Quizzes fetched', sanitized);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) throw new AppError('Quiz not found', 404);
    const quizObj = quiz.toObject();
    if (req.user?.role === 'learner' || req.user?.role === 'student') {
      quizObj.questions = quizObj.questions.map((q) => ({
        ...q,
        correctAnswer: undefined,
        explanation: undefined,
      }));
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
    const quiz = await Quiz.findOne({ _id: req.params.id, educator: req.user._id });
    if (!quiz) throw new AppError('Quiz not found or not authorized', 404);

    const course = await Course.findOne({ _id: quiz.course, educator: req.user._id });
    if (!course) throw new AppError('Course not found or not authorized', 404);

    const { title, description, difficulty, timeLimit, questions } = req.body;
    if (title !== undefined) quiz.title = title;
    if (description !== undefined) quiz.description = description;
    if (difficulty !== undefined) quiz.difficulty = difficulty;
    if (timeLimit !== undefined) quiz.timeLimit = timeLimit;
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
    const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, educator: req.user._id });
    if (!quiz) throw new AppError('Quiz not found or not authorized', 404);
    sendResponse(res, 200, 'Quiz deleted');
  } catch (err) { next(err); }
};