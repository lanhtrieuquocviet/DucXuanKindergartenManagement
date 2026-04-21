const express = require('express');
const homeController = require('../controller/homeController');

const router = express.Router();

/**
 * @openapi
 * /api/home/data:
 *   get:
 *     summary: Lấy toàn bộ dữ liệu trang chủ (public)
 *     tags:
 *       - Home (Public)
 *     responses:
 *       200:
 *         description: Dữ liệu trang chủ tổng hợp
 */
router.get('/data', homeController.getHomepageData);

module.exports = router;
