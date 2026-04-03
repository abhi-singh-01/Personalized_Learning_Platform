const Progress = require('../models/Progress');
const User = require('../models/User');
const { classifyLevel, calculateEngagement } = require('../utils/helpers');

const updateLearnerMetrics = async (learnerId) => {
  const progressRecords = await Progress.find({ learner: learnerId });
  const totalQuizzes = progressRecords.length;
  const avgScore = totalQuizzes > 0
    ? Math.round(progressRecords.reduce((sum, p) => sum + p.score, 0) / totalQuizzes)
    : 0;

  const learner = await User.findById(learnerId);
  const engagement = calculateEngagement({
    quizzesTaken: totalQuizzes,
    coursesEnrolled: learner.enrolledCourses.length,
    streakDays: learner.streak.current,
    materialsViewed: learner.totalMaterialsViewed,
  });

  await User.findByIdAndUpdate(learnerId, {
    averageScore: avgScore,
    totalQuizzesTaken: totalQuizzes,
    aiLevel: classifyLevel(avgScore),
    engagementScore: engagement,
  });
};

const updateLearnerStreak = async (learnerId) => {
  const learner = await User.findById(learnerId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastActive = learner.streak.lastActiveDate
    ? new Date(learner.streak.lastActiveDate)
    : null;

  if (lastActive) {
    lastActive.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      learner.streak.current += 1;
    } else if (diffDays > 1) {
      learner.streak.current = 1;
    }
  } else {
    learner.streak.current = 1;
  }

  learner.streak.longest = Math.max(learner.streak.longest, learner.streak.current);
  learner.streak.lastActiveDate = today;
  await learner.save();
};

const getWeakTopics = async (learnerId) => {
  const progress = await Progress.find({ learner: learnerId })
    .populate('quiz', 'title course questions')
    .sort({ completedAt: -1 })
    .limit(10);

  const topicScores = {};
  progress.forEach((p) => {
    const title = p.quiz?.title || 'Unknown';
    if (!topicScores[title]) topicScores[title] = { total: 0, correct: 0 };
    p.answers.forEach((a) => {
      topicScores[title].total += 1;
      if (a.isCorrect) topicScores[title].correct += 1;
    });
  });

  return Object.entries(topicScores)
    .map(([topic, data]) => ({
      topic,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    }))
    .filter((t) => t.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);
};

module.exports = { updateLearnerMetrics, updateLearnerStreak, getWeakTopics };