// routes/pickupRoutes.js
const express = require("express");
const router = express.Router();

// Import middleware auth
const {
  authenticate,
  authorizeRoles,
  // authorizePermissions, // nếu cần dùng permission code sau này
} = require("../middleware/auth"); // điều chỉnh path nếu cần

// Import controllers
const {
  createPickupRequest,
  getMyPickupRequests,
  getPickupRequests,
  updatePickupRequestStatus,
  getApprovedPickupPersonsByStudent,
  updateMyPickupRequest,
  deleteMyPickupRequest,
} = require("../controller/pickupController");

/**
 * @openapi
 * /api/pickup/requests:
 *   post:
 *     summary: Tạo yêu cầu đưa đón mới
 *     tags:
 *       - Pickup
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PickupRequest'
 *     responses:
 *       201:
 *         description: Tạo mới thành công
 */
router.post(
  "/requests",
  authenticate, // Bắt buộc đăng nhập + gán req.user
  createPickupRequest
);

/**
 * @openapi
 * /api/pickup/my-requests:
 *   get:
 *     summary: Lấy danh sách yêu cầu đưa đón của tôi
 *     tags:
 *       - Pickup
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách yêu cầu
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PickupRequest'
 */
router.get(
  "/my-requests",
  authenticate,
  getMyPickupRequests
);

/**
 * @openapi
 * /api/pickup/requests:
 *   get:
 *     summary: Lấy danh sách yêu cầu chờ duyệt (Chỉ Teacher)
 *     tags:
 *       - Pickup
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách yêu cầu
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PickupRequest'
 */
router.get(
  "/requests",
  authenticate,
  authorizeRoles("Teacher"), // Chỉ giáo viên
  getPickupRequests
);

/**
 * @openapi
 * /api/pickup/requests/student/{studentId}:
 *   get:
 *     summary: Lấy danh sách người đưa đón đã duyệt của một học sinh
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
 *     responses:
 *       200:
 *         description: Danh sách người đưa đón
 */
router.get(
  "/requests/student/:studentId",
  authenticate,
  authorizeRoles("Teacher"),
  getApprovedPickupPersonsByStudent
);

/**
 * @openapi
 * /api/pickup/requests/status:
 *   post:
 *     summary: Duyệt hoặc từ chối yêu cầu đưa đón (Chỉ Teacher)
 *     tags:
 *       - Pickup
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               requestId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: ['approved', 'rejected']
 *               rejectedReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thành công
 */
router.post(
  "/requests/status",
  authenticate,
  authorizeRoles("Teacher"),
  updatePickupRequestStatus
);
/**
 * @openapi
 * /api/pickup/requests/{id}:
 *   put:
 *     summary: Cập nhật yêu cầu đưa đón
 *     tags:
 *       - Pickup
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PickupRequest'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put("/requests/:id", authenticate, updateMyPickupRequest);

/**
 * @openapi
 * /api/pickup/requests/{id}:
 *   delete:
 *     summary: Xóa yêu cầu đưa đón
 *     tags:
 *       - Pickup
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
router.delete("/requests/:id", authenticate, deleteMyPickupRequest);

module.exports = router;
