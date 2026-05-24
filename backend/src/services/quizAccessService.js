const Progress = require('../models/Progress');
const QuizLearnerAccess = require('../models/QuizLearnerAccess');
const AppError = require('../utils/AppError');

async function getAttemptCountsAndOverride(learnerId, quizId) {
  const [attemptsUsed, override] = await Promise.all([
    Progress.countDocuments({ learner: learnerId, quiz: quizId }),
    QuizLearnerAccess.findOne({ learner: learnerId, quiz: quizId }).lean(),
  ]);
  return { attemptsUsed, override };
}

function checkScheduleWindow(quiz, now = new Date()) {
  if (quiz.availableFrom) {
    const from = new Date(quiz.availableFrom);
    if (now < from) {
      return { ok: false, message: 'This quiz is not open yet.' };
    }
  }
  if (quiz.availableUntil) {
    const until = new Date(quiz.availableUntil);
    if (now > until) {
      return { ok: false, message: 'The deadline for this quiz has passed.' };
    }
  }
  return { ok: true };
}

/**
 * @param {import('mongoose').Document} quiz
 * @param {import('mongoose').Types.ObjectId} learnerId
 */
async function buildLearnerAttemptStatus(quiz, learnerId) {
  const maxAttempts = Math.max(1, quiz.maxAttempts == null ? 1 : quiz.maxAttempts);
  const { attemptsUsed, override } = await getAttemptCountsAndOverride(learnerId, quiz._id);
  const extra = override?.extraAttempts || 0;
  const totalAttemptsAllowed = maxAttempts + extra;
  const window = checkScheduleWindow(quiz);

  let canStart = true;
  let reason = '';

  if (override?.blocked) {
    canStart = false;
    reason =
      override.blockReason?.trim() ||
      'This quiz is temporarily unavailable for your account. Please contact your educator.';
  } else if (!window.ok) {
    canStart = false;
    reason = window.message;
  } else if (attemptsUsed >= totalAttemptsAllowed) {
    canStart = false;
    reason = 'You have used all allowed attempts for this quiz.';
  }

  return {
    attemptsUsed,
    maxAttempts,
    extraAttemptsGranted: extra,
    totalAttemptsAllowed,
    canStart,
    reason,
    blocked: Boolean(override?.blocked),
    withinWindow: window.ok,
    availableFrom: quiz.availableFrom || null,
    availableUntil: quiz.availableUntil || null,
    timeLimitMinutes: quiz.timeLimit == null ? 15 : quiz.timeLimit,
  };
}

async function assertLearnerMaySubmit(quiz, learnerId) {
  const status = await buildLearnerAttemptStatus(quiz, learnerId);
  if (!status.canStart) {
    throw new AppError(status.reason || 'You cannot submit this quiz right now.', 403);
  }
}

module.exports = {
  getAttemptCountsAndOverride,
  checkScheduleWindow,
  buildLearnerAttemptStatus,
  assertLearnerMaySubmit,
};
