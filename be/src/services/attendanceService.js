const mongoose = require('mongoose');
const Attendances = require('../models/Attendances');
const Classes = require('../models/Classes');
const Students = require('../models/Student');
const { createSystemLog } = require('../utils/systemLog');
const { createNotification } = require('../controller/notification.controller');

/**
 * Tạo / cập nhật điểm danh (check-in) cho 1 học sinh trong 1 ngày
 * POST /api/students/attendance
 * body: { studentId, classId, date, status, note, time, timeString, isTakeOff }
 */
const upsertAttendance = async (req, res) => {
  try {
    const {
      studentId,
      classId,
      date,
      status,
      note,
      checkinImageName,
      delivererType,
      delivererOtherInfo,
      delivererOtherImageName,
      absentReason,
      time,
      timeString,
      isTakeOff,
      checkinBelongings,
      checkedInByAI,
    } = req.body;

    if (!studentId || !date) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp đầy đủ thông tin: studentId, date',
      });
    }

    // Validate date hợp lệ
    const attendanceDate = new Date(date);
    if (isNaN(attendanceDate.getTime())) {
      return res.status(400).json({ status: 'error', message: 'Ngày điểm danh không hợp lệ' });
    }
    // Chuẩn hoá về đầu ngày để đảm bảo 1 học sinh chỉ có 1 bản ghi / ngày
    attendanceDate.setHours(0, 0, 0, 0);

    // Không cho phép điểm danh ngày tương lai
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (attendanceDate > today) {
      return res.status(400).json({ status: 'error', message: 'Không thể điểm danh cho ngày trong tương lai' });
    }

    // Không cho phép điểm danh vào thứ 7, chủ nhật
    const dayOfWeek = attendanceDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return res.status(400).json({ status: 'error', message: 'Không thể điểm danh vào thứ 7 và chủ nhật' });
    }

    // Validate status enum
    const VALID_STATUSES = ['present', 'absent', 'leave'];
    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Trạng thái không hợp lệ. Chỉ chấp nhận: ${VALID_STATUSES.join(', ')}`,
      });
    }

    // Bắt buộc có lý do khi vắng mặt
    if (status === 'absent' && !absentReason?.trim()) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp lý do vắng mặt' });
    }

    // Validate định dạng giờ check-in nếu được cung cấp
    if (timeString?.checkIn && !/^\d{2}:\d{2}$/.test(timeString.checkIn)) {
      return res.status(400).json({ status: 'error', message: 'Giờ điểm danh đến phải theo định dạng HH:mm' });
    }

    const payload = {
      studentId,
      classId,
      date: attendanceDate,
      status,
      note,
      checkinImageName,
      delivererType,
      delivererOtherInfo,
      delivererOtherImageName,
      absentReason,
      'time.checkIn': time && time.checkIn ? new Date(time.checkIn) : null,
      'timeString.checkIn': timeString && timeString.checkIn ? timeString.checkIn : '',
      isTakeOff: !!isTakeOff,
      ...(Array.isArray(checkinBelongings) && { checkinBelongings }),
      ...(typeof checkedInByAI === 'boolean' && { checkedInByAI }),
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
      .populate('studentId', 'fullName classId parentId')
      .populate('classId', 'className');

    const studentName = attendance?.studentId?.fullName || studentId;
    const className = attendance?.classId?.className || classId || '';
    const statusLabel = status || attendance?.status || '';
    await createSystemLog({
      req,
      action: 'Điểm danh học sinh',
      detail: `Điểm danh ${studentName}${className ? ` (${className})` : ''} - ${statusLabel}`.trim(),
    });

    // Gửi thông báo cho phụ huynh khi điểm danh đến
    const parentId = attendance?.studentId?.parentId;
    if (parentId && statusLabel !== 'absent') {
      const checkInTime = attendance?.timeString?.checkIn || '';
      await createNotification({
        title: 'Điểm danh đến trường',
        body: `${studentName} đã đến trường${checkInTime ? ` lúc ${checkInTime}` : ''}${className ? ` - Lớp ${className}` : ''}.`,
        type: 'attendance_checkin',
        targetRole: 'Parent',
        targetUserId: parentId,
        extra: { studentId, attendanceId: attendance._id },
      });
    } else if (parentId && statusLabel === 'absent') {
      await createNotification({
        title: 'Thông báo vắng mặt',
        body: `${studentName} được ghi nhận vắng mặt hôm nay${className ? ` - Lớp ${className}` : ''}.${attendance?.absentReason ? ` Lý do: ${attendance.absentReason}` : ''}`,
        type: 'attendance_absent',
        targetRole: 'Parent',
        targetUserId: parentId,
        extra: { studentId, attendanceId: attendance._id },
      });
    }

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
 * body: { studentId, classId, date?, note, time, timeString, status?, isTakeOff? }
 * - date: nếu không truyền sẽ lấy theo ngày hiện tại
 */
const checkoutAttendance = async (req, res) => {
  try {
    const {
      studentId,
      classId,
      date,
      note,
      checkoutImageName,
      receiverType,
      receiverOtherInfo,
      receiverOtherImageName,
      checkoutBelongingsNote,
      checkoutBelongings,
      checkedOutByAI,
      teacherConfirmedCheckout,
      checkoutConfirmMethod,
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
    if (isNaN(attendanceDate.getTime())) {
      return res.status(400).json({ status: 'error', message: 'Ngày điểm danh không hợp lệ' });
    }
    attendanceDate.setHours(0, 0, 0, 0);

    // Không cho phép điểm danh về cho ngày tương lai
    const todayForCheckout = new Date();
    todayForCheckout.setHours(0, 0, 0, 0);
    if (attendanceDate > todayForCheckout) {
      return res.status(400).json({ status: 'error', message: 'Không thể điểm danh về cho ngày trong tương lai' });
    }

    // Không cho phép điểm danh vào thứ 7, chủ nhật
    const dayOfWeekCheckout = attendanceDate.getDay();
    if (dayOfWeekCheckout === 0 || dayOfWeekCheckout === 6) {
      return res.status(400).json({ status: 'error', message: 'Không thể điểm danh về vào thứ 7 và chủ nhật' });
    }

    // Validate định dạng giờ check-out nếu client cung cấp tường minh
    if (timeString?.checkOut && !/^\d{2}:\d{2}$/.test(timeString.checkOut)) {
      return res.status(400).json({ status: 'error', message: 'Giờ điểm danh về phải theo định dạng HH:mm' });
    }

    // Validate checkoutConfirmMethod
    const VALID_CONFIRM_METHODS = ['teacher', 'parent_confirm', ''];
    if (checkoutConfirmMethod !== undefined && !VALID_CONFIRM_METHODS.includes(checkoutConfirmMethod || '')) {
      return res.status(400).json({ status: 'error', message: 'Phương thức xác nhận không hợp lệ' });
    }

    // Kiểm tra học sinh đã điểm danh đến trước khi cho phép điểm danh về
    const existingAttendance = await Attendances.findOne({ studentId, date: attendanceDate });
    if (!existingAttendance || !existingAttendance.timeString?.checkIn) {
      return res.status(400).json({
        status: 'error',
        message: 'Học sinh chưa điểm danh đến, không thể điểm danh về',
      });
    }
    if (existingAttendance.time?.checkOut) {
      return res.status(400).json({
        status: 'error',
        message: 'Học sinh đã điểm danh về rồi',
      });
    }

    const checkOutTime = time && time.checkOut ? new Date(time.checkOut) : now;
    const checkOutTimeString =
      (timeString && timeString.checkOut) ||
      `${checkOutTime.getHours().toString().padStart(2, '0')}:${checkOutTime
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

    // Giờ về không thể trước giờ đến
    if (existingAttendance.time?.checkIn && checkOutTime < existingAttendance.time.checkIn) {
      return res.status(400).json({
        status: 'error',
        message: `Giờ về (${checkOutTimeString}) không thể trước giờ đến (${existingAttendance.timeString?.checkIn || ''})`,
      });
    }

    const update = {
      note,
      checkoutImageName,
      receiverType,
      receiverOtherInfo,
      receiverOtherImageName,
      checkoutBelongingsNote: checkoutBelongingsNote || '',
      isTakeOff: typeof isTakeOff === 'boolean' ? isTakeOff : false,
      status: status || 'present',
      'time.checkOut': checkOutTime,
      'timeString.checkOut': checkOutTimeString,
      checkoutStatus: '',
      ...(Array.isArray(checkoutBelongings) && { checkoutBelongings }),
      ...(typeof checkedOutByAI === 'boolean' && { checkedOutByAI }),
      ...(typeof teacherConfirmedCheckout === 'boolean' && { teacherConfirmedCheckout }),
      ...(checkoutConfirmMethod !== undefined && { checkoutConfirmMethod: checkoutConfirmMethod || '' }),
    };

    if (classId) {
      update.classId = classId;
    }

    const attendance = await Attendances.findOneAndUpdate(
      { studentId, date: attendanceDate },
      { $set: update },
      {
        new: true,
        upsert: false,
        runValidators: true,
      },
    )
      .populate('studentId', 'fullName classId parentId')
      .populate('classId', 'className');

    const studentName = attendance?.studentId?.fullName || studentId;
    const className = attendance?.classId?.className || classId || '';
    await createSystemLog({
      req,
      action: 'Check-out học sinh',
      detail: `Check-out ${studentName}${className ? ` (${className})` : ''}`,
    });

    // Gửi thông báo cho phụ huynh khi điểm danh về
    const parentId = attendance?.studentId?.parentId;
    if (parentId) {
      await createNotification({
        title: 'Điểm danh về nhà',
        body: `${studentName} đã về nhà${checkOutTimeString ? ` lúc ${checkOutTimeString}` : ''}${className ? ` - Lớp ${className}` : ''}.`,
        type: 'attendance_checkout',
        targetRole: 'Parent',
        targetUserId: parentId,
        extra: { studentId, attendanceId: attendance._id },
      });
    }

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

/**
 * Lấy tổng quan điểm danh của tất cả các lớp (cho SchoolAdmin)
 * GET /api/school-admin/attendance/overview
 * query: date? (YYYY-MM-DD), gradeId?, classId?, status?
 */
const getAttendanceOverview = async (req, res) => {
  try {
    const { date, gradeId, classId, status } = req.query;

    // Xử lý ngày
    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Lấy danh sách lớp với filter
    const classFilter = {};
    if (gradeId && gradeId !== 'all') {
      // Nếu gradeId là ObjectId hợp lệ thì dùng, không thì tìm theo gradeName
      if (mongoose.Types.ObjectId.isValid(gradeId)) {
        classFilter.gradeId = gradeId;
      } else {
        // Tìm theo gradeName nếu không phải ObjectId
        const Grade = require('../models/Grade');
        const grade = await Grade.findOne({ gradeName: gradeId });
        if (grade) {
          classFilter.gradeId = grade._id;
        }
      }
    }
    if (classId && classId !== 'all') {
      classFilter._id = classId;
    }

    const classes = await Classes.find(classFilter)
      .populate('gradeId', 'gradeName')
      .lean();

    // Lấy tất cả điểm danh trong ngày
    const attendanceFilter = {
      date: { $gte: attendanceDate, $lte: endOfDay },
    };
    if (classId) {
      attendanceFilter.classId = classId;
    }

    const attendances = await Attendances.find(attendanceFilter).lean();

    // Nhóm điểm danh theo classId
    const attendanceByClass = {};
    attendances.forEach((att) => {
      const cId = att.classId?.toString() || att.classId;
      if (!attendanceByClass[cId]) {
        attendanceByClass[cId] = [];
      }
      attendanceByClass[cId].push(att);
    });

    // Tính toán thống kê cho mỗi lớp
    const classStats = await Promise.all(
      classes.map(async (cls) => {
        const clsId = cls._id.toString();
        const classAttendances = attendanceByClass[clsId] || [];

        // Đếm số học sinh trong lớp
        const totalStudents = await Students.countDocuments({
          classId: cls._id,
          status: 'active',
        });

        // Tính toán thống kê
        const present = classAttendances.filter(
          (att) => att.status === 'present'
        ).length;
        const absent = classAttendances.filter(
          (att) => att.status === 'absent'
        ).length;
        const notCheckedOut = classAttendances.filter(
          (att) =>
            att.status === 'present' &&
            att.time?.checkIn &&
            !att.time?.checkOut
        ).length;

        return {
          _id: cls._id,
          className: cls.className,
          gradeName: cls.gradeId?.gradeName || '',
          totalStudents,
          present,
          absent,
          notCheckedOut,
        };
      })
    );

    // Lọc theo trạng thái nếu có
    let filteredStats = classStats;
    if (status) {
      filteredStats = classStats.filter((stat) => {
        if (status === 'complete') {
          return stat.present === stat.totalStudents && stat.absent === 0;
        }
        if (status === 'missing') {
          return stat.present < stat.totalStudents;
        }
        if (status === 'monitoring') {
          return stat.notCheckedOut > 0;
        }
        return true;
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Lấy tổng quan điểm danh thành công',
      data: {
        date: attendanceDate.toISOString().split('T')[0],
        classes: filteredStats,
      },
    });
  } catch (error) {
    console.error('Error in getAttendanceOverview:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy tổng quan điểm danh',
      error: error.message,
    });
  }
};

/**
 * Lấy chi tiết điểm danh của một lớp (cho SchoolAdmin)
 * GET /api/school-admin/classes/:classId/attendance
 * query: date? (YYYY-MM-DD)
 */
const getClassAttendanceDetail = async (req, res) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;

    if (!classId) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp classId',
      });
    }

    // Xử lý ngày
    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Lấy thông tin lớp
    const classInfo = await Classes.findById(classId)
      .populate('gradeId', 'gradeName')
      .lean();

    if (!classInfo) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy lớp học',
      });
    }

    // Lấy tất cả học sinh trong lớp
    const allStudents = await Students.find({
      classId: classId,
      status: 'active',
    })
      .sort({ fullName: 1 })
      .lean();

    // Lấy tất cả điểm danh trong ngày của lớp
    const attendances = await Attendances.find({
      classId: classId,
      date: { $gte: attendanceDate, $lte: endOfDay },
    })
      .populate('studentId', 'fullName classId')
      .lean();

    // Tạo map attendance theo studentId để dễ tra cứu
    const attendanceMap = {};
    attendances.forEach((att) => {
      const studentId = att.studentId?._id?.toString() || att.studentId?.toString();
      if (studentId) {
        attendanceMap[studentId] = att;
      }
    });

    // Kết hợp học sinh với điểm danh
    const studentsWithAttendance = allStudents.map((student) => {
      const studentId = student._id.toString();
      const attendance = attendanceMap[studentId] || null;

      return {
        _id: student._id,
        fullName: student.fullName,
        attendance: attendance
          ? {
              _id: attendance._id,
              status: attendance.status,
              time: attendance.time,
              timeString: attendance.timeString,
              note: attendance.note,
              // Có thể có các trường delivererType, receiverType nếu được lưu
              delivererType: attendance.delivererType || null,
              receiverType: attendance.receiverType || null,
              delivererOtherInfo: attendance.delivererOtherInfo || null,
              receiverOtherInfo: attendance.receiverOtherInfo || null,
            }
          : null,
      };
    });

    // Lấy danh sách tất cả lớp để hiển thị trong dropdown
    const allClasses = await Classes.find()
      .populate('gradeId', 'gradeName')
      .sort({ className: 1 })
      .lean();

    return res.status(200).json({
      status: 'success',
      message: 'Lấy chi tiết điểm danh lớp thành công',
      data: {
        classInfo: {
          _id: classInfo._id,
          className: classInfo.className,
          gradeName: classInfo.gradeId?.gradeName || '',
        },
        students: studentsWithAttendance,
        classes: allClasses.map((cls) => ({
          _id: cls._id,
          className: cls.className,
        })),
      },
    });
  } catch (error) {
    console.error('Error in getClassAttendanceDetail:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy chi tiết điểm danh lớp',
      error: error.message,
    });
  }
};

