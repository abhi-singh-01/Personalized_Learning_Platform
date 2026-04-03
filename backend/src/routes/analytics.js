const router = require('express').Router();
const c = require('../controllers/analyticsController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.get('/learner/dashboard', auth, role('learner'), c.learnerDashboard);
router.get('/educator/dashboard', auth, role('educator'), c.educatorDashboard);

module.exports = router;