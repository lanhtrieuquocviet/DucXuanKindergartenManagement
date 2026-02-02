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
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Đăng nhập bằng tài khoản và mật khẩu
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: parent01
 *               password:
 *                 type: string
 *                 format: password
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       400:
 *         description: Thiếu tài khoản hoặc mật khẩu
 *       401:
 *         description: Sai tài khoản hoặc mật khẩu
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
 
 */
router.post('/forgot-password/verify-account', verifyAccount);

/**
 * POST /api/auth/forgot-password/reset
 
 */
router.post('/forgot-password/reset', resetPassword);

module.exports = router;
