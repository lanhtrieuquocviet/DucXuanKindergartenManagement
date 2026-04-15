const service = require('../services/attendanceService.js');

const upsertAttendance = async (req, res, next) => service.upsertAttendance(req, res, next);
const checkoutAttendance = async (req, res, next) => service.checkoutAttendance(req, res, next);
const getAttendances = async (req, res, next) => service.getAttendances(req, res, next);
const getAttendanceOverview = async (req, res, next) => service.getAttendanceOverview(req, res, next);
const getClassAttendanceDetail = async (req, res, next) => service.getClassAttendanceDetail(req, res, next);
const getStudentAttendanceDetail = async (req, res, next) => service.getStudentAttendanceDetail(req, res, next);
const getStudentAttendanceHistory = async (req, res, next) => service.getStudentAttendanceHistory(req, res, next);
const getAttendanceExportData = async (req, res, next) => service.getAttendanceExportData(req, res, next);

module.exports = {
  upsertAttendance,
  checkoutAttendance,
  getAttendances,
  getAttendanceOverview,
  getClassAttendanceDetail,
  getStudentAttendanceDetail,
  getStudentAttendanceHistory,
  getAttendanceExportData,
};
