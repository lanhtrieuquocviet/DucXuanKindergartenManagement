const service = require('../services/assetService.js');

const listAssets = async (req, res, next) => service.listAssets(req, res, next);
const getAsset = async (req, res, next) => service.getAsset(req, res, next);
const createAsset = async (req, res, next) => service.createAsset(req, res, next);
const updateAsset = async (req, res, next) => service.updateAsset(req, res, next);
const deleteAsset = async (req, res, next) => service.deleteAsset(req, res, next);
const bulkCreateAssets = async (req, res, next) => service.bulkCreateAssets(req, res, next);
const bulkCreateWarehouseAssets = async (req, res, next) => service.bulkCreateWarehouseAssets(req, res, next);

module.exports = {
  listAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  bulkCreateAssets,
  bulkCreateWarehouseAssets,
};
