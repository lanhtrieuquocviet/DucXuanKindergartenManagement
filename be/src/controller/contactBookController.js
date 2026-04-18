const service = require('../services/contactBookService.js');

const getMyStudents = async (req, res, next) => service.getMyStudents(req, res, next);
const getMyClasses = async (req, res, next) => service.getMyClasses(req, res, next);
const getStudentsInClass = async (req, res, next) => service.getStudentsInClass(req, res, next);
const getStudentAttendance = async (req, res, next) => service.getStudentAttendance(req, res, next);
const getTodayMenu = async (req, res, next) => service.getTodayMenu(req, res, next);
const getStudentHealth = async (req, res, next) => service.getStudentHealth(req, res, next);
const getStudentHealthHistory = async (req, res, next) => service.getStudentHealthHistory(req, res, next);
const getNotes = async (req, res, next) => service.getNotes(req, res, next);
const createNote = async (req, res, next) => service.createNote(req, res, next);
const deleteNote = async (req, res, next) => service.deleteNote(req, res, next);
const getChangeRequests = async (req, res, next) => service.getChangeRequests(req, res, next);
const createChangeRequest = async (req, res, next) => service.createChangeRequest(req, res, next);
const getStudentEvaluation = async (req, res, next) => service.getStudentEvaluation(req, res, next);
const updateStudentEvaluation = async (req, res, next) => service.updateStudentEvaluation(req, res, next);

module.exports = {
  getMyStudents,
  getMyClasses,
  getStudentsInClass,
  getStudentAttendance,
  getTodayMenu,
  getStudentHealth,
  getStudentHealthHistory,
  getNotes,
  createNote,
  deleteNote,
  getChangeRequests,
  createChangeRequest,
  getStudentEvaluation,
  updateStudentEvaluation,
};
