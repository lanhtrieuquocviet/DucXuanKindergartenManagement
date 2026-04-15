const service = require('../services/mealPhoto.service.js');

const getMealPhoto = async (req, res, next) => service.getMealPhoto(req, res, next);
const upsertMealPhoto = async (req, res, next) => service.upsertMealPhoto(req, res, next);
const upsertMealEntry = async (req, res, next) => service.upsertMealEntry(req, res, next);
const upsertSampleEntry = async (req, res, next) => service.upsertSampleEntry(req, res, next);
const deleteSampleEntry = async (req, res, next) => service.deleteSampleEntry(req, res, next);
const deleteMealEntry = async (req, res, next) => service.deleteMealEntry(req, res, next);
const reviewSampleEntry = async (req, res, next) => service.reviewSampleEntry(req, res, next);
const requestEdit = async (req, res, next) => service.requestEdit(req, res, next);
const approveEditRequest = async (req, res, next) => service.approveEditRequest(req, res, next);
const getAttendanceSummary = async (req, res, next) => service.getAttendanceSummary(req, res, next);

module.exports = {
  getMealPhoto,
  upsertMealPhoto,
  upsertMealEntry,
  upsertSampleEntry,
  deleteSampleEntry,
  deleteMealEntry,
  reviewSampleEntry,
  requestEdit,
  approveEditRequest,
  getAttendanceSummary,
};
