const service = require('../services/aiMenuService.js');

const analyzeDailyMenu = async (req, res, next) => service.analyzeDailyMenu(req, res, next);
const improveDish = async (req, res, next) => service.improveDish(req, res, next);
const suggestNewDishes = async (req, res, next) => service.suggestNewDishes(req, res, next);
const chatAboutMenu = async (req, res, next) => service.chatAboutMenu(req, res, next);
const createDishFromAISuggestion = async (req, res, next) => service.createDishFromAISuggestion(req, res, next);
const suggestMenuBalance = async (req, res, next) => service.suggestMenuBalance(req, res, next);
const healthCheck = async (req, res, next) => service.healthCheck(req, res, next);

module.exports = {
  analyzeDailyMenu,
  improveDish,
  suggestNewDishes,
  chatAboutMenu,
  createDishFromAISuggestion,
  suggestMenuBalance,
  healthCheck,
};
