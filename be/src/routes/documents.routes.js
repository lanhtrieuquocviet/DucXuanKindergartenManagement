const express = require('express');
const documentController = require('../controller/documentController');

const router = express.Router();

/**
 * @openapi
 * /api/documents/published:
 *   get:
 *     summary: Lấy danh sách các tài liệu đã xuất bản
 *     tags:
 *       - Documents
 *     responses:
 *       200:
 *         description: Danh sách tài liệu
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Document'
 */
router.get('/published', documentController.getPublishedDocuments);

/**
 * @openapi
 * /api/documents/{id}:
 *   get:
 *     summary: Lấy chi tiết tài liệu đã xuất bản theo ID
 *     tags:
 *       - Documents
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chi tiết tài liệu
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Document'
 *       404:
 *         description: Không tìm thấy tài liệu
 */
router.get('/:id', documentController.getPublishedDocumentById);

module.exports = router;
