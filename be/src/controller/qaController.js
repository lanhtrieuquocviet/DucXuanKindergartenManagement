const service = require('../services/qaService.js');

const validateCreateQuestion = async (req, res, next) => service.validateCreateQuestion(req, res, next);
const createQuestion = async (req, res, next) => service.createQuestion(req, res, next);
const getQuestions = async (req, res, next) => service.getQuestions(req, res, next);
const validateCreateAnswer = async (req, res, next) => service.validateCreateAnswer(req, res, next);
const createAnswer = async (req, res, next) => service.createAnswer(req, res, next);
const validateUpdateAnswer = async (req, res, next) => service.validateUpdateAnswer(req, res, next);
const updateAnswer = async (req, res, next) => service.updateAnswer(req, res, next);
const validateQuestionId = async (req, res, next) => service.validateQuestionId(req, res, next);
const updateQuestion = async (req, res, next) => service.updateQuestion(req, res, next);
const deleteQuestion = async (req, res, next) => service.deleteQuestion(req, res, next);

module.exports = {
  validateCreateQuestion,
  createQuestion,
  getQuestions,
  validateCreateAnswer,
  createAnswer,
  validateUpdateAnswer,
  updateAnswer,
  validateQuestionId,
  updateQuestion,
  deleteQuestion,
};