/**
 * Lấy chi tiết điểm danh của một học sinh (cho SchoolAdmin)
 * GET /api/school-admin/students/:studentId/attendance
 * query: date? (YYYY-MM-DD)
 */
const getStudentAttendanceDetail = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { date } = req.query;

    if (!studentId) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp studentId',
      });
    }

    // Lấy thông tin học sinh
    const student = await Students.findById(studentId)
      .populate('classId', 'className')
      .lean();

    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy học sinh',
      });
    }

    // Xử lý ngày
    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);
    const endOfDay = new Date(attendanceDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Lấy điểm danh trong ngày
    const attendance = await Attendances.findOne({
      studentId: studentId,
      date: { $gte: attendanceDate, $lte: endOfDay },
    }).lean();

    return res.status(200).json({
      status: 'success',
      message: 'Lấy chi tiết điểm danh học sinh thành công',
      data: {
        studentInfo: {
          _id: student._id,
          fullName: student.fullName,
          className: student.classId?.className || '',
          classId: student.classId?._id || student.classId,
        },
        attendance: attendance
          ? {
              _id: attendance._id,
              status: attendance.status,
              time: attendance.time,
              timeString: attendance.timeString,
              note: attendance.note,
              date: attendance.date,
              delivererType: attendance.delivererType || '',
              receiverType: attendance.receiverType || '',
              delivererOtherInfo: attendance.delivererOtherInfo || '',
              receiverOtherInfo: attendance.receiverOtherInfo || '',
              delivererOtherImageName: attendance.delivererOtherImageName || '',
              receiverOtherImageName: attendance.receiverOtherImageName || '',
              checkoutBelongingsNote: attendance.checkoutBelongingsNote || '',
              absentReason: attendance.absentReason || '',
              checkinImageName: attendance.checkinImageName || '',
              checkoutImageName: attendance.checkoutImageName || '',
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Error in getStudentAttendanceDetail:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy chi tiết điểm danh học sinh',
      error: error.message,
    });
  }
};

// Helper: kiểm tra đi trễ (sau 7:30 sáng)
const isLate = (checkInTime) => {
  if (!checkInTime) return false;
  try {
    let hours;
    let minutes;
    if (typeof checkInTime === 'string' && /^\d{2}:\d{2}$/.test(checkInTime)) {
      [hours, minutes] = checkInTime.split(':').map(Number);
    } else {
      const d = new Date(checkInTime);
      if (Number.isNaN(d.getTime())) return false;
      hours = d.getHours();
      minutes = d.getMinutes();
    }
    return hours > 8 || (hours === 8 && minutes > 30);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error in isLate helper:', e);
    return false;
  }
};

/**
 * Lấy lịch sử điểm danh của một học sinh (cho SchoolAdmin)
 * GET /api/school-admin/students/:studentId/attendance/history
 * query: from? (YYYY-MM-DD), to? (YYYY-MM-DD)
 * Logic dựa hoàn toàn trên collection Attendances:
 *  - Trả về danh sách bản ghi điểm danh
 *  - Tính toán sẵn thống kê: totalDays, present, absent, late
 */
const getStudentAttendanceHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { from, to } = req.query;

    if (!studentId) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp studentId',
      });
    }

    // Lấy thông tin học sinh
    const student = await Students.findById(studentId)
      .populate('classId', 'className')
      .lean();

    if (!student) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy học sinh',
      });
    }

    // Xử lý filter ngày
    const filter = { studentId };
    if (from || to) {
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

    // Lấy tất cả điểm danh, sắp xếp theo ngày giảm dần
    const attendances = await Attendances.find(filter)
      .sort({ date: -1 })
      .lean();

    // Tính toán thống kê dựa trên bản ghi Attendances
    const totalDays = attendances.length;
    const present = attendances.filter((att) => att.status === 'present').length;
    const absent = attendances.filter((att) => att.status === 'absent').length;
    const late = attendances.filter((att) => {
      if (att.status !== 'present') return false;
      const checkInTime = att?.timeString?.checkIn || att?.time?.checkIn;
      return isLate(checkInTime);
    }).length;

    const mappedAttendances = attendances.map((att) => ({
      _id: att._id,
      date: att.date,
      status: att.status,
      time: att.time,
      timeString: att.timeString,
      note: att.note,
      delivererType: att.delivererType || '',
      receiverType: att.receiverType || '',
      delivererOtherInfo: att.delivererOtherInfo || '',
      receiverOtherInfo: att.receiverOtherInfo || '',
    }));

    return res.status(200).json({
      status: 'success',
      message: 'Lấy lịch sử điểm danh học sinh thành công',
      data: {
        studentInfo: {
          _id: student._id,
          fullName: student.fullName,
          className: student.classId?.className || '',
          classId: student.classId?._id || student.classId,
        },
        stats: {
          totalDays,
          present,
          absent,
          late,
        },
        attendances: mappedAttendances,
      },
    });
  } catch (error) {
    console.error('Error in getStudentAttendanceHistory:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy lịch sử điểm danh học sinh',
      error: error.message,
    });
  }
};

