const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5001,
  nodeEnv: process.env.NODE_ENV || 'development',
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  defaultFrom: process.env.FROM_EMAIL || '"Patra Mailer" <no-reply@patramail.local>',
};

module.exports = config;
