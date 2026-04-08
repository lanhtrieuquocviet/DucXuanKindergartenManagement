const express = require('express');
const { authenticate, authorizeRoles, authorizePermissions } = require('../middleware/auth');
const {
  getStudents,
  createStudent,
  createStudentWithParent,
  getStudentDetail,
  updateStudent,
  deleteStudent,
  checkUsernameAvailability,
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
router.get('/check-username', authenticate, checkUsernameAvailability);

router.get('/generate-username', authenticate, authorizePermissions('MANAGE_STUDENT'), async (req, res) => {
  const User = require('../models/User');
  try {
    const prefix = 'HS';
    const yearSuffix = String(new Date().getFullYear()).slice(-2);
    let username = null;
    for (let attempt = 0; attempt < 20; attempt++) {
      const rand = Math.floor(Math.random() * 1000) + 1;
      const candidate = `${prefix}${yearSuffix}${String(rand).padStart(4, '0')}`;
      const exists = await User.findOne({ username: candidate }).lean();
      if (!exists) { username = candidate; break; }
    }
    if (!username) {
      return res.status(409).json({ status: 'error', message: 'Không thể tạo username duy nhất, vui lòng thử lại' });
    }
    return res.json({ status: 'success', username });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Lỗi khi sinh username', error: error.message });
  }
});
router.get('/', authenticate, getStudents);
router.post('/', authenticate, authorizePermissions('MANAGE_STUDENT'), createStudent);

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
router.post('/with-parent', authenticate, authorizePermissions('MANAGE_STUDENT'), createStudentWithParent);

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
router.post('/attendance', authenticate, authorizePermissions('MANAGE_ATTENDANCE'), upsertAttendance);
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
router.post('/attendance/checkout', authenticate, authorizePermissions('CHECKOUT_STUDENT'), checkoutAttendance);

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
router.delete('/:studentId', authenticate, authorizePermissions('MANAGE_STUDENT'), deleteStudent);

// ── Sổ liên lạc dành cho phụ huynh / học sinh ──────────────────
// Helper: tìm student của user đang đăng nhập
async function getMyStudent(userId) {
  const Student = require('../models/Student');
  return Student.findOne({
    $or: [{ parentId: userId }, { userId }, { UserId: userId }],
    status: 'active',
  })
    .populate('classId', 'className gradeId academicYearId')
    .populate({ path: 'classId', populate: [{ path: 'gradeId', select: 'gradeName' }, { path: 'academicYearId', select: 'yearName' }] })
    .populate('parentId', 'fullName phone email')
    .lean();
}

// GET /students/contact-book/my — thông tin học sinh + lớp
router.get('/contact-book/my', authenticate, async (req, res) => {
  try {
    const student = await getMyStudent(req.user.id);
    if (!student) return res.status(404).json({ status: 'error', message: 'Không tìm thấy thông tin học sinh.' });
    return res.json({ status: 'success', data: student });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /students/contact-book/health — hồ sơ sức khỏe mới nhất
router.get('/contact-book/health', authenticate, async (req, res) => {
  try {
    const student = await getMyStudent(req.user.id);
    if (!student) return res.status(404).json({ status: 'error', message: 'Không tìm thấy học sinh.' });
    const HealthCheck = require('../models/HealthCheck');
    const health = await HealthCheck.findOne({ studentId: student._id }).sort({ checkDate: -1 }).lean();
    return res.json({ status: 'success', data: health || null });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /students/contact-book/attendance?year=&month= — lịch sử điểm danh
router.get('/contact-book/attendance', authenticate, async (req, res) => {
  try {
    const student = await getMyStudent(req.user.id);
    if (!student) return res.status(404).json({ status: 'error', message: 'Không tìm thấy học sinh.' });
    const Attendance = require('../models/Attendances');
    const now = new Date();
    const year  = parseInt(req.query.year)  || now.getFullYear();
    const month = parseInt(req.query.month) || (now.getMonth() + 1);
    const from = new Date(year, month - 1, 1);
    const to   = new Date(year, month, 1);
    const records = await Attendance.find({ studentId: student._id, date: { $gte: from, $lt: to } })
      .sort({ date: -1 }).lean();
    const present = records.filter(r => r.status === 'present').length;
    const absent  = records.filter(r => r.status === 'absent').length;
    const leave   = records.filter(r => r.status === 'leave').length;
    const total   = records.length;
    const rate    = total > 0 ? Math.round((present / total) * 100) : null;
    return res.json({ status: 'success', data: { year, month, total, present, absent, leave, rate, records } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// GET /students/contact-book/notes — ghi chú của giáo viên
router.get('/contact-book/notes', authenticate, async (req, res) => {
  try {
    const student = await getMyStudent(req.user.id);
    if (!student) return res.status(404).json({ status: 'error', message: 'Không tìm thấy học sinh.' });
    const TeacherNote = require('../models/TeacherNote');
    const notes = await TeacherNote.find({ studentId: student._id }).sort({ createdAt: -1 }).lean();
    return res.json({ status: 'success', data: notes });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
