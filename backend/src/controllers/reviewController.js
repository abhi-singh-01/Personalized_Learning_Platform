const Review = require('../models/Review');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');

// ─── Learner: Create a review ───
exports.create = async (req, res, next) => {
  try {
    const { courseId, rating, title, comment } = req.body;

    const course = await Course.findById(courseId);
    if (!course) throw new AppError('Course not found', 404);

    // Check if learner is enrolled
    const isEnrolled = course.learners.some(l => l.toString() === req.user._id.toString());
    if (!isEnrolled) throw new AppError('You must be enrolled to review this course', 403);

    // Check if already reviewed
    const existing = await Review.findOne({ course: courseId, learner: req.user._id });
    if (existing) throw new AppError('You have already reviewed this course', 400);

    const review = await Review.create({
      course: courseId,
      learner: req.user._id,
      rating,
      title: title || '',
      comment: comment || '',
    });

    // Update course rating aggregation
    await updateCourseRating(courseId);

    // Notify educator
    await Notification.create({
      user: course.educator,
      type: 'review_received',
      title: 'New Review',
      message: `${req.user.name} left a ${rating}-star review on "${course.title}"`,
      data: { courseId, reviewId: review._id, rating },
    });

    sendResponse(res, 201, 'Review submitted', review);
  } catch (err) { next(err); }
};

// ─── Public: Get reviews for a course ───
exports.getByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 10, sort = 'recent' } = req.query;

    const sortOption = sort === 'helpful' ? { helpful: -1 } : { createdAt: -1 };

    const reviews = await Review.find({ course: courseId, isApproved: true })
      .populate('learner', 'name avatar')
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Review.countDocuments({ course: courseId, isApproved: true });

    // Rating distribution
    const distribution = await Review.aggregate([
      { $match: { course: require('mongoose').Types.ObjectId.createFromHexString(courseId), isApproved: true } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    const ratingDist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    distribution.forEach(d => { ratingDist[d._id] = d.count; });

    sendResponse(res, 200, 'Reviews fetched', {
      reviews,
      total,
      ratingDistribution: ratingDist,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) { next(err); }
};

// ─── Learner: Update own review ───
exports.update = async (req, res, next) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, learner: req.user._id });
    if (!review) throw new AppError('Review not found', 404);

    const { rating, title, comment } = req.body;
    if (rating) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;

    await review.save();
    await updateCourseRating(review.course);

    sendResponse(res, 200, 'Review updated', review);
  } catch (err) { next(err); }
};

// ─── Learner: Delete own review ───
exports.remove = async (req, res, next) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, learner: req.user._id });
    if (!review) throw new AppError('Review not found', 404);

    const courseId = review.course;
    await review.deleteOne();
    await updateCourseRating(courseId);

    sendResponse(res, 200, 'Review deleted');
  } catch (err) { next(err); }
};

// ─── Learner: Mark review as helpful ───
exports.markHelpful = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) throw new AppError('Review not found', 404);

    const alreadyVoted = review.helpfulVoters.some(v => v.toString() === req.user._id.toString());
    if (alreadyVoted) {
      review.helpfulVoters = review.helpfulVoters.filter(v => v.toString() !== req.user._id.toString());
      review.helpful = Math.max(0, review.helpful - 1);
    } else {
      review.helpfulVoters.push(req.user._id);
      review.helpful += 1;
    }

    await review.save();
    sendResponse(res, 200, alreadyVoted ? 'Removed helpful vote' : 'Marked as helpful', { helpful: review.helpful });
  } catch (err) { next(err); }
};

// ─── Educator: Reply to a review ───
exports.educatorReply = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id).populate('course', 'educator');
    if (!review) throw new AppError('Review not found', 404);

    if (review.course.educator.toString() !== req.user._id.toString())
      throw new AppError('Not authorized — not the course educator', 403);

    review.educatorReply = req.body.reply || '';
    review.repliedAt = new Date();
    await review.save();

    // Notify the learner
    await Notification.create({
      user: review.learner,
      type: 'review_reply',
      title: 'Educator replied to your review',
      message: `The educator responded to your review.`,
      data: { courseId: review.course._id, reviewId: review._id },
    });

    sendResponse(res, 200, 'Reply added', review);
  } catch (err) { next(err); }
};

// ─── Learner: Report a review ───
exports.report = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) throw new AppError('Review not found', 404);

    review.isReported = true;
    review.reportReason = req.body.reason || 'Inappropriate content';
    review.reportedBy = req.user._id;
    await review.save();

    sendResponse(res, 200, 'Review reported for moderation');
  } catch (err) { next(err); }
};

// ─── Admin: Get flagged reviews ───
exports.getFlagged = async (req, res, next) => {
  try {
    const reviews = await Review.find({ isReported: true })
      .populate('learner', 'name email')
      .populate('course', 'title')
      .populate('reportedBy', 'name')
      .sort({ createdAt: -1 })
      .lean();

    sendResponse(res, 200, 'Flagged reviews fetched', reviews);
  } catch (err) { next(err); }
};

// ─── Admin: Moderate a review ───
exports.moderate = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) throw new AppError('Review not found', 404);

    const { action } = req.body; // 'approve' or 'reject'
    if (action === 'approve') {
      review.isApproved = true;
      review.isReported = false;
    } else if (action === 'reject') {
      review.isApproved = false;
    } else {
      throw new AppError('Action must be "approve" or "reject"', 400);
    }

    review.moderatedBy = req.user._id;
    review.moderatedAt = new Date();
    await review.save();

    if (action === 'reject') {
      await updateCourseRating(review.course);
    }

    sendResponse(res, 200, `Review ${action}d`, review);
  } catch (err) { next(err); }
};

// Helper: recalculate course average rating
async function updateCourseRating(courseId) {
  const result = await Review.aggregate([
    { $match: { course: require('mongoose').Types.ObjectId.createFromHexString(courseId.toString()), isApproved: true } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);

  const avg = result.length > 0 ? result[0].avgRating : 0;
  const count = result.length > 0 ? result[0].count : 0;

  await Course.findByIdAndUpdate(courseId, {
    averageRating: Math.round(avg * 10) / 10,
    totalReviews: count,
  });
}
