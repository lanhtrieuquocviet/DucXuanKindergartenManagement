const AcademicYear = require('../models/AcademicYear');
const Classes = require('../models/Classes');
const Student = require('../models/Student');

/**
 * Tự động kết thúc năm học đã quá hạn endDate.
 * Quy ước: chỉ tự kết thúc khi đã qua ngày kết thúc (tức từ 00:00 ngày hôm sau).
 */
const autoFinishExpiredAcademicYears = async () => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  await AcademicYear.updateMany(
    {
      status: 'active',
      endDate: { $lt: startOfToday },
    },
    { $set: { status: 'inactive' } },
  );
};

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

    return res.status(201).json({
      status: 'success',
      message: 'Tạo năm học mới thành công',
      data: newYear,
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

    year.status = 'inactive';
    await year.save();

    return res.status(200).json({
      status: 'success',
      message: 'Kết thúc năm học thành công',
      data: year,
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

module.exports = {
  getCurrentAcademicYear,
  listAcademicYears,
  createAcademicYear,
  finishAcademicYear,
  getAcademicYearHistory,
  getClassesByAcademicYear,
};

