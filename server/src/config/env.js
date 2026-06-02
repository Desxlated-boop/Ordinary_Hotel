require('dotenv').config({ override: true });

const port = Number(process.env.PORT) || 5000;
const databaseUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET || 'dev_secret_change_in_production';
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

if (!databaseUrl) {
  console.warn('Warning: DATABASE_URL is not set');
}

module.exports = {
  port,
  databaseUrl,
  jwtSecret,
  jwtExpiresIn,
  clientUrl,
};
