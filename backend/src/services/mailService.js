const nodemailer = require('nodemailer');
const config = require('../config');

const mailHistory = [];

let cachedTransporter = null;

// Initializes or returns a cached Nodemailer transporter (SMTP or Ethereal fallback)
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

// Dispatches an email message and appends it to the outbox log with user ownership
async function sendMail({ from, to, cc, bcc, subject, text, html, userId = null }) {
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
    userId: userId || null,
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

  mailHistory.unshift(record);
  if (mailHistory.length > 100) {
    mailHistory.pop();
  }

  return record;
}

// Retrieves mail delivery history filtered by user ownership
function getHistory(limit = 50, userId = null) {
  if (userId) {
    return mailHistory.filter((item) => item.userId === userId).slice(0, limit);
  }
  return mailHistory.filter((item) => !item.userId).slice(0, limit);
}

module.exports = {
  sendMail,
  getHistory,
  getTransporter,
};
