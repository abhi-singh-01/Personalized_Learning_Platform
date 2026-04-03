const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');

// ─── Auth: Get my notifications ───
exports.getMyNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const query = { user: req.user._id };
    if (unreadOnly === 'true') query.isRead = false;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

    sendResponse(res, 200, 'Notifications fetched', {
      notifications,
      total,
      unreadCount,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) { next(err); }
};

// ─── Auth: Get unread count ───
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ user: req.user._id, isRead: false });
    sendResponse(res, 200, 'Unread count fetched', { count });
  } catch (err) { next(err); }
};

// ─── Auth: Mark notification as read ───
exports.markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!notification) throw new AppError('Notification not found', 404);

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    sendResponse(res, 200, 'Notification marked as read');
  } catch (err) { next(err); }
};

// ─── Auth: Mark all as read ───
exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
    sendResponse(res, 200, 'All notifications marked as read');
  } catch (err) { next(err); }
};

// ─── Auth: Delete a notification ───
exports.remove = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!notification) throw new AppError('Notification not found', 404);
    sendResponse(res, 200, 'Notification deleted');
  } catch (err) { next(err); }
};

// ─── Auth: Clear all notifications ───
exports.clearAll = async (req, res, next) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    sendResponse(res, 200, 'All notifications cleared');
  } catch (err) { next(err); }
};

// ─── System: Create a notification (internal helper, also admin) ───
exports.createNotification = async ({ userId, type, title, message, data, channel }) => {
  try {
    return await Notification.create({
      user: userId,
      type,
      title,
      message: message || '',
      data: data || {},
      channel: channel || 'in_app',
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
};

// ─── System: Bulk create notifications ───
exports.createBulkNotifications = async (notifications) => {
  try {
    return await Notification.insertMany(notifications);
  } catch (err) {
    console.error('Failed to create bulk notifications:', err.message);
    return [];
  }
};

// ─── Admin: Send announcement to all or specific roles ───
exports.sendAnnouncement = async (req, res, next) => {
  try {
    const { title, message, targetRoles, targetUserIds } = req.body;
    if (!title) throw new AppError('Title is required', 400);

    const User = require('../models/User');
    let userIds = [];

    if (targetUserIds && targetUserIds.length > 0) {
      userIds = targetUserIds;
    } else if (targetRoles && targetRoles.length > 0) {
      const users = await User.find({ role: { $in: targetRoles } }).select('_id');
      userIds = users.map(u => u._id);
    } else {
      // All users
      const users = await User.find().select('_id');
      userIds = users.map(u => u._id);
    }

    const notifications = userIds.map(uid => ({
      user: uid,
      type: 'announcement',
      title,
      message: message || '',
      data: { sentBy: req.user._id },
    }));

    await Notification.insertMany(notifications);

    // Emit via socket
    const io = req.app.get('io');
    if (io) {
      userIds.forEach(uid => {
        io.to(`user:${uid}`).emit('notification:new', { type: 'announcement', title, message });
      });
    }

    sendResponse(res, 201, `Announcement sent to ${userIds.length} users`);
  } catch (err) { next(err); }
};
