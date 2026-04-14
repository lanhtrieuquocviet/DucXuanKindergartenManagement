const service = require('../services/purchaseRequestService.js');

const getMyClasses = async (req, res, next) => service.getMyClasses(req, res, next);
const listMyRequests = async (req, res, next) => service.listMyRequests(req, res, next);
const createRequest = async (req, res, next) => service.createRequest(req, res, next);
const getRequest = async (req, res, next) => service.getRequest(req, res, next);
const updateRequest = async (req, res, next) => service.updateRequest(req, res, next);
const deleteRequest = async (req, res, next) => service.deleteRequest(req, res, next);
const listAllRequests = async (req, res, next) => service.listAllRequests(req, res, next);
const approveRequest = async (req, res, next) => service.approveRequest(req, res, next);
const rejectRequest = async (req, res, next) => service.rejectRequest(req, res, next);

module.exports = {
  getMyClasses,
  listMyRequests,
  createRequest,
  getRequest,
  updateRequest,
  deleteRequest,
  listAllRequests,
  approveRequest,
  rejectRequest,
};
