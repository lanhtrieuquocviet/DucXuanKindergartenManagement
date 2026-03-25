const express = require('express');
const router = express.Router();
const mealPhotoController = require('../controller/mealPhoto.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth');

/**
 * @openapi
 * /api/meal-photos:
 *   get:
 *     summary: Lấy ảnh bữa ăn theo ngày (KitchenStaff / SchoolAdmin)
 *     tags:
 *       - Meal Photos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày cần xem (YYYY-MM-DD), mặc định hôm nay
 *     responses:
 *       200:
 *         description: Dữ liệu ảnh bữa ăn của ngày
 *       403:
 *         description: Không có quyền
 *   post:
 *     summary: Tạo hoặc cập nhật bản ghi ảnh bữa ăn cho ngày (KitchenStaff)
 *     tags:
 *       - Meal Photos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-09-16"
 *     responses:
 *       200:
 *         description: Tạo / cập nhật thành công
 */
router.get('/', authenticate, authorizeRoles('KitchenStaff', 'SchoolAdmin', 'Student', 'Parent', 'StudentParent'), mealPhotoController.getMealPhoto);
router.post('/', authenticate, authorizeRoles('KitchenStaff'), mealPhotoController.upsertMealPhoto);

/**
 * @openapi
 * /api/meal-photos/meal-entry:
 *   post:
 *     summary: Thêm hoặc cập nhật ảnh cho một bữa ăn (KitchenStaff)
 *     tags:
 *       - Meal Photos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - mealType
 *               - photoUrl
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               mealType:
 *                 type: string
 *                 enum: [breakfast, lunch, snack]
 *               photoUrl:
 *                 type: string
 *                 example: https://res.cloudinary.com/.../meal.jpg
 *     responses:
 *       200:
 *         description: Cập nhật ảnh bữa ăn thành công
 *   delete:
 *     summary: Xóa ảnh bữa ăn (KitchenStaff)
 *     tags:
 *       - Meal Photos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - mealType
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               mealType:
 *                 type: string
 *                 enum: [breakfast, lunch, snack]
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.post('/meal-entry', authenticate, authorizeRoles('KitchenStaff'), mealPhotoController.upsertMealEntry);
router.delete('/meal-entry', authenticate, authorizeRoles('KitchenStaff'), mealPhotoController.deleteMealEntry);

/**
 * @openapi
 * /api/meal-photos/sample-entry:
 *   post:
 *     summary: Thêm hoặc cập nhật mẫu thực phẩm (KitchenStaff)
 *     tags:
 *       - Meal Photos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - foodName
 *               - photoUrl
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               foodName:
 *                 type: string
 *                 example: Thịt bò xào rau
 *               photoUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật mẫu thực phẩm thành công
 *   delete:
 *     summary: Xóa mẫu thực phẩm (KitchenStaff)
 *     tags:
 *       - Meal Photos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - sampleEntryId
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               sampleEntryId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.post('/sample-entry', authenticate, authorizeRoles('KitchenStaff'), mealPhotoController.upsertSampleEntry);
router.delete('/sample-entry', authenticate, authorizeRoles('KitchenStaff'), mealPhotoController.deleteSampleEntry);

/**
 * @openapi
 * /api/meal-photos/sample-entry/review:
 *   put:
 *     summary: SchoolAdmin duyệt mẫu thực phẩm
 *     tags:
 *       - Meal Photos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - sampleEntryId
 *               - status
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               sampleEntryId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Duyệt mẫu thực phẩm thành công
 *       403:
 *         description: Không có quyền SchoolAdmin
 */
router.put('/sample-entry/review', authenticate, authorizeRoles('SchoolAdmin'), mealPhotoController.reviewSampleEntry);

/**
 * @openapi
 * /api/meal-photos/attendance-summary:
 *   get:
 *     summary: Tổng hợp sĩ số và suất cơm (KitchenStaff / SchoolAdmin)
 *     tags:
 *       - Meal Photos
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày cần xem
 *     responses:
 *       200:
 *         description: Tổng hợp sĩ số
 */
router.get('/attendance-summary', authenticate, authorizeRoles('KitchenStaff', 'SchoolAdmin'), mealPhotoController.getAttendanceSummary);

/**
 * @openapi
 * /api/meal-photos/edit-request:
 *   post:
 *     summary: Bếp trưởng gửi yêu cầu chỉnh sửa sau khi đã duyệt
 *     tags:
 *       - Meal Photos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - reason
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               reason:
 *                 type: string
 *                 example: Cần sửa ảnh mẫu thực phẩm bữa trưa
 *     responses:
 *       200:
 *         description: Gửi yêu cầu thành công
 */
router.post('/edit-request', authenticate, authorizeRoles('KitchenStaff'), mealPhotoController.requestEdit);

/**
 * @openapi
 * /api/meal-photos/edit-request/approve:
 *   put:
 *     summary: SchoolAdmin duyệt yêu cầu chỉnh sửa
 *     tags:
 *       - Meal Photos
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - approved
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               approved:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Xử lý yêu cầu chỉnh sửa thành công
 */
router.put('/edit-request/approve', authenticate, authorizeRoles('SchoolAdmin'), mealPhotoController.approveEditRequest);

module.exports = router;
