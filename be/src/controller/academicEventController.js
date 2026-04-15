const academicEventService = require('../services/academicEventService');

const getEventPlan = async (req, res) => {
  try {
    const data = await academicEventService.getEventPlan(req.query.yearId);
    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    console.error('getEventPlan error:', error);
    return res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Lỗi khi lấy kế hoạch sự kiện' });
  }
};

const upsertEventPlan = async (req, res) => {
  try {
    const data = await academicEventService.upsertEventPlan({
      academicYearId: req.body?.academicYearId,
      queryYearId: req.query.yearId,
      months: req.body?.months,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Lưu kế hoạch sự kiện thành công',
      data,
    });
  } catch (error) {
    console.error('upsertEventPlan error:', error);
    return res.status(error.statusCode || 500).json({
      status: 'error',
      message: error.message || 'Lỗi khi lưu kế hoạch sự kiện',
    });
  }
};

module.exports = {
  getEventPlan,
  upsertEventPlan,
};

