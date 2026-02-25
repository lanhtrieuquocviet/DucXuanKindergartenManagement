const express = require('express');
const { authenticate, authorizeRoles, authorizePermissions } = require('../middleware/auth');
const contactController = require('../controller/contactController');
const {
  getAttendanceOverview,
  getClassAttendanceDetail,
  getStudentAttendanceDetail,
  getStudentAttendanceHistory,
} = require('../controller/attendanceController');
const blogController = require('../controller/blogController');

const router = express.Router();

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

// Blog CRUD cho SchoolAdmin (permission-based)
router.get(
  '/blogs',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  authorizePermissions('BLOG_READ'),
  blogController.listBlogs
);
router.get(
  '/blogs/:id',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  authorizePermissions('BLOG_READ'),
  blogController.getBlog
);
router.post(
  '/blogs',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  authorizePermissions('BLOG_CREATE'),
  blogController.createBlog
);
router.put(
  '/blogs/:id',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  authorizePermissions('BLOG_UPDATE'),
  blogController.updateBlog
);
router.delete(
  '/blogs/:id',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  authorizePermissions('BLOG_DELETE'),
  blogController.deleteBlog
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

module.exports = router;

