const app = require('./app');
const config = require('./config');

const server = app.listen(config.port, () => {
  console.log('==============================================');
  console.log(`  Patra Mailing Service Backend`);
  console.log(`  Running on: http://localhost:${config.port}`);
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log('==============================================');
});

// Gracefully terminates server connections on process termination signals
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Process terminated.');
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Process terminated.');
  });
});
