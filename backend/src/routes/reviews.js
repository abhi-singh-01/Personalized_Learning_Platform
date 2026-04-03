const router = require('express').Router();
const c = require('../controllers/reviewController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Public — get reviews for a course
router.get('/course/:courseId', c.getByCourse);

// Learner — CRUD
router.post('/', auth, role('learner'), c.create);
router.put('/:id', auth, role('learner'), c.update);
router.delete('/:id', auth, role('learner'), c.remove);
router.post('/:id/helpful', auth, c.markHelpful);
router.post('/:id/report', auth, c.report);

// Educator — reply
router.post('/:id/reply', auth, role('educator'), c.educatorReply);

// Admin — moderation
router.get('/flagged', auth, role('admin'), c.getFlagged);
router.put('/:id/moderate', auth, role('admin'), c.moderate);

module.exports = router;
