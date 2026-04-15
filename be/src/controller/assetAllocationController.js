const service = require('../services/assetAllocationService.js');

const listAllocations = async (req, res, next) => service.listAllocations(req, res, next);
const getAllocation = async (req, res, next) => service.getAllocation(req, res, next);
const createAllocation = async (req, res, next) => service.createAllocation(req, res, next);
const updateAllocation = async (req, res, next) => service.updateAllocation(req, res, next);
const deleteAllocation = async (req, res, next) => service.deleteAllocation(req, res, next);
const transferAllocation = async (req, res, next) => service.transferAllocation(req, res, next);
const confirmAllocation = async (req, res, next) => service.confirmAllocation(req, res, next);
const exportWord = async (req, res, next) => service.exportWord(req, res, next);
const parseWordFile = async (req, res, next) => service.parseWordFile(req, res, next);
const parseExcelFile = async (req, res, next) => service.parseExcelFile(req, res, next);
const generateExcelTemplate = async (req, res, next) => service.generateExcelTemplate(req, res, next);
const listClasses = async (req, res, next) => service.listClasses(req, res, next);

module.exports = {
  listAllocations,
  getAllocation,
  createAllocation,
  updateAllocation,
  deleteAllocation,
  transferAllocation,
  confirmAllocation,
  exportWord,
  parseWordFile,
  parseExcelFile,
  generateExcelTemplate,
  listClasses,
};
