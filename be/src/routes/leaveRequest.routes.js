const express = require('express');
const { authenticate, authorizePermissions } = require('../middleware/auth');
const {
  createLeaveRequest,
  getMyLeaveRequests,
  getTeacherLeaveRequests,
  updateLeaveRequestStatus,
} = require('../controller/leaveRequestController');

const router = express.Router();

router.post('/requests', authenticate, createLeaveRequest);
router.get('/my-requests', authenticate, getMyLeaveRequests);
router.get('/requests', authenticate, authorizePermissions('MANAGE_ATTENDANCE'), getTeacherLeaveRequests);
router.post('/requests/status', authenticate, authorizePermissions('MANAGE_ATTENDANCE'), updateLeaveRequestStatus);

module.exports = router;
