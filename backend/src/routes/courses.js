const router = require('express').Router();
const c = require('../controllers/courseController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const courseThumbnailUpload = require('../middleware/courseThumbnailUpload');

router.get('/public', c.getAll);  // public — no auth needed for homepage search
router.get('/', auth, c.getAll);
router.get('/teaching', auth, role('educator'), c.getEducatorCourses);
router.get('/:id/thumbnail', auth, c.serveThumbnail);
router.get('/:id', auth, c.getById);
router.post('/', auth, role('educator'), courseThumbnailUpload.single('thumbnail'), c.create);
router.put('/:id', auth, role('educator'), courseThumbnailUpload.single('thumbnail'), c.update);
router.delete('/:id', auth, role('educator'), c.remove);
router.post('/:id/duplicate', auth, role('educator'), c.duplicateCourse);
router.patch('/:id/toggle-publish', auth, role('educator'), c.togglePublish);
router.post('/:id/enroll', auth, role('learner'), c.enroll);

// Progress
router.post('/:id/materials/:materialId/complete', auth, role('learner'), c.toggleMaterialComplete);
router.get('/:id/progress', auth, c.getCourseProgress);

// Comments
router.get('/:id/comments', auth, c.getComments);
router.post('/:id/comments', auth, c.addComment);

module.exports = router;