const router = require('express').Router();
const c = require('../controllers/auditLogController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Admin only
router.get('/', auth, role('admin'), c.getLogs);
router.get('/stats', auth, role('admin'), c.getStats);

module.exports = router;
