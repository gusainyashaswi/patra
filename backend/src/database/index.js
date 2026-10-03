const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  connectionString: config.databaseUrl, //The url that tells postresql where to find the database
  max: 20, //Maximum number of database connections that the pool should create simultaneously.
  idleTimeoutMillis: 30000, //Number of milliseconds a client must wait before being disconnected
  connectionTimeoutMillis: 5000, //Number of milliseconds a client must wait before being connected
});

pool.on('error', (err) => {
  console.error('[Database] Unexpected error on idle PostgreSQL client:', err.message); 
});

// Executes a parameterized SQL query against the connection pool

// Also this fxn makes sure that other files can direclty use db.query instead of doing again and again pool.query

// res.rows gives actual data returned by PostgreSQL.

async function query(text, params) {
  const start = Date.now(); //Start time of query
  const res = await pool.query(text, params); //Actual line that talks to postgres sql
  const duration = Date.now() - start; //How long did the query took
  if (config.nodeEnv === 'development' && duration > 100) { //Logs the query that took more than 100ms and were in development mode
    console.log(`[Database] Slow query (${duration}ms): ${text}`);
  }
  return res;
}

//Here were asking the database Give me one actual database connection  
async function getClient() {
  const client = await pool.connect(); //pool.connect gives us one actual database connection 
  return client;
}

// Database connectivity test ( basically asking can my Node.js backend successfully communicate with PostgreSQL?)
async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW() AS current_time'); //Actual line that talks to postgres sql
    return { ok: true, timestamp: res.rows[0].current_time }; //Returning the timestamp (we do rows[0] because rows is an array)
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
};


// NOTE
// query(
//   'SELECT * FROM users WHERE email = $1',
//   ['test@example.com']
// );
// Here the value of [$1]=['test@example.com']