const Timetable = require('../models/Timetable');
const AcademicYear = require('../models/AcademicYear');
const Grade = require('../models/Grade');

const LEN = 6;

function normalizeRow(arr) {
  if (!Array.isArray(arr)) return Array(LEN).fill('');
  const a = arr.slice(0, LEN).map((x) => (x != null ? String(x).trim() : ''));
  while (a.length < LEN) a.push('');
  return a;
}

/**
 * GET /api/school-admin/timetable?yearId=xxx
 * Danh sách thời khóa biểu theo năm học (cho school admin).
 * Trả về { data: [ { gradeId, gradeName, sang, chieu }, ... ], gradeNames: { [gradeId]: name } }
 */
const listByYear = async (req, res) => {
  try {
    let yearId = req.query.yearId;
    if (!yearId) {
      const current = await AcademicYear.findOne({ status: 'active' })
        .sort({ startDate: -1 })
        .select('_id')
        .lean();
      yearId = current?._id;
    }
    if (!yearId) {
      return res.status(200).json({
        status: 'success',
        data: [],
        gradeNames: {},
      });
    }

    const list = await Timetable.find({ academicYear: yearId })
      .populate('gradeId', 'gradeName')
      .sort({ gradeId: 1 })
      .lean();

    const data = list.map((doc) => ({
      gradeId: doc.gradeId?._id ?? doc.gradeId,
      gradeName: doc.gradeId?.gradeName ?? '',
      sang: normalizeRow(doc.sang),
      chieu: normalizeRow(doc.chieu),
    }));
    const gradeNames = data.reduce((acc, item) => {
      if (item.gradeId) acc[item.gradeId] = item.gradeName || '';
      return acc;
    }, {});

    return res.status(200).json({
      status: 'success',
      data,
      gradeNames,
    });
  } catch (error) {
    console.error('listByYear timetable error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy thời khóa biểu',
    });
  }
};

/**
 * PUT /api/school-admin/timetable
 * Body: { academicYearId?, gradeId, sang?, chieu? }
 * Tạo hoặc cập nhật một bản ghi thời khóa biểu theo (academicYear, gradeId).
 */
const upsert = async (req, res) => {
  try {
    let { academicYearId, gradeId, sang, chieu } = req.body;
    if (!gradeId) {
      return res.status(400).json({
        status: 'error',
        message: 'Thiếu gradeId',
      });
    }
    if (!academicYearId) {
      const current = await AcademicYear.findOne({ status: 'active' })
        .sort({ startDate: -1 })
        .select('_id')
        .lean();
      academicYearId = current?._id;
    }
    if (!academicYearId) {
      return res.status(400).json({
        status: 'error',
        message: 'Chưa có năm học đang hoạt động.',
      });
    }

    const yearExists = await AcademicYear.findById(academicYearId).select('_id').lean();
    if (!yearExists) {
      return res.status(400).json({
        status: 'error',
        message: 'Năm học không tồn tại.',
      });
    }
    const gradeExists = await Grade.findById(gradeId).select('_id').lean();
    if (!gradeExists) {
      return res.status(400).json({
        status: 'error',
        message: 'Khối lớp không tồn tại.',
      });
    }

    const payload = {
      sang: normalizeRow(sang),
      chieu: normalizeRow(chieu),
    };

    const doc = await Timetable.findOneAndUpdate(
      { academicYear: academicYearId, gradeId },
      payload,
      { new: true, upsert: true, runValidators: true }
    )
      .populate('gradeId', 'gradeName')
      .lean();

    return res.status(200).json({
      status: 'success',
      data: {
        gradeId: doc.gradeId?._id ?? doc.gradeId,
        gradeName: doc.gradeId?.gradeName ?? '',
        sang: doc.sang,
        chieu: doc.chieu,
      },
    });
  } catch (error) {
    console.error('upsert timetable error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi khi lưu thời khóa biểu',
    });
  }
};

/**
 * GET /api/timetable?yearId=xxx (public, không cần auth)
 * Trả về thời khóa biểu theo năm học để hiển thị ở trang /schedule.
 */
const listPublic = async (req, res) => {
  try {
    let yearId = req.query.yearId;
    if (!yearId) {
      const current = await AcademicYear.findOne({ status: 'active' })
        .sort({ startDate: -1 })
        .select('_id')
        .lean();
      yearId = current?._id;
    }
    if (!yearId) {
      return res.status(200).json({
        status: 'success',
        data: [],
        gradeNames: {},
      });
    }

    const list = await Timetable.find({ academicYear: yearId })
      .populate('gradeId', 'gradeName')
      .sort({ gradeId: 1 })
      .lean();

    const data = list.map((doc) => ({
      gradeId: String(doc.gradeId?._id ?? doc.gradeId),
      gradeName: doc.gradeId?.gradeName ?? '',
      sang: normalizeRow(doc.sang),
      chieu: normalizeRow(doc.chieu),
    }));
    const gradeNames = data.reduce((acc, item) => {
      if (item.gradeId) acc[item.gradeId] = item.gradeName || '';
      return acc;
    }, {});

    return res.status(200).json({
      status: 'success',
      data,
      gradeNames,
    });
  } catch (error) {
    console.error('listPublic timetable error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy thời khóa biểu',
    });
  }
};

module.exports = {
  listByYear,
  upsert,
  listPublic,
};
