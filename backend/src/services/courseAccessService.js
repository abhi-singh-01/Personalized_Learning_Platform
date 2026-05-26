const Course = require('../models/Course');
const Material = require('../models/Material');
const Quiz = require('../models/Quiz');
const Payment = require('../models/Payment');
const User = require('../models/User');
const AppError = require('../utils/AppError');

const idOf = (value) => String(value?._id || value || '');

function normalizeRole(role) {
  if (role === 'teacher') return 'educator';
  if (role === 'student') return 'learner';
  return role;
}

function isAdminUser(user) {
  return normalizeRole(user?.role) === 'admin';
}

function isLearnerUser(user) {
  return normalizeRole(user?.role) === 'learner';
}

function isEducatorUser(user) {
  return normalizeRole(user?.role) === 'educator';
}

function isCoursePublished(course) {
  return Boolean(course?.isPublished) && (!course?.status || course.status === 'published');
}

function isCourseOwner(user, course) {
  return Boolean(user && course && idOf(course.educator) === idOf(user._id));
}

function includesId(values = [], id) {
  const needle = idOf(id);
  return (values || []).some((value) => idOf(value) === needle);
}

async function loadCourse(courseOrId) {
  if (!courseOrId) throw new AppError('Course not found', 404);
  if (courseOrId.title || courseOrId.educator) return courseOrId;
  const course = await Course.findById(courseOrId);
  if (!course) throw new AppError('Course not found', 404);
  return course;
}

async function hasCapturedCoursePayment(learnerId, courseId) {
  const payment = await Payment.findOne({
    user: learnerId,
    course: courseId,
    status: 'captured',
  }).select('_id');
  return Boolean(payment);
}

async function isLearnerEnrolledOrPaid(user, course) {
  if (!isLearnerUser(user)) return false;
  if (includesId(course.learners, user._id)) return true;
  return hasCapturedCoursePayment(user._id, course._id);
}

async function assertCanManageCourse(user, courseOrId) {
  const course = await loadCourse(courseOrId);
  if (isAdminUser(user) || isCourseOwner(user, course)) return course;
  throw new AppError('Course not found or not authorized', 404);
}

async function assertCanViewCourse(user, courseOrId) {
  const course = await loadCourse(courseOrId);
  if (isAdminUser(user) || isCourseOwner(user, course)) return course;
  if (isCoursePublished(course)) return course;
  if (await isLearnerEnrolledOrPaid(user, course)) return course;
  throw new AppError('Course not found or not available', 404);
}

async function assertCanViewCourseContent(user, courseOrId) {
  const course = await loadCourse(courseOrId);
  if (isAdminUser(user) || isCourseOwner(user, course)) return course;
  if (!isCoursePublished(course)) throw new AppError('Course is not available', 403);
  if (await isLearnerEnrolledOrPaid(user, course)) return course;
  throw new AppError('Please enroll in this course to access its content', 403);
}

async function assertCanViewMaterial(user, materialOrId) {
  const material = materialOrId?.course
    ? materialOrId
    : await Material.findById(materialOrId).populate('course');
  if (!material) throw new AppError('Material not found', 404);
  await assertCanViewCourseContent(user, material.course);
  return material;
}

async function assertCanViewQuiz(user, quizOrId) {
  const quiz = quizOrId?.course
    ? quizOrId
    : await Quiz.findById(quizOrId);
  if (!quiz) throw new AppError('Quiz not found', 404);
  await assertCanViewCourseContent(user, quiz.course);
  return quiz;
}

async function assertPaymentBelongsToLearner(payment, user) {
  if (!payment) throw new AppError('Payment record not found', 404);
  if (!isLearnerUser(user) || idOf(payment.user) !== idOf(user._id)) {
    throw new AppError('Payment record not found', 404);
  }
  return payment;
}

async function assertCoursePurchasable(courseOrId, user) {
  const course = await loadCourse(courseOrId);
  if (!isLearnerUser(user)) throw new AppError('Only learners can purchase courses', 403);
  if (!isCoursePublished(course)) throw new AppError('Course is not available for enrollment', 403);
  if (includesId(course.learners, user._id)) throw new AppError('Already enrolled in this course', 400);
  if (course.maxEnrollments > 0 && (course.learners || []).length >= course.maxEnrollments) {
    throw new AppError('This course is full', 400);
  }
  if (course.enrollmentDeadline && new Date(course.enrollmentDeadline).getTime() < Date.now()) {
    throw new AppError('Enrollment is closed for this course', 400);
  }
  return course;
}

async function enrollLearnerInCourse({ learnerId, courseId }) {
  const course = await Course.findById(courseId);
  if (!course) throw new AppError('Course not found', 404);
  if (!includesId(course.learners, learnerId)) {
    course.learners.push(learnerId);
    course.totalEnrollments = Math.max(course.totalEnrollments || 0, course.learners.length);
    await course.save();
  }
  await User.findByIdAndUpdate(learnerId, { $addToSet: { enrolledCourses: course._id } });
  return course;
}

module.exports = {
  normalizeRole,
  isAdminUser,
  isLearnerUser,
  isEducatorUser,
  isCoursePublished,
  isCourseOwner,
  includesId,
  hasCapturedCoursePayment,
  assertCanManageCourse,
  assertCanViewCourse,
  assertCanViewCourseContent,
  assertCanViewMaterial,
  assertCanViewQuiz,
  assertPaymentBelongsToLearner,
  assertCoursePurchasable,
  enrollLearnerInCourse,
};
