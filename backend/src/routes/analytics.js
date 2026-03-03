const router = require('express').Router();
const c = require('../controllers/analyticsController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.get('/student/dashboard', auth, role('student'), c.studentDashboard);
router.get('/teacher/dashboard', auth, role('teacher'), c.teacherDashboard);

module.exports = router;