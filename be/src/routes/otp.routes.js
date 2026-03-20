const express = require('express');
const { authenticate } = require('../middleware/auth');
const { sendOTP, verifyOTP, getPendingOTP } = require('../controller/otpController');

const router = express.Router();

/**
 * @openapi
 * /api/otp/send:
 *   post:
 *     summary: Gửi mã OTP cho việc đón trẻ
 *     description: Gửi mã OTP qua phương thức nội bộ (method=school). Phụ huynh nhận OTP để xác thực người đón trẻ.
 *     tags:
 *       - OTP
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *             properties:
 *               studentId:
 *                 type: string
 *                 example: 664abc123def456789012345
 *               method:
 *                 type: string
 *                 enum: [school, firebase]
 *                 example: school
 *     responses:
 *       200:
 *         description: Gửi OTP thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy học sinh
 */
router.post('/send', authenticate, sendOTP);

/**
 * @openapi
 * /api/otp/verify:
 *   post:
 *     summary: Xác minh mã OTP đón trẻ
 *     tags:
 *       - OTP
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - otpCode
 *             properties:
 *               studentId:
 *                 type: string
 *               otpCode:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP hợp lệ
 *       400:
 *         description: OTP không đúng hoặc đã hết hạn
 */
router.post('/verify', authenticate, verifyOTP);

/**
 * @openapi
 * /api/otp/pending/{studentId}:
 *   get:
 *     summary: Phụ huynh poll OTP đang chờ của con
 *     tags:
 *       - OTP
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID học sinh
 *     responses:
 *       200:
 *         description: Thông tin OTP đang chờ (nếu có)
 *       404:
 *         description: Không có OTP nào đang chờ
 */
router.get('/pending/:studentId', authenticate, getPendingOTP);

module.exports = router;
