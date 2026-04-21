const mongoose = require('mongoose');
const AcademicYear = require('../models/AcademicYear');
const Classes = require('../models/Classes');
const Student = require('../models/Student');
const Grade = require('../models/Grade');
const Enrollment = require('../models/Enrollment');
const StaticBlock = require('../models/StaticBlock');
const { createNotification } = require('../controller/notification.controller');
const Menu = require('../models/Menu');

function timetableSeasonLabel(season) {
  if (season === 'summer') return 'Mùa Hè';
  if (season === 'winter') return 'Mùa Đông';
  return 'Tự động theo tháng';
}

/**
 * Tự động kết thúc năm học đã quá hạn endDate.
 * Quy ước: chỉ tự kết thúc khi đã qua ngày kết thúc (tức từ 00:00 ngày hôm sau).
 */
const autoFinishExpiredAcademicYears = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // 1. Tìm các năm học sắp kết thúc
  const expiringYears = await AcademicYear.find({
    status: 'active',
    endDate: { $lt: startOfToday },
  }).select('_id').lean();

  if (expiringYears.length > 0) {
    const expiringIds = expiringYears.map(y => y._id);

    // 2. Kết thúc thực đơn đang áp dụng của các năm học này
    await Menu.updateMany(
      {
        academicYearId: { $in: expiringIds },
        status: 'active',
      },
      {
        $set: {
          status: 'completed',
          endedAt: new Date(),
        },
        $push: {
          statusHistory: {
            type: 'ended',
            at: new Date(),
            detail: 'Tự động kết thúc do năm học hết hạn',
          },
        },
      },
    );

    // 3. Cập nhật trạng thái năm học
    await AcademicYear.updateMany(
      { _id: { $in: expiringIds } },
      { $set: { status: 'inactive' } },
    );
  }
};

/**
 * Khối được xét tốt nghiệp (năm cuối mầm non): theo khoảng tuổi cấu hình trên Grade
 * (đồng bộ static block, ví dụ min 5 — max 6). Không dựa vào tên hiển thị "Khối chồi", "5-6"...
 */
function isGraduationEligibleBand(grade) {
  if (!grade) return false;
  const min = Number(grade.minAge);
  const max = Number(grade.maxAge);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return false;
  return min >= 5 && max >= 6;
}

/**
 * GET /api/school-admin/academic-years/current
 * Lấy năm học đang hoạt động (active) mới nhất
 */
const getCurrentAcademicYear = async (req, res) => {
  try {
    await autoFinishExpiredAcademicYears();

    const currentYear = await AcademicYear.findOne({ status: 'active' })
      .sort({ startDate: -1 })
      .lean();

    return res.status(200).json({
      status: 'success',
      data: currentYear || null,
    });
  } catch (error) {
    console.error('getCurrentAcademicYear error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy năm học hiện tại',
    });
  }
};

/**
 * PATCH /api/school-admin/academic-years/current/timetable-season
 * Body: { activeTimetableSeason: 'summer' | 'winter' | 'auto' }
 */
const patchCurrentTimetableSeason = async (req, res) => {
  try {
    const { activeTimetableSeason } = req.body || {};
    const allowed = ['summer', 'winter', 'auto'];
    if (!allowed.includes(activeTimetableSeason)) {
      return res.status(400).json({
        status: 'error',
        message: 'Giá trị activeTimetableSeason phải là summer, winter hoặc auto.',
      });
    }

    await autoFinishExpiredAcademicYears();

    const year = await AcademicYear.findOne({ status: 'active' }).sort({ startDate: -1 });
    if (!year) {
      return res.status(404).json({
        status: 'error',
        message: 'Chưa có năm học đang hoạt động.',
      });
    }

    const previousSeason = year.activeTimetableSeason || 'auto';
    year.activeTimetableSeason = activeTimetableSeason;
    await year.save();

    if (previousSeason !== activeTimetableSeason) {
      await createNotification({
        title: 'Thời gian biểu có thay đổi',
        body: `Đã đổi mùa thời gian biểu đang áp dụng năm học ${year.yearName}: ${timetableSeasonLabel(previousSeason)} → ${timetableSeasonLabel(activeTimetableSeason)}.`,
        type: 'timetable_update',
        targetRole: 'all',
        extra: {
          action: 'switch_active_season',
          yearId: String(year._id),
          yearName: year.yearName,
          previousSeason,
          activeTimetableSeason,
        },
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Đã cập nhật mùa áp dụng thời gian biểu.',
      data: year.toObject(),
    });
  } catch (error) {
    console.error('patchCurrentTimetableSeason error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi cập nhật thời gian biểu theo mùa',
    });
  }
};

