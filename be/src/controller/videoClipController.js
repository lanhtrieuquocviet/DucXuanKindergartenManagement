const videoClipService = require('../services/videoClipService');

const listAdminVideoClips = async (req, res) => {
  try {
    const items = await videoClipService.listAdminVideoClips();
    return res.status(200).json({ status: 'success', data: items });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Lỗi tải danh sách video' });
  }
};

const createVideoClipItem = async (req, res) => {
  try {
    const created = await videoClipService.createVideoClipItem(req.body, req.user);
    return res.status(201).json({ status: 'success', data: created });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Lỗi thêm video' });
  }
};

const deleteVideoClipItem = async (req, res) => {
  try {
    await videoClipService.deleteVideoClipItem(req.params.id);
    return res.status(200).json({ status: 'success', message: 'Đã xóa video' });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Lỗi xóa video' });
  }
};

const listPublicVideoClips = async (req, res) => {
  try {
    const items = await videoClipService.listPublicVideoClips();
    return res.status(200).json({ status: 'success', data: items });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ status: 'error', message: error.message || 'Lỗi tải thư viện video' });
  }
};

module.exports = {
  listAdminVideoClips,
  createVideoClipItem,
  deleteVideoClipItem,
  listPublicVideoClips,
};
