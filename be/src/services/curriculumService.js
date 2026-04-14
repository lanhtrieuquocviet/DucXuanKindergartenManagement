const CurriculumTopic = require('../models/CurriculumTopic');
const AcademicYear = require('../models/AcademicYear');

/** Chuẩn hóa "1/2026" -> "Tháng 1/2026" khi lưu */
function normalizeMonthQuarter(value) {
  if (value == null) return '';
  const v = String(value).trim();
  if (!v) return '';
  if (/^Tháng\s+/i.test(v)) return v;
  return `Tháng ${v}`;
}

/**
 * GET /api/school-admin/curriculum?yearId=xxx
 * Lấy danh sách chủ đề chương trình giáo dục theo năm học.
 * Nếu không có yearId thì dùng năm học đang hoạt động (current).
 */
const listCurriculumTopics = async (req, res) => {
  try {
    let yearId = req.query.yearId;

    if (!yearId) {
      const currentYear = await AcademicYear.findOne({ status: 'active' })
        .sort({ startDate: -1 })
        .select('_id')
        .lean();
      yearId = currentYear?._id;
    }

    if (!yearId) {
      return res.status(200).json({
        status: 'success',
        data: [],
        total: 0,
      });
    }

    const topics = await CurriculumTopic.find({ academicYear: yearId })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      status: 'success',
      data: topics,
      total: topics.length,
    });
  } catch (error) {
    console.error('listCurriculumTopics error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi lấy danh sách chủ đề chương trình giáo dục',
    });
  }
};

/**
 * POST /api/school-admin/curriculum
 * Tạo chủ đề mới. Body: academicYearId (optional, mặc định current), monthQuarter, topicName, mainField, mainObjectives, featuredActivities
 */
const createCurriculumTopic = async (req, res) => {
  try {
    let { academicYearId, monthQuarter, topicName, mainField, mainObjectives, featuredActivities } = req.body;

    if (!academicYearId) {
      const currentYear = await AcademicYear.findOne({ status: 'active' })
        .sort({ startDate: -1 })
        .select('_id')
        .lean();
      academicYearId = currentYear?._id;
    }

    if (!academicYearId) {
      return res.status(400).json({
        status: 'error',
        message: 'Chưa có năm học đang hoạt động. Vui lòng tạo năm học trước.',
      });
    }

    const yearExists = await AcademicYear.findById(academicYearId).select('_id').lean();
    if (!yearExists) {
      return res.status(400).json({
        status: 'error',
        message: 'Không tìm thấy năm học',
      });
    }

    const topic = await CurriculumTopic.create({
      academicYear: academicYearId,
      monthQuarter: normalizeMonthQuarter(monthQuarter),
      topicName: topicName != null ? String(topicName).trim() : '',
      mainField: mainField != null ? String(mainField).trim() : '',
      mainObjectives: mainObjectives != null ? String(mainObjectives).trim() : '',
      featuredActivities: featuredActivities != null ? String(featuredActivities).trim() : '',
    });

    return res.status(201).json({
      status: 'success',
      data: topic,
    });
  } catch (error) {
    console.error('createCurriculumTopic error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi tạo chủ đề chương trình giáo dục',
    });
  }
};

/**
 * PATCH /api/school-admin/curriculum/:id
 * Cập nhật chủ đề
 */
const updateCurriculumTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { monthQuarter, topicName, mainField, mainObjectives, featuredActivities } = req.body;

    const topic = await CurriculumTopic.findByIdAndUpdate(
      id,
      {
        ...(monthQuarter !== undefined && { monthQuarter: normalizeMonthQuarter(monthQuarter) }),
        ...(topicName !== undefined && { topicName: String(topicName).trim() }),
        ...(mainField !== undefined && { mainField: String(mainField).trim() }),
        ...(mainObjectives !== undefined && { mainObjectives: String(mainObjectives).trim() }),
        ...(featuredActivities !== undefined && { featuredActivities: String(featuredActivities).trim() }),
      },
      { new: true, runValidators: true }
    ).lean();

    if (!topic) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy chủ đề',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: topic,
    });
  } catch (error) {
    console.error('updateCurriculumTopic error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi cập nhật chủ đề',
    });
  }
};

/**
 * DELETE /api/school-admin/curriculum/:id
 * Xóa chủ đề
 */
const deleteCurriculumTopic = async (req, res) => {
  try {
    const { id } = req.params;

    const topic = await CurriculumTopic.findByIdAndDelete(id);

    if (!topic) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy chủ đề',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Đã xóa chủ đề',
    });
  } catch (error) {
    console.error('deleteCurriculumTopic error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi khi xóa chủ đề',
    });
  }
};

module.exports = {
  listCurriculumTopics,
  createCurriculumTopic,
  updateCurriculumTopic,
  deleteCurriculumTopic,
};
