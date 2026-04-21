const express = require('express');
const { authenticate, authorizeRoles, authorizePermissions } = require('../middleware/auth');
const assetCtrl = require('../controller/assetInspectionController');
const purchaseCtrl = require('../controller/purchaseRequestController');
const incidentCtrl    = require('../controller/assetIncidentController');
const allocationCtrl  = require('../controller/assetAllocationController');
const contactBookCtrl = require('../controller/contactBookController');
const InspectionCommittee = require('../models/InspectionCommittee');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const Classes = require('../models/Classes');
const Student = require('../models/Student');
const Attendances = require('../models/Attendances');
const AcademicYear = require('../models/AcademicYear');

const router = express.Router();

/**
 * @openapi
 * /api/teacher/dashboard:
 *   get:
 *     summary: Dashboard giáo viên
 *     tags:
 *       - Teacher
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin dashboard giáo viên
 *       403:
 *         description: Không có quyền Teacher
 */
router.get('/dashboard', authenticate, authorizeRoles('Teacher', 'HeadTeacher'), async (req, res) => {
  try {
    const currentYear = await AcademicYear.findOne({ status: 'active' }).sort({ startDate: -1 }).select('_id');
    const teacherProfile = await Teacher.findOne({ userId: req.user._id });
    const classFilter = { teacherIds: teacherProfile?._id };
    if (currentYear?._id) classFilter.academicYearId = currentYear._id;
    const classes = teacherProfile
      ? await Classes.find(classFilter).select('_id className')
      : [];
    const classIds = classes.map((c) => c._id);

    const activeStudents = classIds.length
      ? await Student.find({
        classId: { $in: classIds },
        status: 'active',
        ...(currentYear?._id ? { academicYearId: currentYear._id } : {}),
      }).select('_id')
      : [];
    const studentIds = activeStudents.map((s) => s._id);
    const totalStudents = studentIds.length;

    const countAttendanceByRange = async (startDate, endDate) => {
      if (!classIds.length || !studentIds.length) {
        return { present: 0, absent: 0, leave: 0, total: 0 };
      }

      // Deduplicate by student/day and keep latest status when data has legacy duplicates.
      const grouped = await Attendances.aggregate([
        {
          $match: {
            classId: { $in: classIds },
            studentId: { $in: studentIds },
            date: { $gte: startDate, $lte: endDate },
          },
        },
        { $sort: { updatedAt: -1 } },
        {
          $group: {
            _id: '$studentId',
            status: { $first: '$status' },
          },
        },
      ]);

      const present = grouped.filter((r) => r.status === 'present').length;
      const absent = grouped.filter((r) => r.status === 'absent').length;
      const leave = grouped.filter((r) => r.status === 'leave').length;

      return {
        present,
        absent,
        leave,
        total: grouped.length,
      };
    };

    // Week range (Mon–Fri of current week, Vietnam time)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMon);
    monday.setHours(0, 0, 0, 0);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23, 59, 59, 999);

    const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const weeklyAttendance = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dEnd = new Date(d);
      dEnd.setHours(23, 59, 59, 999);
      const daily = await countAttendanceByRange(d, dEnd);
      weeklyAttendance.push({
        date: d.toISOString().slice(0, 10),
        dayName: DAY_NAMES[d.getDay()],
        present: daily.present,
        absent: daily.absent,
        leave: daily.leave,
        total: daily.total,
      });
    }

    // Today stats
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const todayStats = await countAttendanceByRange(todayStart, todayEnd);

    return res.status(200).json({
      status: 'success',
      data: {
        classes: classes.map((c) => ({ _id: c._id, className: c.className })),
        totalStudents,
        todayAttendance: {
          present: todayStats.present,
          absent: todayStats.absent,
          leave: todayStats.leave,
          total: todayStats.total,
        },
        weeklyAttendance,
      },
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

// ── Danh sách học sinh của giáo viên ──
router.get('/students', authenticate, authorizeRoles('Teacher'), contactBookCtrl.getMyStudents);
router.get('/students/:studentId/change-requests', authenticate, authorizeRoles('Teacher'), contactBookCtrl.getChangeRequests);
router.post('/students/:studentId/change-requests', authenticate, authorizeRoles('Teacher'), contactBookCtrl.createChangeRequest);
router.get('/students/:studentId/evaluation', authenticate, authorizeRoles('Teacher'), contactBookCtrl.getStudentEvaluation);
router.put('/students/:studentId/evaluation', authenticate, authorizeRoles('Teacher'), contactBookCtrl.updateStudentEvaluation);

// ── Sổ liên lạc điện tử ──

/**
 * @openapi
 * /api/teacher/contact-book:
 *   get:
 *     summary: Lấy danh sách lớp giáo viên phụ trách (Sổ liên lạc)
 *     tags: [Teacher - ContactBook]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách lớp
 */
router.get('/contact-book', authenticate, authorizeRoles('Teacher'), contactBookCtrl.getMyClasses);

/**
 * @openapi
 * /api/teacher/contact-book/today-menu:
 *   get:
 *     summary: Xem thực đơn hôm nay (dành cho giáo viên)
 *     tags: [Teacher - ContactBook]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin thực đơn
 */
router.get('/contact-book/today-menu', authenticate, authorizeRoles('Teacher'), contactBookCtrl.getTodayMenu);

/**
 * @openapi
 * /api/teacher/contact-book/{classId}/students:
 *   get:
 *     summary: Danh sách học sinh trong lớp (Sổ liên lạc)
 *     tags: [Teacher - ContactBook]
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
router.get('/contact-book/:classId/students', authenticate, authorizeRoles('Teacher'), contactBookCtrl.getStudentsInClass);

/**
 * @openapi
 * /api/teacher/contact-book/{classId}/students/{studentId}/notes:
 *   get:
 *     summary: Lấy danh sách ghi chú của giáo viên về học sinh
 *     tags: [Teacher - ContactBook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *         description: Lọc theo năm học
 *     responses:
 *       200:
 *         description: Danh sách ghi chú
 *   post:
 *     summary: Tạo ghi chú mới cho học sinh
 *     tags: [Teacher - ContactBook]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
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
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               noteType:
 *                 type: string
 *                 enum: [daily, weekly, monthly, general]
 *                 default: daily
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               academicYearId:
 *                 type: string
 *                 description: ID năm học. Nếu để trống sẽ tự lấy năm hiện tại.
 *     responses:
 *       201:
 *         description: Tạo ghi chú thành công
 */
router.get('/contact-book/:classId/students/:studentId/notes', authenticate, authorizeRoles('Teacher'), contactBookCtrl.getNotes);
router.post('/contact-book/:classId/students/:studentId/notes', authenticate, authorizeRoles('Teacher'), contactBookCtrl.createNote);
router.delete('/contact-book/:classId/students/:studentId/notes/:noteId', authenticate, authorizeRoles('Teacher'), contactBookCtrl.deleteNote);

// ── Asset Inspection (Teacher creates/edits own minutes) ──

/**
 * @openapi
 * /api/teacher/asset-committees:
 *   get:
 *     summary: Danh sách ban kiểm kê tài sản
 *     tags:
 *       - Teacher - Inspection
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *         description: Lọc theo năm học (ObjectId). Response có yearName của ban kiểm kê.
 *     responses:
 *       200:
 *         description: Danh sách ban kiểm kê kèm thông tin năm học
 */
router.get('/asset-committees', authenticate, authorizePermissions('MANAGE_INSPECTION'), assetCtrl.listCommittees);

/**
 * @openapi
 * /api/teacher/asset-minutes:
 *   get:
 *     summary: Danh sách biên bản kiểm kê của tôi
 *     tags:
 *       - Teacher - Inspection
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *         description: Lọc theo năm học (ObjectId). Chỉ trả biên bản do người dùng hiện tại tạo.
 *     responses:
 *       200:
 *         description: Danh sách biên bản kiểm kê kèm thông tin năm học
 *   post:
 *     summary: Tạo biên bản kiểm kê mới
 *     tags:
 *       - Teacher - Inspection
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - inspectionDate
 *             properties:
 *               academicYearId:
 *                 type: string
 *                 description: ID năm học. Bỏ trống → tự động gán năm học đang active.
 *               className:
 *                 type: string
 *               scope:
 *                 type: string
 *               location:
 *                 type: string
 *               inspectionDate:
 *                 type: string
 *                 format: date
 *                 description: Ngày kiểm kê (bắt buộc)
 *               inspectionTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               reason:
 *                 type: string
 *               inspectionMethod:
 *                 type: string
 *               committeeId:
 *                 type: string
 *               assets:
 *                 type: array
 *                 items:
 *                   type: object
 *               conclusion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo biên bản thành công
 *       400:
 *         description: Thiếu inspectionDate
 */
router.get('/asset-minutes', authenticate, authorizePermissions('MANAGE_INSPECTION'), assetCtrl.listMyMinutes);
router.post('/asset-minutes', authenticate, authorizePermissions('MANAGE_INSPECTION'), assetCtrl.createMinutes);
router.get('/asset-minutes/:id', authenticate, authorizePermissions('MANAGE_INSPECTION'), assetCtrl.getMinutes);
router.put('/asset-minutes/:id', authenticate, authorizePermissions('MANAGE_INSPECTION'), assetCtrl.updateMinutes);
router.get('/asset-minutes/:id/export-word', authenticate, authorizePermissions('MANAGE_INSPECTION'), assetCtrl.exportMinutesWord);

// ── Purchase Requests (Yêu cầu mua sắm) ──

/**
 * @openapi
 * /api/teacher/purchase-requests:
 *   get:
 *     summary: Danh sách yêu cầu mua sắm của tôi
 *     tags:
 *       - Teacher - Purchase
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *         description: Lọc theo năm học (ObjectId). Response có yearName.
 *     responses:
 *       200:
 *         description: Danh sách yêu cầu mua sắm
 *   post:
 *     summary: Tạo yêu cầu mua sắm mới
 *     tags:
 *       - Teacher - Purchase
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assetName
 *               - classId
 *             properties:
 *               assetName:
 *                 type: string
 *                 description: Tên tài sản cần mua (bắt buộc)
 *               classId:
 *                 type: string
 *                 description: ID lớp học (bắt buộc, phải là lớp giáo viên phụ trách)
 *               academicYearId:
 *                 type: string
 *                 description: ID năm học. Bỏ trống → tự động gán năm học đang active.
 *               quantity:
 *                 type: number
 *                 default: 1
 *               unit:
 *                 type: string
 *                 default: Cái
 *               estimatedCost:
 *                 type: number
 *               reason:
 *                 type: string
 *               notes:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, pending]
 *                 description: Gửi ngay (pending) hoặc lưu nháp (draft)
 *     responses:
 *       201:
 *         description: Tạo yêu cầu thành công, academicYearId được gán tự động
 *       403:
 *         description: Giáo viên không phụ trách lớp được chọn
 */
router.get('/my-classes', authenticate, authorizePermissions('MANAGE_PURCHASE_REQUEST'), purchaseCtrl.getMyClasses);
router.get('/purchase-requests', authenticate, authorizePermissions('MANAGE_PURCHASE_REQUEST'), purchaseCtrl.listMyRequests);
router.post('/purchase-requests', authenticate, authorizePermissions('MANAGE_PURCHASE_REQUEST'), purchaseCtrl.createRequest);
router.get('/purchase-requests/:id', authenticate, authorizePermissions('MANAGE_PURCHASE_REQUEST'), purchaseCtrl.getRequest);
router.put('/purchase-requests/:id', authenticate, authorizePermissions('MANAGE_PURCHASE_REQUEST'), purchaseCtrl.updateRequest);
router.delete('/purchase-requests/:id', authenticate, authorizePermissions('MANAGE_PURCHASE_REQUEST'), purchaseCtrl.deleteRequest);

// ── Asset Allocation (Tài sản lớp) ──
router.get('/asset-allocations', authenticate, authorizePermissions('MANAGE_ASSET'), incidentCtrl.getMyAllocation);
router.patch('/asset-allocations/:id/confirm', authenticate, authorizePermissions('MANAGE_ASSET'), allocationCtrl.confirmAllocation);
// Danh sách bàn giao active cho Ban kiểm kê chọn lớp
router.get('/asset-allocations/active', authenticate, authorizePermissions('MANAGE_INSPECTION'), allocationCtrl.listAllocations);

// ── Asset Incidents (Báo cáo sự cố) ──
router.get('/asset-incidents',     authenticate, authorizePermissions('MANAGE_ASSET'), incidentCtrl.listMyIncidents);
router.post('/asset-incidents',    authenticate, authorizePermissions('MANAGE_ASSET'), incidentCtrl.createIncident);
router.get('/asset-incidents/:id', authenticate, authorizePermissions('MANAGE_ASSET'), incidentCtrl.getIncident);
router.put('/asset-incidents/:id', authenticate, authorizePermissions('MANAGE_ASSET'), incidentCtrl.updateIncident);
router.delete('/asset-incidents/:id', authenticate, authorizePermissions('MANAGE_ASSET'), incidentCtrl.deleteIncident);

module.exports = router;
