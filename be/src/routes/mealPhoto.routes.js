const express = require('express');
const router = express.Router();
const mealPhotoController = require('../controller/mealPhoto.controller');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// Lấy ảnh theo ngày
router.get('/', authenticate, authorizeRoles('KitchenStaff'), mealPhotoController.getMealPhoto);

// Tạo / cập nhật ảnh cho ngày (upsert)
router.post('/', authenticate, authorizeRoles('KitchenStaff'), mealPhotoController.upsertMealPhoto);

// Thêm / cập nhật ảnh cho một bữa ăn cụ thể
router.post('/meal-entry', authenticate, authorizeRoles('KitchenStaff'), mealPhotoController.upsertMealEntry);

// Xóa một bữa ăn
router.delete('/meal-entry', authenticate, authorizeRoles('KitchenStaff'), mealPhotoController.deleteMealEntry);

// Tổng hợp sĩ số & suất cơm
router.get(
  '/attendance-summary',
  authenticate,
  authorizeRoles('KitchenStaff'),
  mealPhotoController.getAttendanceSummary
);

module.exports = router;
