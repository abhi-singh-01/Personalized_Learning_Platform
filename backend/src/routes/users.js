const router = require('express').Router();
const c = require('../controllers/userController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

router.put('/profile', auth, c.updateProfile);
router.put('/change-password', auth, c.changePassword);
router.post('/student', auth, role('teacher'), c.createStudentByTeacher);

module.exports = router;