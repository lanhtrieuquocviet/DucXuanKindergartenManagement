const express = require("express");
const router = express.Router();
const menuController = require("../controller/menuController");
const { authenticate, authorizeRoles } = require("../middleware/auth");

/**
 * @openapi
 * /api/menus:
 *   get:
 *     summary: Lấy danh sách thực đơn
 *     tags:
 *       - Menus
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, submitted, approved, rejected]
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Danh sách thực đơn
 *   post:
 *     summary: Tạo thực đơn mới (KitchenStaff)
 *     tags:
 *       - Menus
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - weekStart
 *             properties:
 *               name:
 *                 type: string
 *                 example: Thực đơn tuần 38/2024
 *               weekStart:
 *                 type: string
 *                 format: date
 *                 example: "2024-09-16"
 *               items:
 *                 type: array
 *                 description: Danh sách món ăn trong tuần
 *     responses:
 *       201:
 *         description: Tạo thực đơn thành công
 *       403:
 *         description: Không có quyền KitchenStaff
 */
router.get("/", authenticate, menuController.getMenus);
router.post("/", authenticate, authorizeRoles("KitchenStaff"), menuController.createMenu);

/**
 * @openapi
 * /api/menus/{id}:
 *   get:
 *     summary: Lấy chi tiết thực đơn
 *     tags:
 *       - Menus
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID thực đơn
 *     responses:
 *       200:
 *         description: Chi tiết thực đơn
 *       404:
 *         description: Không tìm thấy thực đơn
 *   put:
 *     summary: Cập nhật thực đơn (KitchenStaff)
 *     tags:
 *       - Menus
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               items:
 *                 type: array
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.get("/:id", authenticate, menuController.getMenuDetail);
router.put("/:id", authenticate, authorizeRoles("KitchenStaff"), menuController.updateMenu);

/**
 * @openapi
 * /api/menus/{id}/submit:
 *   put:
 *     summary: Gửi thực đơn lên SchoolAdmin duyệt (KitchenStaff)
 *     tags:
 *       - Menus
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
 *         description: Gửi duyệt thành công
 *       400:
 *         description: Thực đơn không ở trạng thái draft
 */
router.put("/:id/submit", authenticate, authorizeRoles("KitchenStaff"), menuController.submitMenu);

/**
 * @openapi
 * /api/menus/{id}/approve:
 *   put:
 *     summary: Duyệt thực đơn (SchoolAdmin)
 *     tags:
 *       - Menus
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
 *         description: Duyệt thực đơn thành công
 *       403:
 *         description: Không có quyền SchoolAdmin
 */
router.put("/:id/approve", authenticate, authorizeRoles("SchoolAdmin"), menuController.approveMenu);

/**
 * @openapi
 * /api/menus/{id}/reject:
 *   put:
 *     summary: Từ chối thực đơn (SchoolAdmin)
 *     tags:
 *       - Menus
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Thực đơn chưa đủ dinh dưỡng
 *     responses:
 *       200:
 *         description: Từ chối thực đơn thành công
 *       403:
 *         description: Không có quyền SchoolAdmin
 */
router.put("/:id/reject", authenticate, authorizeRoles("SchoolAdmin"), menuController.rejectMenu);

module.exports = router;
