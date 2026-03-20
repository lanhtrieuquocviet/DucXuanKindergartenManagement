const express = require("express");
const dailyMenuController = require("../controller/dailyMenu.controller");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const router = express.Router();
/**
 * @openapi
 * /api/daily-menu/{id}:
 *   put:
 *     summary: Cập nhật thực đơn hàng ngày theo ID (Chỉ KitchenStaff)
 *     tags:
 *       - DailyMenu
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
 *             $ref: '#/components/schemas/DailyMenu'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put(
  "/:id",
  authenticate,
  authorizeRoles("KitchenStaff"),
  dailyMenuController.updateDailyMenu
);
module.exports = router;