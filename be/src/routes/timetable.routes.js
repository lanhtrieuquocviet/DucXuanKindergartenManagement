const express = require('express');
const timetableController = require('../controller/timetableController');

const router = express.Router();

// Public: lấy thời khóa biểu theo năm học (cho trang /schedule)
// GET /api/timetable?yearId=xxx (yearId optional, mặc định năm học đang hoạt động)
router.get('/', timetableController.listPublic);

module.exports = router;
