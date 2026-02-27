const Document = require('../models/Document');
const cloudinary = require('cloudinary').v2;

cloudinary.config();

const DOCUMENT_FOLDER = process.env.CLOUDINARY_DOCUMENT_FOLDER || 'documents';

const validateDocumentPayload = (body, isCreate = true) => {
  const errors = [];

  if (isCreate && !body.title) errors.push('Tiêu đề không được để trống');
  if (body.title && typeof body.title !== 'string') errors.push('Tiêu đề không hợp lệ');
  if (body.title && body.title.length > 200) errors.push('Tiêu đề quá dài (tối đa 200 ký tự)');

  if (body.description && typeof body.description !== 'string') {
    errors.push('Mô tả không hợp lệ');
  }
  if (body.description && body.description.length > 5000) {
    errors.push('Mô tả quá dài (tối đa 5000 ký tự)');
  }

  if (body.status && !['draft', 'published', 'inactive'].includes(body.status)) {
    errors.push('Trạng thái không hợp lệ');
  }

  return errors;
};

/**
 * Generate preview images from PDF using Cloudinary transformations
 * Cloudinary automatically extracts pages from PDFs
 */
const generatePdfPreviewImages = async (pdfUrl, pageCount = 3) => {
  try {
    const imageUrls = [];

    // Generate preview images from PDF using Cloudinary transformations
    // Each page is extracted and converted to a format
    for (let page = 1; page <= pageCount; page++) {
      // Use Cloudinary's fetch API to get specific pages from PDF
      // page parameter converts PDF to images - one image per page
      const imageUrl = cloudinary.url(pdfUrl.split('/').pop(), {
        fetch_format: 'png',
        quality: 'auto',
        page: page,
        transformation: [
          { quality: 85, fetch_format: 'auto' },
        ],
      });

      imageUrls.push(imageUrl);
    }

    return imageUrls;
  } catch (error) {
    console.error('PDF preview generation error:', error);
    // Return empty array if preview generation fails
    // The PDF URL will still be available
    return [];
  }
};

/**
 * Upload PDF file to Cloudinary
 */
const uploadPdfToCloudinary = async (pdfBuffer) => {
  try {
    const dataUri = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: DOCUMENT_FOLDER,
      resource_type: 'raw',
      public_id: `pdf_${Date.now()}`,
    });

    return result.secure_url;
  } catch (error) {
    console.error('PDF upload error:', error);
    throw new Error('Lỗi tải lên file PDF: ' + error.message);
  }
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
 * Create new document with PDF upload
 */
const createDocument = async (req, res) => {
  try {
    const { title, description = '', status = 'draft' } = req.body;
    const { user } = req;

    // Validate payload
    const errors = validateDocumentPayload(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Dữ liệu không hợp lệ',
        errors,
      });
    }

    // Check if PDF file exists
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        status: 'error',
        message: 'Vui lòng chọn file PDF',
      });
    }

    // Validate PDF file type
    if (!req.file.mimetype.includes('pdf')) {
      return res.status(400).json({
        status: 'error',
        message: 'Chỉ chấp nhận file PDF',
      });
    }

    // Check file size (max 10MB)
    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({
        status: 'error',
        message: 'File quá lớn (tối đa 10MB)',
      });
    }

    // Check Cloudinary config
    const config = cloudinary.config();
    if (!config.api_key || !config.api_secret || !config.cloud_name) {
      return res.status(500).json({
        status: 'error',
        message: 'Cloudinary chưa được cấu hình',
      });
    }

    // Upload PDF file to Cloudinary
    const pdfUrl = await uploadPdfToCloudinary(req.file.buffer);

    // Generate preview images from the uploaded PDF
    // Cloudinary can extract pages and convert them to images
    const imageUrls = await generatePdfPreviewImages(pdfUrl, 5);

    // Create document record
    const newDocument = new Document({
      title,
      description,
      author: user._id,
      images: imageUrls,
      pdfUrl,
      status,
    });

    await newDocument.save();

    // Populate author info before returning
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
 * Update document
 */
const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    // Validate payload
    const errors = validateDocumentPayload(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Dữ liệu không hợp lệ',
        errors,
      });
    }

    // Find and update document
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;

    // Handle PDF file update (optional)
    if (req.file && req.file.buffer) {
      if (!req.file.mimetype.includes('pdf')) {
        return res.status(400).json({
          status: 'error',
          message: 'Chỉ chấp nhận file PDF',
        });
      }

      if (req.file.size > 10 * 1024 * 1024) {
        return res.status(400).json({
          status: 'error',
          message: 'File quá lớn (tối đa 10MB)',
        });
      }

      // Upload new PDF
      const pdfUrl = await uploadPdfToCloudinary(req.file.buffer);
      updateData.pdfUrl = pdfUrl;

      // Generate preview images from the new PDF
      const imageUrls = await generatePdfPreviewImages(pdfUrl, 5);
      updateData.images = imageUrls;
    }

    const document = await Document.findByIdAndUpdate(id, updateData, { new: true }).populate(
      'author',
      'username fullName email'
    );

    if (!document) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy tài liệu',
      });
    }

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
    const { search, page = 1, limit = 10 } = req.query;

    const filter = { status: 'published' };
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

module.exports = {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  getPublishedDocuments,
};
