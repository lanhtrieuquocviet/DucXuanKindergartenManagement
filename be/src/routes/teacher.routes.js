const express = require('express');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const assetCtrl = require('../controller/assetInspectionController');
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

// ── Asset Inspection (Teacher creates/edits own minutes) ──

// GET /teacher/asset-committees/is-member — kiểm tra giáo viên hiện tại có trong ban kiểm kê không
router.get('/asset-committees/is-member', authenticate, authorizeRoles('Teacher'), async (req, res) => {
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

router.get('/asset-committees', authenticate, authorizeRoles('Teacher'), assetCtrl.listCommittees);
router.get('/asset-minutes', authenticate, authorizeRoles('Teacher'), assetCtrl.listMyMinutes);
router.post('/asset-minutes', authenticate, authorizeRoles('Teacher'), assetCtrl.createMinutes);
router.get('/asset-minutes/:id', authenticate, authorizeRoles('Teacher'), assetCtrl.getMinutes);
router.put('/asset-minutes/:id', authenticate, authorizeRoles('Teacher'), assetCtrl.updateMinutes);

module.exports = router;
