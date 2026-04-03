const AuditLog = require('../models/AuditLog');
const { sendResponse } = require('../utils/response');

// ─── Helper: Log an admin action (call from other controllers) ───
exports.logAction = async ({ adminId, action, targetModel, targetId, previousValue, newValue, details, req }) => {
  try {
    await AuditLog.create({
      admin: adminId,
      action,
      targetModel: targetModel || '',
      targetId: targetId || null,
      previousValue: previousValue || {},
      newValue: newValue || {},
      details: details || '',
      ipAddress: req?.ip || req?.connection?.remoteAddress || '',
      userAgent: req?.get?.('User-Agent') || '',
    });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

// ─── Admin: Get audit logs ───
exports.getLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action, adminId, targetModel, startDate, endDate } = req.query;
    const query = {};

    if (action) query.action = action;
    if (adminId) query.admin = adminId;
    if (targetModel) query.targetModel = targetModel;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .populate('admin', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await AuditLog.countDocuments(query);

    // Get unique actions for filter dropdown
    const uniqueActions = await AuditLog.distinct('action');

    sendResponse(res, 200, 'Audit logs fetched', {
      logs,
      total,
      uniqueActions,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) { next(err); }
};

// ─── Admin: Get audit log stats ───
exports.getStats = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const actionCounts = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    const adminActivity = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$admin', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const dailyActivity = await AuditLog.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    sendResponse(res, 200, 'Audit stats fetched', { actionCounts, adminActivity, dailyActivity });
  } catch (err) { next(err); }
};
