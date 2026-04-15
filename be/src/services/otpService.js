const Students = require('../models/Student');

// Lưu OTP tạm thời trong bộ nhớ: Map<studentId, { code, expiresAt }>
const otpStore = new Map();

const OTP_TTL_MS = 60000; // 60 giây

/**
 * Gửi OTP
 * POST /api/otp/send
 * body: { studentId, method: 'school' | undefined }
 * - method === 'school': generate OTP nội bộ, lưu store, phụ huynh xem qua app
 * - không có method / khác: trả về phone để Firebase xử lý phía client
 */
const sendOTP = async (req, res) => {
  try {
    const { studentId, method } = req.body;

    if (!studentId) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp studentId' });
    }

    const student = await Students.findById(studentId)
      .populate('parentId', 'fullName phone')
      .populate('classId', 'className')
      .lean();

    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy học sinh' });
    }

    if (method === 'school') {
      // Generate 6-digit OTP nội bộ
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = Date.now() + OTP_TTL_MS;
      const extraPerson = req.body.extraPerson || null;
      otpStore.set(String(studentId), { code, expiresAt, extraPerson, student: { fullName: student.fullName, studentCode: student.studentCode, className: student.classId?.className || '' } });

      // Tự xóa sau khi hết hạn
      setTimeout(() => {
        const stored = otpStore.get(String(studentId));
        if (stored && stored.expiresAt <= Date.now()) {
          otpStore.delete(String(studentId));
        }
      }, OTP_TTL_MS + 5000);

      return res.status(200).json({
        status: 'success',
        message: 'Đã tạo OTP, phụ huynh sẽ nhận được trên ứng dụng',
      });
    }

    // Firebase path: trả phone để client gọi Firebase SMS
    if (!student.parentId?.phone) {
      return res.status(400).json({ status: 'error', message: 'Phụ huynh chưa có số điện thoại' });
    }

    return res.status(200).json({
      status: 'success',
      message: 'OTP được xử lý bởi Firebase Phone Auth phía client',
      data: { phoneNumber: student.parentId.phone },
    });
  } catch (error) {
    console.error('Error in sendOTP:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi server', error: error.message });
  }
};

/**
 * Xác minh OTP nội bộ
 * POST /api/otp/verify
 * body: { studentId, otpCode }
 */
const verifyOTP = async (req, res) => {
  try {
    const { studentId, otpCode } = req.body;

    if (!studentId || !otpCode) {
      return res.status(400).json({ status: 'error', message: 'Thiếu studentId hoặc otpCode' });
    }

    const stored = otpStore.get(String(studentId));
    if (!stored) {
      return res.status(400).json({ status: 'error', message: 'Không tìm thấy OTP hoặc đã hết hạn' });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(String(studentId));
      return res.status(400).json({ status: 'error', message: 'OTP đã hết hạn' });
    }

    if (stored.code !== String(otpCode)) {
      return res.status(400).json({ status: 'error', message: 'OTP không chính xác' });
    }

    otpStore.delete(String(studentId));
    return res.status(200).json({ status: 'success', message: 'Xác thực thành công', data: { verified: true } });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Lỗi server', error: error.message });
  }
};

/**
 * Phụ huynh poll OTP đang chờ của con mình
 * GET /api/otp/pending/:studentId
 */
const getPendingOTP = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Students.findById(studentId).lean();
    if (!student || student.parentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ status: 'error', message: 'Không có quyền truy cập' });
    }

    const stored = otpStore.get(String(studentId));
    if (!stored || Date.now() > stored.expiresAt) {
      if (stored) otpStore.delete(String(studentId));
      return res.status(200).json({ status: 'success', data: null });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        code: stored.code,
        expiresAt: stored.expiresAt,
        timeLeft: Math.ceil((stored.expiresAt - Date.now()) / 1000),
        extraPerson: stored.extraPerson || null,
        student: stored.student || null,
      },
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Lỗi server', error: error.message });
  }
};

module.exports = { sendOTP, verifyOTP, getPendingOTP };
