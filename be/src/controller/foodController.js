const service = require('../services/foodService.js');

const createFood = async (req, res, next) => service.createFood(req, res, next);
const getFoods = async (req, res, next) => service.getFoods(req, res, next);
const getFoodById = async (req, res, next) => service.getFoodById(req, res, next);
const updateFood = async (req, res, next) => service.updateFood(req, res, next);
const deleteFood = async (req, res, next) => service.deleteFood(req, res, next);

module.exports = {
  createFood,
  getFoods,
  getFoodById,
  updateFood,
  deleteFood,
};