/**
 * GET /api/school-admin/academic-years
 * Lấy danh sách tất cả năm học
 */
const listAcademicYears = async (req, res) => {
  try {
    await autoFinishExpiredAcademicYears();

    const years = await AcademicYear.find()
      .sort({ startDate: -1 })
      .lean();

    return res.status(200).json({
      status: 'success',
      data: years || [],
      total: years?.length || 0,
    });
  } catch (error) {
    console.error('listAcademicYears error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy danh sách năm học',
    });
  }
};

/**
 * GET /api/school-admin/academic-years/:yearId/students
 * Danh sách học sinh trong năm học (qua classId → class.academicYearId)
 */
const getStudentsByAcademicYear = async (req, res) => {
  try {
    const { yearId } = req.params;
    const year = await AcademicYear.findById(yearId).lean();
    if (!year) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy năm học' });
    }

    const classes = await Classes.find({ academicYearId: yearId })
      .populate('gradeId', 'gradeName minAge maxAge')
      .select('_id className gradeId')
      .lean();
    const classIds = classes.map((c) => c._id);
    const classMap = {};
    const gradeMap = {};
    const gradeDocByClassId = {};
    classes.forEach((c) => {
      const cid = String(c._id);
      classMap[cid] = c.className;
      const g = c.gradeId;
      gradeMap[cid] = g?.gradeName || '';
      gradeDocByClassId[cid] = g || null;
    });

    const students = await Student.find({ classId: { $in: classIds } })
      .select('_id fullName dateOfBirth gender classId avatar status needsSpecialAttention specialNote')
      .lean();

    const Enrollment = require('../models/Enrollment');
    const data = await Promise.all(students.map(async (s) => {
      const cid = String(s.classId);
      const classRow = classes.find((c) => String(c._id) === cid);
      const gradeDoc = gradeDocByClassId[cid];
      const gradeIdForEnroll = classRow?.gradeId?._id ?? classRow?.gradeId;

      // Get evaluation data
      const enrollment = await Enrollment.findOne({
        studentId: s._id,
        academicYearId: yearId,
        gradeId: gradeIdForEnroll,
      }).select('academicEvaluation evaluationNote').lean();

      return {
        _id: s._id,
        fullName: s.fullName,
        dateOfBirth: s.dateOfBirth,
        gender: s.gender,
        avatar: s.avatar || '',
        status: s.status,
        needsSpecialAttention: s.needsSpecialAttention || false,
        specialNote: s.specialNote || '',
        className: classMap[cid] || '',
        gradeName: gradeMap[cid] || '',
        gradeMinAge: gradeDoc?.minAge,
        gradeMaxAge: gradeDoc?.maxAge,
        canChooseGraduation: isGraduationEligibleBand(gradeDoc),
        evaluation: enrollment ? {
          academicEvaluation: enrollment.academicEvaluation,
          evaluationNote: enrollment.evaluationNote
        } : null
      };
    }));

    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    console.error('getStudentsByAcademicYear error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi lấy danh sách học sinh' });
  }
};

/**
 * POST /api/school-admin/academic-years
 * Tạo năm học mới, tự động set các năm học khác về inactive
 */
