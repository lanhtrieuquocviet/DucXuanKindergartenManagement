const express = require('express');
const contactController = require('../controller/contactController');

const router = express.Router();

/**
 * @openapi
 * /api/contact:
 *   post:
 *     summary: Gửi liên hệ từ khách hàng
 *     tags:
 *       - Contact
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - phone
 *               - email
 *               - content
 *             properties:
 *               fullName:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Gửi thành công
 *       400:
 *         description: Lỗi validation
 */
router.post(
  '/',
  contactController.validateSubmitContact,
  contactController.submitContact
);

module.exports = router;
