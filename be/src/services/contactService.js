const { body, param, validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const { sendContactReplyEmail } = require('../utils/email');

/**
 * Validation rules cho gửi liên hệ (public)
 */
const validateSubmitContact = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Họ và tên không được để trống')
    .isLength({ max: 40 })
    .withMessage('Họ và tên tối đa 40 ký tự'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Địa chỉ tối đa 100 ký tự'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Số điện thoại không được để trống')
    .matches(/^[0-9+\-\s()]{10}$/)
    .withMessage('Số điện thoại không hợp lệ (10 ký tự số)'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Thư điện tử không được để trống')
    .isEmail()
    .withMessage('Thư điện tử không đúng định dạng')
    .normalizeEmail(),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Nội dung liên hệ không được để trống')
    .isLength({ max: 2000 })
    .withMessage('Nội dung tối đa 2000 ký tự'),
];

/**
 * POST /api/contact - Gửi liên hệ (public)
 */
const submitContact = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { fullName, address, phone, email, content } = req.body;
    const contact = await Contact.create({
      fullName: fullName.trim(),
      address: (address || '').trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      content: content.trim(),
    });

    return res.status(201).json({
      status: 'success',
      message: 'Gửi liên hệ thành công. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.',
      data: { id: contact._id },
    });
  } catch (err) {
    console.error('submitContact error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Gửi liên hệ thất bại. Vui lòng thử lại sau.',
    });
  }
};

/**
 * Validation cho phản hồi liên hệ
 */
const validateReplyContact = [
  param('id').isMongoId().withMessage('ID liên hệ không hợp lệ'),
  body('reply')
    .trim()
    .notEmpty()
    .withMessage('Nội dung phản hồi không được để trống')
    .isLength({ max: 2000 })
    .withMessage('Nội dung phản hồi tối đa 2000 ký tự'),
];

/**
 * GET /api/school-admin/contacts - Danh sách liên hệ (SchoolAdmin)
 */
const listContacts = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status && ['pending', 'replied'].includes(status)) {
      filter.status = status;
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(50, Math.max(1, parseInt(limit, 10)));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));

    const [contacts, total] = await Promise.all([
      Contact.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('repliedBy', 'fullName username')
        .lean(),
      Contact.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        contacts,
        pagination: {
          page: Math.floor(skip / limitNum) + 1,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    console.error('listContacts error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Không thể tải danh sách liên hệ',
    });
  }
};

/**
 * PATCH /api/school-admin/contacts/:id/reply - Phản hồi liên hệ (SchoolAdmin)
 */
const replyContact = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { id } = req.params;
    const { reply } = req.body;
    const contact = await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy liên hệ',
      });
    }

    if (contact.status === 'replied') {
      return res.status(400).json({
        status: 'error',
        message: 'Liên hệ này đã được phản hồi',
      });
    }

    contact.reply = reply.trim();
    contact.repliedAt = new Date();
    contact.repliedBy = req.user.id;
    contact.status = 'replied';
    await contact.save();

    // Gửi email phản hồi tới người đã gửi liên hệ
    try {
      await sendContactReplyEmail(
        contact.email,
        contact.fullName,
        contact.reply
      );
    } catch (emailErr) {
      console.error('replyContact: send email failed', emailErr);
      // Vẫn trả về success vì phản hồi đã lưu; email có thể gửi lại hoặc báo admin
    }

    return res.status(200).json({
      status: 'success',
      message: 'Phản hồi đã được gửi',
      data: {
        id: contact._id,
        reply: contact.reply,
        repliedAt: contact.repliedAt,
      },
    });
  } catch (err) {
    console.error('replyContact error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Phản hồi thất bại. Vui lòng thử lại.',
    });
  }
};

/**
 * PATCH /api/school-admin/contacts/:id/clear-reply - Xóa phản hồi (SchoolAdmin)
 */
const clearReplyContact = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy liên hệ',
      });
    }

    if (contact.status !== 'replied') {
      return res.status(400).json({
        status: 'error',
        message: 'Liên hệ này chưa có phản hồi để xóa',
      });
    }

    contact.reply = null;
    contact.repliedAt = null;
    contact.repliedBy = null;
    contact.status = 'pending';
    await contact.save();

    return res.status(200).json({
      status: 'success',
      message: 'Đã xóa phản hồi',
      data: { id: contact._id },
    });
  } catch (err) {
    console.error('clearReplyContact error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Xóa phản hồi thất bại.',
    });
  }
};

/**
 * POST /api/school-admin/contacts/:id/resend-email - Gửi lại email phản hồi (SchoolAdmin)
 */
const resendReplyEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findById(id).lean();

    if (!contact) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy liên hệ',
      });
    }

    if (contact.status !== 'replied' || !contact.reply) {
      return res.status(400).json({
        status: 'error',
        message: 'Liên hệ chưa có phản hồi để gửi email',
      });
    }

    await sendContactReplyEmail(
      contact.email,
      contact.fullName,
      contact.reply
    );

    return res.status(200).json({
      status: 'success',
      message: 'Đã gửi lại email phản hồi tới ' + contact.email,
    });
  } catch (err) {
    console.error('resendReplyEmail error:', err);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'Gửi lại email thất bại. Kiểm tra cấu hình EMAIL_* trong .env',
    });
  }
};

module.exports = {
  validateSubmitContact,
  submitContact,
  listContacts,
  validateReplyContact,
  replyContact,
  clearReplyContact,
  resendReplyEmail,
};
