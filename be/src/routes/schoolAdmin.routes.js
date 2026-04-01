const express = require('express');
const multer = require('multer');
const { authenticate, authorizeRoles, authorizePermissions } = require('../middleware/auth');
const contactController = require('../controller/contactController');
const User = require('../models/User');
const Role = require('../models/Role');
const Teacher = require('../models/Teacher');
const { listClassrooms, createClassroom, updateClassroom, deleteClassroom } = require('../controller/classroomController');
const assetCtrl = require('../controller/assetInspectionController');
const assetCrudCtrl = require('../controller/assetController');
const purchaseCtrl = require('../controller/purchaseRequestController');
const allocationCtrl  = require('../controller/assetAllocationController');
const incidentCtrl    = require('../controller/assetIncidentController');
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
const bannerController = require('../controller/bannerController');
const imageLibraryController = require('../controller/imageLibraryController');
const academicYearController = require('../controller/academicYearController');
const AcademicYear = require('../models/AcademicYear');
const curriculumController = require('../controller/curriculumController');
const academicPlanController = require('../controller/academicPlanController');
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
 *     summary: Dashboard SchoolAdmin
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin dashboard SchoolAdmin
 *       403:
 *         description: Không có quyền SchoolAdmin
 */
router.get('/dashboard', authenticate, authorizeRoles('SchoolAdmin'), (req, res) => {
  return res.status(200).json({
    status: 'success',
    message: 'Trang SchoolAdmin dashboard',
    data: { user: req.user },
  });
});

// ============================================
// Contacts
// ============================================

/**
 * @openapi
 * /api/school-admin/contacts:
 *   get:
 *     summary: Lấy danh sách liên hệ
 *     tags:
 *       - SchoolAdmin - Contacts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách liên hệ
 */
router.get('/contacts', authenticate, authorizeRoles('SchoolAdmin'), contactController.listContacts);

/**
 * @openapi
 * /api/school-admin/contacts/{id}/reply:
 *   patch:
 *     summary: Phản hồi liên hệ
 *     tags:
 *       - SchoolAdmin - Contacts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID liên hệ
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - replyContent
 *             properties:
 *               replyContent:
 *                 type: string
 *                 example: Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm.
 *     responses:
 *       200:
 *         description: Phản hồi thành công
 *       404:
 *         description: Không tìm thấy liên hệ
 */
router.patch('/contacts/:id/reply', authenticate, authorizeRoles('SchoolAdmin'), contactController.validateReplyContact, contactController.replyContact);

/**
 * @openapi
 * /api/school-admin/contacts/{id}/clear-reply:
 *   patch:
 *     summary: Xóa nội dung phản hồi của liên hệ
 *     tags:
 *       - SchoolAdmin - Contacts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID liên hệ
 *     responses:
 *       200:
 *         description: Xóa phản hồi thành công
 */
router.patch('/contacts/:id/clear-reply', authenticate, authorizeRoles('SchoolAdmin'), contactController.clearReplyContact);

/**
 * @openapi
 * /api/school-admin/contacts/{id}/resend-email:
 *   post:
 *     summary: Gửi lại email phản hồi
 *     tags:
 *       - SchoolAdmin - Contacts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID liên hệ
 *     responses:
 *       200:
 *         description: Gửi lại email thành công
 */
router.post('/contacts/:id/resend-email', authenticate, authorizeRoles('SchoolAdmin'), contactController.resendReplyEmail);

// ============================================
// Homepage banners
// ============================================
router.get('/banners', authenticate, authorizeRoles('SchoolAdmin'), bannerController.getAdminHomepageBanners);
router.post('/banners', authenticate, authorizeRoles('SchoolAdmin'), bannerController.createAdminHomepageBanner);
router.put('/banners', authenticate, authorizeRoles('SchoolAdmin'), bannerController.updateAdminHomepageBanners);
router.patch('/banners/:bannerId', authenticate, authorizeRoles('SchoolAdmin'), bannerController.updateAdminHomepageBannerById);
router.delete('/banners/:bannerId', authenticate, authorizeRoles('SchoolAdmin'), bannerController.deleteAdminHomepageBannerById);

// ============================================
// Attendance
// ============================================

/**
 * @openapi
 * /api/school-admin/attendance/overview:
 *   get:
 *     summary: Tổng quan điểm danh tất cả các lớp
 *     tags:
 *       - SchoolAdmin - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày điểm danh (YYYY-MM-DD), mặc định hôm nay
 *     responses:
 *       200:
 *         description: Tổng quan điểm danh
 */
router.get('/attendance/overview', authenticate, authorizeRoles('SchoolAdmin'), getAttendanceOverview);

