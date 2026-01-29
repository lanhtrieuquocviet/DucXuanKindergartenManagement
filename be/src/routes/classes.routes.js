const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  getClassList,
  getStudentInClass,
  getClassDetail,
  createClass
} = require('../controller/classController');

const router = express.Router();

/**
 * Lấy danh sách tất cả các lớp học
 * GET /api/classes
 */
router.get('/', authenticate, getClassList);

/**
 * Tạo lớp học mới (chỉ SchoolAdmin)
 * POST /api/classes
 */
router.post('/', authenticate, authorizeRoles('SchoolAdmin'), createClass);

/**
 * Lấy thông tin chi tiết một lớp học
 * GET /api/classes/:classId
 */
router.get('/:classId', authenticate, getClassDetail);

/**
 * Lấy danh sách học sinh trong một lớp cụ thể
 * GET /api/classes/:classId/students
 */
router.get('/:classId/students', authenticate, getStudentInClass);

module.exports = router;
