const express = require('express');
const {
  getPublishedPublicInfos,
  getPublishedPublicInfoById,
  getOrganizationStructure,
} = require('../controller/publicInfoController');

const router = express.Router();

/**
 * @openapi
 * /api/public-info:
 *   get:
 *     summary: Lấy danh sách thông tin công khai đã đăng (public)
 *     tags:
 *       - Public Info (Public)
 *     responses:
 *       200:
 *         description: Danh sách thông tin công khai
 */
router.get('/', getPublishedPublicInfos);
router.get('/organization-structure', getOrganizationStructure);

/**
 * @openapi
 * /api/public-info/{id}:
 *   get:
 *     summary: Lấy chi tiết thông tin công khai (public)
 *     tags:
 *       - Public Info (Public)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID thông tin
 *     responses:
 *       200:
 *         description: Chi tiết thông tin
 *       404:
 *         description: Không tìm thấy
 */
router.get('/:id', getPublishedPublicInfoById);

module.exports = router;
