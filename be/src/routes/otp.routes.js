const express = require('express');
const { authenticate } = require('../middleware/auth');
const { sendOTP, verifyOTP, getPendingOTP } = require('../controller/otpController');

const router = express.Router();

/**
 * @openapi
 * /api/otp/send:
 *   post:
 *     summary: Gửi mã OTP
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
 *             properties:
 *               phone:
 *                 type: string
 *               method:
 *                 type: string
 *                 enum: ['school']
 *     responses:
 *       200:
 *         description: Gửi thành công
 */
router.post('/send', authenticate, sendOTP);

/**
 * @openapi
 * /api/otp/verify:
 *   post:
 *     summary: Xác minh mã OTP
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
 *               - phone
 *               - otp
 *             properties:
 *               phone:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Xác minh thành công
 */
router.post('/verify', authenticate, verifyOTP);

/**
 * @openapi
 * /api/otp/pending/{studentId}:
 *   get:
 *     summary: Lấy mã OTP đang chờ cho học sinh
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
 *     responses:
 *       200:
 *         description: Mã OTP đang chờ
 */
router.get('/pending/:studentId', authenticate, getPendingOTP);

module.exports = router;
