const Students = require('../models/Student');

/**
 * Lấy số điện thoại phụ huynh của học sinh
 * POST /api/otp/send
 * body: { studentId, phoneNumber? }
 * Lưu ý: Việc gửi OTP thực tế được xử lý bởi Firebase Phone Auth ở phía frontend.
 * Endpoint này chỉ dùng để validate studentId còn tồn tại.
 */
const sendOTP = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp studentId',
      });
    }

    const student = await Students.findById(studentId)
      .populate('parentId', 'fullName phone')
      .lean();

    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy học sinh',
      });
    }

    if (!student.parentId?.phone) {
      return res.status(400).json({
        status: 'error',
        message: 'Phụ huynh chưa có số điện thoại',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'OTP được xử lý bởi Firebase Phone Auth phía client',
      data: {
        phoneNumber: student.parentId.phone,
      },
    });
  } catch (error) {
    console.error('Error in sendOTP:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi server',
      error: error.message,
    });
  }
};

/**
 * Xác minh OTP - không còn cần thiết vì Firebase xử lý phía client
 * Giữ lại để không break routes hiện tại
 */
const verifyOTP = async (req, res) => {
  return res.status(200).json({
    status: 'success',
    message: 'OTP được xác minh bởi Firebase Phone Auth phía client',
    data: { verified: true },
  });
};

module.exports = {
  sendOTP,
  verifyOTP,
};
