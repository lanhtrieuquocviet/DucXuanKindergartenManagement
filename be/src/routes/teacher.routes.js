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
    const teacherProfile = await Teacher.findOne({ userId: req.user._id });
    const classes = teacherProfile
      ? await Classes.find({ teacherIds: teacherProfile._id }).select('_id className')
      : [];
    const classIds = classes.map((c) => c._id);

    const totalStudents = classIds.length
      ? await Student.countDocuments({ classId: { $in: classIds }, status: 'active' })
      : 0;

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
      const records = classIds.length
        ? await Attendances.find({ classId: { $in: classIds }, date: { $gte: d, $lte: dEnd } }).select('status')
        : [];
      weeklyAttendance.push({
        date: d.toISOString().slice(0, 10),
        dayName: DAY_NAMES[d.getDay()],
        present: records.filter((r) => r.status === 'present').length,
        absent: records.filter((r) => r.status === 'absent').length,
        leave: records.filter((r) => r.status === 'leave').length,
        total: records.length,
      });
    }

    // Today stats
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const todayRecords = classIds.length
      ? await Attendances.find({ classId: { $in: classIds }, date: { $gte: todayStart, $lte: todayEnd } }).select('status classId')
      : [];

    return res.status(200).json({
      status: 'success',
      data: {
        classes: classes.map((c) => ({ _id: c._id, className: c.className })),
        totalStudents,
        todayAttendance: {
          present: todayRecords.filter((r) => r.status === 'present').length,
          absent: todayRecords.filter((r) => r.status === 'absent').length,
          leave: todayRecords.filter((r) => r.status === 'leave').length,
          total: todayRecords.length,
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
router.get('/contact-book', authenticate, authorizeRoles('Teacher'), contactBookCtrl.getMyClasses);
router.get('/contact-book/today-menu', authenticate, authorizeRoles('Teacher'), contactBookCtrl.getTodayMenu);
router.get('/contact-book/:classId/students', authenticate, authorizeRoles('Teacher'), contactBookCtrl.getStudentsInClass);
router.get('/contact-book/:classId/students/:studentId/attendance', authenticate, authorizeRoles('Teacher'), contactBookCtrl.getStudentAttendance);
router.get('/contact-book/:classId/students/:studentId/health-history', authenticate, authorizeRoles('Teacher'), contactBookCtrl.getStudentHealthHistory);
router.get('/contact-book/:classId/students/:studentId/health', authenticate, authorizeRoles('Teacher'), contactBookCtrl.getStudentHealth);
router.get('/contact-book/:classId/students/:studentId/notes', authenticate, authorizeRoles('Teacher'), contactBookCtrl.getNotes);
router.post('/contact-book/:classId/students/:studentId/notes', authenticate, authorizeRoles('Teacher'), contactBookCtrl.createNote);
router.delete('/contact-book/:classId/students/:studentId/notes/:noteId', authenticate, authorizeRoles('Teacher'), contactBookCtrl.deleteNote);

// ── Asset Inspection (Teacher creates/edits own minutes) ──
router.get('/asset-committees', authenticate, authorizePermissions('MANAGE_INSPECTION'), assetCtrl.listCommittees);
router.get('/asset-minutes', authenticate, authorizePermissions('MANAGE_INSPECTION'), assetCtrl.listMyMinutes);
router.post('/asset-minutes', authenticate, authorizePermissions('MANAGE_INSPECTION'), assetCtrl.createMinutes);
router.get('/asset-minutes/:id', authenticate, authorizePermissions('MANAGE_INSPECTION'), assetCtrl.getMinutes);
router.put('/asset-minutes/:id', authenticate, authorizePermissions('MANAGE_INSPECTION'), assetCtrl.updateMinutes);
router.get('/asset-minutes/:id/export-word', authenticate, authorizePermissions('MANAGE_INSPECTION'), assetCtrl.exportMinutesWord);

// ── Purchase Requests (Yêu cầu mua sắm) ──
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

module.exports = router;
