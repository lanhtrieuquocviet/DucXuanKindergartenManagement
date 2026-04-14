const service = require('../services/authService.js');

const login = async (req, res, next) => service.login(req, res, next);
const logout = async (req, res, next) => service.logout(req, res, next);
const refreshToken = async (req, res, next) => service.refreshToken(req, res, next);
const getProfile = async (req, res, next) => service.getProfile(req, res, next);
const updateProfile = async (req, res, next) => service.updateProfile(req, res, next);
const changePassword = async (req, res, next) => service.changePassword(req, res, next);
const verifyAccount = async (req, res, next) => service.verifyAccount(req, res, next);
const verifyOTP = async (req, res, next) => service.verifyOTP(req, res, next);
const resetPassword = async (req, res, next) => service.resetPassword(req, res, next);
const getMyChildren = async (req, res, next) => service.getMyChildren(req, res, next);
const createMyChild = async (req, res, next) => service.createMyChild(req, res, next);
const updateMyChild = async (req, res, next) => service.updateMyChild(req, res, next);
const deleteMyChild = async (req, res, next) => service.deleteMyChild(req, res, next);
const getMyStudentInfo = async (req, res, next) => service.getMyStudentInfo(req, res, next);

module.exports = {
  login,
  logout,
  refreshToken,
  getProfile,
  updateProfile,
  changePassword,
  verifyAccount,
  verifyOTP,
  resetPassword,
  getMyChildren,
  createMyChild,
  updateMyChild,
  deleteMyChild,
  getMyStudentInfo,
};
