const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const contactController = require('../controller/contactController');
const { getAttendanceOverview } = require('../controller/attendanceController');

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

module.exports = router;

