const service = require('../services/gradeService');

const listGrades = async (req, res, next) => service.listGrades(req, res, next);
const createGrade = async (req, res, next) => service.createGrade(req, res, next);
const updateGrade = async (req, res, next) => service.updateGrade(req, res, next);
const deleteGrade = async (req, res, next) => service.deleteGrade(req, res, next);

module.exports = {
  listGrades,
  createGrade,
  updateGrade,
  deleteGrade,
};
