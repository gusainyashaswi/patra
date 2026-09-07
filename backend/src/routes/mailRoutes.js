const express = require('express');
const { sendMail, getMailHistory, healthCheck } = require('../controllers/mailController');

const router = express.Router();

// Health check endpoint
router.get('/health', healthCheck);

// Mail endpoints
router.post('/mail/send', sendMail);
router.get('/mail/history', getMailHistory);

module.exports = router;
