const router = require('express').Router();
const c = require('../controllers/adminController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// All routes require authentication and admin role
router.use(auth, role('admin'));

router.get('/stats', c.getDashboardStats);
router.get('/users', c.getAllUsers);
router.post('/users', c.createUser);
router.put('/users/:id/role', c.updateUserRole);
router.delete('/users/:id', c.deleteUser);
router.post('/assign-student', c.assignStudentToTeacher);

// Admin Course Management
router.get('/courses', c.getAllCourses);
router.put('/courses/:id', c.updateCourseAdmin);
router.delete('/courses/:id', c.deleteCourseAdmin);
router.delete('/materials/:id', c.deleteMaterialAdmin);

// Admin System Settings
router.get('/settings', c.getSettings);
router.put('/settings', c.updateSettings);

// Admin Analytics
router.get('/analytics', c.getAnalytics);

module.exports = router;
