const service = require('../services/assetAdjustmentService');

const listAdjustments = async (req, res, next) => service.listAdjustments(req, res, next);
const applyAdjustment = async (req, res, next) => service.applyAdjustment(req, res, next);
const voidAdjustment = async (req, res, next) => service.voidAdjustment(req, res, next);

module.exports = {
  listAdjustments,
  applyAdjustment,
  voidAdjustment,
};