const createAcademicYear = async (req, res) => {
  try {
    const {
      yearName,
      startDate,
      endDate,
      termCount,
      term1StartDate,
      term1EndDate,
      term2StartDate,
      term2EndDate,
      description = '',
      carryOverStudentIds,
    } = req.body;

    const errors = [];
    if (!yearName || !String(yearName).trim()) {
      errors.push('Tên năm học không được để trống');
    }
    if (!startDate) {
      errors.push('Ngày bắt đầu không được để trống');
    }
    if (!endDate) {
      errors.push('Ngày kết thúc không được để trống');
    }
    if (!description || !String(description).trim()) {
      errors.push('Mô tả / mục tiêu năm học không được để trống');
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        errors.push('Ngày bắt đầu hoặc kết thúc không hợp lệ');
      } else if (start >= end) {
        errors.push('Ngày kết thúc phải sau ngày bắt đầu');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: errors.join(', '),
      });
    }

    // Validate 2 kỳ học (UI cố định)
    const mustDates = [
      { key: 'term1StartDate', label: 'Ngày bắt đầu kỳ 1', value: term1StartDate },
      { key: 'term1EndDate', label: 'Ngày kết thúc kỳ 1', value: term1EndDate },
      { key: 'term2StartDate', label: 'Ngày bắt đầu kỳ 2', value: term2StartDate },
      { key: 'term2EndDate', label: 'Ngày kết thúc kỳ 2', value: term2EndDate },
    ];

    const missing = mustDates.filter((d) => !d.value);
    if (missing.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: missing.map((m) => m.label).join(', '),
      });
    }

    const t1s = new Date(term1StartDate);
    const t1e = new Date(term1EndDate);
    const t2s = new Date(term2StartDate);
    const t2e = new Date(term2EndDate);

    const anyInvalid =
      Number.isNaN(t1s.getTime()) ||
      Number.isNaN(t1e.getTime()) ||
      Number.isNaN(t2s.getTime()) ||
      Number.isNaN(t2e.getTime());

    if (anyInvalid) {
      return res.status(400).json({
        status: 'error',
        message: 'Ngày bắt đầu/kết thúc kỳ học không hợp lệ',
      });
    }

    if (t1s >= t1e) {
      return res.status(400).json({
        status: 'error',
        message: 'Kỳ 1: ngày kết thúc phải sau ngày bắt đầu',
      });
    }

    if (t2s >= t2e) {
      return res.status(400).json({
        status: 'error',
        message: 'Kỳ 2: ngày kết thúc phải sau ngày bắt đầu',
      });
    }

    if (t1e > t2s) {
      return res.status(400).json({
        status: 'error',
        message: 'Kỳ 2 không thể bắt đầu trước khi kỳ 1 kết thúc',
      });
    }

    const trimmedName = String(yearName).trim();

    const existing = await AcademicYear.findOne({ yearName: trimmedName });
    if (existing) {
      return res.status(400).json({
        status: 'error',
        message: 'Tên năm học đã tồn tại',
      });
    }

    // Đảm bảo chỉ có 1 năm học active tại một thời điểm
    const prevActiveYears = await AcademicYear.find({ status: 'active' }).select('_id').lean();
    const prevActiveIds = prevActiveYears.map(y => y._id);

    if (prevActiveIds.length > 0) {
      // Kết thúc các thực đơn đang áp dụng của năm học cũ
      await Menu.updateMany(
        {
          academicYearId: { $in: prevActiveIds },
          status: 'active',
        },
        {
          $set: {
            status: 'completed',
            endedAt: new Date(),
          },
          $push: {
            statusHistory: {
              type: 'ended',
              at: new Date(),
              detail: 'Kết thúc do bắt đầu năm học mới',
            },
          },
        },
      );
    }

    await AcademicYear.updateMany(
      { status: 'active' },
      { $set: { status: 'inactive' } },
    );

    const newYear = await AcademicYear.create({
      yearName: trimmedName,
      startDate,
      endDate,
      termCount: termCount ? Number(termCount) : 0,
      term1StartDate,
      term1EndDate,
      term2StartDate,
      term2EndDate,
      description: typeof description === 'string' ? description.trim() : '',
      status: 'active',
    });

    // Thêm id năm học mới vào academicYearId của những học sinh được chọn chuyển tiếp
    const ids = Array.isArray(carryOverStudentIds)
      ? carryOverStudentIds.filter(Boolean)
      : [];
    if (ids.length > 0) {
      await Student.updateMany(
        { _id: { $in: ids } },
        [
          {
            $set: {
              academicYearId: {
                $cond: {
                  if: { $isArray: '$academicYearId' },
                  then: { $setUnion: ['$academicYearId', [newYear._id]] },
                  else: {
                    $cond: {
                      if: { $eq: ['$academicYearId', null] },
                      then: [newYear._id],
                      else: { $setUnion: [['$academicYearId'], [newYear._id]] },
                    },
                  },
                },
              },
            },
          },
        ],
      );
    }

    return res.status(201).json({
      status: 'success',
      message: 'Tạo năm học mới thành công',
      data: newYear,
      carryOverCount: ids.length,
    });
  } catch (error) {
    console.error('createAcademicYear error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi tạo năm học mới',
    });
  }
};

/**
 * PATCH /api/school-admin/academic-years/:id/finish
 * Kết thúc (archive) một năm học
 */
const finishAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;
    const { selectedStudentIds } = req.body; // Học sinh khối năm cuối (5–6 tuổi theo cấu hình) được tick tốt nghiệp

    const year = await AcademicYear.findById(id);
    if (!year) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy năm học',
      });
    }

    if (year.status === 'inactive') {
      return res.status(200).json({
        status: 'success',
        message: 'Năm học đã ở trạng thái kết thúc',
        data: year,
      });
    }

    // Get the newest academic year (for automatic transfer)
    const newestYear = await AcademicYear.findOne()
      .sort({ createdAt: -1 })
      .lean();

    // Get all students in this academic year with their class and grade info
    const allStudents = await Student.find({
      academicYearId: id,
      status: 'active'
    })
    .populate('classId', 'gradeId')
    .select('_id status classId needsSpecialAttention');

    const Grade = require('../models/Grade');

    let graduatedCount = 0;
    let transferredCount = 0;

    // Process each student: chỉ khối đủ khoảng tuổi năm cuối (min≥5, max≥6) mới xét tốt nghiệp theo tick
    for (const student of allStudents) {
      const gradeRef = student.classId?.gradeId;
      const gradeId = gradeRef?._id ?? gradeRef;
      const grade = await Grade.findById(gradeId)
        .select('gradeName minAge maxAge')
        .lean();

      if (isGraduationEligibleBand(grade)) {
        if (selectedStudentIds && selectedStudentIds.includes(student._id.toString())) {
          await Student.findByIdAndUpdate(student._id, { status: 'graduated' });
          graduatedCount++;
        } else if (newestYear && newestYear._id.toString() !== id) {
          await Student.findByIdAndUpdate(student._id, {
            $addToSet: { academicYearId: newestYear._id }
          });
          transferredCount++;
        }
      } else if (newestYear && newestYear._id.toString() !== id) {
        await Student.findByIdAndUpdate(student._id, {
          $addToSet: { academicYearId: newestYear._id }
        });
        transferredCount++;
      }
    }

    // 3. Kết thúc các thực đơn đang áp dụng của năm học này
    await Menu.updateMany(
      {
        academicYearId: id,
        status: 'active',
      },
      {
        $set: {
          status: 'completed',
          endedAt: new Date(),
        },
        $push: {
          statusHistory: {
            type: 'ended',
            at: new Date(),
            detail: 'Kết thúc do đóng năm học (thủ công)',
          },
        },
      },
    );

    year.status = 'inactive';
    await year.save();

    return res.status(200).json({
      status: 'success',
      message: `Kết thúc năm học thành công. ${graduatedCount} học sinh tốt nghiệp (khối 5-6), ${transferredCount} học sinh chuyển tiếp.`,
      data: {
        ...year.toObject(),
        graduatedCount,
        transferredCount
      },
    });
  } catch (error) {
    console.error('finishAcademicYear error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi kết thúc năm học',
    });
  }
};

/**
 * GET /api/school-admin/academic-years/history
 * Thống kê lịch sử năm học (số lớp, số trẻ)
 * Query optional: yearId (lọc 1 năm cụ thể)
 */
const getAcademicYearHistory = async (req, res) => {
  try {
    await autoFinishExpiredAcademicYears();

    const { yearId } = req.query;

    const yearFilter = {
      status: { $ne: 'active' },
    };
    if (yearId) {
      yearFilter._id = yearId;
    }

    const years = await AcademicYear.find(yearFilter).sort({ startDate: -1 }).lean();
    if (!years || years.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: [],
      });
    }

    const yearIds = years.map((y) => y._id);

    const classes = await Classes.find({ academicYearId: { $in: yearIds } })
      .select('_id academicYearId')
      .lean();

    const classCountByYear = {};
    const classIdToYearId = {};
    classes.forEach((cls) => {
      const yId = String(cls.academicYearId);
      classCountByYear[yId] = (classCountByYear[yId] || 0) + 1;
      classIdToYearId[String(cls._id)] = yId;
    });

    const classIds = classes.map((c) => c._id);
    let studentCountByYear = {};

    if (classIds.length > 0) {
      const students = await Student.find({ classId: { $in: classIds } })
        .select('classId')
        .lean();

      studentCountByYear = {};
      students.forEach((st) => {
        const cId = String(st.classId);
        const yId = classIdToYearId[cId];
        if (!yId) return;
        studentCountByYear[yId] = (studentCountByYear[yId] || 0) + 1;
      });
    }

    const result = years.map((y) => {
      const key = String(y._id);
      return {
        _id: y._id,
        yearName: y.yearName,
        startDate: y.startDate,
        endDate: y.endDate,
        status: y.status,
        termCount: y.termCount || 0,
        term1StartDate: y.term1StartDate || null,
        term1EndDate: y.term1EndDate || null,
        term2StartDate: y.term2StartDate || null,
        term2EndDate: y.term2EndDate || null,
        description: y.description || '',
        classCount: classCountByYear[key] || 0,
        studentCount: studentCountByYear[key] || 0,
      };
    });

    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    console.error('getAcademicYearHistory error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy lịch sử năm học',
    });
  }
};

