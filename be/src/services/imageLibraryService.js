const ImageLibraryItem = require('../models/ImageLibraryItem');

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeItem = (item) => {
  const imageUrls = Array.isArray(item.imageUrls) ? item.imageUrls.filter(Boolean) : [];
  if (imageUrls.length > 0) return { ...item, imageUrls, imageUrl: imageUrls[0] };
  if (item.imageUrl) return { ...item, imageUrls: [item.imageUrl] };
  return { ...item, imageUrls: [], imageUrl: null };
};

const listAdminImageLibrary = async (req, res) => {
  try {
    const { search } = req.query || {};
    const q = String(search || '').trim();
    let filter = {};
    if (q) {
      const escaped = escapeRegex(q);
      filter = {
        $or: [
          { title: { $regex: escaped, $options: 'i' } },
          {
            $expr: {
              $regexMatch: {
                input: {
                  $concat: [
                    { $dateToString: { format: '%d/%m/%Y', date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } },
                    ' ',
                    { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Ho_Chi_Minh' } },
                  ],
                },
                regex: escaped,
                options: 'i',
              },
            },
          },
        ],
      };
    }

    const pageRaw = parseInt(req.query?.page, 10);
    const limitRaw = parseInt(req.query?.limit, 10);
    const pageNum = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const limitNum = Math.min(50, Math.max(1, Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 12));

    const total = await ImageLibraryItem.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum) || 1;
    const safePage = Math.min(pageNum, totalPages);
    const skip = (safePage - 1) * limitNum;

    const items = await ImageLibraryItem.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy', 'fullName username');
    const normalized = items.map((doc) => normalizeItem(doc.toObject()));
    return res.status(200).json({
      status: 'success',
      data: {
        items: normalized,
        pagination: {
          page: safePage,
          limit: limitNum,
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message || 'Lỗi tải thư viện ảnh' });
  }
};

const createImageLibraryItem = async (req, res) => {
  try {
    const title = String(req.body?.title || '').trim();
    const imageUrl = String(req.body?.imageUrl || '').trim();
    const imageUrls = Array.isArray(req.body?.imageUrls)
      ? req.body.imageUrls.map((url) => String(url || '').trim()).filter(Boolean)
      : [];
    if (!title) return res.status(400).json({ status: 'error', message: 'Tiêu đề không được để trống' });
    if (imageUrls.length === 0 && !imageUrl) {
      return res.status(400).json({ status: 'error', message: 'Ảnh không được để trống' });
    }

    const finalImageUrls = imageUrls.length > 0 ? imageUrls : [imageUrl];

    const created = await ImageLibraryItem.create({
      title,
      imageUrl: finalImageUrls[0],
      imageUrls: finalImageUrls,
      status: req.body?.status === 'inactive' ? 'inactive' : 'active',
      createdBy: req.user?._id || req.user?.id || null,
    });
    return res.status(201).json({ status: 'success', data: normalizeItem(created.toObject()) });
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

/** PATCH body: { status: 'active' | 'inactive' } — ẩn khỏi thư viện công khai khi inactive */
const updateImageLibraryItem = async (req, res) => {
  try {
    const { status } = req.body || {};
    if (status !== 'active' && status !== 'inactive') {
      return res.status(400).json({ status: 'error', message: 'Trạng thái phải là active hoặc inactive' });
    }
    const doc = await ImageLibraryItem.findById(req.params.id);
    if (!doc) return res.status(404).json({ status: 'error', message: 'Không tìm thấy album ảnh' });
    doc.status = status;
    await doc.save();
    return res.status(200).json({ status: 'success', data: normalizeItem(doc.toObject()) });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message || 'Lỗi cập nhật thư viện ảnh' });
  }
};

const listPublicImageLibrary = async (req, res) => {
  try {
    const items = await ImageLibraryItem.find({ status: 'active' })
      .sort({ createdAt: -1 })
      .select('title imageUrl imageUrls createdAt');
    const normalized = items.map((doc) => normalizeItem(doc.toObject()));
    return res.status(200).json({ status: 'success', data: normalized });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message || 'Lỗi tải thư viện ảnh' });
  }
};

module.exports = {
  listAdminImageLibrary,
  createImageLibraryItem,
  updateImageLibraryItem,
  deleteImageLibraryItem,
  listPublicImageLibrary,
};
