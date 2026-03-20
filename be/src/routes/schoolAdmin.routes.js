const express = require('express');
const multer = require('multer');
const { authenticate, authorizeRoles, authorizePermissions } = require('../middleware/auth');
const contactController = require('../controller/contactController');
const User = require('../models/User');
const Role = require('../models/Role');
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
const academicYearController = require('../controller/academicYearController');
const curriculumController = require('../controller/curriculumController');
const timetableController = require('../controller/timetableController');

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

/**
 * @openapi
 * /api/school-admin/dashboard:
 *   get:
 *     summary: Trang Dashboard dành cho SchoolAdmin
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin dashboard
 */
router.get('/dashboard', authenticate, authorizeRoles('SchoolAdmin'), (req, res) => {
  return res.status(200).json({
    status: 'success',
    message: 'Trang SchoolAdmin dashboard',
    data: {
      user: req.user,
    },
  });
});

/**
 * @openapi
 * /api/school-admin/contacts:
 *   get:
 *     summary: Lấy danh sách liên hệ (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách liên hệ
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Contact'
 */
router.get(
  '/contacts',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  contactController.listContacts
);

/**
 * @openapi
 * /api/school-admin/contacts/{id}/reply:
 *   patch:
 *     summary: Phản hồi liên hệ (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               replyContent:
 *                 type: string
 *     responses:
 *       200:
 *         description: Phản hồi thành công
 */
router.patch(
  '/contacts/:id/reply',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  contactController.validateReplyContact,
  contactController.replyContact
);

/**
 * @openapi
 * /api/school-admin/contacts/{id}/clear-reply:
 *   patch:
 *     summary: Xóa phản hồi liên hệ (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa phản hồi thành công
 */
router.patch(
  '/contacts/:id/clear-reply',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  contactController.clearReplyContact
);

/**
 * @openapi
 * /api/school-admin/contacts/{id}/resend-email:
 *   post:
 *     summary: Gửi lại email phản hồi (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Gửi thành công
 */
router.post(
  '/contacts/:id/resend-email',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  contactController.resendReplyEmail
);

/**
 * @openapi
 * /api/school-admin/attendance/overview:
 *   get:
 *     summary: Tổng quan điểm danh các lớp (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dữ liệu tổng quan
 */
router.get(
  '/attendance/overview',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  getAttendanceOverview
);

/**
 * @openapi
 * /api/school-admin/blogs:
 *   get:
 *     summary: Lấy danh sách blog (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách blog
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Blog'
 */
router.get(
  '/blogs',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  blogController.listBlogs
);

/**
 * @openapi
 * /api/school-admin/blogs/{id}:
 *   get:
 *     summary: Lấy chi tiết blog (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết blog
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Blog'
 */
router.get(
  '/blogs/:id',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  blogController.getBlog
);

/**
 * @openapi
 * /api/school-admin/blogs:
 *   post:
 *     summary: Tạo blog mới (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Blog'
 *     responses:
 *       201:
 *         description: Tạo mới thành công
 */
router.post(
  '/blogs',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  blogController.createBlog
);

/**
 * @openapi
 * /api/school-admin/blogs/{id}:
 *   put:
 *     summary: Cập nhật blog (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Blog'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put(
  '/blogs/:id',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  blogController.updateBlog
);

/**
 * @openapi
 * /api/school-admin/blogs/{id}:
 *   delete:
 *     summary: Xóa blog (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete(
  '/blogs/:id',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  blogController.deleteBlog
);

/**
 * @openapi
 * /api/school-admin/blog-categories:
 *   get:
 *     summary: Lấy danh sách danh mục blog (Chỉ SchoolAdmin, Yêu cầu MANAGE_BLOG_CATEGORY)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách danh mục
 */
router.get(
  '/blog-categories',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  authorizePermissions('MANAGE_BLOG_CATEGORY'),
  blogCategoryController.listBlogCategories
);

/**
 * @openapi
 * /api/school-admin/blog-categories:
 *   post:
 *     summary: Tạo danh mục blog mới (Chỉ SchoolAdmin, Yêu cầu MANAGE_BLOG_CATEGORY)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BlogCategory'
 *     responses:
 *       201:
 *         description: Tạo mới thành công
 */
router.post(
  '/blog-categories',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  authorizePermissions('MANAGE_BLOG_CATEGORY'),
  blogCategoryController.createBlogCategory
);

