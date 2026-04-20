const service = require('../services/leaveRequestService.js');

const createLeaveRequest = async (req, res, next) => service.createLeaveRequest(req, res, next);
const getMyLeaveRequests = async (req, res, next) => service.getMyLeaveRequests(req, res, next);
const getTeacherLeaveRequests = async (req, res, next) => service.getTeacherLeaveRequests(req, res, next);
const updateLeaveRequestStatus = async (req, res, next) => service.updateLeaveRequestStatus(req, res, next);
const cancelLeaveRequest = async (req, res, next) => service.cancelLeaveRequest(req, res, next);
const updateMyLeaveRequest = async (req, res, next) => service.updateMyLeaveRequest(req, res, next);
const deleteMyLeaveRequest = async (req, res, next) => service.deleteMyLeaveRequest(req, res, next);

module.exports = {
  createLeaveRequest,
  getMyLeaveRequests,
  getTeacherLeaveRequests,
  updateLeaveRequestStatus,
  cancelLeaveRequest,
  updateMyLeaveRequest,
  deleteMyLeaveRequest,
};
