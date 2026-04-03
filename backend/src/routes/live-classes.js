const router = require('express').Router();
const c = require('../controllers/liveClassController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Educator — start classes
router.post('/start/:scheduleId', auth, role('educator'), c.startFromSchedule);
router.post('/start-quick', auth, role('educator'), c.startQuick);

// Educator — manage
router.put('/:id/end', auth, role('educator'), c.end);
router.get('/educator/active', auth, role('educator'), c.getEducatorActive);
router.get('/educator/history', auth, role('educator'), c.getHistory);
router.get('/:id/attendance', auth, role('educator'), c.getAttendance);

// Learner — join/leave
router.post('/:id/join', auth, c.join);
router.post('/:id/leave', auth, c.leave);

// Auth — active classes (role-aware)
router.get('/active', auth, c.getActive);

// Chat
router.post('/:id/chat', auth, c.sendChat);
router.get('/:id/chat', auth, c.getChatHistory);

// Admin — monitoring
router.get('/admin/all', auth, role('admin'), c.adminGetAll);
router.put('/admin/:id/force-end', auth, role('admin'), c.adminForceEnd);

module.exports = router;
