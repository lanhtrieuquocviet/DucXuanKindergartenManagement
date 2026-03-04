const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  getStudents,
  createStudent,
  getStudentDetail,
  updateStudent,
  deleteStudent,
} = require('../controller/studentController');
const {
  upsertAttendance,
  checkoutAttendance,
  getAttendances,
} = require('../controller/attendanceController');

const router = express.Router();

/**
 * Lấy danh sách tất cả học sinh
 * GET /api/students
 */
router.get('/', authenticate, getStudents);

/**
 * Tạo học sinh mới
 * POST /api/students
 */
router.post('/', authenticate, authorizeRoles('SchoolAdmin'), createStudent);

/**
 * Tạo / cập nhật điểm danh cho 1 học sinh trong 1 ngày
 * POST /api/students/attendance
 */
router.post('/attendance', authenticate, upsertAttendance);

/**
 * Check-out điểm danh cho 1 học sinh trong 1 ngày
 * POST /api/students/attendance/checkout
 */
router.post('/attendance/checkout', authenticate, checkoutAttendance);

/**
 * Lấy danh sách điểm danh
 * GET /api/students/attendance
 */
router.get('/attendance', authenticate, getAttendances);


/**
 * Lấy thông tin chi tiết một học sinh
 * GET /api/students/:studentId
 */
router.get('/:studentId', authenticate, getStudentDetail);

/**
 * Cập nhật thông tin học sinh
 * PUT /api/students/:studentId
 */
router.put(
  '/:studentId',
  authenticate,
  updateStudent,
);

/**
 * Xóa học sinh
 * DELETE /api/students/:studentId
 */
router.delete(
  '/:studentId',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  deleteStudent,
);


module.exports = router;
