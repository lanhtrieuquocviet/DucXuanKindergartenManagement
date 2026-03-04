const express = require('express');
const multer = require('multer');
const { authenticate, authorizeRoles, authorizePermissions } = require('../middleware/auth');
const contactController = require('../controller/contactController');
const {
  getAttendanceOverview,
  getClassAttendanceDetail,
  getStudentAttendanceDetail,
  getStudentAttendanceHistory,
} = require('../controller/attendanceController');
const blogController = require('../controller/blogController');
const blogCategoryController = require('../controller/blogCategoryController');
const qaController = require('../controller/qaController');
const documentController = require('../controller/documentController');
const publicInfoController = require('../controller/publicInfoController');

const router = express.Router();

// Multer configuration for PDF files
const pdfUploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /^application\/pdf$/i.test(file.mimetype);
    if (allowed) cb(null, true);
    else cb(new Error('Chỉ chấp nhận file PDF.'));
  },
});

// Middleware xử lý lỗi upload
function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({
        status: 'error',
        message: 'File quá lớn (tối đa 10MB)',
      });
    }
    return res.status(400).json({
      status: 'error',
      message: `Lỗi upload: ${err.message}`,
    });
  }
  if (err) {
    return res.status(400).json({
      status: 'error',
      message: err.message || 'Lỗi upload file',
    });
  }
  next();
}

// Chỉ SchoolAdmin mới truy cập được
router.get('/dashboard', authenticate, authorizeRoles('SchoolAdmin'), (req, res) => {
  return res.status(200).json({
    status: 'success',
    message: 'Trang SchoolAdmin dashboard',
    data: {
      user: req.user,
    },
  });
});

// Liên hệ: danh sách + phản hồi
router.get(
  '/contacts',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  contactController.listContacts
);
router.patch(
  '/contacts/:id/reply',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  contactController.validateReplyContact,
  contactController.replyContact
);
router.patch(
  '/contacts/:id/clear-reply',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  contactController.clearReplyContact
);
router.post(
  '/contacts/:id/resend-email',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  contactController.resendReplyEmail
);

// Tổng quan điểm danh các lớp
router.get(
  '/attendance/overview',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  getAttendanceOverview
);

// Blog CRUD cho SchoolAdmin
router.get(
  '/blogs',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  blogController.listBlogs
);
router.get(
  '/blogs/:id',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  blogController.getBlog
);
router.post(
  '/blogs',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  blogController.createBlog
);
router.put(
  '/blogs/:id',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  blogController.updateBlog
);
router.delete(
  '/blogs/:id',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  blogController.deleteBlog
);

// Blog Category CRUD — yêu cầu permission MANAGE_BLOG_CATEGORY
router.get(
  '/blog-categories',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  authorizePermissions('MANAGE_BLOG_CATEGORY'),
  blogCategoryController.listBlogCategories
);
router.post(
  '/blog-categories',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  authorizePermissions('MANAGE_BLOG_CATEGORY'),
  blogCategoryController.createBlogCategory
);
router.put(
  '/blog-categories/:id',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  authorizePermissions('MANAGE_BLOG_CATEGORY'),
  blogCategoryController.updateBlogCategory
);
router.delete(
  '/blog-categories/:id',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  authorizePermissions('MANAGE_BLOG_CATEGORY'),
  blogCategoryController.deleteBlogCategory
);

// Q&A cho SchoolAdmin
router.get(
  '/qa/questions',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  qaController.getQuestions
);
router.patch(
  '/qa/questions/:id',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  qaController.validateQuestionId,
  qaController.validateCreateQuestion,
  qaController.updateQuestion
);
router.delete(
  '/qa/questions/:id',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  qaController.validateQuestionId,
  qaController.deleteQuestion
);
router.post(
  '/qa/questions/:id/answers',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  qaController.validateCreateAnswer,
  qaController.createAnswer
);
router.patch(
  '/qa/questions/:id/answers/:answerIndex',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  qaController.validateUpdateAnswer,
  qaController.updateAnswer
);

// Chi tiết điểm danh của một lớp
router.get(
  '/classes/:classId/attendance',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  getClassAttendanceDetail
);

// Chi tiết điểm danh của một học sinh
router.get(
  '/students/:studentId/attendance',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  getStudentAttendanceDetail
);

// Lịch sử điểm danh của một học sinh
router.get(
  '/students/:studentId/attendance/history',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  getStudentAttendanceHistory
);

// Document Management CRUD cho SchoolAdmin
router.get(
  '/documents',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  documentController.listDocuments
);
router.get(
  '/documents/:id',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  documentController.getDocument
);
router.post(
  '/documents',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  documentController.createDocument
);
router.put(
  '/documents/:id',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  documentController.updateDocument
);
router.delete(
  '/documents/:id',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  documentController.deleteDocument
);

// Public Info CRUD cho SchoolAdmin
router.get('/public-info', authenticate, authorizeRoles('SchoolAdmin'), publicInfoController.listPublicInfos);
router.get('/public-info/:id', authenticate, authorizeRoles('SchoolAdmin'), publicInfoController.getPublicInfo);
router.post('/public-info', authenticate, authorizeRoles('SchoolAdmin'), publicInfoController.createPublicInfo);
router.put('/public-info/:id', authenticate, authorizeRoles('SchoolAdmin'), publicInfoController.updatePublicInfo);
router.delete('/public-info/:id', authenticate, authorizeRoles('SchoolAdmin'), publicInfoController.deletePublicInfo);

module.exports = router;