/**
 * GET /api/school-admin/academic-years/:yearId/classes
 * Danh sách lớp học của một năm học (có giáo viên + số trẻ)
 */
const getClassesByAcademicYear = async (req, res) => {
  try {
    const { yearId } = req.params;

    const year = await AcademicYear.findById(yearId).lean();
    if (!year) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy năm học',
      });
    }

    const classes = await Classes.find({ academicYearId: yearId })
      .populate('gradeId', 'gradeName')
      .populate({
        path: 'teacherIds',
        select: 'userId',
        populate: { path: 'userId', select: 'fullName' },
      })
      .sort({ className: 1 })
      .lean();

    const classIds = classes.map((c) => c._id);
    const studentCounts = {};
    if (classIds.length > 0) {
      const counts = await Student.aggregate([
        { $match: { classId: { $in: classIds } } },
        { $group: { _id: '$classId', count: { $sum: 1 } } },
      ]);
      counts.forEach((r) => {
        studentCounts[String(r._id)] = r.count;
      });
    }

    const result = classes.map((cls) => {
      const teachers = (cls.teacherIds || [])
        .map((t) => ({
          _id: t?._id || null,
          fullName: t?.userId?.fullName || '',
        }))
        .filter((t) => t._id && t.fullName);
      const teacherNames = teachers.map((t) => `Cô ${t.fullName}`);
      return {
        _id: cls._id,
        className: cls.className,
        gradeId: cls.gradeId?._id || null,
        gradeName: cls.gradeId?.gradeName || '',
        teacherIds: teachers,
        teacherNames: teacherNames.join(', ') || '-',
        studentCount: studentCounts[String(cls._id)] || 0,
      };
    });

    return res.status(200).json({
      status: 'success',
      data: result,
      yearName: year.yearName,
    });
  } catch (error) {
    console.error('getClassesByAcademicYear error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy danh sách lớp học',
    });
  }
};

/**
 * POST /api/school-admin/academic-years/wizard-setup
 * Thiết lập năm học mới theo luồng Wizard trong một Atomic Transaction.
 * Bao gồm: đóng năm cũ → tạo Năm học → tạo Grade (Snapshot từ StaticBlock) → tạo Lớp → điều chuyển học sinh → tạo Enrollment.
 *
 * Body:
 * {
 *   yearInfo: { yearName, startDate, endDate, term1StartDate, term1EndDate, term2StartDate, term2EndDate, description },
 *   grades: [{ tempId, staticBlockId, headTeacherId? }],
 *   classes: [{ tempId, className, gradeTempId, teacherIds[], maxStudents }],
 *   studentPlacements: [{ studentId, classTempId }]  // học sinh chuyển tiếp
 * }
 */
