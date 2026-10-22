const jwt = require('jsonwebtoken');
const config = require('../config');

// Generates a signed JWT with user ID and role
const generateToken = (user) =>
  jwt.sign(
    { sub: user.id, role: user.role || 'user' },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

// Verifies a signed JWT and returns the decoded payload
const verifyToken = (token) => jwt.verify(token, config.jwt.secret);

module.exports = {
  generateToken,
  verifyToken,
};
