const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  getClassList,
  getStudentInClass,
  getClassDetail,
  createClass
} = require('../controller/classController');
const Classes = require('../models/Classes');

const router = express.Router();

/**
 * DEBUG: Lấy dữ liệu thô (raw) của tất cả các lớp
 * GET /api/classes/debug/raw
 */
router.get('/debug/raw', authenticate, async (req, res) => {
  try {
    const rawClasses = await Classes.find().lean();
    const totalDocs = await Classes.countDocuments();
    
    return res.status(200).json({
      status: 'success',
      message: `Found ${totalDocs} raw classes`,
      data: rawClasses,
      total: totalDocs
    });
  } catch (error) {
    console.error('Debug raw error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Debug endpoint error',
      error: error.message
    });
  }
});

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
