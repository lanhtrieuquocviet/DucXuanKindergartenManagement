const express = require('express');
const router = express.Router();
const { authenticate, authorizeRoles } = require('../middleware/auth');
const reportController = require('../controller/reportController');

const allowedRoles = ['KitchenStaff', 'SchoolAdmin'];

router.get('/weekly', authenticate, authorizeRoles(...allowedRoles), reportController.exportWeeklyReport);
router.get('/monthly', authenticate, authorizeRoles(...allowedRoles), reportController.exportMonthlyReport);
router.get('/food-sample', authenticate, authorizeRoles(...allowedRoles), reportController.exportFoodSampleReport);
router.get('/meal-portion', authenticate, authorizeRoles(...allowedRoles), reportController.exportMealPortionReport);

module.exports = router;
