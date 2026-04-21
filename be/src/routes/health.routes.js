const express = require("express");
const router = express.Router();
const healthController = require("../controller/healthController");
const { authenticate, authorizeRoles, authorizePermissions } = require("../middleware/auth");

/**
 * @openapi
 * tags:
 *   name: Health
 *   description: Quản lý hồ sơ sức khỏe học sinh
 */

/**
 * @openapi
 * /api/health/records:
 *   get:
 *     summary: Lấy danh sách hồ sơ sức khỏe
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: studentId
 *         schema:
 *           type: string
 *         description: Lọc theo ID học sinh
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [healthy, monitor, concerning]
 *         description: Lọc theo tình trạng sức khỏe
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *         description: Lọc theo năm học (ObjectId). Response có thêm trường academicYearId.yearName.
 *     responses:
 *       200:
 *         description: Danh sách hồ sơ sức khỏe (tối đa 100 bản ghi)
 */
router.get(
  "/records",
  authenticate,
  authorizePermissions("MANAGE_HEALTH"),
  healthController.getHealthCheckRecords
);

/**
 * @openapi
 * /api/health/statistics:
 *   get:
 *     summary: Thống kê tổng quan sức khỏe
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu lọc (kết hợp với endDate)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc lọc (kết hợp với startDate)
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *         description: Lọc theo năm học (ObjectId)
 *     responses:
 *       200:
 *         description: Thống kê số lượng healthy / monitor / concerning và danh sách cần tái khám
 */
router.get(
  "/statistics",
  authenticate,
  authorizePermissions("MANAGE_HEALTH"),
  healthController.getHealthStatistics
);

/**
 * @openapi
 * /api/health/record/{id}:
 *   get:
 *     summary: Lấy chi tiết một hồ sơ sức khỏe
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hồ sơ sức khỏe
 *     responses:
 *       200:
 *         description: Chi tiết hồ sơ, bao gồm academicYearId.yearName
 *       404:
 *         description: Không tìm thấy hồ sơ
 *   put:
 *     summary: Cập nhật hồ sơ sức khỏe
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               height:
 *                 type: number
 *               weight:
 *                 type: number
 *               temperature:
 *                 type: number
 *               heartRate:
 *                 type: number
 *               generalStatus:
 *                 type: string
 *                 enum: [healthy, monitor, concerning]
 *               notes:
 *                 type: string
 *               recommendations:
 *                 type: string
 *               followUpDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy hồ sơ
 *   delete:
 *     summary: Xóa hồ sơ sức khỏe
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy hồ sơ
 */
router.get(
  "/record/:id",
  authenticate,
  authorizePermissions("MANAGE_HEALTH"),
  healthController.getHealthCheckById
);

/**
 * @openapi
 * /api/health/student/{studentId}:
 *   get:
 *     summary: Lịch sử khám sức khỏe của một học sinh
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID học sinh
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *         description: Lọc theo năm học (ObjectId). Bỏ trống để lấy toàn bộ lịch sử.
 *     responses:
 *       200:
 *         description: Danh sách lịch sử khám + xu hướng chiều cao/cân nặng
 *       404:
 *         description: Không tìm thấy học sinh
 */
router.get(
  "/student/:studentId",
  authenticate,
  authorizePermissions("MANAGE_HEALTH"),
  healthController.getStudentHealthHistory
);

/**
 * @openapi
 * /api/health/record:
 *   post:
 *     summary: Tạo hồ sơ sức khỏe mới cho học sinh
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentId
 *             properties:
 *               studentId:
 *                 type: string
 *                 description: ID học sinh (bắt buộc)
 *               academicYearId:
 *                 type: string
 *                 description: ID năm học. Bỏ trống → tự động gán năm học đang active.
 *               height:
 *                 type: number
 *                 description: Chiều cao (cm)
 *               weight:
 *                 type: number
 *                 description: Cân nặng (kg)
 *               temperature:
 *                 type: number
 *                 description: Nhiệt độ cơ thể (°C, từ 35 đến 43)
 *               heartRate:
 *                 type: number
 *                 description: Nhịp tim (bpm)
 *               generalStatus:
 *                 type: string
 *                 enum: [healthy, monitor, concerning]
 *                 default: healthy
 *               notes:
 *                 type: string
 *               recommendations:
 *                 type: string
 *               followUpDate:
 *                 type: string
 *                 format: date
 *                 description: Ngày tái khám
 *     responses:
 *       201:
 *         description: Tạo hồ sơ sức khỏe thành công
 *       400:
 *         description: Thiếu studentId hoặc dữ liệu không hợp lệ
 *       404:
 *         description: Không tìm thấy học sinh
 */
router.post(
  "/record",
  authenticate,
  authorizePermissions("MANAGE_HEALTH"),
  healthController.createHealthCheck
);

router.put(
  "/record/:id",
  authenticate,
  authorizePermissions("MANAGE_HEALTH"),
  healthController.updateHealthCheck
);

router.delete(
  "/record/:id",
  authenticate,
  authorizePermissions("MANAGE_HEALTH"),
  healthController.deleteHealthCheck
);

/**
 * @openapi
 * /api/health/export/records:
 *   get:
 *     summary: Xuất danh sách hồ sơ sức khỏe (CSV format)
 *     tags: [Health]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày bắt đầu
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày kết thúc
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [healthy, monitor, concerning]
 *         description: Lọc theo tình trạng sức khỏe
 *       - in: query
 *         name: academicYearId
 *         schema:
 *           type: string
 *         description: Lọc theo năm học. Kết quả sẽ có thêm cột "Academic Year".
 *     responses:
 *       200:
 *         description: Dữ liệu headers + rows định dạng CSV
 */
router.get(
  "/export/records",
  authenticate,
  authorizePermissions("MANAGE_HEALTH"),
  healthController.exportHealthRecords
);

module.exports = router;
