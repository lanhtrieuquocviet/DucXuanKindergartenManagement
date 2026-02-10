const Attendances = require('../models/Attendances');

/**
 * Tạo / cập nhật điểm danh (check-in) cho 1 học sinh trong 1 ngày
 * POST /api/students/attendance
 * body: { studentId, classId, date, status, note, image, time, timeString, isTakeOff }
 */
const upsertAttendance = async (req, res) => {
  try {
    const {
      studentId,
      classId,
      date,
      status,
      note,
      image,
      time,
      timeString,
      isTakeOff,
    } = req.body;

    if (!studentId || !date) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp đầy đủ thông tin: studentId, date',
      });
    }

    const attendanceDate = new Date(date);
    // Chuẩn hoá về đầu ngày để đảm bảo 1 học sinh chỉ có 1 bản ghi / ngày
    attendanceDate.setHours(0, 0, 0, 0);

    const payload = {
      studentId,
      classId,
      date: attendanceDate,
      status,
      note,
      image,
      time: {
        checkIn: time && time.checkIn ? new Date(time.checkIn) : null,
        checkOut: time && time.checkOut ? new Date(time.checkOut) : null,
      },
      timeString: {
        checkIn: timeString && timeString.checkIn ? timeString.checkIn : '',
        checkOut: timeString && timeString.checkOut ? timeString.checkOut : '',
      },
      isTakeOff: !!isTakeOff,
    };

    const attendance = await Attendances.findOneAndUpdate(
      { studentId, date: attendanceDate },
      { $set: payload },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    )
      .populate('studentId', 'fullName classId')
      .populate('classId', 'className');

    return res.status(200).json({
      status: 'success',
      message: 'Lưu điểm danh thành công',
      data: attendance,
    });
  } catch (error) {
    console.error('Error in upsertAttendance:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lưu điểm danh',
      error: error.message,
    });
  }
};

/**
 * Check-out: cập nhật giờ về, ảnh đón trẻ, thông tin người đón
 * POST /api/students/attendance/checkout
 * body: { studentId, classId, date?, note, image, time, timeString, status?, isTakeOff? }
 * - date: nếu không truyền sẽ lấy theo ngày hiện tại
 */
const checkoutAttendance = async (req, res) => {
  try {
    const {
      studentId,
      classId,
      date,
      note,
      image,
      time,
      timeString,
      status,
      isTakeOff,
    } = req.body;

    if (!studentId) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp studentId',
      });
    }

    const now = new Date();
    const attendanceDate = date ? new Date(date) : new Date(now);
    attendanceDate.setHours(0, 0, 0, 0);

    const checkOutTime = time && time.checkOut ? new Date(time.checkOut) : now;
    const checkOutTimeString =
      (timeString && timeString.checkOut) ||
      `${checkOutTime.getHours().toString().padStart(2, '0')}:${checkOutTime
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

    const update = {
      note,
      image,
      isTakeOff: typeof isTakeOff === 'boolean' ? isTakeOff : false,
      status: status || 'present',
      'time.checkOut': checkOutTime,
      'timeString.checkOut': checkOutTimeString,
    };

    if (classId) {
      update.classId = classId;
    }

    const attendance = await Attendances.findOneAndUpdate(
      { studentId, date: attendanceDate },
      { $set: update },
      {
        new: true,
        upsert: true, // nếu chưa có bản ghi check-in vẫn tạo mới khi check-out
        runValidators: true,
      },
    )
      .populate('studentId', 'fullName classId')
      .populate('classId', 'className');

    return res.status(200).json({
      status: 'success',
      message: 'Check-out thành công',
      data: attendance,
    });
  } catch (error) {
    console.error('Error in checkoutAttendance:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi thực hiện check-out',
      error: error.message,
    });
  }
};

/**
 * Lấy danh sách điểm danh
 * GET /api/students/attendance
 * query: studentId?, classId?, date? (YYYY-MM-DD), from?, to?
 */
const getAttendances = async (req, res) => {
  try {
    const { studentId, classId, date, from, to } = req.query;

    const filter = {};

    if (studentId) {
      filter.studentId = studentId;
    }

    if (classId) {
      filter.classId = classId;
    }

    if (date) {
      const d = new Date(date);
      const startOfDay = new Date(d);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(d);
      endOfDay.setHours(23, 59, 59, 999);
      filter.date = { $gte: startOfDay, $lte: endOfDay };
    } else if (from || to) {
      filter.date = {};
      if (from) {
        const fromDate = new Date(from);
        fromDate.setHours(0, 0, 0, 0);
        filter.date.$gte = fromDate;
      }
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.date.$lte = toDate;
      }
    }

    const attendances = await Attendances.find(filter)
      .sort({ date: -1 })
      .populate('studentId', 'fullName classId')
      .populate('classId', 'className');

    return res.status(200).json({
      status: 'success',
      message: 'Lấy danh sách điểm danh thành công',
      data: attendances,
      total: attendances.length,
    });
  } catch (error) {
    console.error('Error in getAttendances:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy danh sách điểm danh',
      error: error.message,
    });
  }
};

module.exports = {
  upsertAttendance,
  checkoutAttendance,
  getAttendances,
};

