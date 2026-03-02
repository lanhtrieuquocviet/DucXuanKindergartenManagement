const { body, param, validationResult } = require('express-validator');
const Question = require('../models/Question');
const { createSystemLog } = require('../utils/systemLog');

const validateCreateQuestion = [
  body('title')
    .trim()
    .notEmpty().withMessage('Tiêu đề không được để trống')
    .isLength({ max: 200 }).withMessage('Tiêu đề tối đa 200 ký tự'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email không được để trống')
    .isEmail().withMessage('Email không hợp lệ')
    .isLength({ max: 150 }).withMessage('Email tối đa 150 ký tự'),

  body('phone')
    .trim()
    .notEmpty().withMessage('Số điện thoại không được để trống')
    .matches(/^[0-9+\-\s()]{6,20}$/).withMessage('Số điện thoại không hợp lệ'),

  body('address')
    .trim()
    .notEmpty().withMessage('Địa chỉ không được để trống')
    .isLength({ max: 200 }).withMessage('Địa chỉ tối đa 200 ký tự'),

  body('idNumber')
    .trim()
    .notEmpty().withMessage('Số CMND/Hộ chiếu không được để trống')
    .isLength({ max: 50 }).withMessage('Số CMND/Hộ chiếu tối đa 50 ký tự'),

  body('category')
    .trim()
    .notEmpty().withMessage('Loại phản hồi không được để trống')
    .isLength({ max: 50 }).withMessage('Loại phản hồi tối đa 50 ký tự'),

  body('content')
    .trim()
    .notEmpty().withMessage('Nội dung không được để trống')
    .isLength({ max: 2000 }).withMessage('Nội dung tối đa 2000 ký tự'),
];

const createQuestion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const {
      title,
      email,
      phone,
      address,
      idNumber,
      category,
      content,
    } = req.body;

    const question = await Question.create({
      title: title.trim(),
      email: email ? email.trim().toLowerCase() : undefined,
      phone: phone ? phone.trim() : undefined,
      address: address ? address.trim() : undefined,
      idNumber: idNumber ? idNumber.trim() : undefined,
      category: category ? category.trim() : undefined,
      content: content.trim(),
    });

    return res.status(201).json({
      status: 'success',
      message: 'Gửi câu hỏi thành công',
      data: question,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('createQuestion error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Gửi câu hỏi thất bại. Vui lòng thử lại.',
    });
  }
};

const getQuestions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      q,
      category,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (q && String(q).trim() !== '') {
      const keyword = String(q).trim();
      const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { title: regex },
        { content: regex },
        { email: regex },
      ];
    }

    const [items, total] = await Promise.all([
      Question.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Question.countDocuments(filter),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        questions: items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('getQuestions error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Không thể tải danh sách câu hỏi',
    });
  }
};

const validateCreateAnswer = [
  param('id').isMongoId().withMessage('ID câu hỏi không hợp lệ'),
  body('content')
    .trim()
    .notEmpty().withMessage('Nội dung trả lời không được để trống')
    .isLength({ max: 2000 }).withMessage('Nội dung trả lời tối đa 2000 ký tự'),
  body('authorName')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Tên người trả lời tối đa 100 ký tự'),
];

const createAnswer = async (req, res) => {
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
    const { content, authorName } = req.body;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy câu hỏi',
      });
    }

    question.answers.push({
      content: content.trim(),
      authorName: authorName ? authorName.trim() : undefined,
    });

    await question.save();

    // Ghi nhật ký khi SchoolAdmin trả lời câu hỏi
    try {
      await createSystemLog({
        req,
        action: 'Trả lời câu hỏi Hỏi đáp',
        detail: `Trả lời câu hỏi: ${question.title || question._id}`,
      });
    } catch (logError) {
      // eslint-disable-next-line no-console
      console.error('Failed to write system log for createAnswer:', logError);
    }

    return res.status(201).json({
      status: 'success',
      message: 'Đã thêm câu trả lời',
      data: question,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('createAnswer error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Gửi câu trả lời thất bại. Vui lòng thử lại.',
    });
  }
};

// Validate khi cập nhật câu trả lời theo index
const validateUpdateAnswer = [
  param('id').isMongoId().withMessage('ID câu hỏi không hợp lệ'),
  param('answerIndex')
    .isInt({ min: 0 })
    .withMessage('Chỉ số câu trả lời không hợp lệ'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Nội dung trả lời không được để trống')
    .isLength({ max: 2000 })
    .withMessage('Nội dung trả lời tối đa 2000 ký tự'),
  body('authorName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Tên người trả lời tối đa 100 ký tự'),
];

const updateAnswer = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      });
    }

    const { id, answerIndex } = req.params;
    const { content, authorName } = req.body;
    const index = Number(answerIndex);

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy câu hỏi',
      });
    }

    if (!Array.isArray(question.answers) || index < 0 || index >= question.answers.length) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy câu trả lời để cập nhật',
      });
    }

    question.answers[index].content = content.trim();
    if (authorName !== undefined) {
      question.answers[index].authorName = authorName.trim();
    }

    // Đánh dấu trường answers đã thay đổi
    question.markModified('answers');
    await question.save();

    try {
      await createSystemLog({
        req,
        action: 'Sửa câu trả lời Hỏi đáp',
        detail: `Sửa câu trả lời cho câu hỏi: ${question.title || question._id}`,
      });
    } catch (logError) {
      // eslint-disable-next-line no-console
      console.error('Failed to write system log for updateAnswer:', logError);
    }

    return res.status(200).json({
      status: 'success',
      message: 'Cập nhật câu trả lời thành công',
      data: question,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('updateAnswer error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Cập nhật câu trả lời thất bại. Vui lòng thử lại.',
    });
  }
};

const validateQuestionId = [
  param('id').isMongoId().withMessage('ID câu hỏi không hợp lệ'),
];

const updateQuestion = async (req, res) => {
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
    const {
      title,
      email,
      phone,
      address,
      idNumber,
      category,
      content,
    } = req.body;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy câu hỏi',
      });
    }

    question.title = title.trim();
    question.email = email ? email.trim().toLowerCase() : undefined;
    question.phone = phone ? phone.trim() : undefined;
    question.address = address ? address.trim() : undefined;
    question.idNumber = idNumber ? idNumber.trim() : undefined;
    question.category = category ? category.trim() : undefined;
    question.content = content.trim();

    await question.save();

    return res.status(200).json({
      status: 'success',
      message: 'Cập nhật câu hỏi thành công',
      data: question,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('updateQuestion error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Cập nhật câu hỏi thất bại. Vui lòng thử lại.',
    });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Question.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Không tìm thấy câu hỏi',
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Đã xóa câu hỏi',
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('deleteQuestion error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Xóa câu hỏi thất bại. Vui lòng thử lại.',
    });
  }
};

module.exports = {
  validateCreateQuestion,
  createQuestion,
  getQuestions,
  validateCreateAnswer,
  createAnswer,
  validateUpdateAnswer,
  updateAnswer,
  validateQuestionId,
  updateQuestion,
  deleteQuestion,
};

