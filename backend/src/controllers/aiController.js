const { generateStudyPlan, generateQuiz, generateFeedback } = require('../services/aiService');
const AIInteractionLog = require('../models/AIInteractionLog');
const Quiz = require('../models/Quiz');
const Course = require('../models/Course');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');
const { getWeakTopics } = require('../services/analyticsService');
const Progress = require('../models/Progress');

exports.getStudyPlan = async (req, res, next) => {
  try {
    const { goal, hoursPerWeek, weeks, courseId } = req.body;
    const user = req.user;
    const weakTopics = await getWeakTopics(user._id);
    let courseTitle = 'General Studies';
    if (courseId) {
      const course = await Course.findById(courseId);
      if (course) courseTitle = course.title;
    }

    const plan = await generateStudyPlan({
      goal: goal || 'Improve overall understanding',
      hoursPerWeek: hoursPerWeek || 10,
      weeks: weeks || 4,
      level: user.aiLevel,
      weakTopics: weakTopics.map((w) => w.topic),
      courseTitle,
    });

    await AIInteractionLog.create({
      user: user._id,
      type: 'study-plan',
      input: { goal, hoursPerWeek, level: user.aiLevel },
      output: plan,
    });

    sendResponse(res, 200, 'Study plan generated', plan);
  } catch (err) { next(err); }
};

exports.generateAIQuiz = async (req, res, next) => {
  try {
    const { courseId, topic, numQuestions, previousQuestions } = req.body;
    const course = await Course.findById(courseId);
    if (!course) throw new AppError('Course not found', 404);

    let difficulty = 'medium';
    if (req.user.role === 'student') {
      const recent = await Progress.find({ student: req.user._id, course: courseId })
        .sort({ completedAt: -1 }).limit(3);
      if (recent.length > 0) {
        const avg = recent.reduce((s, r) => s + r.score, 0) / recent.length;
        difficulty = avg < 40 ? 'easy' : avg > 70 ? 'hard' : 'medium';
      }
    } else {
      difficulty = req.body.difficulty || 'medium';
    }

    const aiQuiz = await generateQuiz({
      topic: topic || course.title,
      difficulty,
      numQuestions: numQuestions || 5,
      courseTitle: course.title,
      previousQuestions,
    });

    if (req.user.role === 'teacher') {
      const quiz = await Quiz.create({
        title: aiQuiz.title,
        description: aiQuiz.description,
        course: courseId,
        teacher: req.user._id,
        difficulty,
        questions: aiQuiz.questions,
        isAIGenerated: true,
      });

      await AIInteractionLog.create({
        user: req.user._id,
        type: 'quiz-generation',
        input: { courseId, topic, difficulty },
        output: { quizId: quiz._id },
      });

      return sendResponse(res, 201, 'AI quiz created', quiz);
    }

    sendResponse(res, 200, 'AI quiz generated', { ...aiQuiz, difficulty });
  } catch (err) { next(err); }
};

exports.getFeedback = async (req, res, next) => {
  try {
    const user = req.user;
    const weakTopics = await getWeakTopics(user._id);
    const recent = await Progress.find({ student: user._id })
      .sort({ completedAt: -1 }).limit(5);

    const feedback = await generateFeedback({
      studentName: user.name,
      level: user.aiLevel,
      averageScore: user.averageScore,
      recentScores: recent.map((r) => r.score),
      weakTopics: weakTopics.map((w) => `${w.topic} (${w.accuracy}%)`),
    });

    await AIInteractionLog.create({
      user: user._id,
      type: 'feedback',
      input: { level: user.aiLevel, averageScore: user.averageScore },
      output: feedback,
    });

    sendResponse(res, 200, 'Feedback generated', feedback);
  } catch (err) { next(err); }
};