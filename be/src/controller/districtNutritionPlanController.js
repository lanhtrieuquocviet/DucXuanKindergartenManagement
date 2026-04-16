const service = require('../services/districtNutritionPlanService.js');

const autoArchiveExpiredDistrictPlans = async (req, res, next) => service.autoArchiveExpiredDistrictPlans(req, res, next);
const listDistrictNutritionPlans = async (req, res, next) => service.listDistrictNutritionPlans(req, res, next);
const getDistrictNutritionPlanDetail = async (req, res, next) => service.getDistrictNutritionPlanDetail(req, res, next);
const createDistrictNutritionPlan = async (req, res, next) => service.createDistrictNutritionPlan(req, res, next);
const updateDistrictNutritionPlan = async (req, res, next) => service.updateDistrictNutritionPlan(req, res, next);
const updateScheduledDistrictPlan = async (req, res, next) => service.updateScheduledDistrictPlan(req, res, next);
const applyScheduledDistrictPlanNow = async (req, res, next) => service.applyScheduledDistrictPlanNow(req, res, next);
const deleteScheduledDistrictPlan = async (req, res, next) => service.deleteScheduledDistrictPlan(req, res, next);
const endDistrictNutritionPlan = async (req, res, next) => service.endDistrictNutritionPlan(req, res, next);
const downloadRegulationFile = async (req, res, next) => service.downloadRegulationFile(req, res, next);

module.exports = {
  autoArchiveExpiredDistrictPlans,
  listDistrictNutritionPlans,
  getDistrictNutritionPlanDetail,
  createDistrictNutritionPlan,
  updateDistrictNutritionPlan,
  updateScheduledDistrictPlan,
  applyScheduledDistrictPlanNow,
  deleteScheduledDistrictPlan,
  endDistrictNutritionPlan,
  downloadRegulationFile,
};
