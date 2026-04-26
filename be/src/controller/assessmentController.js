const service = require('../services/assessmentService');

const getTemplates = async (req, res) => service.getTemplates(req, res);
const upsertTemplate = async (req, res) => service.upsertTemplate(req, res);
const getClassAssessments = async (req, res) => service.getClassAssessments(req, res);
const saveBulkAssessments = async (req, res) => service.saveBulkAssessments(req, res);

module.exports = {
  getTemplates,
  upsertTemplate,
  getClassAssessments,
  saveBulkAssessments
};
