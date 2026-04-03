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

// ── Sổ liên lạc điện tử ──
router.get('/contact-book', authenticate, authorizeRoles('Teacher'), contactBookCtrl.getMyClasses);
router.get('/contact-book/:classId/students', authenticate, authorizeRoles('Teacher'), contactBookCtrl.getStudentsInClass);
router.get('/contact-book/:classId/students/:studentId/attendance', authenticate, authorizeRoles('Teacher'), contactBookCtrl.getStudentAttendance);
router.get('/contact-book/:classId/students/:studentId/health', authenticate, authorizeRoles('Teacher'), contactBookCtrl.getStudentHealth);

// ── Asset Inspection (Teacher creates/edits own minutes) ──

// GET /teacher/asset-committees/is-member — kiểm tra giáo viên hiện tại có trong ban kiểm kê không
router.get('/asset-committees/is-member', authenticate, authorizePermissions('MANAGE_ASSET'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('fullName').lean();
    const fullName = user?.fullName;
    if (!fullName) return res.json({ status: 'success', data: { isMember: false } });
    const found = await InspectionCommittee.findOne({ 'members.fullName': fullName }).lean();
    return res.json({ status: 'success', data: { isMember: !!found } });
  } catch (err) {
    return res.status(500).json({ status: 'error', message: 'Lỗi kiểm tra thành viên' });
  }
});

router.get('/asset-committees', authenticate, authorizePermissions('MANAGE_ASSET'), assetCtrl.listCommittees);
router.get('/asset-minutes', authenticate, authorizePermissions('MANAGE_ASSET'), assetCtrl.listMyMinutes);
router.post('/asset-minutes', authenticate, authorizePermissions('MANAGE_ASSET'), assetCtrl.createMinutes);
router.get('/asset-minutes/:id', authenticate, authorizePermissions('MANAGE_ASSET'), assetCtrl.getMinutes);
router.put('/asset-minutes/:id', authenticate, authorizePermissions('MANAGE_ASSET'), assetCtrl.updateMinutes);

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

// ── Asset Incidents (Báo cáo sự cố) ──
router.get('/asset-incidents',     authenticate, authorizePermissions('MANAGE_ASSET'), incidentCtrl.listMyIncidents);
router.post('/asset-incidents',    authenticate, authorizePermissions('MANAGE_ASSET'), incidentCtrl.createIncident);
router.get('/asset-incidents/:id', authenticate, authorizePermissions('MANAGE_ASSET'), incidentCtrl.getIncident);

module.exports = router;
