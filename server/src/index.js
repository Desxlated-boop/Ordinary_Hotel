const app = require('./app');
const { port } = require('./config/env');
const { pool } = require('./db/pool');

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('PostgreSQL connected');
  } catch (err) {
    console.error('PostgreSQL connection failed:', err.message);
    console.error('Check DATABASE_URL in server/.env');
  }

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

start();