/**
 * Lấy toàn bộ dữ liệu điểm danh để xuất báo cáo (1 query duy nhất)
 * GET /api/school-admin/attendance/export-data
 * query: from (YYYY-MM-DD), to (YYYY-MM-DD), classId?, studentId?
 */
const getAttendanceExportData = async (req, res) => {
  try {
    const { from, to, classId, studentId } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng cung cấp from và to (YYYY-MM-DD)',
      });
    }

    const fromDate = new Date(from);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const filter = { date: { $gte: fromDate, $lte: toDate } };
    if (classId) filter.classId = classId;
    if (studentId) filter.studentId = studentId;

    const attendances = await Attendances.find(filter)
      .populate('studentId', 'fullName classId')
      .populate('classId', 'className')
      .sort({ date: 1, 'classId.className': 1 })
      .lean();

    const data = attendances.map((att) => {
      const fmtTime = (ts, t) => {
        if (ts && /^\d{2}:\d{2}$/.test(ts)) return ts;
        if (t) {
          try {
            const d = new Date(t);
            if (!isNaN(d.getTime())) {
              const hh = String(d.getHours()).padStart(2, '0');
              const mm = String(d.getMinutes()).padStart(2, '0');
              return `${hh}:${mm}`;
            }
          } catch {}
        }
        return '—';
      };

      const dateObj = new Date(att.date);
      const dateStr = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;

      return {
        className: att.classId?.className || '',
        studentName: att.studentId?.fullName || '',
        date: dateStr,
        checkIn: fmtTime(att.timeString?.checkIn, att.time?.checkIn),
        checkOut: fmtTime(att.timeString?.checkOut, att.time?.checkOut),
        deliverer: att.delivererType || '—',
        receiver: att.receiverType || '—',
        status: att.status === 'present' ? 'Có mặt' : 'Nghỉ học',
      };
    });

    return res.status(200).json({
      status: 'success',
      message: 'Lấy dữ liệu xuất báo cáo thành công',
      data,
      total: data.length,
    });
  } catch (error) {
    console.error('Error in getAttendanceExportData:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy dữ liệu xuất báo cáo',
      error: error.message,
    });
  }
};

