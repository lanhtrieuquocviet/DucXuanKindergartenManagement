const express = require('express');
const qaController = require('../controller/qaController');

const router = express.Router();

/**
 * @openapi
 * /api/qa/questions:
 *   get:
 *     summary: Lấy danh sách câu hỏi Q&A
 *     tags:
 *       - QA
 *     responses:
 *       200:
 *         description: Danh sách câu hỏi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Question'
 */
router.get('/questions', qaController.getQuestions);

/**
 * @openapi
 * /api/qa/questions:
 *   post:
 *     summary: Gửi một câu hỏi mới
 *     tags:
 *       - QA
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Question'
 *     responses:
 *       201:
 *         description: Gửi câu hỏi thành công
 */
router.post(
  '/questions',
  qaController.validateCreateQuestion,
  qaController.createQuestion,
);

/**
 * @openapi
 * /api/qa/questions/{id}/answers:
 *   post:
 *     summary: Gửi câu trả lời cho một câu hỏi
 *     tags:
 *       - QA
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
 *               authorName:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Gửi câu trả lời thành công
 */
router.post(
  '/questions/:id/answers',
  qaController.validateCreateAnswer,
  qaController.createAnswer,
);

module.exports = router;

