/**
 * face.routes.js
 * Các API endpoint cho hệ thống điểm danh bằng nhận diện khuôn mặt
 *
 * Endpoints:
 *  POST /api/face/register         — Đăng ký embedding cho học sinh
 *  POST /api/face/match            — Nhận diện + tự động check-in (ONLINE)
 *  GET  /api/face/embeddings       — Tải embeddings về thiết bị (cho OFFLINE)
 *  POST /api/face/sync             — Sync dữ liệu điểm danh offline lên server
 */

const express = require('express');
const { authenticate, authorizeRoles, authorizePermissions } = require('../middleware/auth');
const {
  registerFaceEmbedding,
  matchFaceEmbedding,
  getClassEmbeddings,
  syncOfflineAttendance,
  registerPickupFaceEmbedding,
  matchPickupFace,
  matchPickupFaceForCheckout,
  matchStudentFaceForCheckout,
  deleteFaceEmbedding,
} = require('../controller/faceAttendanceController');

const router = express.Router();

/**
 * @openapi
 * /api/face/register:
 *   post:
 *     summary: Đăng ký embedding khuôn mặt cho học sinh
 *     description: |
 *       Frontend detect khuôn mặt bằng face-api.js → tạo embedding 128 chiều
 *       → gửi lên đây để lưu vào DB.
 *       Chỉ SchoolAdmin mới được đăng ký khuôn mặt.
 *     tags:
 *       - Face Attendance
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, embedding]
 *             properties:
 *               studentId:
 *                 type: string
 *                 example: "64a1b2c3d4e5f6789abcdef0"
 *               embedding:
 *                 type: array
 *                 items:
 *                   type: number
 *                 minItems: 128
 *                 maxItems: 128
 *                 description: Vector 128 chiều từ face-api.js
 *     responses:
 *       200:
 *         description: Đăng ký khuôn mặt thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy học sinh
 */
router.post(
  '/register',
  authenticate,
  authorizePermissions('REGISTER_FACE'),
  registerFaceEmbedding,
);

// Xóa toàn bộ khuôn mặt của học sinh
router.delete(
  '/register/:studentId',
  authenticate,
  authorizePermissions('REGISTER_FACE'),
  deleteFaceEmbedding,
);

/**
 * @openapi
 * /api/face/match:
 *   post:
 *     summary: Nhận diện khuôn mặt + tự động check-in (chế độ ONLINE)
 *     description: |
 *       Nhận embedding từ camera → so sánh với tất cả học sinh trong lớp
 *       → trả về học sinh phù hợp nhất → tự động tạo attendance record.
 *     tags:
 *       - Face Attendance
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [embedding, classId]
 *             properties:
 *               embedding:
 *                 type: array
 *                 items:
 *                   type: number
 *                 description: Vector 128 chiều từ camera realtime
 *               classId:
 *                 type: string
 *                 description: ID lớp học cần điểm danh
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Ngày điểm danh (mặc định hôm nay)
 *               autoCheckIn:
 *                 type: boolean
 *                 default: true
 *                 description: Tự động tạo attendance record khi match
 *     responses:
 *       200:
 *         description: |
 *           status có thể là:
 *           - "success": nhận diện và check-in thành công
 *           - "already_checked_in": đã điểm danh rồi
 *           - "no_match": không nhận diện được
 *           - "no_data": lớp chưa có embedding nào
 */
router.post('/match', authenticate, matchFaceEmbedding);

/**
 * @openapi
 * /api/face/embeddings:
 *   get:
 *     summary: Tải embeddings của lớp về thiết bị (cho chế độ OFFLINE)
 *     description: |
 *       Trả về toàn bộ embedding của học sinh trong lớp.
 *       Frontend lưu vào IndexedDB để so sánh khi không có mạng.
 *     tags:
 *       - Face Attendance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID lớp học
 *     responses:
 *       200:
 *         description: Danh sách embeddings
 */
router.get('/embeddings', authenticate, getClassEmbeddings);

/**
 * @openapi
 * /api/face/sync:
 *   post:
 *     summary: Sync dữ liệu điểm danh offline lên server
 *     description: |
 *       Khi device có mạng trở lại, gọi API này để đẩy dữ liệu offline lên.
 *       Backend dùng upsert → không tạo record trùng.
 *     tags:
 *       - Face Attendance
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [records]
 *             properties:
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     studentId:
 *                       type: string
 *                     classId:
 *                       type: string
 *                     date:
 *                       type: string
 *                       format: date
 *                     checkInTime:
 *                       type: string
 *                       description: ISO datetime string
 *                     checkInTimeString:
 *                       type: string
 *                       example: "07:30"
 *     responses:
 *       200:
 *         description: Sync hoàn tất (kèm báo cáo tạo mới / bỏ qua / lỗi)
 */
router.post('/sync', authenticate, syncOfflineAttendance);

// ── Người đưa/đón ─────────────────────────────────────────────────────────────
// Đăng ký embedding khuôn mặt cho người đưa/đón đã duyệt
router.post('/pickup/register', authenticate, authorizePermissions('REGISTER_FACE'), registerPickupFaceEmbedding);

// So sánh khuôn mặt với danh sách người đưa/đón của học sinh
router.post('/pickup/match', authenticate, matchPickupFace);

// Quét mặt người đến đón → tự động ghi điểm danh về cho học sinh trong lớp
router.post('/pickup/checkout', authenticate, authorizePermissions('CHECKOUT_STUDENT'), matchPickupFaceForCheckout);

// Quét khuôn mặt học sinh → tự động ghi điểm danh về (luồng mới: giáo viên đăng ký mặt học sinh)
router.post('/student/checkout', authenticate, authorizePermissions('CHECKOUT_STUDENT'), matchStudentFaceForCheckout);

module.exports = router;
