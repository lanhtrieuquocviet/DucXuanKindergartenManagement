const Teacher = require('../models/Teacher');
const Classes = require('../models/Classes');
const Student = require('../models/Student');
const Enrollment = require('../models/Enrollment');
const HealthCheck = require('../models/HealthCheck');
const Attendance = require('../models/Attendances');
const Menu = require('../models/Menu');
const DailyMenu = require('../models/DailyMenu');
const TeacherNote = require('../models/TeacherNote');
const StudentChangeRequest = require('../models/StudentChangeRequest');
const AcademicYear = require('../models/AcademicYear');

// Tính số tuần ISO (1-based) từ ngày, để xác định tuần lẻ/chẵn
function getISOWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function nowVN() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
}

/** GET /teacher/students — tất cả học sinh trong các lớp giáo viên phụ trách */
exports.getMyStudents = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id }).lean();
    if (!teacher) return res.json({ status: 'success', data: [], classes: [] });

    const classes = await Classes.find({ teacherIds: teacher._id })
      .populate('gradeId', 'gradeName')
      .populate('academicYearId', 'yearName')
      .sort({ className: 1 })
      .lean();

    const classIds = classes.map(c => c._id);
    const filter = { classId: { $in: classIds }, status: 'active' };
    if (req.query.classId) filter.classId = req.query.classId;

    const students = await Student.find(filter)
      .populate('parentId', 'fullName phone email')
      .populate('classId', 'className gradeId academicYearId')
      .sort({ fullName: 1 })
      .lean();

    // Thêm thông tin đánh giá học tập cho từng học sinh
    const studentsWithEvaluation = await Promise.all(
      students.map(async (student) => {
        const enrollment = await Enrollment.findOne({
          studentId: student._id,
          academicYearId: student.classId.academicYearId,
          gradeId: student.classId.gradeId
        }).select('academicEvaluation evaluationNote').lean();

        return {
          ...student,
          evaluation: enrollment ? {
            academicEvaluation: enrollment.academicEvaluation,
            evaluationNote: enrollment.evaluationNote
          } : null
        };
      })
    );

    const classesData = classes.map(c => ({
      _id: c._id,
      className: c.className,
      gradeName: c.gradeId?.gradeName || '',
      yearName: c.academicYearId?.yearName || '',
    }));

    return res.json({ status: 'success', data: studentsWithEvaluation, classes: classesData });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

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

