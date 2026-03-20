const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  login,
  getProfile,
  updateProfile,
  changePassword,
  verifyAccount,
  verifyOTP,
  resetPassword,
  getMyChildren,
  createMyChild,
  updateMyChild,
  deleteMyChild,
  getMyStudentInfo,
} = require('../controller/authController');

const router = express.Router();

// ============================================
// Các route xác thực
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
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Lấy thông tin hồ sơ người dùng hiện tại
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về thông tin người dùng
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me', authenticate, getProfile);

/**
 * @openapi
 * /api/auth/me:
 *   put:
 *     summary: Cập nhật thông tin cơ bản của người dùng hiện tại
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/me', authenticate, updateProfile);

/**
 * @openapi
 * /api/auth/change-password:
 *   post:
 *     summary: Đổi mật khẩu cho người dùng hiện tại
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       400:
 *         description: Mật khẩu cũ không đúng
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/change-password', authenticate, changePassword);

/**
 * @openapi
 * /api/auth/me/children:
 *   get:
 *     summary: Lấy danh sách con (cho role Phụ huynh)
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách con của phụ huynh
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Student'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me/children', authenticate, getMyChildren);

/**
 * @openapi
 * /api/auth/me/children:
 *   post:
 *     summary: Thêm con cho phụ huynh hiện tại
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       201:
 *         description: Tạo mới thành công
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/me/children', authenticate, createMyChild);

/**
 * @openapi
 * /api/auth/me/children/{studentId}:
 *   put:
 *     summary: Cập nhật thông tin con
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/me/children/:studentId', authenticate, updateMyChild);

/**
 * @openapi
 * /api/auth/me/children/{studentId}:
 *   delete:
 *     summary: Xóa thông tin con
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/me/children/:studentId', authenticate, deleteMyChild);

/**
 * @openapi
 * /api/auth/me/student:
 *   get:
 *     summary: Lấy thông tin học sinh (cho role Student)
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin học sinh
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/me/student', authenticate, getMyStudentInfo);

/**
 * @openapi
 * /api/auth/forgot-password/verify-account:
 *   post:
 *     summary: Xác minh tài khoản và gửi mã OTP qua email
 *     description: Kiểm tra tài khoản có tồn tại và gửi mã OTP 6 chữ số đến email của người dùng. Mã OTP có hiệu lực trong 10 phút.
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
 *         description: Mã OTP đã được gửi đến email
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
 *                   example: Mã OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.
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
 *       429:
 *         description: Đã yêu cầu quá nhiều lần, cần đợi
 *       500:
 *         description: Lỗi server hoặc không thể gửi email
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
/**
 * @openapi
 * /api/auth/forgot-password/verify-otp:
 *   post:
 *     summary: Xác minh mã OTP
 *     description: Xác minh mã OTP đã được gửi qua email để cho phép đặt lại mật khẩu
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
 *               - otpCode
 *             properties:
 *               username:
 *                 type: string
 *                 example: parent01
 *               otpCode:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Mã OTP hợp lệ
 *       400:
 *         description: Mã OTP không chính xác hoặc đã hết hạn
 *       404:
 *         description: Tài khoản không tồn tại
 *       500:
 *         description: Lỗi server
 */
router.post('/forgot-password/verify-otp', verifyOTP);

/**
 * @openapi
 * /api/auth/forgot-password/reset:
 *   post:
 *     summary: Đặt lại mật khẩu sau khi đã xác minh OTP
 *     description: Đặt lại mật khẩu mới sau khi đã xác minh OTP thành công
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
 *               - newPassword
 *             properties:
 *               username:
 *                 type: string
 *                 example: parent01
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "NewPassword123"
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 *       400:
 *         description: Thiếu thông tin hoặc OTP chưa được xác minh
 *       404:
 *         description: Tài khoản không tồn tại
 *       500:
 *         description: Lỗi server
 */
router.post('/forgot-password/reset', resetPassword);

module.exports = router;
