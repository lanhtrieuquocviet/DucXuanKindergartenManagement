const Document = require('../models/Document');
const AcademicYear = require('../models/AcademicYear');

const DOCUMENT_STATUSES = ['draft', 'published', 'inactive'];
const EDITABLE_DOCUMENT_STATUS = 'draft';
const PUBLISHABLE_DOCUMENT_STATUS = 'draft';
const ALLOWED_ATTACHMENT_TYPES = ['pdf', 'word'];

const isValidObjectId = (value) => /^[0-9a-fA-F]{24}$/.test(String(value));

const ensureDocumentIsDraft = (document, actionLabel) => {
  if (document.status !== EDITABLE_DOCUMENT_STATUS) {
    return `${actionLabel} chỉ áp dụng cho tài liệu ở trạng thái Draft`;
  }

  return null;
};

const resolveAcademicYearRef = async (academicYearId) => {
  if (academicYearId === undefined) {
    return { shouldUpdate: false, value: undefined };
  }

  if (academicYearId === null || String(academicYearId).trim() === '') {
    return { shouldUpdate: true, value: null };
  }

  if (!isValidObjectId(academicYearId)) {
    throw new Error('academicYearId không hợp lệ');
  }

  const exists = await AcademicYear.findById(academicYearId).select('_id').lean();
  if (!exists) {
    throw new Error('Không tìm thấy năm học');
  }

  return { shouldUpdate: true, value: exists._id };
};

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

  if (body.status && !DOCUMENT_STATUSES.includes(body.status)) {
    errors.push('Trạng thái không hợp lệ');
  }

  if (body.attachmentUrl && typeof body.attachmentUrl !== 'string') {
    errors.push('URL tệp đính kèm không hợp lệ');
  }
  if (body.attachmentType && !ALLOWED_ATTACHMENT_TYPES.includes(body.attachmentType)) {
    errors.push('Loại tệp đính kèm không hợp lệ');
  }

  if (body.category !== undefined && body.category !== null) {
    if (typeof body.category !== 'string') {
      errors.push('Danh mục không hợp lệ');
    } else if (body.category.trim().length === 0) {
      errors.push('Danh mục không hợp lệ');
    }
  }

  return errors;
};

/**
 * GET /api/school-admin/documents
 * List all documents with pagination
 */
const listDocuments = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10, yearId } = req.query;

    const filter = {};
    if (yearId) {
      if (!isValidObjectId(yearId)) {
        return res.status(400).json({ status: 'error', message: 'yearId không hợp lệ' });
      }
      filter.academicYear = yearId;
    }
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
        .populate('academicYear', 'yearName startDate endDate status')
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
    const {
      title,
      description = '',
      status = 'draft',
      attachmentUrl,
      attachmentType,
      category,
      academicYearId,
    } = req.body;
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

    let academicYearRef = null;
    try {
      const academicYearResolution = await resolveAcademicYearRef(academicYearId);
      if (academicYearResolution.shouldUpdate) {
        academicYearRef = academicYearResolution.value;
      }
    } catch (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    const newDocument = await Document.create({
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      author: userId,
      status,
      attachmentUrl: attachmentUrl || null,
      attachmentType: attachmentType || null,
      category: category || null,
      academicYear: academicYearRef,
    });

    await newDocument.populate('academicYear', 'yearName startDate endDate status');
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
    const {
      title,
      description,
      status,
      attachmentUrl,
      attachmentType,
      category,
      academicYearId,
    } = req.body;

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

    const draftOnlyError = ensureDocumentIsDraft(document, 'Cập nhật');
    if (draftOnlyError) {
      return res.status(400).json({
        status: 'error',
        message: draftOnlyError,
      });
    }

    let academicYearResolution;
    try {
      academicYearResolution = await resolveAcademicYearRef(academicYearId);
    } catch (error) {
      return res.status(400).json({ status: 'error', message: error.message });
    }

    if (title !== undefined) document.title = String(title).trim();
    if (typeof description === 'string') document.description = description.trim();
    if (status !== undefined) document.status = status;
    if (attachmentUrl !== undefined) document.attachmentUrl = attachmentUrl || null;
    if (attachmentType !== undefined) document.attachmentType = attachmentType || null;
    if (category !== undefined) document.category = category || null;
    if (academicYearResolution?.shouldUpdate) document.academicYear = academicYearResolution.value;

    await document.save();
    await document.populate('academicYear', 'yearName startDate endDate status');
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

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy tài liệu',
      });
    }

    const draftOnlyError = ensureDocumentIsDraft(document, 'Xóa');
    if (draftOnlyError) {
      return res.status(400).json({
        status: 'error',
        message: draftOnlyError,
      });
    }

    await document.deleteOne();

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
 * PATCH /api/school-admin/documents/:id/publish
 * Publish a draft document
 */
const publishDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy tài liệu',
      });
    }

    if (document.status !== PUBLISHABLE_DOCUMENT_STATUS) {
      return res.status(400).json({
        status: 'error',
        message: 'Chỉ có thể xuất bản tài liệu ở trạng thái Draft',
      });
    }

    document.status = 'published';
    await document.save();
    await document.populate('academicYear', 'yearName startDate endDate status');
    await document.populate('author', 'username fullName email');

    return res.status(200).json({
      status: 'success',
      message: 'Xuất bản tài liệu thành công',
      data: document,
    });
  } catch (error) {
    console.error('publishDocument error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Lỗi xuất bản tài liệu',
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
  publishDocument,
  getPublishedDocuments,
  getPublishedDocumentById,
};
