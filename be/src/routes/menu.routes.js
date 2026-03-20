const express = require("express");
const router = express.Router();
const menuController = require("../controller/menuController");
const {
  authenticate,
  authorizeRoles,
  // authorizePermissions, // nếu cần dùng permission code sau này
} = require("../middleware/auth"); // điều chỉnh path nếu cần
/**
 * @openapi
 * /api/menu:
 *   post:
 *     summary: Tạo thực đơn mới (Chỉ KitchenStaff)
 *     tags:
 *       - Menu
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Menu'
 *     responses:
 *       201:
 *         description: Tạo mới thành công
 */
router.post("/",authenticate,authorizeRoles('KitchenStaff'), menuController.createMenu);

/**
 * @openapi
 * /api/menu:
 *   get:
 *     summary: Lấy danh sách thực đơn
 *     tags:
 *       - Menu
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách thực đơn
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Menu'
 */
router.get("/",authenticate,menuController.getMenus);

/**
 * @openapi
 * /api/menu/{id}:
 *   get:
 *     summary: Lấy chi tiết thực đơn theo ID
 *     tags:
 *       - Menu
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
 *         description: Chi tiết thực đơn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Menu'
 */
router.get("/:id",authenticate, menuController.getMenuDetail);

/**
 * @openapi
 * /api/menu/{id}:
 *   put:
 *     summary: Cập nhật thực đơn (Chỉ KitchenStaff)
 *     tags:
 *       - Menu
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
 *             $ref: '#/components/schemas/Menu'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put("/:id", authenticate, authorizeRoles('KitchenStaff'),menuController.updateMenu);

/**
 * @openapi
 * /api/menu/{id}/submit:
 *   put:
 *     summary: Gửi thực đơn để duyệt (Chỉ KitchenStaff)
 *     tags:
 *       - Menu
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
 *         description: Gửi thành công
 */
router.put("/:id/submit", authenticate, authorizeRoles('KitchenStaff'),menuController.submitMenu);

/**
 * @openapi
 * /api/menu/{id}/approve:
 *   put:
 *     summary: Duyệt thực đơn (Chỉ SchoolAdmin)
 *     tags:
 *       - Menu
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
 *         description: Duyệt thành công
 */
router.put(
  "/:id/approve",
  authenticate,
  authorizeRoles("SchoolAdmin"),
  menuController.approveMenu
);

/**
 * @openapi
 * /api/menu/{id}/reject:
 *   put:
 *     summary: Từ chối thực đơn (Chỉ SchoolAdmin)
 *     tags:
 *       - Menu
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
 *               rejectReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Từ chối thành công
 */
router.put(
  "/:id/reject",
  authenticate,
  authorizeRoles("SchoolAdmin"),
  menuController.rejectMenu
);

module.exports = router;
