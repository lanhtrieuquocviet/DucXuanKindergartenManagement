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

// 3. Giáo viên xem danh sách chờ duyệt (của lớp mình phụ trách)
router.get(
  "/requests",
  authenticate,
  authorizeRoles("Teacher"), // Chỉ giáo viên
  getPickupRequests
);

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
