const express = require("express");
const dailyMenuController = require("../controller/dailyMenu.controller");
const { authenticate, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

/**
 * @openapi
 * /api/daily-menus/{id}:
 *   put:
 *     summary: Cập nhật thực đơn hằng ngày (KitchenStaff)
 *     tags:
 *       - Daily Menus
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID thực đơn ngày
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               breakfast:
 *                 type: array
 *                 description: Danh sách món bữa sáng
 *               lunch:
 *                 type: array
 *                 description: Danh sách món bữa trưa
 *               snack:
 *                 type: array
 *                 description: Danh sách món bữa phụ
 *     responses:
 *       200:
 *         description: Cập nhật thực đơn ngày thành công
 *       403:
 *         description: Không có quyền KitchenStaff
 *       404:
 *         description: Không tìm thấy thực đơn ngày
 */
router.put("/:id", authenticate, authorizeRoles("KitchenStaff"), dailyMenuController.updateDailyMenu);

module.exports = router;
