const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const reportController = require('../controller/reportController');

const allowedRoles = ['KitchenStaff', 'SchoolAdmin'];

/**
 * @openapi
 * /api/reports/weekly:
 *   get:
 *     summary: Xuất báo cáo thực đơn tuần (Excel)
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: weekStart
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *           example: "2024-09-16"
 *         description: Ngày đầu tuần cần xuất báo cáo
 *     responses:
 *       200:
 *         description: File Excel báo cáo tuần
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Không có quyền
 */
router.get('/weekly', authenticate, authorizeRoles(...allowedRoles), reportController.exportWeeklyReport);

/**
 * @openapi
 * /api/reports/monthly:
 *   get:
 *     summary: Xuất báo cáo thực đơn tháng (Excel)
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: string
 *           example: "2024-09"
 *         description: Tháng cần xuất báo cáo (YYYY-MM)
 *     responses:
 *       200:
 *         description: File Excel báo cáo tháng
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/monthly', authenticate, authorizeRoles(...allowedRoles), reportController.exportMonthlyReport);

/**
 * @openapi
 * /api/reports/food-sample:
 *   get:
 *     summary: Xuất báo cáo mẫu thực phẩm (Excel)
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày cần xuất báo cáo
 *     responses:
 *       200:
 *         description: File Excel báo cáo mẫu thực phẩm
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/food-sample', authenticate, authorizeRoles(...allowedRoles), reportController.exportFoodSampleReport);

/**
 * @openapi
 * /api/reports/meal-portion:
 *   get:
 *     summary: Xuất báo cáo suất ăn (Excel)
 *     tags:
 *       - Reports
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Ngày cần xuất báo cáo
 *     responses:
 *       200:
 *         description: File Excel báo cáo suất ăn
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get('/meal-portion', authenticate, authorizeRoles(...allowedRoles), reportController.exportMealPortionReport);

module.exports = router;
