const express = require("express");
const router = express.Router();
const foodController = require("../controller/foodController");

/**
 * @openapi
 * /api/foods:
 *   get:
 *     summary: Lấy danh sách thực phẩm
 *     tags:
 *       - Foods
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách thực phẩm
 *   post:
 *     summary: Tạo thực phẩm mới
 *     tags:
 *       - Foods
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: Thịt bò
 *               unit:
 *                 type: string
 *                 example: kg
 *               calories:
 *                 type: number
 *                 example: 250
 *               category:
 *                 type: string
 *                 example: Thịt
 *     responses:
 *       201:
 *         description: Tạo thực phẩm thành công
 */
router.get("/", foodController.getFoods);
router.post("/", foodController.createFood);

/**
 * @openapi
 * /api/foods/{id}:
 *   get:
 *     summary: Lấy chi tiết thực phẩm
 *     tags:
 *       - Foods
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID thực phẩm
 *     responses:
 *       200:
 *         description: Chi tiết thực phẩm
 *       404:
 *         description: Không tìm thấy thực phẩm
 *   put:
 *     summary: Cập nhật thực phẩm
 *     tags:
 *       - Foods
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
 *               unit:
 *                 type: string
 *               calories:
 *                 type: number
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa thực phẩm
 *     tags:
 *       - Foods
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
router.get("/:id", foodController.getFoodById);
router.put("/:id", foodController.updateFood);
router.delete("/:id", foodController.deleteFood);

module.exports = router;
