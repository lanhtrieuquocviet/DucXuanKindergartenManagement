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

/**
 * @openapi
 * tags:
 *   name: LeaveRequest
 *   description: Quản lý đơn xin nghỉ học
 */

/**
 * @openapi
 * /api/leave/requests:
 *   post:
 *     summary: Tạo đơn xin nghỉ học mới (Phụ huynh)
 *     tags: [LeaveRequest]
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
 *               - fromDate
 *               - toDate
 *               - reason
 *             properties:
 *               studentId:
 *                 type: string
 *                 description: ID học sinh
 *               fromDate:
 *                 type: string
 *                 format: date
 *                 description: Nghỉ từ ngày
 *               toDate:
 *                 type: string
 *                 format: date
 *                 description: Nghỉ đến hết ngày
 *               reason:
 *                 type: string
 *                 description: Lý do xin nghỉ
 *               academicYearId:
 *                 type: string
 *                 description: ID năm học. Nếu để trống sẽ tự động lấy năm học hiện tại.
 *     responses:
 *       201:
 *         description: Tạo đơn thành công
 *   get:
 *     summary: Lấy danh sách đơn xin nghỉ (Giáo viên/Nhà trường)
 *     tags: [LeaveRequest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, cancelled]
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *         description: Lọc theo năm học
 *     responses:
 *       200:
 *         description: Danh sách đơn xin nghỉ
 */
router.post('/requests', authenticate, createLeaveRequest);
router.get('/requests', authenticate, authorizePermissions('MANAGE_ATTENDANCE'), getTeacherLeaveRequests);

/**
 * @openapi
 * /api/leave/my-requests:
 *   get:
 *     summary: Danh sách đơn xin nghỉ của con tôi (Phụ huynh)
 *     tags: [LeaveRequest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Danh sách đơn của phụ huynh
 */
router.get('/my-requests', authenticate, getMyLeaveRequests);

/**
 * @openapi
 * /api/leave/requests/{id}/cancel:
 *   post:
 *     summary: Hủy đơn xin nghỉ (Phụ huynh)
 *     tags: [LeaveRequest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Hủy thành công
 */
router.post('/requests/:id/cancel', authenticate, cancelLeaveRequest);

/**
 * @openapi
 * /api/leave/requests/{id}:
 *   put:
 *     summary: Cập nhật đơn xin nghỉ (Phụ huynh - chỉ khi còn pending)
 *     tags: [LeaveRequest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fromDate:
 *                 type: string
 *                 format: date
 *               toDate:
 *                 type: string
 *                 format: date
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa đơn xin nghỉ (Phụ huynh - chỉ khi còn pending)
 *     tags: [LeaveRequest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.put('/requests/:id', authenticate, updateMyLeaveRequest);
router.delete('/requests/:id', authenticate, deleteMyLeaveRequest);

/**
 * @openapi
 * /api/leave/requests/status:
 *   post:
 *     summary: Duyệt hoặc từ chối đơn xin nghỉ (Giáo viên)
 *     tags: [LeaveRequest]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - requestId
 *               - status
 *             properties:
 *               requestId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *               rejectedReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.post('/requests/status', authenticate, authorizePermissions('MANAGE_ATTENDANCE'), updateLeaveRequestStatus);

module.exports = router;
