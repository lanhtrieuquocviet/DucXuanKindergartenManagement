const express = require('express');
const { authenticate } = require('../middleware/auth');
const { sendOTP, verifyOTP } = require('../controller/otpController');

const router = express.Router();

/**
 * Gửi OTP qua Email hoặc SMS
 * POST /api/otp/send
 * body: { studentId, method: 'email' | 'sms', phoneNumber? }
 */
router.post('/send', authenticate, sendOTP);

/**
 * Xác minh OTP
 * POST /api/otp/verify
 * body: { studentId, otpCode, sentOtpCode }
 */
router.post('/verify', authenticate, verifyOTP);

module.exports = router;
