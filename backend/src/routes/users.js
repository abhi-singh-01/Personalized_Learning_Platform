const router = require('express').Router();
const c = require('../controllers/userController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.put('/profile', auth, c.updateProfile);
router.put('/change-password', auth, c.changePassword);
router.post('/learner', auth, role('educator'), c.createLearnerByEducator);

module.exports = router;