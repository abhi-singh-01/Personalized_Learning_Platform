const router = require('express').Router();
const c = require('../controllers/aiController');
const t = require('../controllers/transcriptController');
const auth = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

// Existing AI routes
router.post('/study-plan', auth, aiLimiter, c.getStudyPlan);
router.post('/generate-quiz', auth, aiLimiter, c.generateAIQuiz);
router.post('/feedback', auth, aiLimiter, c.getFeedback);

// Video transcript routes
router.post('/transcribe/:materialId', auth, aiLimiter, t.transcribe);
router.post('/generate-notes/:materialId', auth, aiLimiter, t.generateNotes);
router.post('/extract-syllabus/:materialId', auth, aiLimiter, t.extractSyllabus);
router.post('/generate-roadmap/:materialId', auth, aiLimiter, t.generateRoadmap);
router.get('/transcript/:materialId', auth, t.getTranscript);

module.exports = router;