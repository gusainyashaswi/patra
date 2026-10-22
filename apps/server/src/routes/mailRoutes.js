const express = require('express');
const { sendMail, getMailHistory, healthCheck } = require('../controllers/mailController');
const { optionalAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/health', healthCheck);

// Mail endpoints supporting both authenticated user ownership and public testing
router.post('/mail/send', optionalAuth, sendMail);
router.get('/mail/history', optionalAuth, getMailHistory);

module.exports = router;
