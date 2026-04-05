const express = require('express');
const { authenticate, authorizeRoles, authorizePermissions } = require('../middleware/auth');
const {
  getClassList,
  getStudentInClass,
  getClassDetail,
  getGradeList,
  createClass,
  updateClass,
  addStudentsToClass,
  removeStudentFromClass,
  deleteClass,
} = require('../controller/classController');
const Classes = require('../models/Classes');

const router = express.Router();

/**
 * @openapi
 * /api/classes/debug/raw:
 *   get:
 *     summary: "[DEBUG] Lấy dữ liệu thô của tất cả lớp"
 *     tags:
 *       - Classes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dữ liệu raw của tất cả lớp
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
 *     summary: Lấy danh sách khối lớp (dùng cho form tạo lớp)
 *     tags:
 *       - Classes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách khối lớp
 *       403:
 *         description: Không có quyền SchoolAdmin
 */
router.get('/grades', authenticate, authorizePermissions('MANAGE_CLASS'), getGradeList);

/**
 * @openapi
 * /api/classes:
 *   get:
 *     summary: Lấy danh sách tất cả lớp học
 *     tags:
 *       - Classes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách lớp học
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
 *             type: object
 *             required:
 *               - className
 *               - gradeId
 *             properties:
 *               className:
 *                 type: string
 *                 example: Lá 1
 *               gradeId:
 *                 type: string
 *                 description: ID khối lớp
 *               teacherId:
 *                 type: string
 *                 description: ID giáo viên chủ nhiệm
 *               academicYearId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo lớp thành công
 *       403:
 *         description: Không có quyền SchoolAdmin
 */
router.get('/', authenticate, getClassList);
router.post('/', authenticate, authorizePermissions('MANAGE_CLASS'), createClass);

/**
 * @openapi
 * /api/classes/{classId}:
 *   get:
 *     summary: Lấy thông tin chi tiết lớp học
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
 *       404:
 *         description: Không tìm thấy lớp
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
 *             type: object
 *             properties:
 *               className:
 *                 type: string
 *               teacherId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.get('/:classId', authenticate, getClassDetail);
router.put('/:classId', authenticate, authorizePermissions('MANAGE_CLASS'), updateClass);

/**
 * Xóa lớp học (chỉ SchoolAdmin)
 * DELETE /api/classes/:classId
 */
router.delete('/:classId', authenticate, authorizePermissions('MANAGE_CLASS'), deleteClass);

/**
 * Lấy danh sách / thêm học sinh trong lớp
 * GET|POST /api/classes/:classId/students
 */
router.get('/:classId/students', authenticate, getStudentInClass);
router.post('/:classId/students', authenticate, authorizePermissions('MANAGE_CLASS'), addStudentsToClass);
router.delete('/:classId/students/:studentId', authenticate, authorizePermissions('MANAGE_CLASS'), removeStudentFromClass);

module.exports = router;