/**
 * @openapi
 * /api/school-admin/blog-categories/{id}:
 *   put:
 *     summary: Cập nhật danh mục blog (Chỉ SchoolAdmin, Yêu cầu MANAGE_BLOG_CATEGORY)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BlogCategory'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put(
  '/blog-categories/:id',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  authorizePermissions('MANAGE_BLOG_CATEGORY'),
  blogCategoryController.updateBlogCategory
);

/**
 * @openapi
 * /api/school-admin/blog-categories/{id}:
 *   delete:
 *     summary: Xóa danh mục blog (Chỉ SchoolAdmin, Yêu cầu MANAGE_BLOG_CATEGORY)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete(
  '/blog-categories/:id',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  authorizePermissions('MANAGE_BLOG_CATEGORY'),
  blogCategoryController.deleteBlogCategory
);

/**
 * @openapi
 * /api/school-admin/qa/questions:
 *   get:
 *     summary: Lấy danh sách câu hỏi Q&A (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách câu hỏi
 */
router.get(
  '/qa/questions',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  qaController.getQuestions
);

/**
 * @openapi
 * /api/school-admin/qa/questions/{id}:
 *   patch:
 *     summary: Cập nhật câu hỏi Q&A (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Question'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch(
  '/qa/questions/:id',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  qaController.validateQuestionId,
  qaController.validateCreateQuestion,
  qaController.updateQuestion
);

/**
 * @openapi
 * /api/school-admin/qa/questions/{id}:
 *   delete:
 *     summary: Xóa câu hỏi Q&A (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete(
  '/qa/questions/:id',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  qaController.validateQuestionId,
  qaController.deleteQuestion
);

/**
 * @openapi
 * /api/school-admin/qa/questions/{id}/answers:
 *   post:
 *     summary: Trả lời câu hỏi Q&A (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               authorName: { type: 'string' }
 *               content: { type: 'string' }
 *     responses:
 *       201:
 *         description: Trả lời thành công
 */
router.post(
  '/qa/questions/:id/answers',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  qaController.validateCreateAnswer,
  qaController.createAnswer
);

/**
 * @openapi
 * /api/school-admin/qa/questions/{id}/answers/{answerIndex}:
 *   patch:
 *     summary: Cập nhật câu trả lời Q&A (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: 'string' }
 *       - in: path
 *         name: answerIndex
 *         required: true
 *         schema: { type: 'integer' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               authorName: { type: 'string' }
 *               content: { type: 'string' }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch(
  '/qa/questions/:id/answers/:answerIndex',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  qaController.validateUpdateAnswer,
  qaController.updateAnswer
);

/**
 * @openapi
 * /api/school-admin/classes/{classId}/attendance:
 *   get:
 *     summary: Chi tiết điểm danh của một lớp (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dữ liệu điểm danh lớp
 */
router.get(
  '/classes/:classId/attendance',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  getClassAttendanceDetail
);

/**
 * @openapi
 * /api/school-admin/students/{studentId}/attendance:
 *   get:
 *     summary: Chi tiết điểm danh của một học sinh (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dữ liệu điểm danh học sinh
 */
router.get(
  '/students/:studentId/attendance',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  getStudentAttendanceDetail
);

/**
 * @openapi
 * /api/school-admin/students/{studentId}/attendance/history:
 *   get:
 *     summary: Lịch sử điểm danh của một học sinh (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lịch sử điểm danh
 */
router.get(
  '/students/:studentId/attendance/history',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  getStudentAttendanceHistory
);

/**
 * @openapi
 * /api/school-admin/documents:
 *   get:
 *     summary: Lấy danh sách tài liệu (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách tài liệu
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Document'
 */
router.get(
  '/documents',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  documentController.listDocuments
);

/**
 * @openapi
 * /api/school-admin/documents/{id}:
 *   get:
 *     summary: Lấy chi tiết tài liệu (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết tài liệu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Document'
 */
router.get(
  '/documents/:id',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  documentController.getDocument
);

/**
 * @openapi
 * /api/school-admin/documents:
 *   post:
 *     summary: Tạo tài liệu mới (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Document'
 *     responses:
 *       201:
 *         description: Tạo mới thành công
 */
router.post(
  '/documents',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  documentController.createDocument
);

/**
 * @openapi
 * /api/school-admin/documents/{id}:
 *   put:
 *     summary: Cập nhật tài liệu (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Document'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put(
  '/documents/:id',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  documentController.updateDocument
);

/**
 * @openapi
 * /api/school-admin/documents/{id}:
 *   delete:
 *     summary: Xóa tài liệu (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete(
  '/documents/:id',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  documentController.deleteDocument
);

/**
 * @openapi
 * /api/school-admin/public-info:
 *   get:
 *     summary: Lấy danh sách thông tin công khai (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách thông tin
 */
router.get('/public-info', authenticate, authorizeRoles('SchoolAdmin'), publicInfoController.listPublicInfos);

/**
 * @openapi
 * /api/school-admin/public-info/{id}:
 *   get:
 *     summary: Lấy chi tiết thông tin công khai (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết thông tin
 */
router.get('/public-info/:id', authenticate, authorizeRoles('SchoolAdmin'), publicInfoController.getPublicInfo);

