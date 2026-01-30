const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  login,
  getProfile,
  updateProfile,
  changePassword,
  verifyAccount,
  resetPassword,
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

/**
 * POST /api/auth/forgot-password/verify-account
 * 验证账户名，返回部分隐藏的邮箱
 */
router.post('/forgot-password/verify-account', verifyAccount);

/**
 * POST /api/auth/forgot-password/reset
 * 验证完整邮箱并发送重置密码邮件
 */
router.post('/forgot-password/reset', resetPassword);

module.exports = router;
