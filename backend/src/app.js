const express = require('express');
const cors = require('cors');
const mailRoutes = require('./routes/mailRoutes');

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// API Routes
app.use('/api', mailRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Patra Mailing Service API',
    version: '1.0.0',
    documentation: '/api/health',
    endpoints: {
      health: 'GET /api/health',
      sendMail: 'POST /api/mail/send',
      history: 'GET /api/mail/history',
    },
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[App] Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
});

module.exports = app;
