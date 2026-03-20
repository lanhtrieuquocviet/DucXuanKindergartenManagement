const express = require('express');
const contactController = require('../controller/contactController');

const router = express.Router();

/**
 * @openapi
 * /api/contact:
 *   post:
 *     summary: Gửi liên hệ đến nhà trường (public)
 *     description: Cho phép bất kỳ ai gửi liên hệ mà không cần đăng nhập
 *     tags:
 *       - Contact (Public)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - message
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Nguyễn Thị Hoa
 *               email:
 *                 type: string
 *                 format: email
 *                 example: hoa@gmail.com
 *               phone:
 *                 type: string
 *                 example: "0901234567"
 *               message:
 *                 type: string
 *                 example: Tôi muốn tìm hiểu về chương trình học của trường.
 *     responses:
 *       201:
 *         description: Gửi liên hệ thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
router.post('/', contactController.validateSubmitContact, contactController.submitContact);

module.exports = router;