/**
 * @openapi
 * /api/school-admin/classes/{classId}/attendance:
 *   get:
 *     summary: Chi tiết điểm danh của một lớp
 *     tags:
 *       - SchoolAdmin - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày điểm danh (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Chi tiết điểm danh lớp
 */
router.get('/classes/:classId/attendance', authenticate, authorizeRoles('SchoolAdmin'), getClassAttendanceDetail);

/**
 * @openapi
 * /api/school-admin/students/{studentId}/attendance:
 *   get:
 *     summary: Chi tiết điểm danh của một học sinh
 *     tags:
 *       - SchoolAdmin - Attendance
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
 *         description: Chi tiết điểm danh học sinh
 */
router.get('/students/:studentId/attendance', authenticate, authorizeRoles('SchoolAdmin'), getStudentAttendanceDetail);

/**
 * @openapi
 * /api/school-admin/students/{studentId}/attendance/history:
 *   get:
 *     summary: Lịch sử điểm danh của một học sinh
 *     tags:
 *       - SchoolAdmin - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *           example: "2024-09"
 *         description: Tháng cần xem (YYYY-MM)
 *     responses:
 *       200:
 *         description: Lịch sử điểm danh
 */
router.get('/students/:studentId/attendance/history', authenticate, authorizeRoles('SchoolAdmin'), getStudentAttendanceHistory);

// ============================================
// Blogs
// ============================================

/**
 * @openapi
 * /api/school-admin/blogs:
 *   get:
 *     summary: Lấy danh sách tất cả bài viết (SchoolAdmin)
 *     tags:
 *       - SchoolAdmin - Blogs
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách bài viết
 *   post:
 *     summary: Tạo bài viết mới
 *     tags:
 *       - SchoolAdmin - Blogs
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 example: Thông báo khai giảng năm học 2024-2025
 *               content:
 *                 type: string
 *                 example: Nội dung bài viết...
 *               category:
 *                 type: string
 *                 example: 664abc123def456789012345
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *                 example: published
 *               thumbnail:
 *                 type: string
 *                 example: https://res.cloudinary.com/...
 *     responses:
 *       201:
 *         description: Tạo bài viết thành công
 */
router.get('/blogs', authenticate, authorizeRoles('SchoolAdmin'), blogController.listBlogs);
router.post('/blogs', authenticate, authorizeRoles('SchoolAdmin'), blogController.createBlog);

/**
 * @openapi
 * /api/school-admin/blogs/{id}:
 *   get:
 *     summary: Lấy chi tiết bài viết
 *     tags:
 *       - SchoolAdmin - Blogs
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
 *         description: Chi tiết bài viết
 *       404:
 *         description: Không tìm thấy bài viết
 *   put:
 *     summary: Cập nhật bài viết
 *     tags:
 *       - SchoolAdmin - Blogs
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
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa bài viết
 *     tags:
 *       - SchoolAdmin - Blogs
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
router.get('/blogs/:id', authenticate, authorizeRoles('SchoolAdmin'), blogController.getBlog);
router.put('/blogs/:id', authenticate, authorizeRoles('SchoolAdmin'), blogController.updateBlog);
router.delete('/blogs/:id', authenticate, authorizeRoles('SchoolAdmin'), blogController.deleteBlog);

// ============================================
// Blog Categories
// ============================================

/**
 * @openapi
 * /api/school-admin/blog-categories:
 *   get:
 *     summary: Lấy danh sách danh mục blog
 *     tags:
 *       - SchoolAdmin - Blog Categories
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách danh mục
 *       403:
 *         description: Thiếu permission MANAGE_BLOG_CATEGORY
 *   post:
 *     summary: Tạo danh mục blog mới
 *     tags:
 *       - SchoolAdmin - Blog Categories
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Hoạt động ngoại khóa
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.get('/blog-categories', authenticate, authorizeRoles('SchoolAdmin'), authorizePermissions('MANAGE_BLOG_CATEGORY'), blogCategoryController.listBlogCategories);
router.post('/blog-categories', authenticate, authorizeRoles('SchoolAdmin'), authorizePermissions('MANAGE_BLOG_CATEGORY'), blogCategoryController.createBlogCategory);

/**
 * @openapi
 * /api/school-admin/blog-categories/{id}:
 *   put:
 *     summary: Cập nhật danh mục blog
 *     tags:
 *       - SchoolAdmin - Blog Categories
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
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa danh mục blog
 *     tags:
 *       - SchoolAdmin - Blog Categories
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
router.put('/blog-categories/:id', authenticate, authorizeRoles('SchoolAdmin'), authorizePermissions('MANAGE_BLOG_CATEGORY'), blogCategoryController.updateBlogCategory);
router.delete('/blog-categories/:id', authenticate, authorizeRoles('SchoolAdmin'), authorizePermissions('MANAGE_BLOG_CATEGORY'), blogCategoryController.deleteBlogCategory);

// ============================================
// Q&A
// ============================================

/**
 * @openapi
 * /api/school-admin/qa/questions:
 *   get:
 *     summary: Lấy danh sách câu hỏi Q&A
 *     tags:
 *       - SchoolAdmin - Q&A
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách câu hỏi
 */
