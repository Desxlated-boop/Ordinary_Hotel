require('dotenv').config({ override: true });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set in .env');
  }

  const target = new URL(databaseUrl);
  const dbName = target.pathname.replace(/^\//, '');

  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = '/postgres';

  const admin = new Client({ connectionString: adminUrl.toString() });
  await admin.connect();

  const exists = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (exists.rows.length === 0) {
    await admin.query(`CREATE DATABASE ${quoteIdent(dbName)}`);
    console.log(`Database created: ${dbName}`);
  } else {
    console.log(`Database already exists: ${dbName}`);
  }
  await admin.end();

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  const schemaPath = path.join(__dirname, '../src/db/schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  await client.query(sql);
  console.log('Schema applied (tables + room seed)');

  await client.end();
}

function quoteIdent(name) {
  return `"${name.replace(/"/g, '""')}"`;
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Setup failed:', err.message);
    process.exit(1);
  });
