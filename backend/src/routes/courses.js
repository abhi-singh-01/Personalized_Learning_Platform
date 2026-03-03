const router = require('express').Router();
const c = require('../controllers/courseController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.get('/', auth, c.getAll);
router.get('/teaching', auth, role('teacher'), c.getTeacherCourses);
router.get('/:id', auth, c.getById);
router.post('/', auth, role('teacher'), c.create);
router.put('/:id', auth, role('teacher'), c.update);
router.delete('/:id', auth, role('teacher'), c.remove);
router.post('/:id/enroll', auth, role('student'), c.enroll);

// Progress
router.post('/:id/materials/:materialId/complete', auth, role('student'), c.toggleMaterialComplete);
router.get('/:id/progress', auth, c.getCourseProgress);

// Comments
router.get('/:id/comments', auth, c.getComments);
router.post('/:id/comments', auth, c.addComment);

module.exports = router;