/**
 * Giáo viên gửi thông tin người đón cho phụ huynh xác nhận (người ngoài danh sách)
 * POST /api/students/attendance/checkout/request
 * body: { studentId, date?, receiverType, receiverOtherInfo, receiverOtherImageName, checkoutImageName }
 */
const requestCheckout = async (req, res) => {
  try {
    const { studentId, date, receiverType, receiverOtherInfo, receiverOtherImageName, checkoutImageName } = req.body;

    if (!studentId) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp studentId' });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    const existingAttendance = await Attendances.findOne({ studentId, date: attendanceDate });
    if (!existingAttendance || !existingAttendance.timeString?.checkIn) {
      return res.status(400).json({ status: 'error', message: 'Học sinh chưa điểm danh đến' });
    }
    if (existingAttendance.time?.checkOut) {
      return res.status(400).json({ status: 'error', message: 'Học sinh đã điểm danh về rồi' });
    }

    const attendance = await Attendances.findOneAndUpdate(
      { studentId, date: attendanceDate },
      {
        $set: {
          checkoutStatus: 'pending',
          pendingCheckoutData: {
            receiverType: receiverType || '',
            receiverOtherInfo: receiverOtherInfo || '',
            receiverOtherImageName: receiverOtherImageName || '',
            checkoutImageName: checkoutImageName || '',
            sentAt: new Date(),
          },
        },
      },
      { new: true },
    )
      .populate('studentId', 'fullName classId parentId')
      .populate('classId', 'className');

    const parentId = attendance?.studentId?.parentId;
    const studentName = attendance?.studentId?.fullName || studentId;
    const className = attendance?.classId?.className || '';

    if (parentId) {
      await createNotification({
        title: 'Yêu cầu xác nhận đón trẻ',
        body: `Có người đến đón ${studentName}${className ? ` - Lớp ${className}` : ''}. Vui lòng xác nhận trong ứng dụng.`,
        type: 'checkout_pending',
        targetRole: 'Parent',
        targetUserId: parentId,
        extra: { studentId, attendanceId: attendance._id },
      });
    }

    return res.status(200).json({ status: 'success', message: 'Đã gửi thông tin cho phụ huynh', data: { checkoutStatus: 'pending' } });
  } catch (error) {
    console.error('Error in requestCheckout:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi gửi thông tin', error: error.message });
  }
};

