const service = require('../services/leaveRequestService.js');

const createLeaveRequest = async (req, res, next) => service.createLeaveRequest(req, res, next);
const getMyLeaveRequests = async (req, res, next) => service.getMyLeaveRequests(req, res, next);
const getTeacherLeaveRequests = async (req, res, next) => service.getTeacherLeaveRequests(req, res, next);
const updateLeaveRequestStatus = async (req, res, next) => service.updateLeaveRequestStatus(req, res, next);

module.exports = {
  createLeaveRequest,
  getMyLeaveRequests,
  getTeacherLeaveRequests,
  updateLeaveRequestStatus,
};
