const FeatureFlag = require('../models/FeatureFlag');
const AppError = require('../utils/AppError');
const { sendResponse } = require('../utils/response');

// ─── Auth: Get flags for the current user ───
exports.getMyFlags = async (req, res, next) => {
  try {
    const flags = await FeatureFlag.find({ isEnabled: true }).lean();

    // Filter flags based on user's role and specific user targeting
    const userFlags = {};
    for (const flag of flags) {
      let enabled = false;

      // Check role-based access
      if (flag.enabledForRoles.length === 0 || flag.enabledForRoles.includes(req.user.role)) {
        enabled = true;
      }

      // Check specific user targeting
      if (flag.enabledForUsers.length > 0) {
        enabled = flag.enabledForUsers.some(uid => uid.toString() === req.user._id.toString());
      }

      // Apply rollout percentage (deterministic based on user ID)
      if (enabled && flag.rolloutPercentage < 100) {
        const hash = simpleHash(req.user._id.toString() + flag.name);
        enabled = (hash % 100) < flag.rolloutPercentage;
      }

      userFlags[flag.name] = {
        enabled,
        metadata: flag.metadata || {},
      };
    }

    sendResponse(res, 200, 'Feature flags fetched', userFlags);
  } catch (err) { next(err); }
};

// Deterministic hash for consistent rollout
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// ─── Admin: List all flags ───
exports.listAll = async (req, res, next) => {
  try {
    const flags = await FeatureFlag.find()
      .sort({ name: 1 })
      .populate('createdBy', 'name email')
      .lean();
    sendResponse(res, 200, 'All feature flags fetched', flags);
  } catch (err) { next(err); }
};

// ─── Admin: Create flag ───
exports.create = async (req, res, next) => {
  try {
    const { name, description, isEnabled, enabledForRoles, enabledForUsers, rolloutPercentage, metadata } = req.body;

    if (!name) throw new AppError('Flag name is required', 400);

    const existing = await FeatureFlag.findOne({ name });
    if (existing) throw new AppError(`Flag "${name}" already exists`, 400);

    const flag = await FeatureFlag.create({
      name,
      description: description || '',
      isEnabled: isEnabled || false,
      enabledForRoles: enabledForRoles || [],
      enabledForUsers: enabledForUsers || [],
      rolloutPercentage: rolloutPercentage ?? 100,
      metadata: metadata || {},
      createdBy: req.user._id,
    });

    sendResponse(res, 201, 'Feature flag created', flag);
  } catch (err) { next(err); }
};

// ─── Admin: Update flag ───
exports.update = async (req, res, next) => {
  try {
    const flag = await FeatureFlag.findById(req.params.id);
    if (!flag) throw new AppError('Feature flag not found', 404);

    const allowedFields = ['name', 'description', 'isEnabled', 'enabledForRoles', 'enabledForUsers', 'rolloutPercentage', 'metadata'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) flag[field] = req.body[field];
    });

    await flag.save();
    sendResponse(res, 200, 'Feature flag updated', flag);
  } catch (err) { next(err); }
};

// ─── Admin: Toggle flag ───
exports.toggle = async (req, res, next) => {
  try {
    const flag = await FeatureFlag.findById(req.params.id);
    if (!flag) throw new AppError('Feature flag not found', 404);

    flag.isEnabled = !flag.isEnabled;
    await flag.save();

    sendResponse(res, 200, `Flag "${flag.name}" ${flag.isEnabled ? 'enabled' : 'disabled'}`, flag);
  } catch (err) { next(err); }
};

// ─── Admin: Delete flag ───
exports.remove = async (req, res, next) => {
  try {
    const flag = await FeatureFlag.findById(req.params.id);
    if (!flag) throw new AppError('Feature flag not found', 404);
    await flag.deleteOne();
    sendResponse(res, 200, 'Feature flag deleted');
  } catch (err) { next(err); }
};
