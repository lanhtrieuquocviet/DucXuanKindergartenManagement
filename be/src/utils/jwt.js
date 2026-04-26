const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Ký access token JWT cho user (hết hạn ngắn: 15 phút)
 * @param {Object} payload
 * @param {Object} [options]
 * @returns {string}
 */
function signToken(payload, options = {}) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    ...options,
  });
}

/**
 * Verify access token và trả về payload
 * @param {string} token
 * @returns {Object}
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Ký refresh token JWT cho user (hết hạn dài: 7 ngày)
 * @param {Object} payload - chỉ cần { sub: userId }
 * @returns {string}
 */
function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    jwtid: crypto.randomUUID(),
  });
}

/**
 * Verify refresh token và trả về payload
 * @param {string} token
 * @returns {Object}
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}

module.exports = {
  signToken,
  verifyToken,
  signRefreshToken,
  verifyRefreshToken,
};
