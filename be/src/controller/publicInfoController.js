const service = require('../services/publicInfoService.js');

const listPublicInfos = async (req, res, next) => service.listPublicInfos(req, res, next);
const getPublicInfo = async (req, res, next) => service.getPublicInfo(req, res, next);
const createPublicInfo = async (req, res, next) => service.createPublicInfo(req, res, next);
const updatePublicInfo = async (req, res, next) => service.updatePublicInfo(req, res, next);
const deletePublicInfo = async (req, res, next) => service.deletePublicInfo(req, res, next);
const getPublishedPublicInfos = async (req, res, next) => service.getPublishedPublicInfos(req, res, next);
const getPublishedPublicInfoById = async (req, res, next) => service.getPublishedPublicInfoById(req, res, next);
const getOrganizationStructure = async (req, res, next) => service.getOrganizationStructure(req, res, next);

module.exports = {
  listPublicInfos,
  getPublicInfo,
  createPublicInfo,
  updatePublicInfo,
  deletePublicInfo,
  getPublishedPublicInfos,
  getPublishedPublicInfoById,
  getOrganizationStructure,
};
