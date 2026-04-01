const ImageLibraryItem = require('../models/ImageLibraryItem');

const listAdminImageLibrary = async (req, res) => {
  try {
    const items = await ImageLibraryItem.find({})
      .sort({ createdAt: -1 })
      .populate('createdBy', 'fullName username');
    return res.status(200).json({ status: 'success', data: items });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message || 'Lỗi tải thư viện ảnh' });
  }
};

const createImageLibraryItem = async (req, res) => {
  try {
    const title = String(req.body?.title || '').trim();
    const imageUrl = String(req.body?.imageUrl || '').trim();
    if (!title) return res.status(400).json({ status: 'error', message: 'Tiêu đề không được để trống' });
    if (!imageUrl) return res.status(400).json({ status: 'error', message: 'Ảnh không được để trống' });

    const created = await ImageLibraryItem.create({
      title,
      imageUrl,
      status: req.body?.status === 'inactive' ? 'inactive' : 'active',
      createdBy: req.user?._id || req.user?.id || null,
    });
    return res.status(201).json({ status: 'success', data: created });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message || 'Lỗi thêm ảnh' });
  }
};

const deleteImageLibraryItem = async (req, res) => {
  try {
    const deleted = await ImageLibraryItem.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ status: 'error', message: 'Không tìm thấy ảnh' });
    return res.status(200).json({ status: 'success', message: 'Đã xóa ảnh' });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message || 'Lỗi xóa ảnh' });
  }
};

const listPublicImageLibrary = async (req, res) => {
  try {
    const items = await ImageLibraryItem.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .select('title imageUrl createdAt');
    return res.status(200).json({ status: 'success', data: items });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message || 'Lỗi tải thư viện ảnh' });
  }
};

module.exports = {
  listAdminImageLibrary,
  createImageLibraryItem,
  deleteImageLibraryItem,
  listPublicImageLibrary,
};
