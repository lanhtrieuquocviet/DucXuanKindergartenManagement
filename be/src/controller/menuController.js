const service = require('../services/menuService.js');

const createMenu = async (req, res, next) => service.createMenu(req, res, next);
const getPublicMenus = async (req, res, next) => service.getPublicMenus(req, res, next);
const getMenus = async (req, res, next) => service.getMenus(req, res, next);
const getPublicMenuDetail = async (req, res, next) => service.getPublicMenuDetail(req, res, next);
const getMenuDetail = async (req, res, next) => service.getMenuDetail(req, res, next);
const updateMenu = async (req, res, next) => service.updateMenu(req, res, next);
const submitMenu = async (req, res, next) => service.submitMenu(req, res, next);
const approveMenu = async (req, res, next) => service.approveMenu(req, res, next);
const rejectMenu = async (req, res, next) => service.rejectMenu(req, res, next);
const requestEditFromActiveMenu = async (req, res, next) => service.requestEditFromActiveMenu(req, res, next);
const applyMenu = async (req, res, next) => service.applyMenu(req, res, next);
const endMenu = async (req, res, next) => service.endMenu(req, res, next);
const headParentReviewMenu = async (req, res, next) => service.headParentReviewMenu(req, res, next);
const getNutritionPlanSetting = async (req, res, next) => service.getNutritionPlanSetting(req, res, next);
const updateNutritionPlanSetting = async (req, res, next) => service.updateNutritionPlanSetting(req, res, next);

module.exports = {
  createMenu,
  getPublicMenus,
  getMenus,
  getPublicMenuDetail,
  getMenuDetail,
  updateMenu,
  submitMenu,
  approveMenu,
  rejectMenu,
  requestEditFromActiveMenu,
  applyMenu,
  endMenu,
  headParentReviewMenu,
  getNutritionPlanSetting,
  updateNutritionPlanSetting,
};
