const fs = require('fs');
const path = require('path');
const { pool } = require('./index');

// Points to database/migrations
const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// Executes all pending database migrations in alphabetical order within transactions
async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('[Migration] Checking database schema status...');

    // Ensure migrations tracking table exists
    // This table is basically the memory of the migration system.
    // It stores the names of all the migration files that have been applied.
    // So that we don't apply the same migration file twice.

    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // _migrations  

    // id | name                              | applied_at
    // ---+-----------------------------------+-------------------
    // 1  | 001_create_users_table.sql        | 2026-10-03 ...
    // 2  | 002_add_refresh_tokens.sql        | 2026-10-04 ...


    // Fetch list of already applied migrations
    const { rows: appliedRows } = await client.query('SELECT name FROM _migrations');
    const appliedSet = new Set(appliedRows.map((r) => r.name));

    // Read and sort SQL migration files
    if (!fs.existsSync(MIGRATIONS_DIR)) {
      console.log('[Migration] No migrations directory found.');
      return;
    }

    const migrationFiles = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    let appliedCount = 0;

    for (const file of migrationFiles) {
      if (appliedSet.has(file)) {
        continue;
      }

      console.log(`[Migration] Applying migration: ${file}...`);
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`[Migration] ✓ Successfully applied: ${file}`);
        appliedCount += 1;
      } catch (migrationError) {
        await client.query('ROLLBACK');
        console.error(`[Migration] ✗ Failed to apply migration "${file}":`, migrationError.message);
        throw migrationError;
      }
    }

    if (appliedCount === 0) {
      console.log('[Migration] All migrations are already up to date.');
    } else {
      console.log(`[Migration] Completed: ${appliedCount} new migration(s) applied.`);
    }
  } finally {
    client.release();
  }
}

// Run directly from CLI if invoked as main script
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('[Migration] Migration process finished successfully.');
      pool.end();
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migration] Migration process failed:', err);
      pool.end();
      process.exit(1);
    });
}

module.exports = { runMigrations };
