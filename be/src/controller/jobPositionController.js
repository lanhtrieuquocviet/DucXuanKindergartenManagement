const service = require('../services/jobPositionService');

exports.listJobPositions = (req, res) => service.listJobPositions(req, res);
exports.createJobPosition = (req, res) => service.createJobPosition(req, res);
exports.updateJobPosition = (req, res) => service.updateJobPosition(req, res);
exports.deleteJobPosition = (req, res) => service.deleteJobPosition(req, res);
exports.importJobPositions = (req, res) => service.importJobPositions(req, res);
exports.syncFromStaffPositions = (req, res) => service.syncFromStaffPositions(req, res);
