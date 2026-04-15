const service = require('../services/otpService');

const sendOTP = async (req, res, next) => service.sendOTP(req, res, next);
const verifyOTP = async (req, res, next) => service.verifyOTP(req, res, next);
const getPendingOTP = async (req, res, next) => service.getPendingOTP(req, res, next);

module.exports = {
  sendOTP,
  verifyOTP,
  getPendingOTP,
};
