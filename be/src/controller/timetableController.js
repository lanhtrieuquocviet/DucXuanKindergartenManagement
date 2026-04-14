const timetableService = require('../services/timetableService');

/**
 * GET /api/school-admin/timetable?yearId=xxx
 * Trả về danh sách hoạt động theo năm học (Mùa Hè/Mùa Đông).
 */
const listByYear = async (req, res) => {
  try {
    const { data, yearName, activeTimetableSeason } = await timetableService.listByYear(req.query?.yearId);
    return res.status(200).json({
      status: 'success',
      data,
      yearName,
      activeTimetableSeason,
    });
  } catch (error) {
    console.error('listByYear timetable activities error:', error);
    return res.status(error.statusCode || 500).json({
      status: 'error',
      message: error.message || 'Lỗi khi lấy thời gian biểu hoạt động',
    });
  }
};

/**
 * PUT /api/school-admin/timetable
 * Body:
 * - create: { academicYearId?, appliesToSeason, startTime, endTime, content }
 * - edit:   { id, academicYearId?, appliesToSeason, startTime, endTime, content }
 */
const upsert = async (req, res) => {
  try {
    const data = await timetableService.upsert({
      ...(req.body || {}),
      queryYearId: req.query?.yearId,
    });

    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    console.error('upsert timetable activities error:', error);
    return res.status(error.statusCode || 500).json({
      status: 'error',
      message: error.message || 'Lỗi khi lưu thời gian biểu hoạt động',
    });
  }
};

/**
 * DELETE /api/school-admin/timetable/:id?yearId=xxx
 * Xóa một hoạt động theo id.
 */
const remove = async (req, res) => {
  try {
    await timetableService.remove({
      id: req.params.id,
      queryYearId: req.query?.yearId,
      bodyYearId: req.body?.academicYearId,
    });
    return res.status(200).json({ status: 'success', message: 'Đã xóa hoạt động.' });
  } catch (error) {
    console.error('remove timetable activity error:', error);
    return res.status(error.statusCode || 500).json({
      status: 'error',
      message: error.message || 'Lỗi khi xóa hoạt động',
    });
  }
};

/**
 * GET /api/timetable?yearId=xxx (public)
 * Trả về toàn bộ hoạt động (cả 2 mùa) + mùa đang hiệu lực.
 */
const listPublic = async (req, res) => {
  try {
    const { data, effectiveSeason, activeTimetableSeason, yearName } = await timetableService.listPublic(req.query?.yearId);
    return res.status(200).json({
      status: 'success',
      data,
      effectiveSeason,
      activeTimetableSeason,
      yearName,
    });
  } catch (error) {
    console.error('listPublic timetable activities error:', error);
    return res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Lỗi khi lấy thời gian biểu' });
  }
};

module.exports = {
  listByYear,
  upsert,
  remove,
  listPublic,
};
