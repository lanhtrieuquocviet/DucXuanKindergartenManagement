const service = require('../services/assetInspectionService.js');

const listCommittees = async (req, res, next) => service.listCommittees(req, res, next);
const getCommittee = async (req, res, next) => service.getCommittee(req, res, next);
const createCommittee = async (req, res, next) => service.createCommittee(req, res, next);
const updateCommittee = async (req, res, next) => service.updateCommittee(req, res, next);
const deleteCommittee = async (req, res, next) => service.deleteCommittee(req, res, next);
const endCommittee = async (req, res, next) => service.endCommittee(req, res, next);
const listMyMinutes = async (req, res, next) => service.listMyMinutes(req, res, next);
const listMinutes = async (req, res, next) => service.listMinutes(req, res, next);
const getMinutes = async (req, res, next) => service.getMinutes(req, res, next);
const createMinutes = async (req, res, next) => service.createMinutes(req, res, next);
const updateMinutes = async (req, res, next) => service.updateMinutes(req, res, next);
const approveMinutes = async (req, res, next) => service.approveMinutes(req, res, next);
const rejectMinutes = async (req, res, next) => service.rejectMinutes(req, res, next);
const exportMinutesWord = async (req, res, next) => service.exportMinutesWord(req, res, next);
const deleteMinutes = async (req, res, next) => service.deleteMinutes(req, res, next);

module.exports = {
  listCommittees,
  getCommittee,
  createCommittee,
  updateCommittee,
  deleteCommittee,
  endCommittee,
  listMyMinutes,
  listMinutes,
  getMinutes,
  createMinutes,
  updateMinutes,
  approveMinutes,
  rejectMinutes,
  exportMinutesWord,
  deleteMinutes,
};
