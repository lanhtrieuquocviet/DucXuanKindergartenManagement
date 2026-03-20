/**
 * Token Blacklist - lưu các token đã logout
 * Dùng in-memory Set, tự động xóa khi token hết hạn
 */

const { verifyToken } = require('./jwt');

// Set lưu các token đã bị blacklist
const blacklist = new Set();

/**
 * Thêm token vào blacklist
 * Tự động lên lịch xóa khi token hết hạn để tránh memory leak
 * @param {string} token
 */
const addToBlacklist = (token) => {
  blacklist.add(token);

  // Tự động xóa khi token hết hạn
  try {
    const decoded = verifyToken(token);
    const expiresAt = decoded.exp * 1000; // chuyển sang ms
    const now = Date.now();
    const ttl = expiresAt - now;
    if (ttl > 0) {
      setTimeout(() => {
        blacklist.delete(token);
      }, ttl);
    }
  } catch {
    // Token đã hết hạn hoặc không hợp lệ, xóa ngay
    blacklist.delete(token);
  }
};

/**
 * Kiểm tra token có trong blacklist không
 * @param {string} token
 * @returns {boolean}
 */
const isBlacklisted = (token) => {
  return blacklist.has(token);
};

module.exports = { addToBlacklist, isBlacklisted };
