const express = require('express');
const documentController = require('../controller/documentController');

const router = express.Router();

/**
 * @openapi
 * /api/documents/published:
 *   get:
 *     summary: Lấy danh sách tài liệu đã đăng (public)
 *     tags:
 *       - Documents (Public)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *     responses:
 *       200:
 *         description: Danh sách tài liệu đã đăng
 */
router.get('/published', documentController.getPublishedDocuments);

/**
 * @openapi
 * /api/documents/{id}:
 *   get:
 *     summary: Lấy chi tiết tài liệu đã đăng (public)
 *     tags:
 *       - Documents (Public)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID tài liệu
 *     responses:
 *       200:
 *         description: Chi tiết tài liệu
 *       404:
 *         description: Không tìm thấy tài liệu hoặc chưa được đăng
 */
router.get('/:id', documentController.getPublishedDocumentById);

module.exports = router;