const setupNewAcademicYearWizard = async (req, res) => {
  // --- Tự động dọn dẹp các index unique cũ (Fix lỗi E11000) ---
  try {
    const db = mongoose.connection.db;
    await Promise.allSettled([
      db.collection('Grades').dropIndex('gradeName_1'),
      db.collection('Classes').dropIndex('className_1')
    ]);
  } catch (err) {
    // Bỏ qua lỗi nếu index không tồn tại
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { yearInfo, grades = [], classes = [], studentPlacements = [], importedStudents = [] } = req.body;

    // ── Validation cơ bản ──────────────────────────────────────────────────
    if (!yearInfo?.yearName?.trim()) {
      return res.status(400).json({ status: 'error', message: 'Tên năm học không được để trống' });
    }
    if (!yearInfo?.startDate || !yearInfo?.endDate) {
      return res.status(400).json({ status: 'error', message: 'Ngày bắt đầu và kết thúc là bắt buộc' });
    }
    const yearStart = new Date(yearInfo.startDate);
    const yearEnd = new Date(yearInfo.endDate);
    if (yearStart >= yearEnd) {
      return res.status(400).json({ status: 'error', message: 'Ngày kết thúc năm học phải sau ngày bắt đầu' });
    }

    // Validation cho 2 kỳ học
    const { term1StartDate, term1EndDate, term2StartDate, term2EndDate } = yearInfo;
    if (!term1StartDate || !term1EndDate || !term2StartDate || !term2EndDate) {
      return res.status(400).json({ status: 'error', message: 'Thông tin ngày bắt đầu/kết thúc các kỳ học không được để trống' });
    }

    const t1s = new Date(term1StartDate);
    const t1e = new Date(term1EndDate);
    const t2s = new Date(term2StartDate);
    const t2e = new Date(term2EndDate);

    if (t1s >= t1e) return res.status(400).json({ status: 'error', message: 'Kỳ 1: Ngày kết thúc phải sau ngày bắt đầu' });
    if (t2s >= t2e) return res.status(400).json({ status: 'error', message: 'Kỳ 2: Ngày kết thúc phải sau ngày bắt đầu' });
    if (t1e > t2s) return res.status(400).json({ status: 'error', message: 'Kỳ 2 không thể bắt đầu trước khi kỳ 1 kết thúc' });
    
    // Kiểm tra biên năm học
    if (t1s < yearStart) return res.status(400).json({ status: 'error', message: 'Kỳ 1 không thể bắt đầu trước năm học' });
    if (t2e > yearEnd) return res.status(400).json({ status: 'error', message: 'Kỳ 2 không thể kết thúc sau năm học' });

    if (!yearInfo?.description?.trim()) {
      return res.status(400).json({ status: 'error', message: 'Mô tả năm học không được để trống' });
    }
    if (grades.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Phải chọn ít nhất một khối học' });
    }
    if (classes.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Phải tạo ít nhất một lớp học' });
    }
    // Kiểm tra lớp chưa được gán giáo viên
    const classesWithoutTeacher = classes.filter(c => !c.teacherIds || c.teacherIds.length === 0);
    if (classesWithoutTeacher.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: `${classesWithoutTeacher.length} lớp chưa được gán giáo viên: ${classesWithoutTeacher.map(c => c.className).join(', ')}`,
      });
    }
    // Kiểm tra giáo viên bị trùng giữa các lớp
    const allAssignedTeacherIds = classes.flatMap(c => c.teacherIds || []);
    const teacherIdSet = new Set();
    for (const tid of allAssignedTeacherIds) {
      if (teacherIdSet.has(String(tid))) {
        return res.status(400).json({
          status: 'error',
          message: 'Một giáo viên không thể được gán vào nhiều lớp trong cùng một năm học',
        });
      }
      teacherIdSet.add(String(tid));
    }
    // Kiểm tra trùng tên năm học
    const existingYear = await AcademicYear.findOne({ yearName: yearInfo.yearName.trim() }).session(session);
    if (existingYear) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ status: 'error', message: 'Tên năm học đã tồn tại' });
    }

    // ── STEP 1: Đóng tất cả năm học đang active ───────────────────────────
    await AcademicYear.updateMany(
      { status: 'active' },
      { $set: { status: 'inactive' } },
      { session },
    );

    // ── STEP 2: Tạo năm học mới ────────────────────────────────────────────
    const [newYear] = await AcademicYear.create(
      [{
        yearName: yearInfo.yearName.trim(),
        startDate: yearInfo.startDate,
        endDate: yearInfo.endDate,
        termCount: 2,
        term1StartDate: yearInfo.term1StartDate || null,
        term1EndDate: yearInfo.term1EndDate || null,
        term2StartDate: yearInfo.term2StartDate || null,
        term2EndDate: yearInfo.term2EndDate || null,
        description: yearInfo.description.trim(),
        status: 'active',
      }],
      { session },
    );

    // ── STEP 3: Tạo Grade (Snapshot từ StaticBlock) ────────────────────────
    // Map tempId → real Grade ObjectId
    const gradeIdMap = new Map();
    for (const g of grades) {
      if (!g.staticBlockId) throw new Error(`Khối thiếu staticBlockId: ${g.tempId}`);
      const sb = await StaticBlock.findById(g.staticBlockId).session(session).lean();
      if (!sb) throw new Error(`Không tìm thấy StaticBlock: ${g.staticBlockId}`);
      if (sb.status !== 'active') throw new Error(`StaticBlock "${sb.name}" đã bị vô hiệu hóa`);

      const [newGrade] = await Grade.create(
        [{
          gradeName: sb.name,
          description: sb.description || '',
          staticBlockId: sb._id,
          academicYearId: newYear._id,
          // Snapshot độ tuổi tại thời điểm tạo — không phụ thuộc StaticBlock sau này
          minAge: sb.minAge,
          maxAge: sb.maxAge,
          maxClasses: sb.maxClasses,
          headTeacherId: g.headTeacherId || null,
        }],
        { session },
      );
      gradeIdMap.set(g.tempId, newGrade._id);
    }

    // ── STEP 4: Tạo lớp học hàng loạt ─────────────────────────────────────
    // Map tempId → real Class ObjectId
    const classIdMap = new Map();
    const classDocs = [];
    for (const c of classes) {
      const gradeId = gradeIdMap.get(c.gradeTempId);
      if (!gradeId) throw new Error(`Lớp "${c.className}" trỏ đến khối không tồn tại: ${c.gradeTempId}`);

      // Validate sĩ số hợp lệ
      const maxStudents = Number(c.maxStudents) || 25;
      if (maxStudents < 1 || maxStudents > 100) {
        throw new Error(`Sĩ số lớp "${c.className}" phải từ 1-100`);
      }

      classDocs.push({
        className: c.className.trim(),
        gradeId,
        academicYearId: newYear._id,
        teacherIds: c.teacherIds || [],
        maxStudents,
        capacity: 0,
        _tempId: c.tempId, // tạm thời để map, sẽ không được lưu vào DB
      });
    }
    // insertMany để tối ưu, sau đó map lại theo tên
    const docsToInsert = classDocs.map(({ _tempId, ...rest }) => rest);
    const insertedClasses = await Classes.insertMany(docsToInsert, { session });
    insertedClasses.forEach((cls, idx) => {
      classIdMap.set(classDocs[idx]._tempId, cls._id);
    });
 
    // ── STEP 4.5: Tạo học sinh mới được import ────────────────────────────
    const importedStudentIdMap = new Map(); // tempId -> real ObjectId
    if (importedStudents.length > 0) {
      const studentDocs = importedStudents.map(s => ({
        fullName: s.fullName.trim(),
        dateOfBirth: s.dateOfBirth,
        gender: s.gender || 'other',
        status: 'active',
        academicYearId: [newYear._id], // Bắt đầu từ năm học mới
        _tempId: s.tempId,
      }));
      
      const insertedStudents = await Student.insertMany(
        studentDocs.map(({ _tempId, ...rest }) => rest),
        { session }
      );
      
      insertedStudents.forEach((st, idx) => {
        importedStudentIdMap.set(studentDocs[idx]._tempId, st._id);
      });
    }

    // ── STEP 5: Điều chuyển học sinh + tạo Enrollment ─────────────────────
    let studentsTransferred = 0;
    let orphanStudents = [];

    // Bước 5a: Tìm học sinh "mồ côi" (active nhưng không được xếp lớp)
    if (studentPlacements.length > 0) {
      const placedStudentIds = studentPlacements.map(p => p.studentId);

      const bulkOps = [];
      const enrollmentDocs = [];

      for (const placement of studentPlacements) {
        const realClassId = classIdMap.get(placement.classTempId);
        if (!realClassId) {
          // Học sinh được chuyển tiếp nhưng không có lớp đích → bỏ qua, cảnh báo
          orphanStudents.push(placement.studentId);
          continue;
        }
        // Lấy gradeId từ lớp đích
        const targetClass = insertedClasses.find(c => String(c._id) === String(realClassId));
        const gradeId = targetClass?.gradeId || null;

        // Validate sĩ số không vượt quá maxStudents
        const targetClassConfig = classes.find(c => c.tempId === placement.classTempId);
        const maxStudents = Number(targetClassConfig?.maxStudents) || 25;
        const currentCount = bulkOps.filter(op =>
          op.updateOne?.filter?.classId && String(op.updateOne.filter.classId) === String(realClassId)
        ).length;
        if (currentCount >= maxStudents) {
          return res.status(400).json({
            status: 'error',
            message: `Lớp "${targetClassConfig?.className}" đã vượt quá sĩ số tối đa (${maxStudents})`,
          });
        }

        bulkOps.push({
          updateOne: {
            filter: { _id: placement.studentId },
            update: {
              $set: { classId: realClassId, status: 'active' },
              $addToSet: { academicYearId: newYear._id },
            },
          },
        });

        enrollmentDocs.push({
          studentId: placement.studentId,
          classId: realClassId,
          gradeId,
          academicYearId: newYear._id,
          enrollmentDate: new Date(),
        });

        studentsTransferred++;
      }
 
      // Xử lý placements cho học sinh mới import
      for (const student of importedStudents) {
        const realStudentId = importedStudentIdMap.get(student.tempId);
        const realClassId = classIdMap.get(student.classId);
        if (!realStudentId || !realClassId) continue;

        const targetClass = insertedClasses.find(c => String(c._id) === String(realClassId));
        const gradeId = targetClass?.gradeId || null;

        bulkOps.push({
          updateOne: {
            filter: { _id: realStudentId },
            update: { $set: { classId: realClassId } },
          },
        });

        enrollmentDocs.push({
          studentId: realStudentId,
          classId: realClassId,
          gradeId,
          academicYearId: newYear._id,
          enrollmentDate: new Date(),
        });
        
        studentsTransferred++;
      }

      if (bulkOps.length > 0) {
        await Student.bulkWrite(bulkOps, { session });
      }
      if (enrollmentDocs.length > 0) {
        await Enrollment.insertMany(enrollmentDocs, { session });
      }
    }

    // ── STEP 6: Commit ─────────────────────────────────────────────────────
    await session.commitTransaction();

    return res.status(201).json({
      status: 'success',
      message: `Thiết lập năm học "${newYear.yearName}" thành công!`,
      data: {
        yearId: newYear._id,
        yearName: newYear.yearName,
        gradesCreated: grades.length,
        classesCreated: insertedClasses.length,
        studentsTransferred,
        orphanStudents: orphanStudents.length > 0 ? orphanStudents : undefined,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('setupNewAcademicYearWizard error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi khi thiết lập năm học mới',
    });
  } finally {
    session.endSession();
  }
};

