const router = require('express').Router();
const c = require('../controllers/progressController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.post('/submit', auth, role('learner'), c.submitQuiz);
router.get('/my', auth, role('learner'), c.getLearnerProgress);
router.get('/course/:courseId', auth, role('learner'), c.getCourseProgress);

module.exports = router;
