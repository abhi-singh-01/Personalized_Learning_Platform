const Quiz = require('../models/Quiz');
const Course = require('../models/Course');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');

exports.create = async (req, res, next) => {
  try {
    const course = await Course.findOne({ _id: req.body.course, teacher: req.user._id });
    if (!course) throw new AppError('Course not found or not authorized', 404);
    const quiz = await Quiz.create({ ...req.body, teacher: req.user._id });
    sendResponse(res, 201, 'Quiz created', quiz);
  } catch (err) { next(err); }
};

exports.getByCourse = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ course: req.params.courseId })
      .select('-questions.correctAnswer -questions.explanation')
      .sort({ createdAt: -1 });
    sendResponse(res, 200, 'Quizzes fetched', quizzes);
  } catch (err) { next(err); }
};

exports.getById = async (req, res, next) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) throw new AppError('Quiz not found', 404);
    const quizObj = quiz.toObject();
    if (req.user.role === 'student') {
      quizObj.questions = quizObj.questions.map((q) => ({
        ...q,
        correctAnswer: undefined,
        explanation: undefined,
      }));
    }
    sendResponse(res, 200, 'Quiz details', quizObj);
  } catch (err) { next(err); }
};

exports.getTeacherQuizzes = async (req, res, next) => {
  try {
    const quizzes = await Quiz.find({ teacher: req.user._id })
      .populate('course', 'title')
      .sort({ createdAt: -1 });
    sendResponse(res, 200, 'Teacher quizzes', quizzes);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const quiz = await Quiz.findOneAndDelete({ _id: req.params.id, teacher: req.user._id });
    if (!quiz) throw new AppError('Quiz not found or not authorized', 404);
    sendResponse(res, 200, 'Quiz deleted');
  } catch (err) { next(err); }
};