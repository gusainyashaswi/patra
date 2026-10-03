const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, getMe, logout } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

// Rate limiter to mitigate brute-force authentication attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', authenticate, getMe);
router.post('/logout', logout);

module.exports = router;
