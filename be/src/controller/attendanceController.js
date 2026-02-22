const mongoose = require('mongoose');
const Attendances = require('../models/Attendances');
const Classes = require('../models/Classes');
const Students = require('../models/Student');

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
      checkinImageName,
      delivererType,
      delivererOtherInfo,
      delivererOtherImageName,
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
      checkinImageName,
      delivererType,
      delivererOtherInfo,
      delivererOtherImageName,
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
      checkoutImageName,
      receiverType,
      receiverOtherInfo,
      receiverOtherImageName,
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
      checkoutImageName,
      receiverType,
      receiverOtherInfo,
      receiverOtherImageName,
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
              image: attendance.image,
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
              image: attendance.image,
              date: attendance.date,
              delivererType: attendance.delivererType || '',
              receiverType: attendance.receiverType || '',
              delivererOtherInfo: attendance.delivererOtherInfo || '',
              receiverOtherInfo: attendance.receiverOtherInfo || '',
              delivererOtherImageName: attendance.delivererOtherImageName || '',
              receiverOtherImageName: attendance.receiverOtherImageName || '',
              checkinImageName: attendance.checkinImageName || attendance.image || '',
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

/**
 * Lấy lịch sử điểm danh của một học sinh (cho SchoolAdmin)
 * GET /api/school-admin/students/:studentId/attendance/history
 * query: from? (YYYY-MM-DD), to? (YYYY-MM-DD)
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
    const filter = { studentId: studentId };
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
        attendances: attendances.map((att) => ({
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
        })),
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

module.exports = {
  upsertAttendance,
  checkoutAttendance,
  getAttendances,
  getAttendanceOverview,
  getClassAttendanceDetail,
  getStudentAttendanceDetail,
  getStudentAttendanceHistory,
};

