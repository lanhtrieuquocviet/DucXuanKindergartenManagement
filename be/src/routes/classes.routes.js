const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  getClassList,
  getStudentInClass,
  getClassDetail,
  getGradeList,
  createClass,
  updateClass,
  addStudentsToClass,
} = require('../controller/classController');
const Classes = require('../models/Classes');

const router = express.Router();

/**
 * @openapi
 * /api/classes/debug/raw:
 *   get:
 *     summary: Lấy dữ liệu thô (raw) của tất cả các lớp (Chỉ dùng cho Debug)
 *     tags:
 *       - Classes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dữ liệu thô của các lớp
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
 * @openapi
 * /api/classes/grades:
 *   get:
 *     summary: Lấy danh sách khối lớp (grades)
 *     tags:
 *       - Classes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách khối lớp
 */
router.get('/grades', authenticate, authorizeRoles('SchoolAdmin'), getGradeList);

/**
 * @openapi
 * /api/classes:
 *   get:
 *     summary: Lấy danh sách tất cả các lớp học
 *     tags:
 *       - Classes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách lớp học
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Classes'
 */
router.get('/', authenticate, getClassList);

/**
 * @openapi
 * /api/classes:
 *   post:
 *     summary: Tạo lớp học mới (chỉ SchoolAdmin)
 *     tags:
 *       - Classes
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Classes'
 *     responses:
 *       201:
 *         description: Tạo lớp học thành công
 */
router.post('/', authenticate, authorizeRoles('SchoolAdmin'), createClass);

/**
 * @openapi
 * /api/classes/{classId}:
 *   get:
 *     summary: Lấy thông tin chi tiết một lớp học
 *     tags:
 *       - Classes
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
 *         description: Chi tiết lớp học
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Classes'
 */
router.get('/:classId', authenticate, getClassDetail);

/**
 * @openapi
 * /api/classes/{classId}/students:
 *   get:
 *     summary: Lấy danh sách học sinh trong một lớp cụ thể
 *     tags:
 *       - Classes
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
 *         description: Danh sách học sinh
 */
router.get('/:classId/students', authenticate, getStudentInClass);

/**
 * @openapi
 * /api/classes/{classId}/students:
 *   post:
 *     summary: Thêm học sinh vào lớp (bulk) — chỉ SchoolAdmin
 *     tags:
 *       - Classes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
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
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Thêm học sinh thành công
 */
router.post('/:classId/students', authenticate, authorizeRoles('SchoolAdmin'), addStudentsToClass);

/**
 * @openapi
 * /api/classes/{classId}:
 *   put:
 *     summary: Cập nhật lớp học (chỉ SchoolAdmin)
 *     tags:
 *       - Classes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Classes'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/:classId', authenticate, authorizeRoles('SchoolAdmin'), updateClass);

module.exports = router;
