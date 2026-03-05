const Document = require('../models/Document');

const validateDocumentPayload = (body, isCreate = true) => {
  const errors = [];

  if (isCreate && !body.title) errors.push('Tiêu đề không được để trống');
  if (body.title && typeof body.title !== 'string') errors.push('Tiêu đề không hợp lệ');
  if (body.title && body.title.length > 200) errors.push('Tiêu đề quá dài (tối đa 200 ký tự)');

  if (body.description && typeof body.description !== 'string') {
    errors.push('Mô tả không hợp lệ');
  }
  if (body.description && body.description.length > 500000) {
    errors.push('Nội dung quá dài');
  }

  if (body.status && !['draft', 'published', 'inactive'].includes(body.status)) {
    errors.push('Trạng thái không hợp lệ');
  }

  if (body.attachmentUrl && typeof body.attachmentUrl !== 'string') {
    errors.push('URL tệp đính kèm không hợp lệ');
  }
  if (body.attachmentType && !['pdf', 'word'].includes(body.attachmentType)) {
    errors.push('Loại tệp đính kèm không hợp lệ');
  }

  if (body.category !== undefined && body.category !== '' && body.category !== null &&
      !['văn bản pháp quy', 'văn bản từ phòng'].includes(body.category)) {
    errors.push('Danh mục không hợp lệ');
  }

  return errors;
};

/**
 * GET /api/school-admin/documents
 * List all documents with pagination
 */
const listDocuments = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (status) filter.status = status;
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
      Document.find(filter)
        .populate('author', 'username fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Document.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    console.error('listDocuments error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Không tải được danh sách tài liệu',
    });
  }
};

/**
 * GET /api/school-admin/documents/:id
 * Get document detail
 */
const getDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id).populate('author', 'username fullName email');

    if (!document) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy tài liệu',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: document,
    });
  } catch (error) {
    console.error('getDocument error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi lấy chi tiết tài liệu',
    });
  }
};

/**
 * POST /api/school-admin/documents
 * Create new document (JSON body)
 */
const createDocument = async (req, res) => {
  try {
    const { title, description = '', status = 'draft', attachmentUrl, attachmentType, category } = req.body;
    const user = req.user;

    if (!user || (!user._id && !user.id)) {
      return res.status(401).json({
        status: 'error',
        message: 'Người dùng không được xác thực',
      });
    }

    const userId = user._id || user.id;

    const errors = validateDocumentPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: errors.join(', '),
      });
    }

    const newDocument = await Document.create({
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      author: userId,
      status,
      attachmentUrl: attachmentUrl || null,
      attachmentType: attachmentType || null,
      category: category || null,
    });

    await newDocument.populate('author', 'username fullName email');

    return res.status(201).json({
      status: 'success',
      message: 'Tạo tài liệu thành công',
      data: newDocument,
    });
  } catch (error) {
    console.error('createDocument error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi tạo tài liệu',
    });
  }
};

/**
 * PUT /api/school-admin/documents/:id
 * Update document (JSON body)
 */
const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, attachmentUrl, attachmentType, category } = req.body;

    const errors = validateDocumentPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: errors.join(', '),
      });
    }

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy tài liệu',
      });
    }

    if (title !== undefined) document.title = String(title).trim();
    if (typeof description === 'string') document.description = description.trim();
    if (status !== undefined) document.status = status;
    if (attachmentUrl !== undefined) document.attachmentUrl = attachmentUrl || null;
    if (attachmentType !== undefined) document.attachmentType = attachmentType || null;
    if (category !== undefined) document.category = category || null;

    await document.save();
    await document.populate('author', 'username fullName email');

    return res.status(200).json({
      status: 'success',
      message: 'Cập nhật tài liệu thành công',
      data: document,
    });
  } catch (error) {
    console.error('updateDocument error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi cập nhật tài liệu',
    });
  }
};

/**
 * DELETE /api/school-admin/documents/:id
 * Delete document
 */
const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await Document.findByIdAndDelete(id);

    if (!document) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy tài liệu',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Xóa tài liệu thành công',
    });
  } catch (error) {
    console.error('deleteDocument error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Lỗi xóa tài liệu',
    });
  }
};

/**
 * GET /api/documents/published
 * Public endpoint - Get published documents
 */
const getPublishedDocuments = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 10 } = req.query;

    const filter = { status: 'published' };
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
      Document.find(filter)
        .populate('author', 'username fullName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Document.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (error) {
    console.error('getPublishedDocuments error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Không tải được danh sách tài liệu',
    });
  }
};

/**
 * GET /api/documents/:id
 * Public endpoint - Get single published document by id
 */
const getPublishedDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findOne({ _id: id, status: 'published' })
      .populate('author', 'username fullName');

    if (!document) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy tài liệu' });
    }

    return res.status(200).json({ status: 'success', data: document });
  } catch (error) {
    console.error('getPublishedDocumentById error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi tải tài liệu' });
  }
};

module.exports = {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  getPublishedDocuments,
  getPublishedDocumentById,
};
