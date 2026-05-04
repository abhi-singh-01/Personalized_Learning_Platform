const router = require('express').Router();
const {
  register, login, googleLogin, getMe, completeProfile, switchRole,
  logout, getSessions, revokeSession, revokeAllOtherSessions,
  registerValidation, loginValidation
} = require('../controllers/authController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);
router.post('/google', authLimiter, googleLogin);
router.get('/me', auth, getMe);
router.put('/complete-profile', auth, completeProfile);
router.post('/switch-role', auth, switchRole);

// Session management
router.post('/logout', auth, logout);
router.get('/sessions', auth, getSessions);
router.delete('/sessions/:sessionId', auth, revokeSession);
router.delete('/sessions', auth, revokeAllOtherSessions);

module.exports = router;