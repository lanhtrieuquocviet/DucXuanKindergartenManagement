const express = require("express");
const router = express.Router();
const foodController = require("../controller/foodController");

/**
 * @openapi
 * /api/food:
 *   post:
 *     summary: Tạo món ăn mới
 *     tags:
 *       - Food
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Food'
 *     responses:
 *       201:
 *         description: Tạo món ăn thành công
 */
router.post("/", foodController.createFood);

/**
 * @openapi
 * /api/food:
 *   get:
 *     summary: Lấy danh sách tất cả món ăn
 *     tags:
 *       - Food
 *     responses:
 *       200:
 *         description: Danh sách món ăn
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Food'
 */
router.get("/", foodController.getFoods);

/**
 * @openapi
 * /api/food/{id}:
 *   get:
 *     summary: Lấy thông tin món ăn theo ID
 *     tags:
 *       - Food
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin món ăn
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Food'
 */
router.get("/:id", foodController.getFoodById);

/**
 * @openapi
 * /api/food/{id}:
 *   put:
 *     summary: Cập nhật thông tin món ăn theo ID
 *     tags:
 *       - Food
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
 *             $ref: '#/components/schemas/Food'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put("/:id", foodController.updateFood);

/**
 * @openapi
 * /api/food/{id}:
 *   delete:
 *     summary: Xóa món ăn theo ID
 *     tags:
 *       - Food
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
router.delete("/:id", foodController.deleteFood);

module.exports = router;
