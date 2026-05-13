const router = require('express').Router();
const c = require('../controllers/chatbotController');
const auth = require('../middleware/auth');
const { chatLimiter } = require('../middleware/rateLimiter');
const chatUpload = require('../middleware/chatUpload');

// Chat endpoints — all require authentication
router.post('/chat', auth, chatLimiter, chatUpload.single('attachment'), c.chat);
router.post('/stream', auth, chatLimiter, chatUpload.single('attachment'), c.chatStream);
router.post('/quick-explain', auth, chatLimiter, c.quickExplain);
router.get('/suggest', auth, c.suggestQuestions);

module.exports = router;
