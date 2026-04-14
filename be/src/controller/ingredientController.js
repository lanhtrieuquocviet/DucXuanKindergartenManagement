const service = require('../services/ingredientService.js');

const getIngredients = async (req, res, next) => service.getIngredients(req, res, next);
const createIngredient = async (req, res, next) => service.createIngredient(req, res, next);
const updateIngredient = async (req, res, next) => service.updateIngredient(req, res, next);
const deleteIngredient = async (req, res, next) => service.deleteIngredient(req, res, next);

module.exports = {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
};
