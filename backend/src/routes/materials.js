const router = require('express').Router();
const c = require('../controllers/materialController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const upload = require('../middleware/upload');

router.get('/course/:courseId', auth, c.getByCourse);
router.post('/', auth, role('teacher'), upload.single('file'), c.create);
router.put('/:id', auth, role('teacher'), upload.single('file'), c.update);
router.post('/:id/view', auth, role('student'), c.trackView);
router.delete('/:id', auth, role('teacher'), c.remove);

module.exports = router;