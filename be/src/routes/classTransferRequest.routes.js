const express = require('express');
const { authenticate, authorizePermissions } = require('../middleware/auth');
const {
  createClassTransferRequest,
  getMyClassTransferRequests,
  cancelClassTransferRequest,
  getTeacherClassTransferRequests,
  getAdminClassTransferRequests,
  updateClassTransferRequestStatus,
} = require('../services/classTransferRequest.service');

const router = express.Router();

// ── Parent ────────────────────────────────────────────────────────────────────
router.post('/requests', authenticate, createClassTransferRequest);
router.get('/my-requests', authenticate, getMyClassTransferRequests);
router.post('/requests/:id/cancel', authenticate, cancelClassTransferRequest);

// ── Teacher (BR-169) ──────────────────────────────────────────────────────────
router.get('/teacher-requests', authenticate, getTeacherClassTransferRequests);

// ── Admin (BR-168) ────────────────────────────────────────────────────────────
router.get('/admin-requests', authenticate, authorizePermissions('MANAGE_STUDENT'), getAdminClassTransferRequests);
router.patch('/requests/:id/status', authenticate, authorizePermissions('MANAGE_STUDENT'), updateClassTransferRequestStatus);

module.exports = router;
