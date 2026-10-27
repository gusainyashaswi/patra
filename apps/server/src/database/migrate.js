const { execSync } = require('child_process');
const path = require('path');

// Executes Prisma schema synchronization/migration
async function runMigrations() {
  console.log('[Migration] Synchronizing Prisma schema with database...');
  try {
    execSync('npx prisma db push', {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '../..'),
    });
    console.log('[Migration] ✓ Database schema synchronized successfully.');
  } catch (error) {
    console.error('[Migration] ✗ Failed to synchronize schema with Prisma:', error.message);
    throw error;
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigrations };
