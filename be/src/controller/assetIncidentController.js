const service = require('../services/assetIncidentService.js');

const getMyAllocation = async (req, res, next) => service.getMyAllocation(req, res, next);
const listMyIncidents = async (req, res, next) => service.listMyIncidents(req, res, next);
const createIncident = async (req, res, next) => service.createIncident(req, res, next);
const getIncident = async (req, res, next) => service.getIncident(req, res, next);
const updateIncident = async (req, res, next) => service.updateIncident(req, res, next);
const deleteIncident = async (req, res, next) => service.deleteIncident(req, res, next);
const listAllIncidents = async (req, res, next) => service.listAllIncidents(req, res, next);
const updateIncidentStatus = async (req, res, next) => service.updateIncidentStatus(req, res, next);

module.exports = {
  getMyAllocation,
  listMyIncidents,
  createIncident,
  getIncident,
  updateIncident,
  deleteIncident,
  listAllIncidents,
  updateIncidentStatus,
};
