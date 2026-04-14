const service = require('../services/pickupService.js');

const createPickupRequest = async (req, res, next) => service.createPickupRequest(req, res, next);
const getMyPickupRequests = async (req, res, next) => service.getMyPickupRequests(req, res, next);
const getPickupRequests = async (req, res, next) => service.getPickupRequests(req, res, next);
const getApprovedPickupPersonsByStudent = async (req, res, next) => service.getApprovedPickupPersonsByStudent(req, res, next);
const updatePickupRequestStatus = async (req, res, next) => service.updatePickupRequestStatus(req, res, next);
const updateMyPickupRequest = async (req, res, next) => service.updateMyPickupRequest(req, res, next);
const deleteMyPickupRequest = async (req, res, next) => service.deleteMyPickupRequest(req, res, next);

module.exports = {
  createPickupRequest,
  getMyPickupRequests,
  getPickupRequests,
  getApprovedPickupPersonsByStudent,
  updatePickupRequestStatus,
  updateMyPickupRequest,
  deleteMyPickupRequest,
};
