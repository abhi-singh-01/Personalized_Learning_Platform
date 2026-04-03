const User = require('../models/User');
const Course = require('../models/Course');
const Progress = require('../models/Progress');
const Material = require('../models/Material');
const Quiz = require('../models/Quiz');
const { sendResponse } = require('../utils/response');
const { getWeakTopics } = require('../services/analyticsService');

exports.learnerDashboard = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const progress = await Progress.find({ learner: req.user._id })
      .populate('quiz', 'title')
      .populate('course', 'title')
      .sort({ completedAt: -1 });

    const recentScores = progress.slice(0, 10).map((p) => ({
      score: p.score,
      quiz: p.quiz?.title,
      date: p.completedAt,
    }));

    const weakTopics = await getWeakTopics(req.user._id);

    const courseProgress = {};
    for (const courseId of user.enrolledCourses) {
      const totalQuizzes = await Quiz.countDocuments({ course: courseId });
      const attemptedQuizzes = await Progress.distinct('quiz', {
        learner: req.user._id,
        course: courseId,
      });
      courseProgress[courseId] = {
        total: totalQuizzes,
        attempted: attemptedQuizzes.length,
        percentage: totalQuizzes > 0 ? Math.round((attemptedQuizzes.length / totalQuizzes) * 100) : 0,
      };
    }

    sendResponse(res, 200, 'Learner dashboard data', {
      user,
      recentScores,
      weakTopics,
      courseProgress,
      totalAttempts: progress.length,
    });
  } catch (err) { next(err); }
};

exports.educatorDashboard = async (req, res, next) => {
  try {
    const courses = await Course.find({ educator: req.user._id });
    const courseIds = courses.map((c) => c._id);

    const totalLearnersSet = new Set();
    courses.forEach((c) => c.learners.forEach((l) => totalLearnersSet.add(l.toString())));

    const educator = await User.findById(req.user._id).select('assignedLearners');
    if (educator && educator.assignedLearners) {
      educator.assignedLearners.forEach((l) => totalLearnersSet.add(l.toString()));
    }

    const totalMaterials = await Material.countDocuments({ course: { $in: courseIds } });
    const totalQuizzes = await Quiz.countDocuments({ course: { $in: courseIds } });

    const allProgress = await Progress.find({ course: { $in: courseIds } });
    const avgClassScore = allProgress.length > 0
      ? Math.round(allProgress.reduce((s, p) => s + p.score, 0) / allProgress.length)
      : 0;

    const learnerIds = [...totalLearnersSet];
    const learners = await User.find({ _id: { $in: learnerIds } })
      .select('name email aiLevel engagementScore averageScore streak updatedAt');

    const atRisk = learners
      .filter((s) => s.engagementScore < 40 || s.averageScore < 40)
      .map((s) => ({
        id: s._id,
        name: s.name,
        email: s.email,
        engagementScore: s.engagementScore,
        averageScore: s.averageScore,
        lastActive: s.streak?.lastActiveDate || s.updatedAt,
        risk: s.engagementScore < 30 ? 'High' : 'Medium',
      }));

    const topPerformers = learners
      .filter((s) => s.averageScore > 0)
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5);

    const levelDistribution = { Beginner: 0, Developing: 0, Proficient: 0, Advanced: 0 };
    learners.forEach((s) => { if (levelDistribution[s.aiLevel] !== undefined) levelDistribution[s.aiLevel]++; });

    const coursePerformance = [];
    for (const course of courses) {
      const cp = await Progress.find({ course: course._id });
      const avg = cp.length > 0
        ? Math.round(cp.reduce((s, p) => s + p.score, 0) / cp.length)
        : 0;
      coursePerformance.push({ title: course.title, avgScore: avg, learners: course.learners.length });
    }

    sendResponse(res, 200, 'Educator dashboard data', {
      totalLearners: learnerIds.length,
      totalCourses: courses.length,
      totalMaterials,
      totalQuizzes,
      avgClassScore,
      atRisk,
      topPerformers,
      levelDistribution,
      coursePerformance,
    });
  } catch (err) { next(err); }
};