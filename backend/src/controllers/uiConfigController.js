const UIConfig = require('../models/UIConfig');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');

// ─── Public: Get UI config for a specific screen ───
exports.getScreenConfig = async (req, res, next) => {
  try {
    const { screen } = req.params;
    const now = new Date();

    const query = {
      screen: { $in: [screen, 'global'] },
      isActive: true,
      startsAt: { $lte: now },
      $or: [
        { expiresAt: null },
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: now } },
      ],
    };

    const role = req.user?.role === 'student' ? 'learner' : req.user?.role === 'teacher' ? 'educator' : req.user?.role;

    if (req.user) {
      query.$and = [
        {
          $or: [
            { targetRoles: { $in: ['all', role] } },
            { targetUserIds: req.user._id },
          ],
        },
      ];
    } else {
      query.$and = [
        {
          $or: [
            { targetRoles: { $in: ['all', 'guest'] } },
          ],
        },
      ];
    }

    const configs = await UIConfig.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    // Group by type for easier frontend consumption
    const grouped = {
      banners: configs.filter(c => c.type === 'banner'),
      carousels: configs.filter(c => c.type === 'carousel'),
      popups: configs.filter(c => c.type === 'popup'),
      strips: configs.filter(c => c.type === 'strip'),
      modals: configs.filter(c => c.type === 'modal'),
      sections: configs.filter(c => c.type === 'section'),
      announcements: configs.filter(c => c.type === 'announcement'),
    };

    sendResponse(res, 200, 'UI config fetched', grouped);
  } catch (err) { next(err); }
};

// ─── Public: Track impression ───
exports.trackImpression = async (req, res, next) => {
  try {
    const { id } = req.params;
    await UIConfig.findByIdAndUpdate(id, { $inc: { impressions: 1 } });
    sendResponse(res, 200, 'Impression tracked');
  } catch (err) { next(err); }
};

// ─── Public: Track click ───
exports.trackClick = async (req, res, next) => {
  try {
    const { id } = req.params;
    await UIConfig.findByIdAndUpdate(id, { $inc: { clicks: 1 } });
    sendResponse(res, 200, 'Click tracked');
  } catch (err) { next(err); }
};

// ─── Admin: List all UI configs ───
exports.listAll = async (req, res, next) => {
  try {
    const { screen, type, active } = req.query;
    const query = {};
    if (screen) query.screen = screen;
    if (type) query.type = type;
    if (active !== undefined) query.isActive = active === 'true';

    const configs = await UIConfig.find(query)
      .sort({ screen: 1, priority: -1, createdAt: -1 })
      .populate('createdBy', 'name email')
      .lean();

    sendResponse(res, 200, 'All UI configs fetched', configs);
  } catch (err) { next(err); }
};

// ─── Admin: Create UI config ───
exports.create = async (req, res, next) => {
  try {
    const {
      key, screen, type, title, description, content,
      targetRoles, targetUserIds, conditions,
      priority, isActive, startsAt, expiresAt,
    } = req.body;

    if (!key || !screen || !type) {
      throw new AppError('key, screen, and type are required', 400);
    }

    const existing = await UIConfig.findOne({ key });
    if (existing) throw new AppError(`UI config with key "${key}" already exists`, 400);

    const config = await UIConfig.create({
      key, screen, type, title, description, content,
      targetRoles: targetRoles || ['all'],
      targetUserIds: targetUserIds || [],
      conditions: conditions || {},
      priority: priority || 0,
      isActive: isActive !== undefined ? isActive : true,
      startsAt: startsAt || new Date(),
      expiresAt: expiresAt || null,
      createdBy: req.user._id,
    });

    sendResponse(res, 201, 'UI config created', config);
  } catch (err) { next(err); }
};

// ─── Admin: Update UI config ───
exports.update = async (req, res, next) => {
  try {
    const config = await UIConfig.findById(req.params.id);
    if (!config) throw new AppError('UI config not found', 404);

    const allowedFields = [
      'key', 'screen', 'type', 'title', 'description', 'content',
      'targetRoles', 'targetUserIds', 'conditions',
      'priority', 'isActive', 'startsAt', 'expiresAt',
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) config[field] = req.body[field];
    });

    await config.save();
    sendResponse(res, 200, 'UI config updated', config);
  } catch (err) { next(err); }
};

// ─── Admin: Delete UI config ───
exports.remove = async (req, res, next) => {
  try {
    const config = await UIConfig.findById(req.params.id);
    if (!config) throw new AppError('UI config not found', 404);
    await config.deleteOne();
    sendResponse(res, 200, 'UI config deleted');
  } catch (err) { next(err); }
};

// ─── Admin: Bulk toggle active status ───
exports.bulkToggle = async (req, res, next) => {
  try {
    const { ids, isActive } = req.body;
    if (!ids || !Array.isArray(ids)) throw new AppError('ids array is required', 400);

    await UIConfig.updateMany(
      { _id: { $in: ids } },
      { $set: { isActive } }
    );

    sendResponse(res, 200, `${ids.length} UI configs updated`);
  } catch (err) { next(err); }
};

// ─── Admin: Get BDUI analytics ───
exports.getAnalytics = async (req, res, next) => {
  try {
    const configs = await UIConfig.find()
      .select('key screen type title impressions clicks isActive')
      .sort({ clicks: -1 })
      .lean();

    const totalImpressions = configs.reduce((sum, c) => sum + (c.impressions || 0), 0);
    const totalClicks = configs.reduce((sum, c) => sum + (c.clicks || 0), 0);
    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0;

    sendResponse(res, 200, 'BDUI analytics fetched', {
      configs,
      totals: { totalImpressions, totalClicks, ctr: parseFloat(ctr) },
    });
  } catch (err) { next(err); }
};
