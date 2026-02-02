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
 * @openapi
 * /api/auth/forgot-password/verify-account:
 *   post:
 *     summary: Xác minh tài khoản và trả về email đã ẩn một phần
 *     description: Kiểm tra tài khoản có tồn tại và trả về email đã được ẩn một phần để người dùng xác nhận
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
 *             properties:
 *               username:
 *                 type: string
 *                 example: parent01
 *     responses:
 *       200:
 *         description: Tài khoản hợp lệ, trả về email đã ẩn
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Tài khoản hợp lệ
 *                 data:
 *                   type: object
 *                   properties:
 *                     maskedEmail:
 *                       type: string
 *                       example: abc***@gmail.com
 *       400:
 *         description: Thiếu username hoặc tài khoản chưa có email
 *       403:
 *         description: Tài khoản đã bị khóa
 *       404:
 *         description: Tài khoản không tồn tại
 *       500:
 *         description: Lỗi server
 */
router.post('/forgot-password/verify-account', verifyAccount);

/**
 * @openapi
 * /api/auth/forgot-password/reset:
 *   post:
 *     summary: Đặt lại mật khẩu và gửi mật khẩu mới qua email
 *     description: Xác minh email khớp với tài khoản, tạo mật khẩu mới và gửi qua email. Có rate limiting để tránh spam.
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
 *               - email
 *             properties:
 *               username:
 *                 type: string
 *                 example: parent01
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Mật khẩu mới đã được gửi đến email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Mật khẩu mới đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.
 *       400:
 *         description: Thiếu thông tin hoặc email không khớp với tài khoản
 *       403:
 *         description: Tài khoản đã bị khóa
 *       404:
 *         description: Tài khoản không tồn tại
 *       429:
 *         description: Đã yêu cầu đặt lại mật khẩu quá nhiều lần, cần đợi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     waitMinutes:
 *                       type: number
 *                     waitUntil:
 *                       type: string
 *                       format: date-time
 *       500:
 *         description: Lỗi server hoặc không thể gửi email
 */
router.post('/forgot-password/reset', resetPassword);

module.exports = router;