router.get('/qa/questions', authenticate, authorizeRoles('SchoolAdmin'), qaController.getQuestions);

/**
 * @openapi
 * /api/school-admin/qa/questions/{id}:
 *   patch:
 *     summary: Cập nhật câu hỏi Q&A
 *     tags:
 *       - SchoolAdmin - Q&A
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
 *               question:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, answered]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa câu hỏi Q&A
 *     tags:
 *       - SchoolAdmin - Q&A
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
router.patch('/qa/questions/:id', authenticate, authorizeRoles('SchoolAdmin'), qaController.validateQuestionId, qaController.validateCreateQuestion, qaController.updateQuestion);
router.delete('/qa/questions/:id', authenticate, authorizeRoles('SchoolAdmin'), qaController.validateQuestionId, qaController.deleteQuestion);

/**
 * @openapi
 * /api/school-admin/qa/questions/{id}/answers:
 *   post:
 *     summary: Thêm câu trả lời cho câu hỏi
 *     tags:
 *       - SchoolAdmin - Q&A
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
 *             required:
 *               - answer
 *             properties:
 *               answer:
 *                 type: string
 *                 example: Trường mầm non mở cửa từ 7h sáng đến 5h chiều.
 *     responses:
 *       201:
 *         description: Thêm câu trả lời thành công
 */
router.post('/qa/questions/:id/answers', authenticate, authorizeRoles('SchoolAdmin'), qaController.validateCreateAnswer, qaController.createAnswer);

/**
 * @openapi
 * /api/school-admin/qa/questions/{id}/answers/{answerIndex}:
 *   patch:
 *     summary: Cập nhật câu trả lời
 *     tags:
 *       - SchoolAdmin - Q&A
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: answerIndex
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vị trí câu trả lời trong mảng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answer:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch('/qa/questions/:id/answers/:answerIndex', authenticate, authorizeRoles('SchoolAdmin'), qaController.validateUpdateAnswer, qaController.updateAnswer);

// ============================================
// Documents
// ============================================

/**
 * @openapi
 * /api/school-admin/documents:
 *   get:
 *     summary: Lấy danh sách tài liệu (SchoolAdmin)
 *     tags:
 *       - SchoolAdmin - Documents
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách tài liệu
 *   post:
 *     summary: Tạo tài liệu mới
 *     tags:
 *       - SchoolAdmin - Documents
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - fileUrl
 *             properties:
 *               title:
 *                 type: string
 *                 example: Quy chế trường học 2024
 *               fileUrl:
 *                 type: string
 *                 example: https://res.cloudinary.com/.../document.pdf
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *     responses:
 *       201:
 *         description: Tạo tài liệu thành công
 */
router.get('/documents', authenticate, authorizeRoles('SchoolAdmin'), documentController.listDocuments);
router.post('/documents', authenticate, authorizeRoles('SchoolAdmin'), documentController.createDocument);
router.get('/image-library', authenticate, authorizeRoles('SchoolAdmin'), imageLibraryController.listAdminImageLibrary);
router.post('/image-library', authenticate, authorizeRoles('SchoolAdmin'), imageLibraryController.createImageLibraryItem);
router.delete('/image-library/:id', authenticate, authorizeRoles('SchoolAdmin'), imageLibraryController.deleteImageLibraryItem);

