const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const {
  getStudents,
  createStudent,
  createStudentWithParent,
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
 * @openapi
 * /api/students:
 *   get:
 *     summary: Lấy danh sách tất cả học sinh
 *     tags:
 *       - Students
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách học sinh
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Student'
 */
router.get('/', authenticate, getStudents);

/**
 * @openapi
 * /api/students:
 *   post:
 *     summary: Tạo học sinh mới (Chỉ SchoolAdmin)
 *     tags:
 *       - Students
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       201:
 *         description: Tạo mới thành công
 */
router.post('/', authenticate, authorizeRoles('SchoolAdmin'), createStudent);

/**
 * @openapi
 * /api/students/with-parent:
 *   post:
 *     summary: Tạo cả phụ huynh và học sinh (Chỉ SchoolAdmin)
 *     tags:
 *       - Students
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               parent:
 *                 type: object
 *               student:
 *                 type: object
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.post('/with-parent', authenticate, authorizeRoles('SchoolAdmin'), createStudentWithParent);

/**
 * @openapi
 * /api/students/attendance:
 *   post:
 *     summary: Tạo hoặc cập nhật điểm danh (Check-in)
 *     tags:
 *       - Students
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentId: { type: 'string' }
 *               date: { type: 'string', format: 'date' }
 *               status: { type: 'string', enum: ['hiện diện', 'vắng mặt', 'vắng có phép'] }
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post('/attendance', authenticate, upsertAttendance);

/**
 * @openapi
 * /api/students/attendance/checkout:
 *   post:
 *     summary: Check-out điểm danh cho học sinh
 *     tags:
 *       - Students
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentId: { type: 'string' }
 *               date: { type: 'string', format: 'date' }
 *     responses:
 *       200:
 *         description: Check-out thành công
 */
router.post('/attendance/checkout', authenticate, checkoutAttendance);

/**
 * @openapi
 * /api/students/attendance:
 *   get:
 *     summary: Lấy danh sách điểm danh
 *     tags:
 *       - Students
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách điểm danh
 */
router.get('/attendance', authenticate, getAttendances);


/**
 * @openapi
 * /api/students/{studentId}:
 *   get:
 *     summary: Lấy chi tiết thông tin một học sinh
 *     tags:
 *       - Students
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
 *         description: Thông tin học sinh
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Student'
 */
router.get('/:studentId', authenticate, getStudentDetail);

/**
 * @openapi
 * /api/students/{studentId}:
 *   put:
 *     summary: Cập nhật thông tin học sinh
 *     tags:
 *       - Students
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Student'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put(
  '/:studentId',
  authenticate,
  updateStudent,
);

/**
 * @openapi
 * /api/students/{studentId}:
 *   delete:
 *     summary: Xóa học sinh (Chỉ SchoolAdmin)
 *     tags:
 *       - Students
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
 *         description: Xóa thành công
 */
router.delete(
  '/:studentId',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  deleteStudent,
);


module.exports = router;
