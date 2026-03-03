const Progress = require('../models/Progress');
const Quiz = require('../models/Quiz');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');
const { updateStudentMetrics, updateStreak } = require('../services/analyticsService');

exports.submitQuiz = async (req, res, next) => {
  try {
    const { quizId, answers, timeTaken } = req.body;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) throw new AppError('Quiz not found', 404);

    const graded = answers.map((a, i) => ({
      questionIndex: i,
      selectedAnswer: a,
      isCorrect: quiz.questions[i] && a === quiz.questions[i].correctAnswer,
    }));

    const correctCount = graded.filter((a) => a.isCorrect).length;
    const score = Math.round((correctCount / quiz.questions.length) * 100);

    const progress = await Progress.create({
      student: req.user._id,
      quiz: quizId,
      course: quiz.course,
      answers: graded,
      score,
      timeTaken: timeTaken || 0,
    });

    await updateStreak(req.user._id);
    await updateStudentMetrics(req.user._id);

    const result = {
      ...progress.toObject(),
      correctCount,
      totalQuestions: quiz.questions.length,
      explanations: quiz.questions.map((q) => ({
        question: q.question,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
      }))
    };

    // --- ADAPTIVE AI QUIZ LOGIC ---
    // If the student scores >= 80%, generate a new, harder set of 5 questions
    if (score >= 80) {
      try {
        const { generateQuiz } = require('../services/aiService');
        // Let's generate a slightly harder quiz based on the same title/topic
        const currentDifficulty = quiz.difficulty || 'medium';
        const nextDifficulty = currentDifficulty === 'easy' ? 'medium' : 'hard';

        const aiResponse = await generateQuiz({
          topic: quiz.title,
          difficulty: nextDifficulty,
          numQuestions: 5,
          courseTitle: 'Adaptive Assessment'
        });

        result.nextAdaptiveQuiz = aiResponse;
        result.nextAdaptiveQuiz.isAdaptive = true;
      } catch (aiErr) {
        console.error('Failed to generate adaptive questions:', aiErr);
        // We gracefully silently fail so the student still submits their current progress.
      }
    }

    sendResponse(res, 201, 'Quiz submitted', result);
  } catch (err) { next(err); }
};

exports.getStudentProgress = async (req, res, next) => {
  try {
    const progress = await Progress.find({ student: req.user._id })
      .populate('quiz', 'title difficulty')
      .populate('course', 'title')
      .sort({ completedAt: -1 });
    sendResponse(res, 200, 'Progress fetched', progress);
  } catch (err) { next(err); }
};

exports.getCourseProgress = async (req, res, next) => {
  try {
    const progress = await Progress.find({
      student: req.user._id,
      course: req.params.courseId,
    })
      .populate('quiz', 'title difficulty')
      .sort({ completedAt: -1 });
    sendResponse(res, 200, 'Course progress', progress);
  } catch (err) { next(err); }
};

