const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  login,
  getProfile,
  updateProfile,
  changePassword,
} = require('../controller/authController');

const router = express.Router();

// ============================================
// Authentication Routes
// ============================================

/**
 * POST /api/auth/login
 * Đăng nhập bằng tài khoản + mật khẩu
 */
router.post('/login', login);

/**
 * GET /api/auth/me
 * Lấy thông tin hồ sơ người dùng hiện tại (dựa trên token)
 */
router.get('/me', authenticate, getProfile);

/**
 * PUT /api/auth/me
 * Cập nhật thông tin cơ bản của người dùng hiện tại
 * (fullName, email, avatar; các field khác có thể bổ sung sau)
 */
router.put('/me', authenticate, updateProfile);

/**
 * POST /api/auth/change-password
 * Đổi mật khẩu cho người dùng hiện tại
 */
router.post('/change-password', authenticate, changePassword);

module.exports = router;
