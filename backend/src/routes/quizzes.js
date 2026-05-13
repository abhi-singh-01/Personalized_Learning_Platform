const router = require('express').Router();
const c = require('../controllers/quizController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.get('/course/:courseId', auth, c.getByCourse);
router.get('/teaching', auth, role('educator'), c.getEducatorQuizzes);
router.get('/:id', auth, c.getById);
router.post('/', auth, role('educator'), c.create);
router.put('/:id', auth, role('educator'), c.update);
router.delete('/:id', auth, role('educator'), c.remove);

module.exports = router;