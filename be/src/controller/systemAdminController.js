const service = require('../services/systemAdminService.js');

const getUsers = async (req, res, next) => service.getUsers(req, res, next);
const createUser = async (req, res, next) => service.createUser(req, res, next);
const updateUser = async (req, res, next) => service.updateUser(req, res, next);
const deleteUser = async (req, res, next) => service.deleteUser(req, res, next);
const updateUserRoles = async (req, res, next) => service.updateUserRoles(req, res, next);
const getRoles = async (req, res, next) => service.getRoles(req, res, next);
const createRole = async (req, res, next) => service.createRole(req, res, next);
const updateRole = async (req, res, next) => service.updateRole(req, res, next);
const deleteRole = async (req, res, next) => service.deleteRole(req, res, next);
const getPermissions = async (req, res, next) => service.getPermissions(req, res, next);
const createPermission = async (req, res, next) => service.createPermission(req, res, next);
const updatePermission = async (req, res, next) => service.updatePermission(req, res, next);
const deletePermission = async (req, res, next) => service.deletePermission(req, res, next);
const updateRolePermissions = async (req, res, next) => service.updateRolePermissions(req, res, next);
const getSystemLogs = async (req, res, next) => service.getSystemLogs(req, res, next);
const getDashboardStats = async (req, res, next) => service.getDashboardStats(req, res, next);

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserRoles,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  updateRolePermissions,
  getSystemLogs,
  getDashboardStats,
};
