const service = require('../services/curriculumService.js');

const listCurriculumTopics = async (req, res, next) => service.listCurriculumTopics(req, res, next);
const createCurriculumTopic = async (req, res, next) => service.createCurriculumTopic(req, res, next);
const updateCurriculumTopic = async (req, res, next) => service.updateCurriculumTopic(req, res, next);
const deleteCurriculumTopic = async (req, res, next) => service.deleteCurriculumTopic(req, res, next);

module.exports = {
  listCurriculumTopics,
  createCurriculumTopic,
  updateCurriculumTopic,
  deleteCurriculumTopic,
};
