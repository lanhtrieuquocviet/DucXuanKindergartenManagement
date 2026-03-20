const express = require('express');
const qaController = require('../controller/qaController');

const router = express.Router();

/**
 * @openapi
 * /api/qa/questions:
 *   get:
 *     summary: Lấy danh sách câu hỏi Q&A (public)
 *     tags:
 *       - Q&A (Public)
 *     responses:
 *       200:
 *         description: Danh sách câu hỏi thường gặp
 *   post:
 *     summary: Gửi câu hỏi mới (public)
 *     tags:
 *       - Q&A (Public)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *               - authorName
 *             properties:
 *               question:
 *                 type: string
 *                 example: Trường có chương trình bán trú không?
 *               authorName:
 *                 type: string
 *                 example: Phụ huynh Nguyễn Văn A
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: Gửi câu hỏi thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.get('/questions', qaController.getQuestions);
router.post('/questions', qaController.validateCreateQuestion, qaController.createQuestion);

/**
 * @openapi
 * /api/qa/questions/{id}/answers:
 *   post:
 *     summary: Thêm câu trả lời cho câu hỏi (public)
 *     tags:
 *       - Q&A (Public)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID câu hỏi
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answer
 *               - authorName
 *             properties:
 *               answer:
 *                 type: string
 *                 example: Có, trường có chương trình bán trú từ 11h-14h.
 *               authorName:
 *                 type: string
 *                 example: Ban Giám Hiệu
 *     responses:
 *       201:
 *         description: Thêm câu trả lời thành công
 *       404:
 *         description: Không tìm thấy câu hỏi
 */
router.post('/questions/:id/answers', qaController.validateCreateAnswer, qaController.createAnswer);

module.exports = router;