/**
 * Lấy trạng thái pending checkout (GV polling / PH xem thông tin để xác nhận)
 * GET /api/students/attendance/checkout/pending/:studentId
 */
const getPendingCheckout = async (req, res) => {
  try {
    const { studentId } = req.params;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendances.findOne({ studentId, date: today })
      .populate('studentId', 'fullName classId parentId')
      .populate('classId', 'className')
      .lean();

    if (!attendance || !['pending', 'confirmed'].includes(attendance.checkoutStatus) || attendance.time?.checkOut) {
      return res.status(200).json({ status: 'success', data: null });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        checkoutStatus: attendance.checkoutStatus,
        pendingCheckoutData: attendance.pendingCheckoutData,
        student: {
          fullName: attendance.studentId?.fullName,
          className: attendance.classId?.className,
        },
      },
    });
  } catch (error) {
    console.error('Error in getPendingCheckout:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi lấy trạng thái', error: error.message });
  }
};

/**
 * Phụ huynh xác nhận đón trẻ
 * POST /api/students/attendance/checkout/parent-confirm
 * body: { studentId, date? }
 */
const parentConfirmCheckout = async (req, res) => {
  try {
    const { studentId, date } = req.body;
    const parentUserId = req.user?._id || req.user?.id;

    if (!studentId) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp studentId' });
    }

    const student = await Students.findById(studentId).lean();
    if (!student) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy học sinh' });
    }
    if (student.parentId?.toString() !== parentUserId?.toString()) {
      return res.status(403).json({ status: 'error', message: 'Không có quyền xác nhận cho học sinh này' });
    }

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    const attendance = await Attendances.findOne({ studentId, date: attendanceDate });
    if (!attendance) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy điểm danh' });
    }
    if (attendance.checkoutStatus !== 'pending') {
      return res.status(400).json({ status: 'error', message: 'Không có yêu cầu xác nhận nào' });
    }

    await Attendances.updateOne(
      { studentId, date: attendanceDate },
      { $set: { checkoutStatus: 'confirmed' } },
    );

    return res.status(200).json({ status: 'success', message: 'Đã xác nhận đón trẻ thành công' });
  } catch (error) {
    console.error('Error in parentConfirmCheckout:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi xác nhận', error: error.message });
  }
};

module.exports = {
  upsertAttendance,
  checkoutAttendance,
  getAttendances,
  getAttendanceOverview,
  getClassAttendanceDetail,
  getStudentAttendanceDetail,
  getStudentAttendanceHistory,
  getAttendanceExportData,
  requestCheckout,
  getPendingCheckout,
  parentConfirmCheckout,
};

