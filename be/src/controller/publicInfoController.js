const PublicInfo = require('../models/PublicInfo');
const { PUBLIC_INFO_CATEGORIES } = require('../models/PublicInfo');

const validatePayload = (body, isCreate = true) => {
  const errors = [];

  if (isCreate && !body.title) errors.push('Tiêu đề không được để trống');
  if (body.title && body.title.length > 200) errors.push('Tiêu đề quá dài (tối đa 200 ký tự)');

  if (isCreate && !body.category) errors.push('Danh mục không được để trống');
  if (body.category && !PUBLIC_INFO_CATEGORIES.includes(body.category)) {
    errors.push('Danh mục không hợp lệ');
  }

  if (body.description && body.description.length > 500000) errors.push('Nội dung quá dài');

  if (body.status && !['draft', 'published', 'inactive'].includes(body.status)) {
    errors.push('Trạng thái không hợp lệ');
  }
  if (body.attachmentUrl && typeof body.attachmentUrl !== 'string') {
    errors.push('URL tệp đính kèm không hợp lệ');
  }
  if (body.attachmentType && !['pdf', 'word'].includes(body.attachmentType)) {
    errors.push('Loại tệp đính kèm không hợp lệ');
  }

  return errors;
};

/** GET /api/school-admin/public-info */
const listPublicInfos = async (req, res) => {
  try {
    const { status, category, search, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
      ];
    }

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      PublicInfo.find(filter)
        .populate('author', 'username fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      PublicInfo.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

/** GET /api/school-admin/public-info/:id */
const getPublicInfo = async (req, res) => {
  try {
    const item = await PublicInfo.findById(req.params.id).populate('author', 'username fullName');
    if (!item) return res.status(404).json({ status: 'error', message: 'Không tìm thấy' });
    return res.status(200).json({ status: 'success', data: item });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

/** POST /api/school-admin/public-info */
const createPublicInfo = async (req, res) => {
  try {
    const errors = validatePayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ status: 'error', message: errors.join(', ') });
    }

    const { title, description, category, status, attachmentUrl, attachmentType } = req.body;
    const item = new PublicInfo({
      title: title.trim(),
      description: description || '',
      category,
      status: status || 'draft',
      attachmentUrl: attachmentUrl || null,
      attachmentType: attachmentType || null,
      author: req.user._id,
    });
    await item.save();
    await item.populate('author', 'username fullName');

    return res.status(201).json({ status: 'success', data: item });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

/** PUT /api/school-admin/public-info/:id */
const updatePublicInfo = async (req, res) => {
  try {
    const errors = validatePayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({ status: 'error', message: errors.join(', ') });
    }

    const item = await PublicInfo.findById(req.params.id);
    if (!item) return res.status(404).json({ status: 'error', message: 'Không tìm thấy' });

    const { title, description, category, status, attachmentUrl, attachmentType } = req.body;
    if (title !== undefined) item.title = title.trim();
    if (description !== undefined) item.description = description;
    if (category !== undefined) item.category = category;
    if (status !== undefined) item.status = status;
    if (attachmentUrl !== undefined) item.attachmentUrl = attachmentUrl;
    if (attachmentType !== undefined) item.attachmentType = attachmentType;

    await item.save();
    await item.populate('author', 'username fullName');

    return res.status(200).json({ status: 'success', data: item });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

/** DELETE /api/school-admin/public-info/:id */
const deletePublicInfo = async (req, res) => {
  try {
    const item = await PublicInfo.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ status: 'error', message: 'Không tìm thấy' });
    return res.status(200).json({ status: 'success', message: 'Đã xóa' });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

/** GET /api/public-info (public - published only) */
const getPublishedPublicInfos = async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const filter = { status: 'published' };
    if (category) filter.category = category;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      PublicInfo.find(filter)
        .populate('author', 'username fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      PublicInfo.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

/** GET /api/public-info/:id (public - published only) */
const getPublishedPublicInfoById = async (req, res) => {
  try {
    const item = await PublicInfo.findOne({ _id: req.params.id, status: 'published' })
      .populate('author', 'username fullName');
    if (!item) return res.status(404).json({ status: 'error', message: 'Không tìm thấy' });
    return res.status(200).json({ status: 'success', data: item });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = {
  listPublicInfos,
  getPublicInfo,
  createPublicInfo,
  updatePublicInfo,
  deletePublicInfo,
  getPublishedPublicInfos,
  getPublishedPublicInfoById,
};
