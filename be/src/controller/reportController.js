const service = require('../services/reportService.js');

const exportWeeklyReport = async (req, res, next) => service.exportWeeklyReport(req, res, next);
const exportMonthlyReport = async (req, res, next) => service.exportMonthlyReport(req, res, next);
const exportFoodSampleReport = async (req, res, next) => service.exportFoodSampleReport(req, res, next);
const exportMealPortionReport = async (req, res, next) => service.exportMealPortionReport(req, res, next);

module.exports = {
  exportWeeklyReport,
  exportMonthlyReport,
  exportFoodSampleReport,
  exportMealPortionReport,
};
