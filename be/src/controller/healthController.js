const service = require('../services/healthService.js');

const getHealthCheckRecords = async (req, res, next) => service.getHealthCheckRecords(req, res, next);
const getHealthCheckById = async (req, res, next) => service.getHealthCheckById(req, res, next);
const getStudentHealthHistory = async (req, res, next) => service.getStudentHealthHistory(req, res, next);
const createHealthCheck = async (req, res, next) => service.createHealthCheck(req, res, next);
const updateHealthCheck = async (req, res, next) => service.updateHealthCheck(req, res, next);
const deleteHealthCheck = async (req, res, next) => service.deleteHealthCheck(req, res, next);
const getHealthStatistics = async (req, res, next) => service.getHealthStatistics(req, res, next);
const exportHealthRecords = async (req, res, next) => service.exportHealthRecords(req, res, next);

module.exports = {
  getHealthCheckRecords,
  getHealthCheckById,
  getStudentHealthHistory,
  createHealthCheck,
  updateHealthCheck,
  deleteHealthCheck,
  getHealthStatistics,
  exportHealthRecords,
};
