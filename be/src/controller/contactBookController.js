const Teacher = require('../models/Teacher');
const Classes = require('../models/Classes');
const Student = require('../models/Student');
const HealthCheck = require('../models/HealthCheck');

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
