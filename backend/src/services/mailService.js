const nodemailer = require('nodemailer');
const config = require('../config');

// In-memory outbox / history log (can be extended to a database)
const mailHistory = [];

let cachedTransporter = null;

/**
 * Initializes and returns a nodemailer transporter.
 * If SMTP credentials are provided in config, uses them;
 * otherwise automatically creates a test account via Ethereal Mail.
 */
async function getTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  if (config.smtp.host && config.smtp.user) {
    cachedTransporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
    console.log(`[MailService] Using configured SMTP host: ${config.smtp.host}`);
  } else {
    // Generate an Ethereal test account for seamless local testing
    console.log('[MailService] No SMTP credentials provided. Creating ethereal test account...');
    const testAccount = await nodemailer.createTestAccount();
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`[MailService] Ethereal test account ready: ${testAccount.user}`);
  }

  return cachedTransporter;
}

/**
 * Send an email message.
 * @param {Object} options
 * @param {string} [options.from]
 * @param {string|string[]} options.to
 * @param {string|string[]} [options.cc]
 * @param {string|string[]} [options.bcc]
 * @param {string} options.subject
 * @param {string} [options.text]
 * @param {string} [options.html]
 */
async function sendMail({ from, to, cc, bcc, subject, text, html }) {
  const transporter = await getTransporter();

  const mailOptions = {
    from: from || config.defaultFrom,
    to: Array.isArray(to) ? to.join(', ') : to,
    cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
    bcc: bcc ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : undefined,
    subject: subject || '(No Subject)',
    text: text || '',
    html: html || (text ? `<p>${text.replace(/\n/g, '<br>')}</p>` : ''),
  };

  const info = await transporter.sendMail(mailOptions);
  const previewUrl = nodemailer.getTestMessageUrl(info) || null;

  const record = {
    id: info.messageId || `msg_${Date.now()}`,
    timestamp: new Date().toISOString(),
    from: mailOptions.from,
    to: mailOptions.to,
    cc: mailOptions.cc || null,
    bcc: mailOptions.bcc || null,
    subject: mailOptions.subject,
    previewUrl,
    status: 'sent',
    response: info.response,
  };

  // Keep latest 100 emails in memory history
  mailHistory.unshift(record);
  if (mailHistory.length > 100) {
    mailHistory.pop();
  }

  return record;
}

/**
 * Get mail delivery history.
 */
function getHistory(limit = 50) {
  return mailHistory.slice(0, limit);
}

module.exports = {
  sendMail,
  getHistory,
  getTransporter,
};
