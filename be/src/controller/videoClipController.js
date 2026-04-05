const VideoClipItem = require('../models/VideoClipItem');

const isValidHttpUrl = (str) => {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

const listAdminVideoClips = async (req, res) => {
  try {
    const items = await VideoClipItem.find({})
      .sort({ createdAt: -1 })
      .populate('createdBy', 'fullName username');
    return res.status(200).json({ status: 'success', data: items });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message || 'Lỗi tải danh sách video' });
  }
};

const createVideoClipItem = async (req, res) => {
  try {
    const title = String(req.body?.title || '').trim();
    const thumbnailUrl = String(req.body?.thumbnailUrl || '').trim();
    const videoUrl = String(req.body?.videoUrl || '').trim();

    if (!title) return res.status(400).json({ status: 'error', message: 'Tiêu đề không được để trống' });
    if (!thumbnailUrl) return res.status(400).json({ status: 'error', message: 'Ảnh bìa không được để trống' });
    if (!videoUrl) return res.status(400).json({ status: 'error', message: 'Link video không được để trống' });
    if (!isValidHttpUrl(thumbnailUrl)) {
      return res.status(400).json({ status: 'error', message: 'URL ảnh bìa không hợp lệ' });
    }
    if (!isValidHttpUrl(videoUrl)) {
      return res.status(400).json({ status: 'error', message: 'Link video phải là URL http/https hợp lệ' });
    }

    const created = await VideoClipItem.create({
      title,
      thumbnailUrl,
      videoUrl,
      status: req.body?.status === 'inactive' ? 'inactive' : 'active',
      createdBy: req.user?._id || req.user?.id || null,
    });
    return res.status(201).json({ status: 'success', data: created });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message || 'Lỗi thêm video' });
  }
};

const deleteVideoClipItem = async (req, res) => {
  try {
    const deleted = await VideoClipItem.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ status: 'error', message: 'Không tìm thấy video' });
    return res.status(200).json({ status: 'success', message: 'Đã xóa video' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message || 'Lỗi xóa video' });
  }
};

const listPublicVideoClips = async (req, res) => {
  try {
    const items = await VideoClipItem.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .select('title thumbnailUrl videoUrl createdAt');
    return res.status(200).json({ status: 'success', data: items });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message || 'Lỗi tải thư viện video' });
  }
};

module.exports = {
  listAdminVideoClips,
  createVideoClipItem,
  deleteVideoClipItem,
  listPublicVideoClips,
};
