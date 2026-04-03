const router = require('express').Router();
const c = require('../controllers/notificationController');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// Auth — personal notifications
router.get('/', auth, c.getMyNotifications);
router.get('/unread-count', auth, c.getUnreadCount);
router.put('/:id/read', auth, c.markRead);
router.put('/read-all', auth, c.markAllRead);
router.delete('/:id', auth, c.remove);
router.delete('/', auth, c.clearAll);

// Admin — broadcast announcements
router.post('/announce', auth, role('admin'), c.sendAnnouncement);

module.exports = router;
