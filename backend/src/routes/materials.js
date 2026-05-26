const router = require('express').Router();
const c = require('../controllers/materialController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const upload = require('../middleware/upload');

router.get('/course/:courseId', auth, c.getByCourse);
router.put('/course/:courseId/reorder', auth, role('educator'), c.reorderCourse);
router.post('/', auth, role('educator'), upload.single('file'), c.create);
router.put('/:id', auth, role('educator'), upload.single('file'), c.update);
router.get('/:id/file', auth, c.serveFile);
router.post('/:id/view', auth, role('learner'), c.trackView);
router.delete('/:id', auth, role('educator'), c.remove);

module.exports = router;