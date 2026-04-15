const service = require('../services/districtNutritionPlanService.js');

const autoArchiveExpiredDistrictPlans = async (req, res, next) => service.autoArchiveExpiredDistrictPlans(req, res, next);
const listDistrictNutritionPlans = async (req, res, next) => service.listDistrictNutritionPlans(req, res, next);
const createDistrictNutritionPlan = async (req, res, next) => service.createDistrictNutritionPlan(req, res, next);
const updateDistrictNutritionPlan = async (req, res, next) => service.updateDistrictNutritionPlan(req, res, next);
const endDistrictNutritionPlan = async (req, res, next) => service.endDistrictNutritionPlan(req, res, next);
const downloadRegulationFile = async (req, res, next) => service.downloadRegulationFile(req, res, next);

module.exports = {
  autoArchiveExpiredDistrictPlans,
  listDistrictNutritionPlans,
  createDistrictNutritionPlan,
  updateDistrictNutritionPlan,
  endDistrictNutritionPlan,
  downloadRegulationFile,
};
