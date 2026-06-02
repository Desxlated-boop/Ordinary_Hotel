require('dotenv').config({ override: true });
const { query } = require('../src/db/pool');

async function main() {
  // Add user block flag (safe to run multiple times)
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false`);

  console.log('Migrations applied');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

