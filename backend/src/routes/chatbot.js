const router = require('express').Router();
const c = require('../controllers/chatbotController');
const auth = require('../middleware/auth');
const { chatLimiter } = require('../middleware/rateLimiter');

// Chat endpoints — all require authentication
router.post('/chat', auth, chatLimiter, c.chat);
router.post('/stream', auth, chatLimiter, c.chatStream);
router.post('/quick-explain', auth, chatLimiter, c.quickExplain);
router.get('/suggest', auth, c.suggestQuestions);

module.exports = router;
