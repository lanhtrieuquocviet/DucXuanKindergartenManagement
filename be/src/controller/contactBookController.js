const Teacher = require('../models/Teacher');
const Classes = require('../models/Classes');
const Student = require('../models/Student');
const HealthCheck = require('../models/HealthCheck');
const Attendance = require('../models/Attendances');

/** GET /teacher/contact-book — danh sách lớp giáo viên phụ trách */
exports.getMyClasses = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id }).lean();
    if (!teacher) {
      return res.json({ status: 'success', data: [] });
    }

    const classes = await Classes.find({ teacherIds: teacher._id })
      .populate('gradeId', 'gradeName')
      .populate('academicYearId', 'yearName')
      .lean();

    const classIds = classes.map(c => c._id);
    const counts = await Student.aggregate([
      { $match: { classId: { $in: classIds }, status: 'active' } },
      { $group: { _id: '$classId', count: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach(c => { countMap[c._id.toString()] = c.count; });

    const data = classes.map(c => ({
      _id: c._id,
      className: c.className,
      gradeName: c.gradeId?.gradeName || '',
      yearName: c.academicYearId?.yearName || '',
      studentCount: countMap[c._id.toString()] || 0,
    }));

    return res.json({ status: 'success', data });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

/** GET /teacher/contact-book/:classId/students — danh sách học sinh trong lớp */
exports.getStudentsInClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacher = await Teacher.findOne({ userId: req.user._id }).lean();
    if (!teacher) {
      return res.status(403).json({ status: 'error', message: 'Không có hồ sơ giáo viên.' });
    }

    const cls = await Classes.findOne({ _id: classId, teacherIds: teacher._id })
      .populate('gradeId', 'gradeName')
      .lean();
    if (!cls) {
      return res.status(403).json({ status: 'error', message: 'Bạn không phụ trách lớp này.' });
    }

    const students = await Student.find({ classId, status: 'active' })
      .populate('parentId', 'fullName phone email username')
      .sort({ fullName: 1 })
      .lean();

    return res.json({
      status: 'success',
      data: {
        class: {
          _id: cls._id,
          className: cls.className,
          gradeName: cls.gradeId?.gradeName || '',
        },
        students,
      },
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

/**
 * GET /teacher/contact-book/:classId/students/:studentId/attendance
 * Lịch sử điểm danh của học sinh — lọc theo tháng (query: year, month)
 */
exports.getStudentAttendance = async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const teacher = await Teacher.findOne({ userId: req.user._id }).lean();
    if (!teacher) {
      return res.status(403).json({ status: 'error', message: 'Không có hồ sơ giáo viên.' });
    }
    const cls = await Classes.findOne({ _id: classId, teacherIds: teacher._id }).lean();
    if (!cls) {
      return res.status(403).json({ status: 'error', message: 'Bạn không phụ trách lớp này.' });
    }

    const now = new Date();
    const year  = parseInt(req.query.year)  || now.getFullYear();
    const month = parseInt(req.query.month) || (now.getMonth() + 1); // 1–12

    const from = new Date(year, month - 1, 1, 0, 0, 0);
    const to   = new Date(year, month, 1, 0, 0, 0); // đầu tháng sau

    const records = await Attendance.find({
      studentId,
      date: { $gte: from, $lt: to },
    })
      .sort({ date: -1 })
      .lean();

    const present = records.filter(r => r.status === 'present').length;
    const absent  = records.filter(r => r.status === 'absent').length;
    const leave   = records.filter(r => r.status === 'leave').length;
    const total   = records.length;
    const rate    = total > 0 ? Math.round((present / total) * 100) : null;

    return res.json({
      status: 'success',
      data: {
        year, month, total, present, absent, leave, rate,
        records,
      },
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

/** GET /teacher/contact-book/:classId/students/:studentId/health — hồ sơ sức khỏe mới nhất */
exports.getStudentHealth = async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const teacher = await Teacher.findOne({ userId: req.user._id }).lean();
    if (!teacher) {
      return res.status(403).json({ status: 'error', message: 'Không có hồ sơ giáo viên.' });
    }
    const cls = await Classes.findOne({ _id: classId, teacherIds: teacher._id }).lean();
    if (!cls) {
      return res.status(403).json({ status: 'error', message: 'Bạn không phụ trách lớp này.' });
    }

    const health = await HealthCheck.findOne({ studentId })
      .sort({ checkDate: -1 })
      .lean();

    return res.json({ status: 'success', data: health || null });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
