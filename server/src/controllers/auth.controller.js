const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db/pool');
const ApiError = require('../utils/ApiError');
const { jwtSecret, jwtExpiresIn } = require('../config/env');

function mapUser(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    createdAt: row.created_at,
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, fullName: user.full_name },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );
}

async function register(req, res) {
  const { email, password, fullName } = req.body;

  if (!email || !password || !fullName) {
    throw new ApiError(400, 'Email, password and full name are required');
  }

  if (password.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters');
  }

  const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length > 0) {
    throw new ApiError(409, 'Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await query(
    `INSERT INTO users (email, password_hash, full_name)
     VALUES ($1, $2, $3)
     RETURNING id, email, full_name, role, created_at`,
    [email.toLowerCase(), passwordHash, fullName.trim()]
  );

  const user = result.rows[0];
  const token = signToken(user);

  res.status(201).json({ token, user: mapUser(user) });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const result = await query(
    'SELECT id, email, password_hash, full_name, role, created_at, is_blocked FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  if (result.rows.length === 0) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const user = result.rows[0];

  if (user.is_blocked) {
    throw new ApiError(403, 'User is blocked');
  }

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = signToken(user);
  res.json({ token, user: mapUser(user) });
}

async function me(req, res) {
  const result = await query(
    'SELECT id, email, full_name, role, created_at FROM users WHERE id = $1',
    [req.user.id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, 'User not found');
  }

  res.json({ user: mapUser(result.rows[0]) });
}

module.exports = { register, login, me };
