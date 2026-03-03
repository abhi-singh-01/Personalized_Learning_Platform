const router = require('express').Router();
const c = require('../controllers/quizController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.get('/course/:courseId', auth, c.getByCourse);
router.get('/teaching', auth, role('teacher'), c.getTeacherQuizzes);
router.get('/:id', auth, c.getById);
router.post('/', auth, role('teacher'), c.create);
router.delete('/:id', auth, role('teacher'), c.remove);

module.exports = router;