/**
 * GET /api/school-admin/academic-years/wizard-clone-data
 * Lấy dữ liệu cấu trúc năm học cũ nhất để "Nhân bản" vào Wizard.
 * Trả về: danh sách StaticBlock active, danh sách lớp cũ (tên + khối + sĩ số),
 * danh sách học sinh chuyển tiếp (không tốt nghiệp) từ năm học cuối.
 */
const getWizardCloneData = async (req, res) => {
  try {
    // Lấy năm học inactive mới nhất (vừa kết thúc)
    const latestInactiveYear = await AcademicYear.findOne({ status: 'inactive' })
      .sort({ endDate: -1 })
      .lean();

    // Lấy danh sách StaticBlock đang active
    const staticBlocks = await StaticBlock.find({ status: 'active' })
      .sort({ minAge: 1 })
      .lean();

    let cloneClasses = [];
    let carryOverStudents = [];

    if (latestInactiveYear) {
      // Lấy lớp của năm cũ (nhân bản tên lớp + sĩ số, KHÔNG nhân bản giáo viên)
      const oldClasses = await Classes.find({ academicYearId: latestInactiveYear._id })
        .populate('gradeId', 'gradeName staticBlockId minAge maxAge')
        .select('className gradeId maxStudents')
        .lean();

      cloneClasses = oldClasses.map(cls => ({
        className: cls.className,
        maxStudents: cls.maxStudents || 25,
        // Tên khối cũ và staticBlockId để Wizard tự động map
        gradeName: cls.gradeId?.gradeName || '',
        staticBlockId: cls.gradeId?.staticBlockId || null,
        gradeMinAge: cls.gradeId?.minAge,
        gradeMaxAge: cls.gradeId?.maxAge,
        // KHÔNG trả về teacherIds — bắt buộc gán lại
      }));

      // Lấy học sinh chuyển tiếp: active, thuộc năm học cũ, chưa tốt nghiệp
      carryOverStudents = await Student.find({
        academicYearId: latestInactiveYear._id,
        status: 'active',
      })
        .populate('classId', 'className gradeId')
        .select('_id fullName dateOfBirth gender avatar classId')
        .lean();
    }

    return res.status(200).json({
      status: 'success',
      data: {
        latestYear: latestInactiveYear
          ? { _id: latestInactiveYear._id, yearName: latestInactiveYear.yearName }
          : null,
        staticBlocks,
        cloneClasses,
        carryOverStudents,
      },
    });
  } catch (error) {
    console.error('getWizardCloneData error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy dữ liệu khởi tạo Wizard',
    });
  }
};

module.exports = {
  getCurrentAcademicYear,
  patchCurrentTimetableSeason,
  listAcademicYears,
  createAcademicYear,
  finishAcademicYear,
  getAcademicYearHistory,
  getClassesByAcademicYear,
  getStudentsByAcademicYear,
  setupNewAcademicYearWizard,
  getWizardCloneData,
};

