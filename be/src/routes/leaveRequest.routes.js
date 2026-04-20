const express = require('express');
const { authenticate, authorizePermissions } = require('../middleware/auth');
const {
  createLeaveRequest,
  getMyLeaveRequests,
  getTeacherLeaveRequests,
  updateLeaveRequestStatus,
  cancelLeaveRequest,
  updateMyLeaveRequest,
  deleteMyLeaveRequest,
} = require('../controller/leaveRequestController');

const router = express.Router();

router.post('/requests', authenticate, createLeaveRequest);
router.get('/my-requests', authenticate, getMyLeaveRequests);
router.post('/requests/:id/cancel', authenticate, cancelLeaveRequest);
router.put('/requests/:id', authenticate, updateMyLeaveRequest);
router.delete('/requests/:id', authenticate, deleteMyLeaveRequest);
router.get('/requests', authenticate, authorizePermissions('MANAGE_ATTENDANCE'), getTeacherLeaveRequests);
router.post('/requests/status', authenticate, authorizePermissions('MANAGE_ATTENDANCE'), updateLeaveRequestStatus);

module.exports = router;
