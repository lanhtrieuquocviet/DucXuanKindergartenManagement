const service = require('../services/academicYearService.js');

const getCurrentAcademicYear = async (req, res, next) => service.getCurrentAcademicYear(req, res, next);
const patchCurrentTimetableSeason = async (req, res, next) => service.patchCurrentTimetableSeason(req, res, next);
const listAcademicYears = async (req, res, next) => service.listAcademicYears(req, res, next);
const createAcademicYear = async (req, res, next) => service.createAcademicYear(req, res, next);
const finishAcademicYear = async (req, res, next) => service.finishAcademicYear(req, res, next);
const getAcademicYearHistory = async (req, res, next) => service.getAcademicYearHistory(req, res, next);
const getClassesByAcademicYear = async (req, res, next) => service.getClassesByAcademicYear(req, res, next);
const getStudentsByAcademicYear = async (req, res, next) => service.getStudentsByAcademicYear(req, res, next);

module.exports = {
  getCurrentAcademicYear,
  patchCurrentTimetableSeason,
  listAcademicYears,
  createAcademicYear,
  finishAcademicYear,
  getAcademicYearHistory,
  getClassesByAcademicYear,
  getStudentsByAcademicYear,
};