/** GET /teacher/contact-book/today-menu — thực đơn hôm nay */
exports.getTodayMenu = async (req, res) => {
  try {
    const today = nowVN();
    const jsDay = today.getDay(); // 0=CN, 1=T2...6=T7

    // Thứ 7 và Chủ nhật không có thực đơn
    const DAY_MAP = { 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri' };
    if (!DAY_MAP[jsDay]) {
      return res.json({ status: 'success', data: null, message: 'Cuối tuần không có thực đơn' });
    }

    const dayOfWeek = DAY_MAP[jsDay];
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const weekNum = getISOWeek(today);
    const weekType = weekNum % 2 === 1 ? 'odd' : 'even';

    // Tìm menu tháng này: ưu tiên menu đang áp dụng (active) trước.
    const candidateMenus = await Menu.find({
      month,
      year,
      status: { $in: ['approved', 'active', 'completed'] },
    })
      .sort({ updatedAt: -1, createdAt: -1 })
      .lean();

    const menu =
      candidateMenus.find((m) => m.status === 'active') ||
      candidateMenus.find((m) => m.status === 'approved') ||
      candidateMenus.find((m) => m.status === 'completed') ||
      null;

    if (!menu) {
      return res.json({ status: 'success', data: null, message: `Chưa có thực đơn tháng ${month}/${year} được duyệt` });
    }

    const daily = await DailyMenu.findOne({ menuId: menu._id, weekType, dayOfWeek })
      .populate('lunchFoods', 'name calories protein fat carb')
      .populate('afternoonFoods', 'name calories protein fat carb')
      .lean();

    if (!daily) {
      return res.json({ status: 'success', data: null, message: 'Không có thực đơn cho ngày hôm nay' });
    }

    const DAY_LABEL = { mon: 'Thứ Hai', tue: 'Thứ Ba', wed: 'Thứ Tư', thu: 'Thứ Năm', fri: 'Thứ Sáu' };
    return res.json({
      status: 'success',
      data: {
        date: today.toISOString().slice(0, 10),
        dayLabel: DAY_LABEL[dayOfWeek],
        weekType,
        weekNum,
        lunchFoods: daily.lunchFoods || [],
        afternoonFoods: daily.afternoonFoods || [],
        totalCalories: daily.totalCalories,
        totalProtein: daily.totalProtein,
        totalFat: daily.totalFat,
        totalCarb: daily.totalCarb,
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
      .sort({ checkDate: -1, createdAt: -1 })
      .lean();

    return res.json({ status: 'success', data: health || null });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

/** GET /teacher/contact-book/:classId/students/:studentId/health-history — toàn bộ lịch sử khám (mới nhất trước) */
exports.getStudentHealthHistory = async (req, res) => {
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

    const records = await HealthCheck.find({ studentId })
      .populate('recordedBy', 'fullName username')
      .sort({ checkDate: -1, createdAt: -1 })
      .lean();

    return res.json({ status: 'success', data: records });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── Teacher Notes ─────────────────────────────────────────────

async function verifyTeacherClass(userId, classId) {
  const teacher = await Teacher.findOne({ userId }).lean();
  if (!teacher) return null;
  const cls = await Classes.findOne({ _id: classId, teacherIds: teacher._id }).lean();
  if (!cls) return null;
  return teacher;
}

/** GET /teacher/contact-book/:classId/students/:studentId/notes */
exports.getNotes = async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const teacher = await verifyTeacherClass(req.user._id, classId);
    if (!teacher) return res.status(403).json({ status: 'error', message: 'Không có quyền truy cập.' });

    const notes = await TeacherNote.find({ studentId, classId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ status: 'success', data: notes });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

/** POST /teacher/contact-book/:classId/students/:studentId/notes */
exports.createNote = async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const teacher = await verifyTeacherClass(req.user._id, classId);
    if (!teacher) return res.status(403).json({ status: 'error', message: 'Không có quyền truy cập.' });

    const { content, images } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ status: 'error', message: 'Nội dung ghi chú không được để trống.' });
    }

    // Auto-detect năm học active
    const activeYear = await AcademicYear.findOne({ status: 'active' }).select('_id').lean();

    const note = await TeacherNote.create({
      studentId,
      classId,
      teacherId: teacher._id,
      academicYearId: activeYear?._id || null,
      content: content.trim(),
      images: Array.isArray(images) ? images : [],
    });

    return res.status(201).json({ status: 'success', data: note });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

/** DELETE /teacher/contact-book/:classId/students/:studentId/notes/:noteId */
exports.deleteNote = async (req, res) => {
  try {
    const { classId, noteId } = req.params;
    const teacher = await verifyTeacherClass(req.user._id, classId);
    if (!teacher) return res.status(403).json({ status: 'error', message: 'Không có quyền truy cập.' });

    const note = await TeacherNote.findOne({ _id: noteId, teacherId: teacher._id });
    if (!note) return res.status(404).json({ status: 'error', message: 'Không tìm thấy ghi chú.' });

    await note.deleteOne();
    return res.json({ status: 'success', message: 'Đã xoá ghi chú.' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── Student Change Requests (Teacher) ────────────────────────

/** GET /teacher/students/:studentId/change-requests */
exports.getChangeRequests = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id }).lean();
    if (!teacher) return res.status(403).json({ status: 'error', message: 'Không có hồ sơ giáo viên.' });

    const requests = await StudentChangeRequest.find({
      studentId: req.params.studentId,
      teacherId: teacher._id,
    }).sort({ createdAt: -1 }).lean();

    return res.json({ status: 'success', data: requests });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

/** POST /teacher/students/:studentId/change-requests */
exports.createChangeRequest = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ userId: req.user._id }).lean();
    if (!teacher) return res.status(403).json({ status: 'error', message: 'Không có hồ sơ giáo viên.' });

    const { title, content } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ status: 'error', message: 'Tiêu đề và nội dung không được để trống.' });
    }

    // Lấy classId từ học sinh
    const student = await Student.findById(req.params.studentId).lean();
    if (!student) return res.status(404).json({ status: 'error', message: 'Không tìm thấy học sinh.' });

    // Giáo viên phải phụ trách lớp của học sinh đó
    const cls = await Classes.findOne({ _id: student.classId, teacherIds: teacher._id }).lean();
    if (!cls) return res.status(403).json({ status: 'error', message: 'Bạn không phụ trách lớp của học sinh này.' });

    const request = await StudentChangeRequest.create({
      studentId: student._id,
      classId: cls._id,
      teacherId: teacher._id,
      title: title.trim(),
      content: content.trim(),
    });

    return res.status(201).json({ status: 'success', data: request });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

// ── Student Evaluation ────────────────────────────────────────

/** GET /teacher/students/:studentId/evaluation */
exports.getStudentEvaluation = async (req, res) => {
  try {
    const { studentId } = req.params;
    const teacher = await Teacher.findOne({ userId: req.user._id }).lean();
    if (!teacher) return res.status(403).json({ status: 'error', message: 'Không có hồ sơ giáo viên.' });

    // Lấy học sinh và kiểm tra giáo viên có phụ trách lớp không
    const student = await Student.findById(studentId).populate('classId').lean();
    if (!student) return res.status(404).json({ status: 'error', message: 'Không tìm thấy học sinh.' });

    const cls = await Classes.findOne({ _id: student.classId._id, teacherIds: teacher._id }).lean();
    if (!cls) return res.status(403).json({ status: 'error', message: 'Bạn không phụ trách lớp của học sinh này.' });

    // Lấy enrollment hiện tại của học sinh
    const enrollment = await Enrollment.findOne({
      studentId,
      academicYearId: cls.academicYearId,
      gradeId: cls.gradeId
    }).lean();

    return res.json({
      status: 'success',
      data: {
        student: {
          _id: student._id,
          fullName: student.fullName,
          className: student.classId.className
        },
        evaluation: enrollment ? {
          academicEvaluation: enrollment.academicEvaluation,
          evaluationNote: enrollment.evaluationNote
        } : null
      }
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

/** PUT /teacher/students/:studentId/evaluation */
exports.updateStudentEvaluation = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { academicEvaluation, evaluationNote } = req.body;

    const teacher = await Teacher.findOne({ userId: req.user._id }).lean();
    if (!teacher) return res.status(403).json({ status: 'error', message: 'Không có hồ sơ giáo viên.' });

    // Lấy học sinh và kiểm tra giáo viên có phụ trách lớp không
    const student = await Student.findById(studentId).populate('classId').lean();
    if (!student) return res.status(404).json({ status: 'error', message: 'Không tìm thấy học sinh.' });

    const cls = await Classes.findOne({ _id: student.classId._id, teacherIds: teacher._id }).lean();
    if (!cls) return res.status(403).json({ status: 'error', message: 'Bạn không phụ trách lớp của học sinh này.' });

    // Cập nhật hoặc tạo enrollment
    const enrollment = await Enrollment.findOneAndUpdate(
      {
        studentId,
        academicYearId: cls.academicYearId,
        gradeId: cls.gradeId
      },
      {
        academicEvaluation,
        evaluationNote: evaluationNote?.trim() || ''
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    return res.json({
      status: 'success',
      data: {
        academicEvaluation: enrollment.academicEvaluation,
        evaluationNote: enrollment.evaluationNote
      },
      message: 'Đã cập nhật đánh giá học tập.'
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};
