const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const { jwtSecret } = require('../config/env');
const { query } = require('../db/pool');

async function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication required'));
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, jwtSecret);

    const dbUser = await query('SELECT id, email, full_name, role, is_blocked FROM users WHERE id = $1', [
      payload.id,
    ]);

    if (dbUser.rows.length === 0) {
      return next(new ApiError(401, 'Invalid or expired token'));
    }

    if (dbUser.rows[0].is_blocked) {
      return next(new ApiError(403, 'User is blocked'));
    }

    req.user = {
      id: dbUser.rows[0].id,
      email: dbUser.rows[0].email,
      role: dbUser.rows[0].role,
      fullName: dbUser.rows[0].full_name,
    };
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

module.exports = { authenticate };
