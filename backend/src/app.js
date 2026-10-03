const express = require('express');
const cors = require('cors');
const mailRoutes = require('./routes/mailRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Logs HTTP request method, URL, status code, and duration
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api', mailRoutes);

app.get('/', (req, res) => {
  res.json({
    name: 'Patra Mailing & Auth Service API',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: {
      health: 'GET /api/health',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me',
      logout: 'POST /api/auth/logout',
      sendMail: 'POST /api/mail/send',
      history: 'GET /api/mail/history',
    },
  });
});

// Handles unmatched routes with a 404 response
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('[App] Unhandled error:', err.message);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: status === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error',
  });
});

module.exports = app;
