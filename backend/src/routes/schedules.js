const router = require('express').Router();
const c = require('../controllers/scheduleController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.post('/', auth, role('educator'), c.create);
router.get('/educator', auth, role('educator'), c.getEducatorSchedules);
router.get('/learner/upcoming', auth, role('learner'), c.getUpcoming);
router.get('/course/:courseId', auth, c.getByCourse);
router.put('/:id/cancel', auth, role('educator'), c.cancel);
router.delete('/:id', auth, role('educator'), c.remove);

module.exports = router;
