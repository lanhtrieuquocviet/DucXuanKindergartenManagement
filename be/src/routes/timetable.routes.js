const express = require('express');
const timetableController = require('../controller/timetableController');

const router = express.Router();

/**
 * @openapi
 * /api/timetable:
 *   get:
 *     summary: Lấy thời khóa biểu công khai (public)
 *     description: Không cần đăng nhập. Trả về thời khóa biểu của năm học đang hoạt động hoặc năm học chỉ định.
 *     tags:
 *       - Timetable (Public)
 *     parameters:
 *       - in: query
 *         name: yearId
 *         schema:
 *           type: string
 *         description: ID năm học (tùy chọn, mặc định năm học hiện tại)
 *     responses:
 *       200:
 *         description: Thời khóa biểu
 */
router.get('/', timetableController.listPublic);

module.exports = router;
