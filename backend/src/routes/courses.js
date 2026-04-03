const router = require('express').Router();
const c = require('../controllers/courseController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.get('/public', c.getAll);  // public — no auth needed for homepage search
router.get('/', auth, c.getAll);
router.get('/teaching', auth, role('educator'), c.getEducatorCourses);
router.get('/:id', auth, c.getById);
router.post('/', auth, role('educator'), c.create);
router.put('/:id', auth, role('educator'), c.update);
router.delete('/:id', auth, role('educator'), c.remove);
router.post('/:id/enroll', auth, role('learner'), c.enroll);

// Progress
router.post('/:id/materials/:materialId/complete', auth, role('learner'), c.toggleMaterialComplete);
router.get('/:id/progress', auth, c.getCourseProgress);

// Comments
router.get('/:id/comments', auth, c.getComments);
router.post('/:id/comments', auth, c.addComment);

module.exports = router;