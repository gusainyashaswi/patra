const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const config = require('../config');

// PostgreSQL connection pool used by pg and Prisma adapter
const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[Database] Unexpected error on idle PostgreSQL client:', err.message);
});

// Prisma 7 driver adapter using the shared pg connection pool
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Direct raw query helper for flexibility
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (config.nodeEnv === 'development' && duration > 100) {
    console.log(`[Database] Slow query (${duration}ms): ${text}`);
  }
  return res;
}

// Retrieves a client directly from the pool
async function getClient() {
  const client = await pool.connect();
  return client;
}

// Database connectivity test
async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW() AS current_time');
    return { ok: true, timestamp: res.rows[0].current_time };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

module.exports = {
  prisma,
  pool,
  query,
  getClient,
  testConnection,
};