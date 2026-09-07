const mailService = require('../services/mailService');

/**
 * Validates email format roughly
 */
function isValidEmail(email) {
  return typeof email === 'string' && email.trim().length > 3 && email.includes('@');
}

/**
 * Controller to send an email
 */
async function sendMail(req, res, next) {
  try {
    const { from, to, cc, bcc, subject, text, html } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: "to" (recipient email address)',
      });
    }

    // Basic recipient format validation
    const recipients = Array.isArray(to) ? to : [to];
    for (const recipient of recipients) {
      if (!isValidEmail(recipient)) {
        return res.status(400).json({
          success: false,
          error: `Invalid email address format for recipient: "${recipient}"`,
        });
      }
    }

    if (!text && !html) {
      return res.status(400).json({
        success: false,
        error: 'Either "text" or "html" email body content must be provided',
      });
    }

    const result = await mailService.sendMail({
      from,
      to,
      cc,
      bcc,
      subject,
      text,
      html,
    });

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      data: result,
    });
  } catch (error) {
    console.error('[MailController] Error sending mail:', error);
    next(error);
  }
}

/**
 * Controller to fetch sent emails history
 */
async function getMailHistory(req, res) {
  const limit = parseInt(req.query.limit, 10) || 50;
  const history = mailService.getHistory(limit);

  return res.status(200).json({
    success: true,
    count: history.length,
    data: history,
  });
}

/**
 * Service health check controller
 */
function healthCheck(req, res) {
  return res.status(200).json({
    success: true,
    service: 'Patra Mailing Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
}

module.exports = {
  sendMail,
  getMailHistory,
  healthCheck,
};
