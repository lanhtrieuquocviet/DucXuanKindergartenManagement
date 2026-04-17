const service = require('../services/cloudinaryService.js');

const getMediaLibrarySignature = async (req, res, next) => service.getMediaLibrarySignature(req, res, next);
const uploadAvatar = async (req, res, next) => service.uploadAvatar(req, res, next);
const uploadBlogImage = async (req, res, next) => service.uploadBlogImage(req, res, next);
const uploadBlogFile = async (req, res, next) => service.uploadBlogFile(req, res, next);
const uploadKitchenImage = async (req, res, next) => service.uploadKitchenImage(req, res, next);
const uploadAttendanceImage = async (req, res, next) => service.uploadAttendanceImage(req, res, next);
const uploadAttendanceFile = async (req, res, next) => service.uploadAttendanceFile(req, res, next);
const uploadPurchaseImage = async (req, res, next) => service.uploadPurchaseImage(req, res, next);
const uploadNoteImage = async (req, res, next) => service.uploadNoteImage(req, res, next);

module.exports = {
  getMediaLibrarySignature,
  uploadAvatar,
  uploadBlogImage,
  uploadBlogFile,
  uploadKitchenImage,
  uploadAttendanceImage,
  uploadAttendanceFile,
  uploadPurchaseImage,
  uploadNoteImage,
};
