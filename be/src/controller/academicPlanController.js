const academicPlanService = require('../services/academicPlanService');

const listTopics = async (req, res) => {
  try {
    const data = await academicPlanService.listTopics({
      yearId: req.query.yearId,
      gradeId: req.query.gradeId,
    });
    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    console.error('listTopics error:', error);
    return res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Lỗi khi lấy danh sách chủ đề kế hoạch' });
  }
};

const listTopicsForTeacher = async (req, res) => {
  try {
    const data = await academicPlanService.listTopicsForTeacher({
      userId: req.user?._id,
      yearId: req.query.yearId,
    });
    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    console.error('listTopicsForTeacher error:', error);
    return res
      .status(error.statusCode || 500)
      .json({ status: 'error', message: error.message || 'Lỗi khi lấy kế hoạch học tập giáo viên' });
  }
};

const createTopic = async (req, res) => {
  try {
    const data = await academicPlanService.createTopic(req.body);
    return res.status(201).json({
      status: 'success',
      message: 'Tạo chủ đề kế hoạch thành công',
      data,
    });
  } catch (error) {
    console.error('createTopic error:', error);
    return res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Lỗi khi tạo chủ đề kế hoạch' });
  }
};

const updateTopic = async (req, res) => {
  try {
    const data = await academicPlanService.updateTopic(req.params.id, req.body || {});
    return res.status(200).json({
      status: 'success',
      message: 'Cập nhật chủ đề kế hoạch thành công',
      data,
    });
  } catch (error) {
    console.error('updateTopic error:', error);
    return res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Lỗi khi cập nhật chủ đề kế hoạch' });
  }
};

const deleteTopic = async (req, res) => {
  try {
    await academicPlanService.deleteTopic(req.params.id);
    return res.status(200).json({ status: 'success', message: 'Đã xóa chủ đề kế hoạch' });
  } catch (error) {
    console.error('deleteTopic error:', error);
    return res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Lỗi khi xóa chủ đề kế hoạch' });
  }
};

module.exports = {
  listTopics,
  listTopicsForTeacher,
  createTopic,
  updateTopic,
  deleteTopic,
};