/**
 * @openapi
 * /api/school-admin/documents/{id}:
 *   get:
 *     summary: Lấy chi tiết tài liệu
 *     tags:
 *       - SchoolAdmin - Documents
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
 *   put:
 *     summary: Cập nhật tài liệu
 *     tags:
 *       - SchoolAdmin - Documents
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
 *               title:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa tài liệu
 *     tags:
 *       - SchoolAdmin - Documents
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
router.get('/documents/:id', authenticate, authorizeRoles('SchoolAdmin'), documentController.getDocument);
router.put('/documents/:id', authenticate, authorizeRoles('SchoolAdmin'), documentController.updateDocument);
router.delete('/documents/:id', authenticate, authorizeRoles('SchoolAdmin'), documentController.deleteDocument);

// ============================================
// Public Info
// ============================================

/**
 * @openapi
 * /api/school-admin/public-info:
 *   get:
 *     summary: Lấy danh sách thông tin công khai (SchoolAdmin)
 *     tags:
 *       - SchoolAdmin - Public Info
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách thông tin
 *   post:
 *     summary: Tạo thông tin công khai mới
 *     tags:
 *       - SchoolAdmin - Public Info
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.get('/public-info', authenticate, authorizeRoles('SchoolAdmin'), publicInfoController.listPublicInfos);
router.post('/public-info', authenticate, authorizeRoles('SchoolAdmin'), publicInfoController.createPublicInfo);

/**
 * @openapi
 * /api/school-admin/public-info/{id}:
 *   get:
 *     summary: Lấy chi tiết thông tin công khai
 *     tags:
 *       - SchoolAdmin - Public Info
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
 *   put:
 *     summary: Cập nhật thông tin công khai
 *     tags:
 *       - SchoolAdmin - Public Info
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
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa thông tin công khai
 *     tags:
 *       - SchoolAdmin - Public Info
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
router.get('/public-info/:id', authenticate, authorizeRoles('SchoolAdmin'), publicInfoController.getPublicInfo);
router.put('/public-info/:id', authenticate, authorizeRoles('SchoolAdmin'), publicInfoController.updatePublicInfo);
router.delete('/public-info/:id', authenticate, authorizeRoles('SchoolAdmin'), publicInfoController.deletePublicInfo);

// ============================================
// Academic Years
// ============================================

/**
 * @openapi
 * /api/school-admin/academic-years/current:
 *   get:
 *     summary: Lấy năm học hiện tại đang hoạt động
 *     tags:
 *       - SchoolAdmin - Academic Years
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Năm học hiện tại
 */
router.get('/academic-years/current', authenticate, authorizeRoles('SchoolAdmin'), academicYearController.getCurrentAcademicYear);

/**
 * @openapi
 * /api/school-admin/academic-years/history:
 *   get:
 *     summary: Lấy lịch sử các năm học
 *     tags:
 *       - SchoolAdmin - Academic Years
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách năm học đã kết thúc
 */
router.get('/academic-years/history', authenticate, authorizeRoles('SchoolAdmin'), academicYearController.getAcademicYearHistory);

/**
 * @openapi
 * /api/school-admin/academic-years:
 *   get:
 *     summary: Lấy danh sách năm học
 *     tags:
 *       - SchoolAdmin - Academic Years
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách năm học
 *   post:
 *     summary: Tạo năm học mới
 *     tags:
 *       - SchoolAdmin - Academic Years
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - startDate
 *               - endDate
 *             properties:
 *               name:
 *                 type: string
 *                 example: Năm học 2024-2025
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-09-01"
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-05-31"
 *     responses:
 *       201:
 *         description: Tạo năm học thành công
 */
router.get('/academic-years', authenticate, authorizeRoles('SchoolAdmin'), academicYearController.listAcademicYears);
router.post('/academic-years', authenticate, authorizeRoles('SchoolAdmin'), academicYearController.createAcademicYear);

/**
 * @openapi
 * /api/school-admin/academic-years/{id}/finish:
 *   patch:
 *     summary: Kết thúc năm học
 *     tags:
 *       - SchoolAdmin - Academic Years
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID năm học
 *     responses:
 *       200:
 *         description: Kết thúc năm học thành công
 */
router.patch('/academic-years/:id/finish', authenticate, authorizeRoles('SchoolAdmin'), academicYearController.finishAcademicYear);

/**
 * @openapi
 * /api/school-admin/academic-years/{yearId}/classes:
 *   get:
 *     summary: Lấy danh sách lớp theo năm học
 *     tags:
 *       - SchoolAdmin - Academic Years
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: yearId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID năm học
 *     responses:
 *       200:
 *         description: Danh sách lớp của năm học
 */
router.get('/academic-years/:yearId/classes', authenticate, authorizeRoles('SchoolAdmin'), academicYearController.getClassesByAcademicYear);

// ============================================
// Academic Plan
// ============================================
router.get('/academic-plan/topics', authenticate, authorizeRoles('SchoolAdmin'), academicPlanController.listTopics);
router.post('/academic-plan/topics', authenticate, authorizeRoles('SchoolAdmin'), academicPlanController.createTopic);
router.patch('/academic-plan/topics/:id', authenticate, authorizeRoles('SchoolAdmin'), academicPlanController.updateTopic);
router.delete('/academic-plan/topics/:id', authenticate, authorizeRoles('SchoolAdmin'), academicPlanController.deleteTopic);

// ============================================
// Curriculum
// ============================================

