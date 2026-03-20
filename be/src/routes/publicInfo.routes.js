const express = require('express');
const { getPublishedPublicInfos, getPublishedPublicInfoById } = require('../controller/publicInfoController');

const router = express.Router();

/**
 * @openapi
 * /api/public-info:
 *   get:
 *     summary: Lấy danh sách các thông tin công khai đã phát hành
 *     tags:
 *       - PublicInfo
 *     responses:
 *       200:
 *         description: Danh sách thông tin
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PublicInfo'
 */
router.get('/', getPublishedPublicInfos);

/**
 * @openapi
 * /api/public-info/{id}:
 *   get:
 *     summary: Lấy chi tiết thông tin công khai theo ID
 *     tags:
 *       - PublicInfo
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết thông tin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PublicInfo'
 */
router.get('/:id', getPublishedPublicInfoById);

module.exports = router;
