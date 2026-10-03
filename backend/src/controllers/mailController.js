const mailService = require('../services/mailService');

// Validates basic email string format
function isValidEmail(email) {
  return typeof email === 'string' && email.trim().length > 3 && email.includes('@');
}

// Validates payload and dispatches email via mail service
async function sendMail(req, res, next) {
  try {
    const { from, to, cc, bcc, subject, text, html } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: "to" (recipient email address)',
      });
    }

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

    const userId = req.user ? req.user.id : null;

    const result = await mailService.sendMail({
      from,
      to,
      cc,
      bcc,
      subject,
      text,
      html,
      userId,
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

// Retrieves sent mail history scoped to the requesting user
async function getMailHistory(req, res) {
  const limit = parseInt(req.query.limit, 10) || 50;
  const userId = req.user ? req.user.id : null;
  const history = mailService.getHistory(limit, userId);

  return res.status(200).json({
    success: true,
    count: history.length,
    data: history,
  });
}

// Returns current service health status
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
