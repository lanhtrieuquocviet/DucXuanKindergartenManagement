const express = require('express');
const router = express.Router();
const ingredientController = require('../controller/ingredientController');

/**
 * @openapi
 * /api/ingredients:
 *   get:
 *     summary: Lấy danh sách ingredients
 *     tags:
 *       - Ingredients
 *     responses:
 *       200:
 *         description: Danh sách nguyên liệu
 *   post:
 *     summary: Tạo nguyên liệu mới
 *     tags:
 *       - Ingredients
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
 *               unit:
 *                 type: string
 *               calories:
 *                 type: number
 *               protein:
 *                 type: number
 *               fat:
 *                 type: number
 *               carb:
 *                 type: number
 *     responses:
 *       201:
 *         description: Tạo nguyên liệu thành công
 */
router.get('/', ingredientController.getIngredients);
router.post('/', ingredientController.createIngredient);

module.exports = router;
