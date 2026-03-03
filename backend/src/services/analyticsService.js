const Progress = require('../models/Progress');
const User = require('../models/User');
const { classifyLevel, calculateEngagement } = require('../utils/helpers');

const updateStudentMetrics = async (studentId) => {
  const progressRecords = await Progress.find({ student: studentId });
  const totalQuizzes = progressRecords.length;
  const avgScore = totalQuizzes > 0
    ? Math.round(progressRecords.reduce((sum, p) => sum + p.score, 0) / totalQuizzes)
    : 0;

  const student = await User.findById(studentId);
  const engagement = calculateEngagement({
    quizzesTaken: totalQuizzes,
    coursesEnrolled: student.enrolledCourses.length,
    streakDays: student.streak.current,
    materialsViewed: student.totalMaterialsViewed,
  });

  await User.findByIdAndUpdate(studentId, {
    averageScore: avgScore,
    totalQuizzesTaken: totalQuizzes,
    aiLevel: classifyLevel(avgScore),
    engagementScore: engagement,
  });
};

const updateStreak = async (studentId) => {
  const student = await User.findById(studentId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastActive = student.streak.lastActiveDate
    ? new Date(student.streak.lastActiveDate)
    : null;

  if (lastActive) {
    lastActive.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      student.streak.current += 1;
    } else if (diffDays > 1) {
      student.streak.current = 1;
    }
  } else {
    student.streak.current = 1;
  }

  student.streak.longest = Math.max(student.streak.longest, student.streak.current);
  student.streak.lastActiveDate = today;
  await student.save();
};

const getWeakTopics = async (studentId) => {
  const progress = await Progress.find({ student: studentId })
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

module.exports = { updateStudentMetrics, updateStreak, getWeakTopics };