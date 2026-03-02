const express = require('express');
const { authenticate } = require('../middleware/auth');
const { sendOTP, verifyOTP, getPendingOTP } = require('../controller/otpController');

const router = express.Router();

// Gửi OTP (method: 'school' → nội bộ; không có → Firebase phía client)
router.post('/send', authenticate, sendOTP);

// Xác minh OTP nội bộ
router.post('/verify', authenticate, verifyOTP);

// Phụ huynh poll OTP đang chờ của con mình
router.get('/pending/:studentId', authenticate, getPendingOTP);

module.exports = router;
