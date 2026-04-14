const service = require('../services/faceAttendanceService.js');

const registerFaceEmbedding = async (req, res, next) => service.registerFaceEmbedding(req, res, next);
const matchFaceEmbedding = async (req, res, next) => service.matchFaceEmbedding(req, res, next);
const getClassEmbeddings = async (req, res, next) => service.getClassEmbeddings(req, res, next);
const syncOfflineAttendance = async (req, res, next) => service.syncOfflineAttendance(req, res, next);
const registerPickupFaceEmbedding = async (req, res, next) => service.registerPickupFaceEmbedding(req, res, next);
const matchPickupFace = async (req, res, next) => service.matchPickupFace(req, res, next);
const matchPickupFaceForCheckout = async (req, res, next) => service.matchPickupFaceForCheckout(req, res, next);
const matchStudentFaceForCheckout = async (req, res, next) => service.matchStudentFaceForCheckout(req, res, next);
const deleteFaceEmbedding = async (req, res, next) => service.deleteFaceEmbedding(req, res, next);
const deleteFaceAngle = async (req, res, next) => service.deleteFaceAngle(req, res, next);
const updateAttendanceDeliverer = async (req, res, next) => service.updateAttendanceDeliverer(req, res, next);

module.exports = {
  registerFaceEmbedding,
  matchFaceEmbedding,
  getClassEmbeddings,
  syncOfflineAttendance,
  registerPickupFaceEmbedding,
  matchPickupFace,
  matchPickupFaceForCheckout,
  matchStudentFaceForCheckout,
  deleteFaceEmbedding,
  deleteFaceAngle,
  updateAttendanceDeliverer,
};
