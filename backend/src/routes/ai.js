const router = require('express').Router();
const c = require('../controllers/aiController');
const auth = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.post('/study-plan', auth, aiLimiter, c.getStudyPlan);
router.post('/generate-quiz', auth, aiLimiter, c.generateAIQuiz);
router.post('/feedback', auth, aiLimiter, c.getFeedback);

module.exports = router;