/**
 * @openapi
 * /api/school-admin/curriculum:
 *   get:
 *     summary: Lấy danh sách chủ đề chương trình giáo dục
 *     tags:
 *       - SchoolAdmin - Curriculum
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: yearId
 *         schema:
 *           type: string
 *         description: ID năm học (tùy chọn)
 *     responses:
 *       200:
 *         description: Danh sách chủ đề
 *   post:
 *     summary: Tạo chủ đề chương trình mới
 *     tags:
 *       - SchoolAdmin - Curriculum
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - yearId
 *             properties:
 *               title:
 *                 type: string
 *                 example: Chủ đề mùa thu
 *               yearId:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.get('/curriculum', authenticate, authorizeRoles('SchoolAdmin'), curriculumController.listCurriculumTopics);
router.post('/curriculum', authenticate, authorizeRoles('SchoolAdmin'), curriculumController.createCurriculumTopic);

/**
 * @openapi
 * /api/school-admin/curriculum/{id}:
 *   patch:
 *     summary: Cập nhật chủ đề chương trình
 *     tags:
 *       - SchoolAdmin - Curriculum
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa chủ đề chương trình
 *     tags:
 *       - SchoolAdmin - Curriculum
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
router.patch('/curriculum/:id', authenticate, authorizeRoles('SchoolAdmin'), curriculumController.updateCurriculumTopic);
router.delete('/curriculum/:id', authenticate, authorizeRoles('SchoolAdmin'), curriculumController.deleteCurriculumTopic);

// ============================================
// Timetable
// ============================================

/**
 * @openapi
 * /api/school-admin/timetable:
 *   get:
 *     summary: Lấy thời khóa biểu theo năm học / khối (SchoolAdmin)
 *     tags:
 *       - SchoolAdmin - Timetable
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: yearId
 *         schema:
 *           type: string
 *         description: ID năm học
 *     responses:
 *       200:
 *         description: Thời khóa biểu
 *   put:
 *     summary: Tạo hoặc cập nhật thời khóa biểu (upsert)
 *     tags:
 *       - SchoolAdmin - Timetable
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - yearId
 *               - gradeId
 *               - schedule
 *             properties:
 *               yearId:
 *                 type: string
 *               gradeId:
 *                 type: string
 *               schedule:
 *                 type: array
 *                 description: Danh sách tiết học theo ngày
 *     responses:
 *       200:
 *         description: Lưu thời khóa biểu thành công
 */
router.get('/timetable', authenticate, authorizeRoles('SchoolAdmin'), timetableController.listByYear);
router.put('/timetable', authenticate, authorizeRoles('SchoolAdmin'), timetableController.upsert);
router.delete('/timetable/:id', authenticate, authorizeRoles('SchoolAdmin'), timetableController.remove);

// ============================================
// Teachers
// ============================================

/**
 * @openapi
 * /api/school-admin/teachers:
 *   get:
 *     summary: Lấy danh sách giáo viên (dùng cho form tạo/cập nhật lớp)
 *     tags:
 *       - SchoolAdmin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách giáo viên đang active
 */
// GET /school-admin/teachers/availability?className=...&excludeClassId=...
// Trả về trạng thái từng giáo viên theo nghiệp vụ phân công lớp
router.get('/teachers/availability', authenticate, authorizeRoles('SchoolAdmin'), async (req, res) => {
  try {
    const { className, excludeClassId } = req.query;
    const Classes = require('../models/Classes');

    // Lấy năm học hiện tại
    const activeYear = await AcademicYear.findOne({ status: 'active' }).lean();

    // Lấy tất cả Teacher active
    const teacherDocs = await Teacher.find({ status: 'active' })
      .populate('userId', 'fullName email status')
      .lean();

    const result = await Promise.all(
      teacherDocs
        .filter(t => t.userId && t.userId.status === 'active')
        .map(async (t) => {
          // Rule 2: đã phụ trách lớp khác trong năm này chưa?
          let inCurrentYear = false;
          if (activeYear) {
            const q = { academicYearId: activeYear._id, teacherIds: t._id };
            if (excludeClassId) q._id = { $ne: excludeClassId };
            const existing = await Classes.findOne(q).select('className').lean();
            if (existing) inCurrentYear = existing.className;
          }

          // Rule 3: đã dạy className này bao nhiêu năm?
          let yearsInClass = 0;
          if (className?.trim()) {
            const q = { className: className.trim(), teacherIds: t._id };
            if (excludeClassId) q._id = { $ne: excludeClassId };
            yearsInClass = await Classes.countDocuments(q);
          }

          return {
            _id: t._id,
            fullName: t.userId.fullName,
            email: t.userId.email,
            degree: t.degree,
            experienceYears: t.experienceYears,
            inCurrentYear,   // false | tên lớp đang phụ trách
            yearsInClass,    // 0 | 1 | 2
            maxYearsReached: yearsInClass >= 2,
          };
        })
    );

    return res.status(200).json({ status: 'success', data: result });
  } catch (error) {
    console.error('teacherAvailability error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi kiểm tra giáo viên' });
  }
});

