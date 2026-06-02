const { Pool } = require('pg');
const { databaseUrl } = require('../config/env');

const pool = new Pool({
  connectionString: databaseUrl,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error', err);
});

async function query(text, params) {
  return pool.query(text, params);
}

module.exports = { pool, query };