/**
 * @openapi
 * /api/school-admin/public-info:
 *   post:
 *     summary: Tạo thông tin công khai mới (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PublicInfo'
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/public-info', authenticate, authorizeRoles('SchoolAdmin'), publicInfoController.createPublicInfo);

/**
 * @openapi
 * /api/school-admin/public-info/{id}:
 *   put:
 *     summary: Cập nhật thông tin công khai (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PublicInfo'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/public-info/:id', authenticate, authorizeRoles('SchoolAdmin'), publicInfoController.updatePublicInfo);

/**
 * @openapi
 * /api/school-admin/public-info/{id}:
 *   delete:
 *     summary: Xóa thông tin công khai (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete('/public-info/:id', authenticate, authorizeRoles('SchoolAdmin'), publicInfoController.deletePublicInfo);

/**
 * @openapi
 * /api/school-admin/academic-years/current:
 *   get:
 *     summary: Lấy năm học hiện tại (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Năm học hiện tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AcademicYear'
 */
router.get(
  '/academic-years/current',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  academicYearController.getCurrentAcademicYear
);

/**
 * @openapi
 * /api/school-admin/academic-years:
 *   get:
 *     summary: Lấy danh sách năm học (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách năm học
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/AcademicYear'
 */
router.get(
  '/academic-years',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  academicYearController.listAcademicYears
);

/**
 * @openapi
 * /api/school-admin/academic-years:
 *   post:
 *     summary: Tạo năm học mới (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AcademicYear'
 *     responses:
 *       201:
 *         description: Tạo mới thành công
 */
router.post(
  '/academic-years',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  academicYearController.createAcademicYear
);

/**
 * @openapi
 * /api/school-admin/academic-years/{id}/finish:
 *   patch:
 *     summary: Kết thúc năm học (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Kết thúc thành công
 */
router.patch(
  '/academic-years/:id/finish',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  academicYearController.finishAcademicYear
);

/**
 * @openapi
 * /api/school-admin/academic-years/history:
 *   get:
 *     summary: Lịch sử năm học (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách lịch sử
 */
router.get(
  '/academic-years/history',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  academicYearController.getAcademicYearHistory
);

/**
 * @openapi
 * /api/school-admin/academic-years/{yearId}/classes:
 *   get:
 *     summary: Lấy danh sách lớp theo năm học (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: yearId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách lớp
 */
router.get(
  '/academic-years/:yearId/classes',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  academicYearController.getClassesByAcademicYear
);

/**
 * @openapi
 * /api/school-admin/curriculum:
 *   get:
 *     summary: Lấy danh sách chủ đề chương trình giáo dục (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách chủ đề
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CurriculumTopic'
 */
router.get(
  '/curriculum',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  curriculumController.listCurriculumTopics
);

/**
 * @openapi
 * /api/school-admin/curriculum:
 *   post:
 *     summary: Tạo chủ đề chương trình giáo dục mới (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CurriculumTopic'
 *     responses:
 *       201:
 *         description: Tạo mới thành công
 */
router.post(
  '/curriculum',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  curriculumController.createCurriculumTopic
);

/**
 * @openapi
 * /api/school-admin/curriculum/{id}:
 *   patch:
 *     summary: Cập nhật chủ đề chương trình giáo dục (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CurriculumTopic'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch(
  '/curriculum/:id',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  curriculumController.updateCurriculumTopic
);

/**
 * @openapi
 * /api/school-admin/curriculum/{id}:
 *   delete:
 *     summary: Xóa chủ đề chương trình giáo dục (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.delete(
  '/curriculum/:id',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  curriculumController.deleteCurriculumTopic
);

/**
 * @openapi
 * /api/school-admin/timetable:
 *   get:
 *     summary: Lấy thời khóa biểu (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin thời khóa biểu
 */
router.get(
  '/timetable',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  timetableController.listByYear
);

/**
 * @openapi
 * /api/school-admin/timetable:
 *   put:
 *     summary: Tạo hoặc cập nhật thời khóa biểu (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Timetable'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put(
  '/timetable',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  timetableController.upsert
);

/**
 * @openapi
 * /api/school-admin/teachers:
 *   get:
 *     summary: Lấy danh sách giáo viên đang hoạt động (Chỉ SchoolAdmin)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách giáo viên
 */
router.get('/teachers', authenticate, authorizeRoles('SchoolAdmin'), async (req, res) => {
  try {
    const teacherRole = await Role.findOne({ roleName: 'Teacher' }).lean();
    if (!teacherRole) {
      return res.status(200).json({ status: 'success', data: [] });
    }
    const teachers = await User.find({ roles: teacherRole._id, status: 'active' })
      .select('fullName email phone avatar')
      .sort({ fullName: 1 })
      .lean();
    return res.status(200).json({ status: 'success', data: teachers });
  } catch (error) {
    console.error('listTeachers error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi lấy danh sách giáo viên' });
  }
});

module.exports = router;