router.get('/teachers', authenticate, authorizeRoles('SchoolAdmin'), async (req, res) => {
  try {
    const teacherRole = await Role.findOne({ roleName: 'Teacher' }).lean();

    // Đồng bộ: tạo Teacher record cho TẤT CẢ User có role Teacher (kể cả inactive)
    if (teacherRole) {
      const teacherUsers = await User.find({ roles: teacherRole._id }).lean();
      for (const u of teacherUsers) {
        const exists = await Teacher.findOne({ userId: u._id }).lean();
        if (!exists) await Teacher.create({ userId: u._id, status: u.status === 'active' ? 'active' : 'inactive' });
      }
    }

    const teacherDocs = await Teacher.find()
      .populate('userId', 'fullName email phone avatar status')
      .sort({ createdAt: 1 })
      .lean();

    const teachers = teacherDocs
      .filter(t => t.userId)
      .map(t => ({
        _id: t._id,
        fullName: t.userId.fullName,
        email: t.userId.email,
        phone: t.userId.phone,
        avatar: t.userId.avatar,
        status: t.userId.status,
        degree: t.degree,
        experienceYears: t.experienceYears,
        hireDate: t.hireDate,
      }));

    return res.status(200).json({ status: 'success', data: teachers });
  } catch (error) {
    console.error('listTeachers error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi lấy danh sách giáo viên' });
  }
});

// POST /school-admin/teachers — tạo giáo viên mới (User + Teacher record)
router.post('/teachers', authenticate, authorizeRoles('SchoolAdmin'), async (req, res) => {
  try {
    const { fullName, email, phone, password, degree, experienceYears, hireDate, avatar } = req.body;
    if (!fullName?.trim()) return res.status(400).json({ status: 'error', message: 'Họ tên không được để trống' });
    if (!email?.trim()) return res.status(400).json({ status: 'error', message: 'Email không được để trống' });
    if (!password || password.length < 6) return res.status(400).json({ status: 'error', message: 'Mật khẩu tối thiểu 6 ký tự' });

    const existingUser = await User.findOne({ email: email.trim().toLowerCase() }).lean();
    if (existingUser) return res.status(400).json({ status: 'error', message: 'Email đã được sử dụng' });

    const teacherRole = await Role.findOne({ roleName: 'Teacher' }).lean();
    if (!teacherRole) return res.status(500).json({ status: 'error', message: 'Không tìm thấy role Teacher trong hệ thống' });

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      username: email.trim().toLowerCase().split('@')[0] + '_' + Date.now(),
      passwordHash,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || '',
      avatar: avatar || '',
      roles: [teacherRole._id],
      status: 'active',
    });

    const teacher = await Teacher.create({
      userId: user._id,
      degree: degree?.trim() || '',
      experienceYears: Number(experienceYears) || 0,
      hireDate: hireDate || null,
      status: 'active',
    });

    await teacher.populate('userId', 'fullName email phone avatar');
    return res.status(201).json({
      status: 'success',
      message: 'Tạo giáo viên thành công',
      data: {
        _id: teacher._id,
        fullName: teacher.userId.fullName,
        email: teacher.userId.email,
        phone: teacher.userId.phone,
        avatar: teacher.userId.avatar,
        degree: teacher.degree,
        experienceYears: teacher.experienceYears,
        hireDate: teacher.hireDate,
      },
    });
  } catch (error) {
    console.error('createTeacher error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi tạo giáo viên', error: error.message });
  }
});

