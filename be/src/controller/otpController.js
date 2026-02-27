const Students = require('../models/Student');

/**
 * Tạo mã OTP ngẫu nhiên 6 chữ số
 * @returns {string} - Mã OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Gửi OTP qua SMS
 * POST /api/otp/send
 * body: { studentId, phoneNumber? }
 */
const sendOTP = async (req, res) => {
  try {
    const { studentId, phoneNumber } = req.body;

    if (!studentId) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp studentId',
      });
    }

    // Lấy thông tin học sinh
    const student = await Students.findById(studentId)
      .populate('parentId', 'fullName phone')
      .lean();

    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy học sinh',
      });
    }

    // Kiểm tra thông tin phụ huynh
    if (!student.parentId) {
      return res.status(400).json({
        status: 'error',
        message: 'Học sinh chưa có thông tin phụ huynh',
      });
    }

    const parent = student.parentId;
    const phone = phoneNumber || parent.phone;

    if (!phone) {
      return res.status(400).json({
        status: 'error',
        message: 'Phụ huynh chưa có số điện thoại',
      });
    }

    const otpCode = generateOTP();

    try {
      // Kiểm tra xem có cấu hình Twilio không
      if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
        // Nếu không có Twilio, chỉ trả về OTP (dùng cho dev/test)
        console.warn('⚠️  Twilio not configured. OTP will not be sent via SMS.');
        return res.status(200).json({
          status: 'success',
          message: 'Mã OTP đã được tạo (SMS chưa được cấu hình)',
          data: {
            otpCode,
            phoneNumber: phone,
            warning: 'SMS service not configured. Use OTP code for testing.',
          },
        });
      }

      // Gửi SMS qua Twilio
      const twilio = require('twilio');
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );

      await client.messages.create({
        body: `Mã OTP của bạn là: ${otpCode}. Mã này có hiệu lực trong 2 phút.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone,
      });

      return res.status(200).json({
        status: 'success',
        message: 'Mã OTP đã được gửi qua SMS',
        data: {
          otpCode,
          phoneNumber: phone,
        },
      });
    } catch (error) {
      console.error('Error sending SMS:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Lỗi khi gửi OTP qua SMS',
        error: error.message,
      });
    }
  } catch (error) {
    console.error('Error in sendOTP:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi gửi OTP',
      error: error.message,
    });
  }
};

/**
 * Xác minh OTP
 * POST /api/otp/verify
 * body: { studentId, otpCode }
 */
const verifyOTP = async (req, res) => {
  try {
    const { studentId, otpCode, sentOtpCode } = req.body;

    if (!studentId || !otpCode || !sentOtpCode) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp đầy đủ thông tin: studentId, otpCode, sentOtpCode',
      });
    }

    // Kiểm tra mã OTP
    if (otpCode !== sentOtpCode) {
      return res.status(400).json({
        status: 'error',
        message: 'Mã OTP không chính xác',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Mã OTP chính xác',
      data: {
        verified: true,
      },
    });
  } catch (error) {
    console.error('Error in verifyOTP:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi xác minh OTP',
      error: error.message,
    });
  }
};

module.exports = {
  sendOTP,
  verifyOTP,
  generateOTP,
};
