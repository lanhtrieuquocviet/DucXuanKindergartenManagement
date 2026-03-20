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
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *         description: Lọc theo lớp
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo tên học sinh
 *     responses:
 *       200:
 *         description: Danh sách học sinh
 *   post:
 *     summary: Tạo học sinh mới (chỉ SchoolAdmin)
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
 *             required:
 *               - fullName
 *               - dateOfBirth
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Nguyễn Văn An
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "2019-05-15"
 *               gender:
 *                 type: string
 *                 enum: [male, female]
 *               classId:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo học sinh thành công
 *       403:
 *         description: Không có quyền SchoolAdmin
 */
router.get('/', authenticate, getStudents);
router.post('/', authenticate, authorizeRoles('SchoolAdmin'), createStudent);

/**
 * @openapi
 * /api/students/with-parent:
 *   post:
 *     summary: Tạo tài khoản phụ huynh kèm học sinh (chỉ SchoolAdmin)
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
 *             required:
 *               - student
 *               - parent
 *             properties:
 *               student:
 *                 type: object
 *                 properties:
 *                   fullName:
 *                     type: string
 *                     example: Nguyễn Văn An
 *                   dateOfBirth:
 *                     type: string
 *                     format: date
 *               parent:
 *                 type: object
 *                 properties:
 *                   username:
 *                     type: string
 *                     example: parent_an
 *                   password:
 *                     type: string
 *                     format: password
 *                   fullName:
 *                     type: string
 *                   email:
 *                     type: string
 *                     format: email
 *     responses:
 *       201:
 *         description: Tạo phụ huynh và học sinh thành công
 *       403:
 *         description: Không có quyền SchoolAdmin
 */
router.post('/with-parent', authenticate, authorizeRoles('SchoolAdmin'), createStudentWithParent);

/**
 * @openapi
 * /api/students/attendance:
 *   post:
 *     summary: Điểm danh check-in học sinh
 *     tags:
 *       - Students - Attendance
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - date
 *               - status
 *             properties:
 *               studentId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-09-15"
 *               status:
 *                 type: string
 *                 enum: [present, absent, late]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Điểm danh thành công
 *   get:
 *     summary: Lấy danh sách điểm danh
 *     tags:
 *       - Students - Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Danh sách điểm danh
 */
router.post('/attendance', authenticate, upsertAttendance);
router.get('/attendance', authenticate, getAttendances);

/**
 * @openapi
 * /api/students/attendance/checkout:
 *   post:
 *     summary: Điểm danh check-out học sinh
 *     tags:
 *       - Students - Attendance
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *               - date
 *             properties:
 *               studentId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               checkoutTime:
 *                 type: string
 *                 example: "17:00"
 *     responses:
 *       200:
 *         description: Check-out thành công
 */
router.post('/attendance/checkout', authenticate, checkoutAttendance);

/**
 * @openapi
 * /api/students/{studentId}:
 *   get:
 *     summary: Lấy thông tin chi tiết học sinh
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
 *         description: Chi tiết học sinh
 *       404:
 *         description: Không tìm thấy học sinh
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
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa học sinh (chỉ SchoolAdmin)
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
 *       403:
 *         description: Không có quyền SchoolAdmin
 */
router.get('/:studentId', authenticate, getStudentDetail);
router.put('/:studentId', authenticate, updateStudent);
router.delete('/:studentId', authenticate, authorizeRoles('SchoolAdmin'), deleteStudent);

module.exports = router;