// PUT /school-admin/teachers/:id — cập nhật giáo viên
router.put('/teachers/:id', authenticate, authorizeRoles('SchoolAdmin'), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).lean();
    if (!teacher) return res.status(404).json({ status: 'error', message: 'Không tìm thấy giáo viên' });

    const { fullName, email, phone, degree, experienceYears, hireDate, avatar, status } = req.body;

    // Cập nhật User
    const userUpdate = {};
    if (fullName?.trim()) userUpdate.fullName = fullName.trim();
    if (phone !== undefined) userUpdate.phone = phone?.trim() || '';
    if (avatar !== undefined) userUpdate.avatar = avatar;
    if (email?.trim()) {
      const currentUser = await User.findById(teacher.userId).select('email').lean();
      if (email.trim().toLowerCase() !== currentUser?.email) {
        const dup = await User.findOne({ email: email.trim().toLowerCase(), _id: { $ne: teacher.userId } }).lean();
        if (dup) return res.status(400).json({ status: 'error', message: 'Email đã được sử dụng' });
        userUpdate.email = email.trim().toLowerCase();
      }
    }
    if (status && ['active', 'inactive'].includes(status)) {
      userUpdate.status = status;
    }
    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(teacher.userId, userUpdate);
    }

    // Cập nhật Teacher
    const teacherUpdate = {};
    if (degree !== undefined) teacherUpdate.degree = degree?.trim() || '';
    if (experienceYears !== undefined) teacherUpdate.experienceYears = Number(experienceYears) || 0;
    if (hireDate !== undefined) teacherUpdate.hireDate = hireDate || null;
    if (status && ['active', 'inactive'].includes(status)) teacherUpdate.status = status;
    await Teacher.findByIdAndUpdate(teacher._id, teacherUpdate);

    const updated = await Teacher.findById(teacher._id)
      .populate('userId', 'fullName email phone avatar status')
      .lean();

    return res.status(200).json({
      status: 'success',
      message: 'Cập nhật giáo viên thành công',
      data: {
        _id: updated._id,
        fullName: updated.userId.fullName,
        email: updated.userId.email,
        phone: updated.userId.phone,
        avatar: updated.userId.avatar,
        status: updated.userId.status,
        degree: updated.degree,
        experienceYears: updated.experienceYears,
        hireDate: updated.hireDate,
      },
    });
  } catch (error) {
    console.error('updateTeacher error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi cập nhật giáo viên', error: error.message });
  }
});

// DELETE /school-admin/teachers/:id — xóa giáo viên
router.delete('/teachers/:id', authenticate, authorizeRoles('SchoolAdmin'), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).lean();
    if (!teacher) return res.status(404).json({ status: 'error', message: 'Không tìm thấy giáo viên' });

    const Classes = require('../models/Classes');
    const inUse = await Classes.countDocuments({ teacherIds: teacher._id });
    if (inUse > 0) return res.status(400).json({ status: 'error', message: `Không thể xóa: giáo viên đang phụ trách ${inUse} lớp học` });

    await Teacher.findByIdAndDelete(teacher._id);
    await User.findByIdAndUpdate(teacher.userId, { status: 'inactive' });

    return res.status(200).json({ status: 'success', message: 'Đã xóa giáo viên' });
  } catch (error) {
    console.error('deleteTeacher error:', error);
    return res.status(500).json({ status: 'error', message: 'Lỗi khi xóa giáo viên', error: error.message });
  }
});

