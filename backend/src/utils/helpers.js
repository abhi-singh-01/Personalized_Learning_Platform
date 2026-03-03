const extractYouTubeId = (url) => {
  const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const classifyLevel = (avgScore) => {
  if (avgScore <= 40) return 'Beginner';
  if (avgScore <= 60) return 'Developing';
  if (avgScore <= 80) return 'Proficient';
  return 'Advanced';
};

const calculateEngagement = ({ quizzesTaken, coursesEnrolled, streakDays, materialsViewed }) => {
  const q = Math.min(quizzesTaken / 10, 1) * 30;
  const c = Math.min(coursesEnrolled / 5, 1) * 20;
  const s = Math.min(streakDays / 14, 1) * 30;
  const m = Math.min(materialsViewed / 20, 1) * 20;
  return Math.round(q + c + s + m);
};

module.exports = { extractYouTubeId, classifyLevel, calculateEngagement };