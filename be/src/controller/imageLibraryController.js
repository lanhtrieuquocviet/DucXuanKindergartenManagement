const service = require('../services/imageLibraryService.js');

const listAdminImageLibrary = async (req, res, next) => service.listAdminImageLibrary(req, res, next);
const createImageLibraryItem = async (req, res, next) => service.createImageLibraryItem(req, res, next);
const deleteImageLibraryItem = async (req, res, next) => service.deleteImageLibraryItem(req, res, next);
const listPublicImageLibrary = async (req, res, next) => service.listPublicImageLibrary(req, res, next);

module.exports = {
  listAdminImageLibrary,
  createImageLibraryItem,
  deleteImageLibraryItem,
  listPublicImageLibrary,
};