// Migration: tạo Teacher record cho User có role Teacher chưa có record
router.post('/teachers/migrate', authenticate, authorizeRoles('SchoolAdmin'), async (req, res) => {
  try {
    const teacherRole = await Role.findOne({ roleName: 'Teacher' }).lean();
    if (!teacherRole) return res.status(200).json({ status: 'success', message: 'Không tìm thấy role Teacher', created: 0 });

    const users = await User.find({ roles: teacherRole._id }).select('_id').lean();
    let created = 0;
    for (const u of users) {
      const result = await Teacher.findOneAndUpdate(
        { userId: u._id },
        { $setOnInsert: { userId: u._id, status: 'active' } },
        { upsert: true, new: true, rawResult: true }
      );
      if (result.lastErrorObject?.upserted) created++;
    }
    return res.status(200).json({ status: 'success', message: `Đã tạo ${created} Teacher record mới`, created });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================
// Classrooms
// ============================================
router.get('/classrooms', authenticate, authorizeRoles('SchoolAdmin'), listClassrooms);
router.post('/classrooms', authenticate, authorizeRoles('SchoolAdmin'), createClassroom);
router.put('/classrooms/:id', authenticate, authorizeRoles('SchoolAdmin'), updateClassroom);
router.delete('/classrooms/:id', authenticate, authorizeRoles('SchoolAdmin'), deleteClassroom);

// ============================================
// GET /school-admin/staff — danh sách user có role SchoolAdmin (để chọn thành viên ban kiểm kê)
router.get('/staff', authenticate, authorizeRoles('SchoolAdmin'), async (req, res) => {
  try {
    const role = await Role.findOne({ roleName: 'SchoolAdmin' }).lean();
    if (!role) return res.status(200).json({ status: 'success', data: [] });
    const users = await User.find({ roles: role._id, status: 'active' })
      .select('fullName email')
      .sort({ fullName: 1 })
      .lean();
    return res.status(200).json({ status: 'success', data: users });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Lỗi khi lấy danh sách nhân viên' });
  }
});

// Asset Inspection - Committees (Ban kiểm kê)
// ============================================
router.get('/asset-committees', authenticate, authorizeRoles('SchoolAdmin'), assetCtrl.listCommittees);
router.post('/asset-committees', authenticate, authorizeRoles('SchoolAdmin'), assetCtrl.createCommittee);
router.get('/asset-committees/:id', authenticate, authorizeRoles('SchoolAdmin'), assetCtrl.getCommittee);
router.put('/asset-committees/:id', authenticate, authorizeRoles('SchoolAdmin'), assetCtrl.updateCommittee);
router.delete('/asset-committees/:id', authenticate, authorizeRoles('SchoolAdmin'), assetCtrl.deleteCommittee);

// ============================================
// Asset Inspection - Minutes (Biên bản kiểm kê)
// ============================================
router.get('/asset-minutes', authenticate, authorizeRoles('SchoolAdmin'), assetCtrl.listMinutes);
router.post('/asset-minutes', authenticate, authorizeRoles('SchoolAdmin'), assetCtrl.createMinutes);
router.get('/asset-minutes/:id', authenticate, authorizeRoles('SchoolAdmin'), assetCtrl.getMinutes);
router.put('/asset-minutes/:id', authenticate, authorizeRoles('SchoolAdmin'), assetCtrl.updateMinutes);
router.delete('/asset-minutes/:id', authenticate, authorizeRoles('SchoolAdmin'), assetCtrl.deleteMinutes);
router.patch('/asset-minutes/:id/approve', authenticate, authorizeRoles('SchoolAdmin'), assetCtrl.approveMinutes);
router.patch('/asset-minutes/:id/reject', authenticate, authorizeRoles('SchoolAdmin'), assetCtrl.rejectMinutes);

// ============================================
// Assets CRUD (Danh sách tài sản)
// ============================================
router.get('/assets', authenticate, authorizeRoles('SchoolAdmin'), assetCrudCtrl.listAssets);
router.post('/assets', authenticate, authorizeRoles('SchoolAdmin'), assetCrudCtrl.createAsset);
router.post('/assets/bulk', authenticate, authorizeRoles('SchoolAdmin'), assetCrudCtrl.bulkCreateAssets);
router.get('/assets/:id', authenticate, authorizeRoles('SchoolAdmin'), assetCrudCtrl.getAsset);
router.put('/assets/:id', authenticate, authorizeRoles('SchoolAdmin'), assetCrudCtrl.updateAsset);
router.delete('/assets/:id', authenticate, authorizeRoles('SchoolAdmin'), assetCrudCtrl.deleteAsset);

// ============================================
// Asset Allocations (Biên bản bàn giao tài sản)
// ============================================
const wordUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
router.get('/asset-allocations', authenticate, authorizeRoles('SchoolAdmin'), allocationCtrl.listAllocations);
router.post('/asset-allocations', authenticate, authorizeRoles('SchoolAdmin'), allocationCtrl.createAllocation);
router.get('/asset-allocations/template', authenticate, authorizeRoles('SchoolAdmin'), allocationCtrl.generateExcelTemplate);
router.post('/asset-allocations/parse-word', authenticate, authorizeRoles('SchoolAdmin'), wordUpload.single('file'), allocationCtrl.parseWordFile);
router.post('/asset-allocations/parse-excel', authenticate, authorizeRoles('SchoolAdmin'), wordUpload.single('file'), allocationCtrl.parseExcelFile);
router.get('/asset-allocations/classes', authenticate, authorizeRoles('SchoolAdmin'), allocationCtrl.listClasses);
router.get('/asset-allocations/:id', authenticate, authorizeRoles('SchoolAdmin'), allocationCtrl.getAllocation);
router.put('/asset-allocations/:id', authenticate, authorizeRoles('SchoolAdmin'), allocationCtrl.updateAllocation);
router.delete('/asset-allocations/:id', authenticate, authorizeRoles('SchoolAdmin'), allocationCtrl.deleteAllocation);
router.patch('/asset-allocations/:id/transfer', authenticate, authorizeRoles('SchoolAdmin'), allocationCtrl.transferAllocation);

// ============================================
// Purchase Requests (Yêu cầu mua sắm)
// ============================================
router.get('/purchase-requests', authenticate, authorizeRoles('SchoolAdmin'), purchaseCtrl.listAllRequests);
router.patch('/purchase-requests/:id/approve', authenticate, authorizeRoles('SchoolAdmin'), purchaseCtrl.approveRequest);
router.patch('/purchase-requests/:id/reject', authenticate, authorizeRoles('SchoolAdmin'), purchaseCtrl.rejectRequest);

// ============================================
// Asset Incidents (Báo cáo sự cố tài sản)
// ============================================
router.get('/asset-incidents',          authenticate, authorizeRoles('SchoolAdmin'), incidentCtrl.listAllIncidents);
router.patch('/asset-incidents/:id',    authenticate, authorizeRoles('SchoolAdmin'), incidentCtrl.updateIncidentStatus);

module.exports = router;
