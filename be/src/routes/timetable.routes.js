const express = require('express');
const timetableController = require('../controller/timetableController');

const router = express.Router();

/**
 * @openapi
 * /api/timetable:
 *   get:
 *     summary: Lấy thời khóa biểu công khai
 *     tags:
 *       - Timetable
 *     parameters:
 *       - in: query
 *         name: yearId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thông tin thời khóa biểu
 */
router.get('/', timetableController.listPublic);

module.exports = router;
