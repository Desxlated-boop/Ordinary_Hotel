require('dotenv').config({ override: true });
const bcrypt = require('bcryptjs');
const { query } = require('./pool');

async function seedAdmin() {
  const email = 'admin@hotel.com';
  const password = 'admin123';
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);

  if (existing.rows.length > 0) {
    console.log('Admin already exists:', email);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await query(
    `INSERT INTO users (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4)`,
    [email, passwordHash, 'Hotel Admin', 'admin']
  );

  console.log('Admin created:', email, '/', password);
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
