const express = require("express");
const router = express.Router();
const { authenticate, authorizeRoles } = require("../middleware/auth");
const {
  createPickupRequest,
  getMyPickupRequests,
  getPickupRequests,
  updatePickupRequestStatus,
  getApprovedPickupPersonsByStudent,
  updateMyPickupRequest,
  deleteMyPickupRequest,
} = require("../controller/pickupController");

// 1. Tạo đăng ký mới - Chỉ Parent hoặc StudentParent
router.post(
  "/requests",
  authenticate, // Bắt buộc đăng nhập + gán req.user
  createPickupRequest
);

// 2. Phụ huynh xem danh sách đăng ký của mình
router.get(
  "/my-requests",
  authenticate,
  getMyPickupRequests
);

/**
 * @openapi
 * /api/pickup/requests/student/{studentId}:
 *   get:
 *     summary: Giáo viên xem người đón đã được duyệt của học sinh
 *     tags:
 *       - Pickup
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID học sinh
 *     responses:
 *       200:
 *         description: Danh sách người đón đã duyệt
 *       403:
 *         description: Không có quyền Teacher
 */
router.get("/requests/student/:studentId", authenticate, authorizeRoles("Teacher", "SchoolAdmin"), getApprovedPickupPersonsByStudent);

// 5. Giáo viên xem danh sách người đưa đón đã duyệt của một học sinh
router.get(
  "/requests/student/:studentId",
  authenticate,
  authorizeRoles("Teacher"),
  getApprovedPickupPersonsByStudent
);

// 4. Giáo viên duyệt hoặc từ chối
router.post(
  "/requests/status",
  authenticate,
  authorizeRoles("Teacher"),
  updatePickupRequestStatus
);
// Update requests by parent
router.put("/requests/:id", authenticate, updateMyPickupRequest);
// Delete requests by parent
router.delete("/requests/:id", authenticate, deleteMyPickupRequest);

module.exports = router;
