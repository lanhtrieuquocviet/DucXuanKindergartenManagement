const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const reportController = require('../controller/reportController');

const allowedRoles = ['KitchenStaff', 'SchoolAdmin'];

/**
 * @openapi
 * /api/report/weekly:
 *   get:
 *     summary: Xuất báo cáo tuần (Excel)
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: File Excel báo cáo tuần
 */
router.get('/weekly', authenticate, authorizeRoles(...allowedRoles), reportController.exportWeeklyReport);

/**
 * @openapi
 * /api/report/monthly:
 *   get:
 *     summary: Xuất báo cáo tháng (Excel)
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: File Excel báo cáo tháng
 */
router.get('/monthly', authenticate, authorizeRoles(...allowedRoles), reportController.exportMonthlyReport);

/**
 * @openapi
 * /api/report/food-sample:
 *   get:
 *     summary: Xuất báo cáo lưu mẫu thực phẩm (Excel)
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: File Excel báo cáo lưu mẫu
 */
router.get('/food-sample', authenticate, authorizeRoles(...allowedRoles), reportController.exportFoodSampleReport);

/**
 * @openapi
 * /api/report/meal-portion:
 *   get:
 *     summary: Xuất báo cáo suất ăn (Excel)
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: File Excel báo cáo suất ăn
 */
router.get('/meal-portion', authenticate, authorizeRoles(...allowedRoles), reportController.exportMealPortionReport);

module.exports = router;
