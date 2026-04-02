const express = require("express");
const router = express.Router();
const { authenticate, authorizeRoles, authorizePermissions } = require("../middleware/auth");
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
 *     summary: Tạo đăng ký đón trẻ mới (Phụ huynh)
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
 *             required:
 *               - studentId
 *               - pickupPersonName
 *               - pickupPersonPhone
 *               - pickupDate
 *             properties:
 *               studentId:
 *                 type: string
 *               pickupPersonName:
 *                 type: string
 *                 example: Nguyễn Thị B
 *               pickupPersonPhone:
 *                 type: string
 *                 example: "0901234567"
 *               pickupPersonRelation:
 *                 type: string
 *                 example: Cô
 *               pickupDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-09-20"
 *               note:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo đăng ký thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *   get:
 *     summary: Giáo viên xem danh sách đăng ký đón trẻ chờ duyệt
 *     tags:
 *       - Pickup
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách đăng ký đón trẻ
 *       403:
 *         description: Không có quyền Teacher
 */
router.post("/requests", authenticate, createPickupRequest);
router.get("/requests", authenticate, authorizePermissions("MANAGE_PICKUP"), getPickupRequests);

/**
 * @openapi
 * /api/pickup/my-requests:
 *   get:
 *     summary: Phụ huynh xem danh sách đăng ký của mình
 *     tags:
 *       - Pickup
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách đăng ký đón trẻ của phụ huynh
 */
router.get("/my-requests", authenticate, getMyPickupRequests);

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
router.get("/requests/student/:studentId", authenticate, authorizePermissions("MANAGE_PICKUP"), getApprovedPickupPersonsByStudent);

/**
 * @openapi
 * /api/pickup/requests/status:
 *   post:
 *     summary: Giáo viên duyệt hoặc từ chối đăng ký đón trẻ
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
 *             required:
 *               - requestId
 *               - status
 *             properties:
 *               requestId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *               reason:
 *                 type: string
 *                 description: Lý do từ chối (nếu rejected)
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *       403:
 *         description: Không có quyền Teacher
 */
router.post("/requests/status", authenticate, authorizePermissions("MANAGE_PICKUP"), updatePickupRequestStatus);

/**
 * @openapi
 * /api/pickup/requests/{id}:
 *   put:
 *     summary: Phụ huynh cập nhật đăng ký đón trẻ
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
 *         description: ID đăng ký
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pickupPersonName:
 *                 type: string
 *               pickupPersonPhone:
 *                 type: string
 *               pickupDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Phụ huynh xóa đăng ký đón trẻ
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
 *         description: ID đăng ký
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.put("/requests/:id", authenticate, updateMyPickupRequest);
router.delete("/requests/:id", authenticate, deleteMyPickupRequest);

module.exports = router;
