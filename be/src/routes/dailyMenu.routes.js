const express = require("express");
const dailyMenuController = require("../controller/dailyMenu.controller");
const { authenticate, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

/**
 * @openapi
 * /api/daily-menus/{id}:
 *   put:
 *     summary: Cập nhật thực đơn hằng ngày với tính toán dinh dưỡng tự động (KitchenStaff)
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
 *               lunchFoods:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Danh sách ID món bữa trưa
 *               afternoonFoods:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Danh sách ID món bữa chiều
 *     responses:
 *       200:
 *         description: Cập nhật thực đơn ngày thành công - tự động tính toán P-L-G
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProtein:
 *                       type: number
 *                       description: Tổng Protein (grams)
 *                     totalFat:
 *                       type: number
 *                       description: Tổng Fat/Lipid (grams)
 *                     totalCarb:
 *                       type: number
 *                       description: Tổng Carb/Glucid (grams)
 *                     proteinPercentage:
 *                       type: number
 *                       description: Tỉ lệ % Protein so với tổng Kcal
 *                     fatPercentage:
 *                       type: number
 *                       description: Tỉ lệ % Fat so với tổng Kcal
 *                     carbPercentage:
 *                       type: number
 *                       description: Tỉ lệ % Carb so với tổng Kcal
 *       403:
 *         description: Không có quyền KitchenStaff
 *       404:
 *         description: Không tìm thấy thực đơn ngày
 */
router.put("/:id", authenticate, authorizeRoles("KitchenStaff"), dailyMenuController.updateDailyMenu);

module.exports = router;
