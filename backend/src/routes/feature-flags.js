const router = require('express').Router();
const c = require('../controllers/featureFlagController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Auth — get flags for current user
router.get('/me', auth, c.getMyFlags);

// Admin — full management
router.get('/', auth, role('admin'), c.listAll);
router.post('/', auth, role('admin'), c.create);
router.put('/:id', auth, role('admin'), c.update);
router.patch('/:id/toggle', auth, role('admin'), c.toggle);
router.delete('/:id', auth, role('admin'), c.remove);

module.exports = router;
