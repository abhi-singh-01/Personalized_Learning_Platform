const router = require('express').Router();
const c = require('../controllers/progressController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.post('/submit', auth, role('student'), c.submitQuiz);
router.get('/my', auth, role('student'), c.getStudentProgress);
router.get('/course/:courseId', auth, role('student'), c.getCourseProgress);

module.exports = router;
