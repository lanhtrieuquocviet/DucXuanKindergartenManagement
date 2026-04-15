const express = require('express');
const { authenticate, authorizeRoles, authorizePermissions } = require('../middleware/auth');
const assetCtrl = require('../controller/assetInspectionController');
const purchaseCtrl = require('../controller/purchaseRequestController');
const incidentCtrl    = require('../controller/assetIncidentController');
const allocationCtrl  = require('../controller/assetAllocationController');
const contactBookCtrl = require('../controller/contactBookController');
const InspectionCommittee = require('../models/InspectionCommittee');
const User = require('../models/User');

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
router.get('/dashboard', authenticate, authorizeRoles('Teacher'), (req, res) => {
  return res.status(200).json({
    status: 'success',
    message: 'Trang Teacher dashboard',
    data: {
      user: req.user,
    },
  });
});

// ── Danh sách học sinh của giáo viên ──
router.get('/students', authenticate, authorizeRoles('Teacher'), contactBookCtrl.getMyStudents);
router.get('/students/:studentId/change-requests', authenticate, authorizeRoles('Teacher'), contactBookCtrl.getChangeRequests);
router.post('/students/:studentId/change-requests', authenticate, authorizeRoles('Teacher'), contactBookCtrl.createChangeRequest);

// ── Sổ liên lạc điện tử ──
router.get('/contact-book', authenticate, authorizeRoles('Teacher'), contactBookCtrl.getMyClasses);
router.get('/contact-book/today-menu', authenticate, authorizeRoles('Teacher'), contactBookCtrl.getTodayMenu);
router.get('/contact-book/:classId/students', authenticate, authorizeRoles('Teacher'), contactBookCtrl.getStudentsInClass);
router.get('/contact-book/:classId/students/:studentId/attendance', authenticate, authorizeRoles('Teacher'), contactBookCtrl.getStudentAttendance);
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
