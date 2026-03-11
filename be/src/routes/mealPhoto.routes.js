const express = require('express');
const router = express.Router();
const mealPhotoController = require('../controller/mealPhoto.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// Lấy ảnh theo ngày (KitchenStaff + SchoolAdmin)
router.get('/', authenticate, authorizeRoles('KitchenStaff', 'SchoolAdmin'), mealPhotoController.getMealPhoto);

// Tạo / cập nhật ảnh cho ngày (upsert)
router.post('/', authenticate, authorizeRoles('KitchenStaff'), mealPhotoController.upsertMealPhoto);

// Thêm / cập nhật ảnh cho một bữa ăn cụ thể
router.post('/meal-entry', authenticate, authorizeRoles('KitchenStaff'), mealPhotoController.upsertMealEntry);

// Xóa một bữa ăn
router.delete('/meal-entry', authenticate, authorizeRoles('KitchenStaff'), mealPhotoController.deleteMealEntry);

// Thêm / cập nhật mẫu thực phẩm cho một bữa ăn
router.post('/sample-entry', authenticate, authorizeRoles('KitchenStaff'), mealPhotoController.upsertSampleEntry);

// Xóa một mẫu thực phẩm
router.delete('/sample-entry', authenticate, authorizeRoles('KitchenStaff'), mealPhotoController.deleteSampleEntry);

// Tổng hợp sĩ số & suất cơm (cả SchoolAdmin xem được)
router.get(
  '/attendance-summary',
  authenticate,
  authorizeRoles('KitchenStaff', 'SchoolAdmin'),
  mealPhotoController.getAttendanceSummary
);

// School admin duyệt mẫu thực phẩm
router.put(
  '/sample-entry/review',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  mealPhotoController.reviewSampleEntry
);

// Bếp trưởng gửi yêu cầu chỉnh sửa
router.post(
  '/edit-request',
  authenticate,
  authorizeRoles('KitchenStaff'),
  mealPhotoController.requestEdit
);

// School admin duyệt yêu cầu chỉnh sửa
router.put(
  '/edit-request/approve',
  authenticate,
  authorizeRoles('SchoolAdmin'),
  mealPhotoController.approveEditRequest
);

module.exports = router;
