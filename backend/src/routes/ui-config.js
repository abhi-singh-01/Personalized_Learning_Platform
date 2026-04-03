const router = require('express').Router();
const c = require('../controllers/uiConfigController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Public — get UI config for a screen (optionally authenticated for targeting)
router.get('/screen/:screen', optionalAuth, c.getScreenConfig);

// Public — tracking
router.post('/:id/impression', c.trackImpression);
router.post('/:id/click', c.trackClick);

// Admin — full management
router.get('/', auth, role('admin'), c.listAll);
router.get('/analytics', auth, role('admin'), c.getAnalytics);
router.post('/', auth, role('admin'), c.create);
router.put('/:id', auth, role('admin'), c.update);
router.delete('/:id', auth, role('admin'), c.remove);
router.post('/bulk-toggle', auth, role('admin'), c.bulkToggle);

// Optional auth middleware — attaches user if token present, but doesn't reject
function optionalAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next();

  try {
    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../config/env');
    const User = require('../models/User');

    const decoded = jwt.verify(token, JWT_SECRET);
    User.findById(decoded.id).then(user => {
      if (user) req.user = user;
      next();
    }).catch(() => next());
  } catch {
    next();
  }
}

module.exports = router;
